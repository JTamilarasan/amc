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

const EXECUTIVES_COLLECTION = 'executives'

const normalizeExecutiveName = (name) => (name || '').trim().toLowerCase()

const mapExecutive = (docSnapshot) => {
  const data = docSnapshot.data()
  return {
    id: docSnapshot.id,
    name: data.name,
    nameLower: data.nameLower,
    status: data.status || 'Active',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

export const createExecutive = async (name) => {
  const normalizedName = normalizeExecutiveName(name)
  const exists = await checkExecutiveExists(normalizedName)

  if (exists) {
    throw new Error('Executive already exists.')
  }

  const docRef = await addDoc(collection(db, EXECUTIVES_COLLECTION), {
    name: name.trim(),
    nameLower: normalizedName,
    status: 'Active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const createdSnapshot = await getDoc(docRef)
  const createdData = createdSnapshot.data()

  return {
    id: createdSnapshot.id,
    name: createdData?.name || name.trim(),
    nameLower: createdData?.nameLower || normalizedName,
    status: createdData?.status || 'Active',
    createdAt: createdData?.createdAt || null,
    updatedAt: createdData?.updatedAt || null,
  }
}

export const getExecutives = async () => {
  const executivesRef = collection(db, EXECUTIVES_COLLECTION)
  const q = query(executivesRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(mapExecutive)
}

export const updateExecutive = async (id, name) => {
  const normalizedName = normalizeExecutiveName(name)
  const exists = await checkExecutiveExists(normalizedName, id)

  if (exists) {
    throw new Error('Executive already exists.')
  }

  const executiveRef = doc(db, EXECUTIVES_COLLECTION, id)
  await updateDoc(executiveRef, {
    name: name.trim(),
    nameLower: normalizedName,
    updatedAt: serverTimestamp(),
  })

  return {
    id,
    name: name.trim(),
    nameLower: normalizedName,
    status: 'Active',
  }
}

export const deleteExecutive = async (id) => {
  const executiveRef = doc(db, EXECUTIVES_COLLECTION, id)
  await deleteDoc(executiveRef)
}

export const searchExecutives = async (searchText) => {
  const normalizedSearch = normalizeExecutiveName(searchText)
  const executivesRef = collection(db, EXECUTIVES_COLLECTION)
  const q = query(executivesRef, where('nameLower', '>=', normalizedSearch), where('nameLower', '<=', `${normalizedSearch}\uf8ff`))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(mapExecutive)
}

export const checkExecutiveExists = async (name, excludeId) => {
  const normalizedName = normalizeExecutiveName(name)
  const executivesRef = collection(db, EXECUTIVES_COLLECTION)
  const q = query(executivesRef, where('nameLower', '==', normalizedName))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return false
  }

  if (!excludeId) {
    return true
  }

  return snapshot.docs.some((item) => item.id !== excludeId)
}

export const executiveService = {
  createExecutive,
  getExecutives,
  updateExecutive,
  deleteExecutive,
  searchExecutives,
  checkExecutiveExists,
}
