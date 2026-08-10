export const getFirebaseAuthErrorMessage = (error, context = 'login') => {
  const code = error?.code || ''

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/user-not-found':
      return context === 'signup' ? 'This email address is already registered.' : 'Invalid email or password.'
    case 'auth/wrong-password':
      return 'Invalid email or password.'
    case 'auth/email-already-in-use':
      return 'This email address is already registered.'
    case 'auth/weak-password':
      return 'Password must contain at least 6 characters.'
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled.'
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network issue. Please check your connection and try again.'
    case 'auth/requires-recent-login':
      return 'Please sign in again to continue.'
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    default:
      return error?.message || 'Authentication failed. Please try again.'
  }
}
