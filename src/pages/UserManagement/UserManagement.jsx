import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { normalizeUserRole, PERMISSION_LABELS, USER_ROLES, USER_STATUSES } from '../../constants/userAccess'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'

const UserManagement = () => {
  const { user, refreshUserProfile } = useAuth()
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [savingId, setSavingId] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState('')
  useEffect(() => { userService.getUsers().then((records) => setUsers(records.map((entry) => ({ ...entry, role: normalizeUserRole(entry.role) })))).catch((reason) => setError(reason.message || 'Unable to load users.')).finally(() => setLoading(false)) }, [])
  const change = (id, field, value) => setUsers((current) => current.map((entry) => entry.id === id ? { ...entry, [field]: value } : entry))
  const changePermission = (id, permission, checked) => setUsers((current) => current.map((entry) => entry.id === id ? { ...entry, permissions: { ...entry.permissions, [permission]: checked } } : entry))
  const save = async (entry) => { setSavingId(entry.id); setError(''); setMessage(''); try { await userService.updateUserAccess(entry.id, entry); if (entry.id === user?.uid) await refreshUserProfile(); setMessage(`${entry.email} access updated successfully.`) } catch (reason) { setError(reason.message || 'Unable to update user access.') } finally { setSavingId('') } }
  return <div className="page-stack user-management-page"><PageHeader title="User Management" subtitle="Manage roles, account status, and screen access." />{error && <div className="auth-error">{error}</div>}{message && <div className="auth-success">{message}</div>}<section className="panel-card">{loading ? <Loader label="Loading users..." /> : <div className="table-wrap user-management-table"><table><thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Screen Access</th><th>Actions</th></tr></thead><tbody>{!users.length && <tr><td colSpan="5" className="text-center">No user profiles found.</td></tr>}{users.map((entry) => <tr key={entry.id}><td>{entry.email || '—'}</td><td><select value={entry.role} onChange={(event) => change(entry.id, 'role', event.target.value)}>{USER_ROLES.map((role) => <option value={role} key={role}>{role[0].toUpperCase() + role.slice(1)}</option>)}</select></td><td><select value={entry.status} onChange={(event) => change(entry.id, 'status', event.target.value)}>{USER_STATUSES.map((status) => <option value={status} key={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></td><td><div className="permission-grid">{Object.entries(PERMISSION_LABELS).map(([key, label]) => <label className="checkbox-row" key={key}><input type="checkbox" checked={entry.role === 'admin' || Boolean(entry.permissions?.[key])} disabled={entry.role === 'admin'} onChange={(event) => changePermission(entry.id, key, event.target.checked)} /><span>{label}</span></label>)}</div></td><td><Button type="button" onClick={() => save(entry)} disabled={savingId === entry.id}><Save size={14} /> {savingId === entry.id ? 'Saving...' : 'Save'}</Button></td></tr>)}</tbody></table></div>}</section></div>
}
export default UserManagement
