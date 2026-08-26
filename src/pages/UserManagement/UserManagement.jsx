import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { CRUD_ACTIONS, fullCrudPermission, normalizeUserRole, PERMISSION_LABELS, USER_ROLES, USER_STATUSES } from '../../constants/userAccess'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'

const title = (value) => value[0].toUpperCase() + value.slice(1)
const UserManagement = () => {
  const { user, refreshUserProfile } = useAuth()
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [savingId, setSavingId] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState('')
  useEffect(() => { userService.getUsers().then((records) => setUsers(records.map((entry) => ({ ...entry, role: normalizeUserRole(entry.role) })))).catch((reason) => setError(reason.message || 'Unable to load users.')).finally(() => setLoading(false)) }, [])
  const change = (id, field, value) => setUsers((current) => current.map((entry) => entry.id === id ? { ...entry, [field]: value } : entry))
  const changePermission = (id, module, action, checked) => setUsers((current) => current.map((entry) => {
    if (entry.id !== id || entry.role === 'admin') return entry
    const row = { ...entry.permissions[module] }
    if (action === 'all') Object.assign(row, checked ? fullCrudPermission() : { view: false, add: false, edit: false, delete: false })
    else if (action === 'view' && !checked) Object.assign(row, { view: false, add: false, edit: false, delete: false })
    else { row[action] = checked; if (action !== 'view' && checked) row.view = true }
    return { ...entry, permissions: { ...entry.permissions, [module]: row } }
  }))
  const save = async (entry) => { setSavingId(entry.id); setError(''); setMessage(''); try { await userService.updateUserAccess(entry.id, entry); if (entry.id === user?.uid) await refreshUserProfile(); setMessage(`${entry.email} access updated successfully.`) } catch (reason) { setError(reason.message || 'Unable to update user access.') } finally { setSavingId('') } }
  return <div className="page-stack user-management-page"><PageHeader title="User Management" subtitle="Manage roles, account status, and CRUD screen access." />{error && <div className="auth-error">{error}</div>}{message && <div className="auth-success">{message}</div>}<section className="panel-card">{loading ? <Loader label="Loading users..." /> : <div className="user-access-list">{!users.length && <div className="text-center">No user profiles found.</div>}{users.map((entry) => <article className="user-access-card" key={entry.id}><div className="user-access-heading"><strong>{entry.email || '—'}</strong><label className="field"><span>Role</span><select value={entry.role} onChange={(event) => change(entry.id, 'role', event.target.value)}>{USER_ROLES.map((role) => <option value={role} key={role}>{title(role)}</option>)}</select></label><label className="field"><span>Status</span><select value={entry.status} onChange={(event) => change(entry.id, 'status', event.target.value)}>{USER_STATUSES.map((status) => <option value={status} key={status}>{title(status)}</option>)}</select></label><Button type="button" onClick={() => save(entry)} disabled={savingId === entry.id}><Save size={14} /> {savingId === entry.id ? 'Saving...' : 'Save'}</Button></div><div className="table-wrap permission-matrix"><table><thead><tr><th>Screen</th>{CRUD_ACTIONS.map((action) => <th key={action}>{title(action)}</th>)}<th>Select All</th></tr></thead><tbody>{Object.entries(PERMISSION_LABELS).map(([module, label]) => { const row = entry.role === 'admin' ? fullCrudPermission() : entry.permissions[module]; const all = CRUD_ACTIONS.every((action) => row?.[action]); return <tr key={module}><th scope="row">{label}</th>{CRUD_ACTIONS.map((action) => <td key={action}><input type="checkbox" aria-label={`${label} ${action}`} checked={Boolean(row?.[action])} disabled={entry.role === 'admin' || (action !== 'view' && !row?.view)} onChange={(event) => changePermission(entry.id, module, action, event.target.checked)} /></td>)}<td><input type="checkbox" aria-label={`${label} select all`} checked={all} disabled={entry.role === 'admin'} onChange={(event) => changePermission(entry.id, module, 'all', event.target.checked)} /></td></tr> })}</tbody></table></div></article>)}</div>}</section></div>
}
export default UserManagement
