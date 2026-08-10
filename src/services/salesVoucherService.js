import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

const vouchersCollection = 'salesVouchers'
const settingsRef = () => doc(db, 'voucherSettings', 'salesVoucher')

const mapVoucher = (snapshot) => ({ id: snapshot.id, ...snapshot.data() })

const cleanItems = (items = []) => items.map((item) => ({
  productId: item.productId,
  itemName: item.itemName,
  quantity: Number(item.quantity),
  unit: item.unit || '',
  amcApplicable: Boolean(item.amcApplicable),
  amcFromDate: item.amcFromDate || '',
  amcToDate: item.amcToDate || '',
  amount: Number(item.amount),
}))

export const initializeVoucherCounter = async (startingNumber) => {
  const start = Math.max(0, Math.trunc(Number(startingNumber)))
  if (!Number.isFinite(start)) throw new Error('Enter a valid manual starting number.')
  const savedSnapshot = await getDocs(query(collection(db, vouchersCollection), orderBy('voucherNumber', 'desc'), limit(1)))
  const highestSavedNumber = savedSnapshot.empty ? null : Number(savedSnapshot.docs[0].data().voucherNumber)

  return runTransaction(db, async (transaction) => {
    const ref = settingsRef()
    const snapshot = await transaction.get(ref)
    if (!snapshot.exists()) {
      transaction.set(ref, { startingNumber: start, lastVoucherNumber: null, hasSavedVoucher: false, updatedAt: serverTimestamp() })
      return start + 1
    }

    const data = snapshot.data()
    const savedStart = Number(data.startingNumber ?? start)
    if (data.hasSavedVoucher === false) return savedStart + 1
    if (data.hasSavedVoucher === true) return Number(data.lastVoucherNumber ?? savedStart) + 1
    return Number.isFinite(highestSavedNumber) && highestSavedNumber > savedStart ? highestSavedNumber + 1 : savedStart + 1
  })
}

// This is a preview. The number is allocated atomically when createSalesVoucher runs.
export const getNextVoucherNumber = async () => {
  const sequence = await getVoucherSequence()
  return sequence?.nextVoucherNumber ?? null
}

export const getVoucherSequence = async () => {
  const snapshot = await getDoc(settingsRef())
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  const startingNumber = Number(data.startingNumber ?? 0)

  if (typeof data.hasSavedVoucher === 'boolean') {
    return {
      startingNumber,
      lastVoucherNumber: data.lastVoucherNumber ?? null,
      nextVoucherNumber: data.hasSavedVoucher ? Number(data.lastVoucherNumber ?? startingNumber) + 1 : startingNumber + 1,
    }
  }

  // Legacy settings may contain a number consumed during page initialization.
  // Read saved vouchers as the source of truth, but never mutate the counter here.
  const savedSnapshot = await getDocs(query(collection(db, vouchersCollection), orderBy('voucherNumber', 'desc'), limit(1)))
  const highestSavedNumber = savedSnapshot.empty ? null : Number(savedSnapshot.docs[0].data().voucherNumber)
  const hasSavedVoucher = Number.isFinite(highestSavedNumber) && highestSavedNumber > startingNumber
  return {
    startingNumber,
    lastVoucherNumber: hasSavedVoucher ? highestSavedNumber : null,
    nextVoucherNumber: hasSavedVoucher ? highestSavedNumber + 1 : startingNumber + 1,
  }
}

export const createSalesVoucher = async (voucherData) => {
  // Used only to resolve settings created by the old implementation. New
  // settings carry hasSavedVoucher, so transaction retries remain authoritative.
  const savedSnapshot = await getDocs(query(collection(db, vouchersCollection), orderBy('voucherNumber', 'desc'), limit(1)))
  const highestSavedNumber = savedSnapshot.empty ? null : Number(savedSnapshot.docs[0].data().voucherNumber)

  const createdRef = await runTransaction(db, async (transaction) => {
    const counterRef = settingsRef()
    const counterSnapshot = await transaction.get(counterRef)
    if (!counterSnapshot.exists()) throw new Error('Set the manual starting number first.')

    const counter = counterSnapshot.data()
    const startingNumber = Number(counter.startingNumber ?? 0)
    let lastNumber
    if (counter.hasSavedVoucher === false) {
      lastNumber = startingNumber
    } else if (counter.hasSavedVoucher === true) {
      lastNumber = Number(counter.lastVoucherNumber ?? startingNumber)
    } else {
      // Legacy counter: trust an actually saved voucher, not its potentially
      // consumed lastVoucherNumber value.
      lastNumber = Number.isFinite(highestSavedNumber) && highestSavedNumber > startingNumber
        ? highestSavedNumber
        : startingNumber
    }
    const voucherNumber = lastNumber + 1
    const voucherRef = doc(collection(db, vouchersCollection))
    const payload = {
      voucherNumber,
      voucherDate: voucherData.voucherDate,
      customerId: voucherData.customerId,
      customerName: voucherData.customerName,
      narration: (voucherData.narration || '').trim(),
      items: cleanItems(voucherData.items),
      totalAmount: Number(voucherData.totalAmount),
      status: 'Active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

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
    narration: (voucherData.narration || '').trim(),
    items: cleanItems(voucherData.items),
    totalAmount: Number(voucherData.totalAmount),
    updatedAt: serverTimestamp(),
  }
  await updateDoc(ref, payload)
  const snapshot = await getDoc(ref)
  return mapVoucher(snapshot)
}

export const deleteSalesVoucher = (id) => deleteDoc(doc(db, vouchersCollection, id))

export const salesVoucherService = {
  createSalesVoucher, getSalesVouchers, getSalesVoucherById, updateSalesVoucher,
  deleteSalesVoucher, getNextVoucherNumber, getVoucherSequence, initializeVoucherCounter,
}
