import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { DEFAULT_USER_PERMISSIONS, normalizePermissions, normalizeUserRole, USER_ROLES, USER_STATUSES } from '../constants/userAccess'

const COLLECTION = 'user'
const mapUserProfile = (snapshot) => {
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return { id: snapshot.id, ...data, role: normalizeUserRole(data.role), permissions: normalizePermissions(data.permissions) }
}

export const createSignupProfile = async (firebaseUser) => {
  const profile = { email: firebaseUser.email || '', role: 'user', status: 'pending', permissions: { ...DEFAULT_USER_PERMISSIONS }, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
  try {
    await setDoc(doc(db, COLLECTION, firebaseUser.uid), profile)
  } catch (error) {
    console.error('Signup profile creation failed', {
      code: error?.code,
      message: error?.message,
      error,
    })
    throw error
  }
  return { id: firebaseUser.uid, ...profile }
}
export const getUserProfile = async (uid) => {
  try {
    return mapUserProfile(await getDoc(doc(db, COLLECTION, uid)))
  } catch (error) {
    console.error('User profile read failed', {
      code: error?.code,
      message: error?.message,
      error,
    })
    throw error
  }
}
export const getUsers = async () => { const snapshot = await getDocs(collection(db, COLLECTION)); return snapshot.docs.map(mapUserProfile).sort((a, b) => (a.email || '').localeCompare(b.email || '')) }
export const updateUserAccess = async (uid, { role, status, permissions }) => {
  if (!USER_ROLES.includes(role)) throw new Error('Select a valid role.')
  if (!USER_STATUSES.includes(status)) throw new Error('Select a valid status.')
  const payload = { role, status, permissions: normalizePermissions(permissions), updatedAt: serverTimestamp() }
  await updateDoc(doc(db, COLLECTION, uid), payload)
  return payload
}
export const userService = { createSignupProfile, getUserProfile, getUsers, updateUserAccess }
