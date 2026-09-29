import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/firebase'

const COLLECTION = 'otherFollowUps'
const mapDocument = (snapshot) => ({ id: snapshot.id, ...snapshot.data() })

export const getOtherFollowUps = async () => {
  const snapshot = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')))
  return snapshot.docs.map(mapDocument)
}

export const createOtherFollowUp = async (data) => {
  if (!data.date) throw new Error('Date is required.')
  if (!data.executiveName?.trim()) throw new Error('Executive name is required.')
  if (!['Open', 'Closed'].includes(data.status)) throw new Error('Select a valid status.')
  const payload = {
    date: data.date,
    executiveId: data.executiveId || '',
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
