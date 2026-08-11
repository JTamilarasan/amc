import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

const vouchersCollection = 'salesVouchers'
const settingsRef = () => doc(db, 'voucherSettings', 'salesVoucher')
const claimRef = (voucherNumber) => doc(db, 'salesVoucherNumberClaims', String(voucherNumber))

const mapVoucher = (snapshot) => ({ id: snapshot.id, ...snapshot.data() })

const cleanItems = (items = []) => items.map((item) => ({
  serialNo: (item.serialNo || '').trim(),
  productId: item.productId,
  itemName: item.itemName,
  duration: item.duration || '',
  unit: item.unit || '',
  amcApplicable: Boolean(item.amcApplicable),
  amcFromDate: item.amcFromDate || '',
  amcToDate: item.amcToDate || '',
  amount: Number(item.amount),
}))

export const initializeVoucherCounter = async (startingNumber) => {
  const start = Math.max(0, Math.trunc(Number(startingNumber)))
  if (!Number.isFinite(start)) throw new Error('Enter a valid manual starting number.')
  await runTransaction(db, async (transaction) => {
    const ref = settingsRef()
    const snapshot = await transaction.get(ref)
    if (!snapshot.exists()) {
      transaction.set(ref, { startingNumber: start, lastVoucherNumber: null, hasSavedVoucher: false, updatedAt: serverTimestamp() })
    } else if (Number(snapshot.data().startingNumber) !== start) {
      transaction.update(ref, { startingNumber: start, updatedAt: serverTimestamp() })
    }
  })
  return getNextAvailableVoucherNumber(start)
}

// This is a preview. The number is allocated atomically when createSalesVoucher runs.
export const getExistingVoucherNumbers = async (startingNumber = 0) => {
  const snapshot = await getDocs(query(collection(db, vouchersCollection), where('voucherNumber', '>=', Number(startingNumber) + 1)))
  return snapshot.docs.map((item) => Number(item.data().voucherNumber)).filter(Number.isFinite)
}

export const getNextAvailableVoucherNumber = async (startingNumber) => {
  const start = Math.max(0, Math.trunc(Number(startingNumber)))
  const usedNumbers = new Set(await getExistingVoucherNumbers(start))
  let candidate = start + 1
  while (usedNumbers.has(candidate)) candidate += 1
  return candidate
}

export const checkVoucherNumberExists = async (voucherNumber) => {
  const snapshot = await getDocs(query(collection(db, vouchersCollection), where('voucherNumber', '==', Number(voucherNumber)), limit(1)))
  return !snapshot.empty
}

export const getNextVoucherNumber = (startingNumber = 0) => getNextAvailableVoucherNumber(startingNumber)

export const getVoucherSequence = async () => {
  const snapshot = await getDoc(settingsRef())
  if (!snapshot.exists()) return null
  const startingNumber = Number(snapshot.data().startingNumber ?? 0)
  return {
    startingNumber,
    lastVoucherNumber: snapshot.data().lastVoucherNumber ?? null,
    nextVoucherNumber: await getNextAvailableVoucherNumber(startingNumber),
  }
}

export const createSalesVoucher = async (voucherData) => {
  const voucherNumber = Number(voucherData.voucherNumber)
  if (!Number.isFinite(voucherNumber)) throw new Error('Voucher number is required.')
  if (await checkVoucherNumberExists(voucherNumber)) throw new Error('Voucher number already exists.')

  const createdRef = await runTransaction(db, async (transaction) => {
    const counterRef = settingsRef()
    const counterSnapshot = await transaction.get(counterRef)
    if (!counterSnapshot.exists()) throw new Error('Set the manual starting number first.')
    const numberClaimRef = claimRef(voucherNumber)
    const numberClaimSnapshot = await transaction.get(numberClaimRef)
    if (numberClaimSnapshot.exists()) throw new Error('Voucher number already exists.')
    const voucherRef = doc(collection(db, vouchersCollection))
    const payload = {
      voucherNumber,
      voucherDate: voucherData.voucherDate,
      customerId: voucherData.customerId,
      customerName: voucherData.customerName,
      executiveId: voucherData.executiveId,
      executiveName: voucherData.executiveName,
      category: voucherData.category,
      narration: (voucherData.narration || '').trim(),
      items: cleanItems(voucherData.items),
      totalAmount: Number(voucherData.totalAmount),
      status: 'Active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    transaction.set(numberClaimRef, { voucherNumber, voucherId: voucherRef.id, createdAt: serverTimestamp() })
    transaction.update(counterRef, { lastVoucherNumber: voucherNumber, hasSavedVoucher: true, updatedAt: serverTimestamp() })
    transaction.set(voucherRef, payload)
    return voucherRef
  })

  const createdSnapshot = await getDoc(createdRef)
  return mapVoucher(createdSnapshot)
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
    voucherDate: voucherData.voucherDate,
    customerId: voucherData.customerId,
    customerName: voucherData.customerName,
    executiveId: voucherData.executiveId,
    executiveName: voucherData.executiveName,
    category: voucherData.category,
    narration: (voucherData.narration || '').trim(),
    items: cleanItems(voucherData.items),
    totalAmount: Number(voucherData.totalAmount),
    updatedAt: serverTimestamp(),
  }
  await updateDoc(ref, payload)
  const snapshot = await getDoc(ref)
  return mapVoucher(snapshot)
}

export const deleteSalesVoucher = async (id) => {
  const voucherRef = doc(db, vouchersCollection, id)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(voucherRef)
    if (!snapshot.exists()) return
    transaction.delete(voucherRef)
    const voucherNumber = Number(snapshot.data().voucherNumber)
    if (Number.isFinite(voucherNumber)) transaction.delete(claimRef(voucherNumber))
  })
}

export const salesVoucherService = {
  createSalesVoucher, getSalesVouchers, getSalesVoucherById, updateSalesVoucher,
  deleteSalesVoucher, getExistingVoucherNumbers, getNextAvailableVoucherNumber,
  checkVoucherNumberExists, getNextVoucherNumber, getVoucherSequence, initializeVoucherCounter,
}
