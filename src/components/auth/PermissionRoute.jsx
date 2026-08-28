import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getUserLandingRoute } from '../../constants/userAccess'

const PermissionRoute = ({ permission, anyOf, adminOnly = false, children }) => {
  const { isAdmin, hasPermission, userProfile } = useAuth()
  const allowed = adminOnly ? isAdmin : isAdmin || (permission ? hasPermission(permission) : (anyOf || []).some(hasPermission))
  const landingRoute = getUserLandingRoute(userProfile)
  return allowed ? children : <Navigate to={landingRoute === '/unauthorized' ? '/unauthorized' : landingRoute} replace />
}
export default PermissionRoute
