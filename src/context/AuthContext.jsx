import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase/firebase'
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthErrors'
import Loader from '../components/common/Loader'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const applyPersistence = async (rememberMe) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
  }

  const login = async (email, password, rememberMe = false) => {
    setAuthError('')
    try {
      await applyPersistence(rememberMe)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setAuthError(getFirebaseAuthErrorMessage(error, 'login'))
      throw error
    }
  }

  const signup = async (email, password, displayName, rememberMe = false) => {
    setAuthError('')
    try {
      await applyPersistence(rememberMe)
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      if (credential.user) {
        await updateProfile(credential.user, { displayName })
      }
    } catch (error) {
      setAuthError(getFirebaseAuthErrorMessage(error, 'signup'))
      throw error
    }
  }

  const resetPassword = async (email) => {
    setAuthError('')
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      setAuthError(getFirebaseAuthErrorMessage(error, 'reset'))
      throw error
    }
  }

  const logout = async () => {
    setAuthError('')
    await signOut(auth)
  }

  const value = useMemo(
    () => ({
      user,
      currentUser: user,
      loading,
      authError,
      login,
      signup,
      resetPassword,
      logout,
      setAuthError,
    }),
    [user, loading, authError]
  )

  if (loading) {
    return <Loader fullScreen />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
