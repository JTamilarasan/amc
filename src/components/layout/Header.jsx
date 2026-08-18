import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '../../context/AuthContext'
import { fetchExecutives, selectActiveExecutives } from '../../features/executives/executiveSlice'
import Button from '../common/Button'

const Header = () => {
  const { user, updateDisplayName } = useAuth()
  const dispatch = useDispatch()
  const executives = useSelector(selectActiveExecutives)
  const [profileOpen, setProfileOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [profileError, setProfileError] = useState('')
  const [saving, setSaving] = useState(false)
  const profileRef = useRef(null)
  const { pathname } = useLocation()
  const breadcrumbByPath = {
    '/dashboard': ['Dashboard', 'AMC Dashboard'],
    '/dashboard/enquiry': ['Dashboard', 'Enquiry and Support Dashboard'],
    '/enquiry': ['Vouchers', 'Enquiry Voucher'],
    '/masters': ['Masters'],
    '/masters/executives': ['Masters', 'Executive Master'],
    '/masters/customers': ['Masters', 'Customer Master'],
    '/masters/products': ['Masters', 'Product Master'],
    '/masters/areas': ['Masters', 'Area Master'],
    '/sales-voucher': ['Vouchers', 'AMC Voucher'],
    '/amc': ['AMC Management'],
    '/reports': ['Reports'],
    '/reports/sales-register': ['Reports', 'AMC Register Report'],
    '/reports/call-register': ['Reports', 'Call Register Report'],
    '/reports/single-customer-calls-history': ['Reports', 'Single Customer Calls History Report'],
    '/reports/amc-active': ['Reports', 'Active AMC Customers Report'],
    '/reports/amc-expired': ['Reports', 'Expired AMC Customers Report'],
    '/reports/amc-new': ['Reports', 'New AMC Report'],
    '/reports/amc-going-to-expire': ['Reports', 'Going to Expire AMC Report'],
    '/reports/amc-renewed': ['Reports', 'Renewed AMC Report'],
    '/reports/enquiry-report': ['Reports', 'Enquiry Report'],
    '/reports/current-month-expiry': ['Reports', 'Current Monthly Expiry Report'],
    '/reports/customer-calls-history': ['Reports', 'AMC Customer Calls History'],
    '/reports/executive-calls': ['Reports', 'Executive Calls Report'],
    '/call-management/call-receipt-voucher': ['Vouchers', 'Call Receipt Voucher'],
  }
  const breadcrumb = breadcrumbByPath[pathname] || ['Dashboard']
  const displayName = user?.displayName || user?.email || 'User'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    if (!profileOpen) return undefined
    const closeOutside = (event) => { if (!profileRef.current?.contains(event.target)) setProfileOpen(false) }
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [profileOpen])

  useEffect(() => { dispatch(fetchExecutives()) }, [dispatch])

  const toggleProfile = () => {
    setProfileOpen((open) => {
      if (!open) { setNameInput(user?.displayName || ''); setProfileError('') }
      return !open
    })
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    if (!nameInput.trim()) { setProfileError('Display Name is required.'); return }
    setSaving(true); setProfileError('')
    try { await updateDisplayName(nameInput); setProfileOpen(false) }
    catch (error) { setProfileError(error.message || 'Unable to update Display Name.') }
    finally { setSaving(false) }
  }

  return (
    <header className="topbar">
      <nav className="header-breadcrumb" aria-label="Breadcrumb">
        {breadcrumb.map((label, index) => (
          <span key={label} className={index === breadcrumb.length - 1 ? 'current' : ''}>
            {index > 0 ? <i aria-hidden="true">/</i> : null}{label}
          </span>
        ))}
      </nav>
      <div className="topbar-actions">
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="profile-menu" ref={profileRef}>
          <button type="button" className="profile-pill" onClick={toggleProfile} aria-expanded={profileOpen}>
            <div className="avatar">{initials || 'U'}</div>
            <div>
              <strong>Welcome, {displayName}</strong>
              <p>{user?.email || 'Signed in'}</p>
            </div>
            <ChevronDown size={16} />
          </button>
          {profileOpen && <form className="profile-popup" onSubmit={saveProfile}>
            <h3>Profile</h3>
            <label className="field"><span>Executive</span><select value={executives.find((executive) => executive.name === nameInput)?.id || ''} onChange={(event) => { setNameInput(executives.find((executive) => executive.id === event.target.value)?.name || ''); setProfileError('') }} autoFocus><option value="">Select executive</option>{executives.map((executive) => <option key={executive.id} value={executive.id}>{executive.name}</option>)}</select>{profileError && <div className="field-message">{profileError}</div>}</label>
            <label className="field"><span>Email</span><input value={user?.email || ''} readOnly disabled /></label>
            <div className="profile-popup-actions"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button><Button type="button" variant="secondary" onClick={() => setProfileOpen(false)} disabled={saving}>Cancel</Button></div>
          </form>}
        </div>
      </div>
    </header>
  )
}
export default Header
