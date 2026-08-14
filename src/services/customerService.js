import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { INDIAN_STATES } from '../data/indianStates'

const CUSTOMERS_COLLECTION = 'customers'

const normalizeCustomerName = (name) => (name || '').trim().toLowerCase()

const validateRequiredCustomerFields = (customerData) => {
  if (!(customerData.customerName || '').trim()) throw new Error('Customer name is required.')
  if (!customerData.areaId) throw new Error('Please select an area.')
  if (!INDIAN_STATES.includes(customerData.state)) throw new Error('Please select State')
  const mobileNo = (customerData.mobileNo || '').trim()
  if (!mobileNo) throw new Error('Mobile number is required.')
  if (!/^\d{10}$/.test(mobileNo)) throw new Error('Enter a valid 10-digit mobile number.')
  const email = (customerData.email || '').trim()
  if (!email) throw new Error('Email ID is required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
}

const mapCustomer = (docSnapshot) => {
  const data = docSnapshot.data()
  return {
    id: docSnapshot.id,
    customerName: data.customerName,
    customerNameLower: data.customerNameLower,
    mobileNo: data.mobileNo || '',
    email: data.email || '',
    areaId: data.areaId || '',
    areaName: data.areaName || '',
    address: data.address || '',
    pincode: data.pincode || '',
    country: data.country || '',
    state: data.state || '',
    gstin: data.gstin || '',
    category1: data.category1 || '',
    category2: data.category2 || '',
    executiveId: data.executiveId || '',
    executiveName: data.executiveName || '',
    notes: data.notes || '',
    status: data.status || 'Active',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

const formatCustomerPayload = (customerData) => ({
  customerName: customerData.customerName.trim(),
  customerNameLower: normalizeCustomerName(customerData.customerName),
  mobileNo: (customerData.mobileNo || '').trim(),
  email: (customerData.email || '').trim().toLowerCase(),
  areaId: customerData.areaId || '',
  areaName: customerData.areaName || '',
  address: (customerData.address || '').trim(),
  pincode: (customerData.pincode || '').trim(),
  country: (customerData.country || '').trim(),
  state: (customerData.state || '').trim(),
  gstin: (customerData.gstin || '').trim(),
  category1: customerData.category1 || '',
  category2: customerData.category2 || '',
  executiveId: customerData.executiveId || '',
  executiveName: customerData.executiveName || '',
  notes: (customerData.notes || '').trim(),
  status: 'Active',
})

export const createCustomer = async (customerData) => {
  validateRequiredCustomerFields(customerData)
  const normalizedName = normalizeCustomerName(customerData.customerName)
  const exists = await checkCustomerExists(normalizedName)

  if (exists) {
    throw new Error('Customer already exists.')
  }

  const payload = {
    ...formatCustomerPayload(customerData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), payload)
  const createdSnapshot = await getDoc(docRef)
  return mapCustomer(createdSnapshot)
}

export const getCustomers = async () => {
  const customersRef = collection(db, CUSTOMERS_COLLECTION)
  const q = query(customersRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(mapCustomer)
}

export const getCustomerById = async (id) => {
  const snapshot = await getDoc(doc(db, CUSTOMERS_COLLECTION, id))
  return snapshot.exists() ? mapCustomer(snapshot) : null
}

export const updateCustomer = async (id, customerData) => {
  validateRequiredCustomerFields(customerData)
  const normalizedName = normalizeCustomerName(customerData.customerName)
  const exists = await checkCustomerExists(normalizedName, id)

  if (exists) {
    throw new Error('Customer already exists.')
  }

  const payload = {
    ...formatCustomerPayload(customerData),
    updatedAt: serverTimestamp(),
  }

  const customerRef = doc(db, CUSTOMERS_COLLECTION, id)
  await updateDoc(customerRef, payload)
  return mapCustomer(await getDoc(customerRef))
}

export const getCustomerUsage = async () => {
  const [salesSnapshot, callsSnapshot] = await Promise.all([
    getDocs(collection(db, 'salesVouchers')),
    getDocs(collection(db, 'callReceiptVouchers')),
  ])
  const ids = [...new Set([
    ...salesSnapshot.docs.map((item) => item.data().customerId),
    ...callsSnapshot.docs.map((item) => item.data().partyId),
  ].filter(Boolean))]
  const legacyNames = [...new Set([
    ...salesSnapshot.docs.filter((item) => !item.data().customerId).map((item) => normalizeCustomerName(item.data().customerName)),
    ...callsSnapshot.docs.filter((item) => !item.data().partyId).map((item) => normalizeCustomerName(item.data().partyName)),
  ].filter(Boolean))]
  return { ids, legacyNames }
}

export const getUsedCustomerIds = async () => (await getCustomerUsage()).ids

export const isCustomerUsed = async (id) => {
  const [salesSnapshot, callsSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'salesVouchers'), where('customerId', '==', id), limit(1))),
    getDocs(query(collection(db, 'callReceiptVouchers'), where('partyId', '==', id), limit(1))),
  ])
  if (!salesSnapshot.empty || !callsSnapshot.empty) return true
  const customerSnapshot = await getDoc(doc(db, CUSTOMERS_COLLECTION, id))
  if (!customerSnapshot.exists()) return false
  const usage = await getCustomerUsage()
  return usage.legacyNames.includes(normalizeCustomerName(customerSnapshot.data().customerName))
}

export const deleteCustomer = async (id) => {
  if (await isCustomerUsed(id)) throw new Error('Customer cannot be deleted because transactions already exist.')
  const customerRef = doc(db, CUSTOMERS_COLLECTION, id)
  await deleteDoc(customerRef)
}

export const checkCustomerExists = async (customerName, excludeId) => {
  const normalizedName = normalizeCustomerName(customerName)
  const customersRef = collection(db, CUSTOMERS_COLLECTION)
  const q = query(customersRef, where('customerNameLower', '==', normalizedName))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return false
  }

  if (!excludeId) {
    return true
  }

  return snapshot.docs.some((item) => item.id !== excludeId)
}

export const searchCustomers = async (searchText) => {
  const normalizedSearch = normalizeCustomerName(searchText)
  const customersRef = collection(db, CUSTOMERS_COLLECTION)
  const q = query(customersRef, where('customerNameLower', '>=', normalizedSearch), where('customerNameLower', '<=', `${normalizedSearch}\uf8ff`))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(mapCustomer)
}

export const customerService = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  checkCustomerExists,
  searchCustomers,
  getUsedCustomerIds,
  getCustomerUsage,
  isCustomerUsed,
}
