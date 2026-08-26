import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Save, Search, X } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { CRUD_ACTIONS, fullCrudPermission, fullModulePermission, getModuleActions, normalizeUserRole, PERMISSION_MODULES, USER_ROLES, USER_STATUSES } from '../../constants/userAccess'
import { userService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'

const title = (value) => value[0].toUpperCase() + value.slice(1)
const copyUser = (entry) => ({ ...entry, permissions: Object.fromEntries(Object.entries(entry.permissions).map(([module, permission]) => [module, { ...permission }])) })

const UserManagement = () => {
  const { user, refreshUserProfile } = useAuth()
  const selectorRef = useRef(null)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    userService.getUsers()
      .then((records) => setUsers(records.map((entry) => ({ ...entry, role: normalizeUserRole(entry.role) }))))
      .catch((reason) => setError(reason.message || 'Unable to load users.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const closeOnOutsideClick = (event) => { if (!selectorRef.current?.contains(event.target)) setIsOpen(false) }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase()
    return users.filter((entry) => !search || (entry.email || '').toLowerCase().includes(search))
  }, [query, users])

  const selectUser = (entry) => {
    setSelectedUser(copyUser(entry)); setQuery(entry.email || ''); setIsOpen(false); setActiveIndex(-1); setError(''); setMessage('')
  }
  const clearSelection = () => {
    setSelectedUser(null); setQuery(''); setIsOpen(false); setActiveIndex(-1); setError(''); setMessage('')
  }
  const handleSearchChange = (value) => {
    setQuery(value); setIsOpen(true); setActiveIndex(-1); setMessage('')
    if (selectedUser && value !== selectedUser.email) setSelectedUser(null)
  }
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') setIsOpen(false)
    else if (event.key === 'ArrowDown') { event.preventDefault(); setIsOpen(true); setActiveIndex((current) => Math.min(current + 1, filteredUsers.length - 1)) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((current) => Math.max(current - 1, 0)) }
    else if (event.key === 'Enter' && isOpen && activeIndex >= 0) { event.preventDefault(); selectUser(filteredUsers[activeIndex]) }
  }

  const change = (field, value) => setSelectedUser((current) => ({ ...current, [field]: value }))
  const changePermission = (module, action, checked) => setSelectedUser((current) => {
    if (!current || current.role === 'admin') return current
    const row = { ...current.permissions[module] }
    if (action === 'all') Object.assign(row, checked ? fullCrudPermission() : { view: false, add: false, edit: false, delete: false })
    else if (action === 'view' && !checked) Object.assign(row, { view: false, add: false, edit: false, delete: false })
    else { row[action] = checked; if (action !== 'view' && checked) row.view = true }
    return { ...current, permissions: { ...current.permissions, [module]: row } }
  })

  const save = async () => {
    if (!selectedUser) return
    setSaving(true); setError(''); setMessage('')
    try {
      await userService.updateUserAccess(selectedUser.id, selectedUser)
      setUsers((current) => current.map((entry) => entry.id === selectedUser.id ? copyUser(selectedUser) : entry))
      if (selectedUser.id === user?.uid) await refreshUserProfile()
      setMessage('User permissions updated successfully.')
    } catch (reason) { setError(reason.message || 'Unable to update user access.') } finally { setSaving(false) }
  }

  return <div className="page-stack user-management-page">
    <PageHeader title="User Management" subtitle="Manage roles, account status, and CRUD screen access." />
    {error && <div className="auth-error">{error}</div>}{message && <div className="auth-success">{message}</div>}
    <section className="panel-card">{loading ? <Loader label="Loading users..." /> : <>
      <div className="user-search-field" ref={selectorRef}>
        <label htmlFor="user-email-search">Select User</label>
        <div className={`user-search-control${isOpen ? ' is-open' : ''}`}><Search size={17} /><input id="user-email-search" type="text" value={query} placeholder="Search or select user email" autoComplete="off" role="combobox" aria-expanded={isOpen} aria-controls="user-email-options" onChange={(event) => handleSearchChange(event.target.value)} onFocus={() => setIsOpen(true)} onKeyDown={handleKeyDown} />{query && <button type="button" className="user-search-clear" aria-label="Clear selected user" onClick={clearSelection}><X size={17} /></button>}<ChevronDown size={17} /></div>
        {isOpen && <div id="user-email-options" className="user-search-options" role="listbox">
          {!users.length && <div className="user-search-empty">No user profiles found.</div>}
          {!!users.length && !filteredUsers.length && <div className="user-search-empty">No matching users found.</div>}
          {filteredUsers.map((entry, index) => <button type="button" role="option" aria-selected={selectedUser?.id === entry.id} className={`user-search-option${activeIndex === index ? ' is-active' : ''}`} key={entry.id} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectUser(entry)}><span>{entry.email || 'Email unavailable'}</span>{selectedUser?.id === entry.id && <Check size={16} />}</button>)}
        </div>}
      </div>
      {!selectedUser ? <div className="user-access-empty">Select a user to manage roles and permissions.</div> : <article className="user-access-card">
        <div className="user-access-heading"><div className="selected-user-email"><span>Email</span><strong>{selectedUser.email || '—'}</strong></div><label className="field"><span>Role</span><select value={selectedUser.role} disabled={selectedUser.role === 'admin'} onChange={(event) => change('role', event.target.value)}>{USER_ROLES.map((role) => <option value={role} key={role}>{title(role)}</option>)}</select></label><label className="field"><span>Status</span><select value={selectedUser.status} onChange={(event) => change('status', event.target.value)}>{USER_STATUSES.map((status) => <option value={status} key={status}>{title(status)}</option>)}</select></label></div>
        <div className="table-wrap permission-matrix"><table><thead><tr><th>Screen</th>{CRUD_ACTIONS.map((action) => <th key={action}>{title(action)}</th>)}<th>Select All</th></tr></thead><tbody>{PERMISSION_MODULES.map((permissionModule) => { const { key, label } = permissionModule; const actions = getModuleActions(permissionModule); const row = selectedUser.role === 'admin' ? fullModulePermission(permissionModule) : selectedUser.permissions[key]; const all = actions.length === CRUD_ACTIONS.length && actions.every((action) => row?.[action]); return <tr key={key}><th scope="row">{label}</th>{CRUD_ACTIONS.map((action) => <td key={action}>{actions.includes(action) && <input type="checkbox" aria-label={`${label} ${action}`} checked={Boolean(row?.[action])} disabled={selectedUser.role === 'admin' || (action !== 'view' && !row?.view)} onChange={(event) => changePermission(key, action, event.target.checked)} />}</td>)}<td>{actions.length === CRUD_ACTIONS.length && <input type="checkbox" aria-label={`${label} select all`} checked={all} disabled={selectedUser.role === 'admin'} onChange={(event) => changePermission(key, 'all', event.target.checked)} />}</td></tr> })}</tbody></table></div>
        <div className="user-access-save"><Button type="button" onClick={save} disabled={saving}><Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}</Button></div>
      </article>}
    </>}</section>
  </div>
}
export default UserManagement
