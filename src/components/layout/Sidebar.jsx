import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PERMISSION_KEYS } from '../../constants/userAccess'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, children: [{ label: 'AMC Dashboard', path: '/dashboard', permission: 'dashboard' }, { label: 'Free Support Dashboard', path: '/dashboard/free-support', permission: 'dashboard' }, { label: 'Enquiry and Support Dashboard', path: '/dashboard/enquiry', permission: 'enquiries' }] },
  {
    label: 'Vouchers',
    path: '/sales-voucher',
    icon: FileText,
    children: [
      { label: 'AMC Voucher', path: '/sales-voucher', permission: 'salesVouchers' },
      { label: 'Free Support', path: '/free-support-voucher', permission: 'salesVouchers' },
      { label: 'Call Receipt Voucher', path: '/call-management/call-receipt-voucher', permission: 'voucherSettings' },
      { label: 'Enquiry Voucher', path: '/enquiry', permission: 'enquiries' },
    ],
  },
  {
    label: 'Masters',
    path: '/masters',
    icon: BookOpen,
    children: [
      { label: 'Executive Master', path: '/masters/executives', permission: 'executives' },
      { label: 'Customer Master', path: '/masters/customers', permission: 'customers' },
      { label: 'Product Master', path: '/masters/products', permission: 'products' },
      { label: 'Area Master', path: '/masters/areas', permission: 'areas' },
    ],
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: BarChart3,
    permission: PERMISSION_KEYS.reports,
    children: [
      { label: 'Registers', type: 'heading' },
      { label: 'AMC Register', path: '/reports/sales-register', permission: PERMISSION_KEYS.reports },
      { label: 'Free support Register', path: '/reports/free-support-register', permission: PERMISSION_KEYS.reports },
      { label: 'Call Register', path: '/reports/call-register', permission: PERMISSION_KEYS.reports },
      { label: 'Enquiry register', path: '/reports/enquiry-report', permission: PERMISSION_KEYS.reports },
      { label: 'Summary', type: 'heading' },
      { label: 'Free support call Summary', path: '/reports/free-support-calls-history', permission: PERMISSION_KEYS.reports },
      { label: 'AMC Customer call summary', path: '/reports/customer-calls-history', permission: PERMISSION_KEYS.reports },
      { label: 'Executive wise summary', path: '/reports/executive-calls', permission: PERMISSION_KEYS.reports },
      { label: 'Enquiry Lead wise summary', path: '/reports/enquiry-leads', permission: PERMISSION_KEYS.reports },
      { label: 'Other Reports', type: 'heading' },
      { label: 'Current Month Expiry report', path: '/reports/current-month-expiry', permission: PERMISSION_KEYS.reports },
      { label: 'Customer calls report', path: '/reports/single-customer-calls-history', permission: PERMISSION_KEYS.reports },
    ],
  },
  { label: 'User Management', path: '/user-management', icon: Users, adminOnly: true },
]

const Sidebar = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { logout, isAdmin, hasPermission } = useAuth()
  const visibleItems = navItems.map((item) => {
    const children = item.children?.filter((child) => child.type === 'heading' || isAdmin || hasPermission(child.permission))
    const firstLink = children?.find((child) => child.type !== 'heading')
    return { ...item, path: !isAdmin && firstLink ? firstLink.path : item.path, children }
  }).filter((item) => item.adminOnly ? isAdmin : item.children ? (isAdmin || !item.permission || hasPermission(item.permission)) && item.children.length > 0 : (isAdmin || !item.permission || hasPermission(item.permission)))

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand-block">
            <div className="brand-icon">A</div>
            <div>
              <h2>AMC Manager</h2>
              <p>Service CRM</p>
            </div>
            <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>

          <nav className="nav-links">
            {visibleItems.map((item) => (
              <div key={item.label}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
                {item.children ? (
                  <div className="submenu">
                    {item.children.map((child) => child.type === 'heading' ? (
                      <div className="nav-subheading" key={child.label}>{child.label}</div>
                    ) : (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) => `nav-sublink ${isActive ? 'active' : ''}`}
                        onClick={() => setOpen(false)}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </aside>
    </>
  )
}

export default Sidebar
