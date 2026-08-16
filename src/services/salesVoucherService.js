import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'

const vouchersCollection = 'salesVouchers'
const counterRef = (year) => doc(db, 'voucherSettings', `salesVoucher_${year}`)
const claimRef = (year, sequence) => doc(db, 'salesVoucherNumberClaims', `${year}_${sequence}`)
const mapVoucher = (snapshot) => ({ id: snapshot.id, ...snapshot.data() })
const numberValue = (value) => Math.max(0, Math.trunc(Number(value) || 0))

const voucherYear = (dateValue) => {
  const match = String(dateValue || '').match(/^(\d{4})-/)
  if (!match) throw new Error('Voucher date is required.')
  return Number(match[1])
}

const savedVoucherSequence = (voucher, year) => {
  if (Number(voucher.voucherYear) === year && numberValue(voucher.voucherSequence)) return numberValue(voucher.voucherSequence)
  const parts = String(voucher.voucherNumber ?? '').split('/')
  if (parts.length > 1) return Number(parts[1]) === year ? numberValue(parts[0]) : 0
  const savedYear = String(voucher.voucherDate || '').match(/^(\d{4})-/)
  return Number(savedYear?.[1]) === year ? numberValue(voucher.voucherNumber) : 0
}

const getHighestSequenceForYear = async (year) => {
  const snapshot = await getDocs(collection(db, vouchersCollection))
  return snapshot.docs.reduce((highest, item) => Math.max(highest, savedVoucherSequence(item.data(), year)), 0)
}

const cleanItems = (items = []) => items.map((item) => ({
  serialNo: (item.serialNo || '').trim(), productId: item.productId, itemName: item.itemName,
  duration: item.duration || '', unit: item.unit || '', amcApplicable: Boolean(item.amcApplicable),
  amcFromDate: item.amcFromDate || '', amcToDate: item.amcToDate || '', amount: Number(item.amount),
}))

// Preview only. The final sequence is allocated atomically when the voucher is created.
export const getNextAvailableVoucherNumber = async (voucherDate) => {
  const year = voucherYear(voucherDate)
  const [snapshot, existingHighest] = await Promise.all([getDoc(counterRef(year)), getHighestSequenceForYear(year)])
  const next = Math.max(numberValue(snapshot.exists() ? snapshot.data().lastVoucherNumber : 0), existingHighest) + 1
  return `${next}/${year}`
}

export const getExistingVoucherNumbers = async (voucherDate) => {
  const year = voucherYear(voucherDate)
  const snapshot = await getDocs(collection(db, vouchersCollection))
  return snapshot.docs.map((item) => savedVoucherSequence(item.data(), year)).filter(Boolean)
}

export const checkVoucherNumberExists = async (voucherNumber) => {
  const snapshot = await getDocs(collection(db, vouchersCollection))
  return snapshot.docs.some((item) => String(item.data().voucherNumber) === String(voucherNumber))
}

export const getNextVoucherNumber = (voucherDate) => getNextAvailableVoucherNumber(voucherDate)
export const initializeVoucherCounter = async (voucherDate) => getNextAvailableVoucherNumber(voucherDate)

export const getVoucherSequence = async (voucherDate) => {
  const year = voucherYear(voucherDate)
  const snapshot = await getDoc(counterRef(year))
  return { year, lastVoucherNumber: snapshot.exists() ? numberValue(snapshot.data().lastVoucherNumber) : null, nextVoucherNumber: await getNextAvailableVoucherNumber(voucherDate) }
}

