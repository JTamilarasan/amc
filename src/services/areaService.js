import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase/firebase'

const AREAS_COLLECTION = 'areas'
const normalizeAreaName = (name) => (name || '').trim().toLowerCase()
const mapArea = (snapshot) => ({ id: snapshot.id, ...snapshot.data(), status: snapshot.data().status || 'Active' })

export const checkAreaExists = async (areaName, excludeId) => {
  const snapshot = await getDocs(query(collection(db, AREAS_COLLECTION), where('areaNameLower', '==', normalizeAreaName(areaName))))
  return snapshot.docs.some((item) => item.id !== excludeId)
}

export const createArea = async (areaName) => {
  const name = (areaName || '').trim()
  if (await checkAreaExists(name)) throw new Error('Area already exists.')
  const ref = await addDoc(collection(db, AREAS_COLLECTION), {
    areaName: name, areaNameLower: normalizeAreaName(name), status: 'Active',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return mapArea(await getDoc(ref))
}

export const getAreas = async () => {
  const snapshot = await getDocs(query(collection(db, AREAS_COLLECTION), orderBy('createdAt', 'desc')))
  return snapshot.docs.map(mapArea)
}

export const updateArea = async (id, areaName) => {
  const name = (areaName || '').trim()
  if (await checkAreaExists(name, id)) throw new Error('Area already exists.')
  const ref = doc(db, AREAS_COLLECTION, id)
  await updateDoc(ref, { areaName: name, areaNameLower: normalizeAreaName(name), updatedAt: serverTimestamp() })
  return mapArea(await getDoc(ref))
}

export const deleteArea = (id) => deleteDoc(doc(db, AREAS_COLLECTION, id))

export const areaService = { createArea, getAreas, updateArea, deleteArea, checkAreaExists }
