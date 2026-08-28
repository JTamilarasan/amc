import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Loader from '../common/Loader'
import ApprovalPending from '../../pages/ApprovalPending/ApprovalPending'

const ProtectedRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return <Loader fullScreen />
  }

  if (!user || !userProfile) {
    return <Navigate to="/login" replace />
  }

  if (userProfile.status === 'pending') {
    return <ApprovalPending />
  }

  return children
}

export default ProtectedRoute
