import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

const CUSTOMERS_COLLECTION = 'customers'

const normalizeCustomerName = (name) => (name || '').trim().toLowerCase()

const mapCustomer = (docSnapshot) => {
  const data = docSnapshot.data()
  return {
    id: docSnapshot.id,
    customerName: data.customerName,
    customerNameLower: data.customerNameLower,
    address: data.address,
    pincode: data.pincode,
    country: data.country,
    state: data.state,
    gstin: data.gstin,
    category1: data.category1,
    category2: data.category2,
    executiveId: data.executiveId,
    executiveName: data.executiveName,
    notes: data.notes,
    status: data.status || 'Active',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

const formatCustomerPayload = (customerData) => ({
  customerName: customerData.customerName.trim(),
  customerNameLower: normalizeCustomerName(customerData.customerName),
  address: customerData.address.trim(),
  pincode: customerData.pincode.trim(),
  country: customerData.country.trim(),
  state: customerData.state.trim(),
  gstin: (customerData.gstin || '').trim(),
  category1: customerData.category1,
  category2: customerData.category2,
  executiveId: customerData.executiveId || '',
  executiveName: customerData.executiveName || '',
  notes: (customerData.notes || '').trim(),
  status: 'Active',
})

export const createCustomer = async (customerData) => {
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
  return {
    id,
    ...payload,
    status: 'Active',
    createdAt: null,
    updatedAt: null,
  }
}

export const deleteCustomer = async (id) => {
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
}
