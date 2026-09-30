import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../firebase/firebase'

const COLLECTION = 'otherFollowUps'
const mapDocument = (snapshot) => ({ id: snapshot.id, ...snapshot.data() })

export const getOtherFollowUps = async (userId) => {
  if (!userId) return []
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('executiveId', '==', userId)))
  return snapshot.docs.map(mapDocument).sort((left, right) => (right.date || '').localeCompare(left.date || ''))
}

export const createOtherFollowUp = async (data) => {
  if (!data.date) throw new Error('Date is required.')
  if (!data.userId || !data.executiveName?.trim()) throw new Error('Signed-in executive details are required.')
  if (!['Open', 'Closed'].includes(data.status)) throw new Error('Select a valid status.')
  const payload = {
    date: data.date,
    executiveId: data.userId,
    createdById: data.userId,
    executiveName: data.executiveName.trim(),
    status: data.status,
    remarks: (data.remarks || '').trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const reference = await addDoc(collection(db, COLLECTION), payload)
  return { id: reference.id, ...payload }
}

export const otherFollowUpService = { getOtherFollowUps, createOtherFollowUp }
