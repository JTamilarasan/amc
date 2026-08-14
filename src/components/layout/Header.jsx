import { Bell, ChevronDown } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Header = () => {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const breadcrumbByPath = {
    '/dashboard': ['Dashboard'],
    '/enquiry': ['Enquiry'],
    '/masters': ['Masters'],
    '/masters/executives': ['Masters', 'Executive Master'],
    '/masters/customers': ['Masters', 'Customer Master'],
    '/masters/products': ['Masters', 'Product Master'],
    '/masters/areas': ['Masters', 'Area Master'],
    '/sales-voucher': ['Sales Voucher'],
    '/amc': ['AMC Management'],
    '/reports': ['Reports'],
    '/reports/sales-register': ['Reports', 'Sales Register Report'],
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
    '/call-management/call-receipt-voucher': ['Call Management', 'Call Receipt Voucher'],
  }
  const breadcrumb = breadcrumbByPath[pathname] || ['Dashboard']
  const displayName = user?.displayName || user?.email || 'User'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

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
        <div className="profile-pill">
          <div className="avatar">{initials || 'U'}</div>
          <div>
            <strong>Welcome, {displayName}</strong>
            <p>{user?.email || 'Signed in'}</p>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  )
}

export default Header
