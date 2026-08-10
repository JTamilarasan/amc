import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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

export const initializeVoucherCounter = (startingNumber) => runTransaction(db, async (transaction) => {
  const ref = settingsRef()
  const snapshot = await transaction.get(ref)
  const start = Math.max(0, Math.trunc(Number(startingNumber)))
  if (!Number.isFinite(start)) throw new Error('Enter a valid manual starting number.')

  if (!snapshot.exists()) {
    transaction.set(ref, { startingNumber: start, lastVoucherNumber: start, updatedAt: serverTimestamp() })
    return start + 1
  }

  const data = snapshot.data()
  return Number(data.lastVoucherNumber ?? data.startingNumber ?? start) + 1
})

// This is a preview. The number is allocated atomically when createSalesVoucher runs.
export const getNextVoucherNumber = async () => {
  const snapshot = await getDoc(settingsRef())
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return Number(data.lastVoucherNumber ?? data.startingNumber ?? 0) + 1
}

export const createSalesVoucher = (voucherData) => runTransaction(db, async (transaction) => {
  const counterRef = settingsRef()
  const counterSnapshot = await transaction.get(counterRef)
  if (!counterSnapshot.exists()) throw new Error('Set the manual starting number first.')

  const counter = counterSnapshot.data()
  const lastNumber = Number(counter.lastVoucherNumber ?? counter.startingNumber ?? 0)
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

  transaction.update(counterRef, { lastVoucherNumber: voucherNumber, updatedAt: serverTimestamp() })
  transaction.set(voucherRef, payload)
  return { id: voucherRef.id, ...payload }
})

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
  deleteSalesVoucher, getNextVoucherNumber, initializeVoucherCounter,
}
