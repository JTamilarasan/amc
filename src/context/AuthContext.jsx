import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword, deleteUser, onAuthStateChanged, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { auth } from '../firebase/firebase'
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthErrors'
import { userService } from '../services/userService'
import Loader from '../components/common/Loader'

const AuthContext = createContext({})
const PROFILE_MISSING_ERROR = 'Your user profile is not configured. Please contact the administrator.'
const PROFILE_INACTIVE_ERROR = 'Your account is inactive. Please contact the administrator.'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); const [userProfile, setUserProfile] = useState(null); const [loading, setLoading] = useState(true); const [authError, setAuthError] = useState(''); const [profileVersion, setProfileVersion] = useState(0)
  const authOperation = useRef(false)
  const acceptAuthenticatedUser = async (firebaseUser) => { const profile = await userService.getUserProfile(firebaseUser.uid); if (!profile) throw new Error(PROFILE_MISSING_ERROR); if (profile.status !== 'active') throw new Error(PROFILE_INACTIVE_ERROR); setUser(firebaseUser); setUserProfile(profile); return profile }
  const rejectAuthenticatedUser = async (message) => { setUser(null); setUserProfile(null); setAuthError(message); await signOut(auth) }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (authOperation.current) return
      setLoading(true)
      if (!currentUser) { setUser(null); setUserProfile(null); setLoading(false); return }
      try { await acceptAuthenticatedUser(currentUser) }
      catch (error) { await rejectAuthenticatedUser(error.message || PROFILE_MISSING_ERROR) }
      finally { setLoading(false) }
    })
    return () => unsubscribe()
  }, [])

  const applyPersistence = async (rememberMe) => setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
  const login = async (email, password, rememberMe = false) => {
    setAuthError(''); setLoading(true); authOperation.current = true
    try { await applyPersistence(rememberMe); const credential = await signInWithEmailAndPassword(auth, email, password); await acceptAuthenticatedUser(credential.user) }
    catch (error) { const message = [PROFILE_MISSING_ERROR, PROFILE_INACTIVE_ERROR].includes(error.message) ? error.message : getFirebaseAuthErrorMessage(error, 'login'); if (auth.currentUser) await rejectAuthenticatedUser(message); else setAuthError(message); throw error }
    finally { authOperation.current = false; setLoading(false) }
  }
  const signup = async (email, password, displayName, rememberMe = false) => {
    setAuthError(''); setLoading(true); authOperation.current = true
    let createdUser = null
    try { await applyPersistence(rememberMe); const credential = await createUserWithEmailAndPassword(auth, email, password); createdUser = credential.user; await updateProfile(createdUser, { displayName }); const profile = await userService.createSignupProfile(createdUser); setUser(createdUser); setUserProfile(profile) }
    catch (error) {
      let message = getFirebaseAuthErrorMessage(error, 'signup')
      if (createdUser) {
        message = 'Your account profile could not be created. The incomplete signup was cancelled. Please try again or contact the administrator.'
        try { await deleteUser(createdUser) } catch { if (auth.currentUser) await signOut(auth) }
      }
      setAuthError(message); setUser(null); setUserProfile(null); throw error
    }
    finally { authOperation.current = false; setLoading(false) }
  }
  const resetPassword = async (email) => { setAuthError(''); try { await sendPasswordResetEmail(auth, email) } catch (error) { setAuthError(getFirebaseAuthErrorMessage(error, 'reset')); throw error } }
  const updateDisplayName = async (displayName) => { const nextName = displayName.trim(); if (!nextName) throw new Error('Display Name is required.'); if (!auth.currentUser) throw new Error('No authenticated user found.'); await updateProfile(auth.currentUser, { displayName: nextName }); setUser(auth.currentUser); setProfileVersion((current) => current + 1); return nextName }
  const refreshUserProfile = async () => { if (!auth.currentUser) return null; const profile = await acceptAuthenticatedUser(auth.currentUser); setProfileVersion((current) => current + 1); return profile }
  const logout = async () => { setAuthError(''); setUser(null); setUserProfile(null); await signOut(auth) }
  const isAdmin = userProfile?.role === 'admin'
  const hasPermission = (permission, action = 'view') => Boolean(isAdmin || userProfile?.permissions?.[permission]?.[action])
  const value = { user, currentUser: user, userProfile, role: userProfile?.role || 'user', permissions: userProfile?.permissions || {}, isAdmin, hasPermission, loading, authError, profileVersion, login, signup, resetPassword, updateDisplayName, refreshUserProfile, logout, setAuthError }
  if (loading) return <Loader fullScreen />
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
