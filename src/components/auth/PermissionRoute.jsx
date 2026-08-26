import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const PermissionRoute = ({ permission, anyOf, adminOnly = false, children }) => {
  const { isAdmin, hasPermission } = useAuth()
  const allowed = adminOnly ? isAdmin : isAdmin || (permission ? hasPermission(permission) : (anyOf || []).some(hasPermission))
  return allowed ? children : <Navigate to="/unauthorized" replace />
}
export default PermissionRoute