export const createSalesVoucher = async (voucherData) => {
  const year = voucherYear(voucherData.voucherDate)
  const existingHighest = await getHighestSequenceForYear(year)
  const createdRef = await runTransaction(db, async (transaction) => {
    const sequenceRef = counterRef(year)
    const sequenceSnapshot = await transaction.get(sequenceRef)
    const sequence = Math.max(numberValue(sequenceSnapshot.exists() ? sequenceSnapshot.data().lastVoucherNumber : 0), existingHighest) + 1
    const numberClaimRef = claimRef(year, sequence)
    const numberClaimSnapshot = await transaction.get(numberClaimRef)
    if (numberClaimSnapshot.exists()) throw new Error('Voucher number already exists. Please try again.')
    const oldVoucherRef = voucherData.renewalSourceVoucherId ? doc(db, vouchersCollection, voucherData.renewalSourceVoucherId) : null
    const oldVoucherSnapshot = oldVoucherRef ? await transaction.get(oldVoucherRef) : null
    if (oldVoucherRef && !oldVoucherSnapshot?.exists()) throw new Error('The AMC voucher selected for renewal no longer exists.')
    if (oldVoucherSnapshot?.data()?.expiryRenewed === true || oldVoucherSnapshot?.data()?.expiryRenewed === 'Yes') throw new Error('This AMC voucher has already been renewed.')
    const voucherRef = doc(collection(db, vouchersCollection))
    const voucherNumber = `${sequence}/${year}`
    const payload = {
      voucherNumber, voucherSequence: sequence, voucherYear: year, voucherDate: voucherData.voucherDate,
      customerId: voucherData.customerId, customerName: voucherData.customerName,
      executiveId: voucherData.executiveId, executiveName: voucherData.executiveName,
      category: voucherData.category, narration: (voucherData.narration || '').trim(),
      renewedFromVoucherId: voucherData.renewalSourceVoucherId || '', renewedFromVoucherNumber: voucherData.renewalSourceVoucherNumber || '',
      items: cleanItems(voucherData.items), totalAmount: Number(voucherData.totalAmount),
      status: 'Active', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }
    transaction.set(numberClaimRef, { voucherSequence: sequence, voucherYear: year, voucherNumber, voucherId: voucherRef.id, createdAt: serverTimestamp() })
    transaction.set(sequenceRef, { lastVoucherNumber: sequence, voucherYear: year, updatedAt: serverTimestamp() }, { merge: true })
    transaction.set(voucherRef, payload)
    if (oldVoucherRef) transaction.update(oldVoucherRef, { expiryRenewed: true, renewedVoucherId: voucherRef.id, renewedVoucherNumber: voucherNumber, updatedAt: serverTimestamp() })
    return voucherRef
  })
  return mapVoucher(await getDoc(createdRef))
}

export const getSalesVouchers = async () => {
  const snapshot = await getDocs(query(collection(db, vouchersCollection), orderBy('createdAt', 'desc')))
  return snapshot.docs.map(mapVoucher)
}

export const getSalesVoucherById = async (id) => {
  const snapshot = await getDoc(doc(db, vouchersCollection, id))
  return snapshot.exists() ? mapVoucher(snapshot) : null
}

export const updateSalesVoucher = async (id, voucherData) => {
  const ref = doc(db, vouchersCollection, id)
  const payload = {
    voucherDate: voucherData.voucherDate, customerId: voucherData.customerId, customerName: voucherData.customerName,
    executiveId: voucherData.executiveId, executiveName: voucherData.executiveName,
    category: voucherData.category, narration: (voucherData.narration || '').trim(),
    items: cleanItems(voucherData.items), totalAmount: Number(voucherData.totalAmount), updatedAt: serverTimestamp(),
  }
  await updateDoc(ref, payload)
  return mapVoucher(await getDoc(ref))
}

export const deleteSalesVoucher = async (id) => {
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, vouchersCollection, id)
    if ((await transaction.get(ref)).exists()) transaction.delete(ref)
  })
}

export const salesVoucherService = {
  createSalesVoucher, getSalesVouchers, getSalesVoucherById, updateSalesVoucher, deleteSalesVoucher,
  getExistingVoucherNumbers, getNextAvailableVoucherNumber, checkVoucherNumberExists,
  getNextVoucherNumber, getVoucherSequence, initializeVoucherCounter,
}
