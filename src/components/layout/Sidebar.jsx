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

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, children: [{ label: 'AMC Dashboard', path: '/dashboard', permission: 'dashboard' }, { label: 'Enquiry and Support Dashboard', path: '/dashboard/enquiry', permission: 'enquiries' }] },
  {
    label: 'Vouchers',
    path: '/sales-voucher',
    icon: FileText,
    children: [
      { label: 'AMC Voucher', path: '/sales-voucher', permission: 'salesVouchers' },
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
    children: [
      { label: 'AMC Register Report', path: '/reports/sales-register', permission: 'salesVouchers' },
      { label: 'Call Register Report', path: '/reports/call-register', permission: 'voucherSettings' },
      { label: 'Single Customer Calls History Report', path: '/reports/single-customer-calls-history', permission: 'customers' },
      { label: 'Current Monthly Expiry Report', path: '/reports/current-month-expiry', permission: 'salesVouchers' },
      { label: 'AMC Customer Calls History', path: '/reports/customer-calls-history', permission: 'customers' },
      { label: 'Executive Calls Report', path: '/reports/executive-calls', permission: 'executives' },
      { label: 'Enquiry Report', path: '/reports/enquiry-report', permission: 'enquiries' },
      { label: 'Enquiry Leads Report', path: '/reports/enquiry-leads', permission: 'enquiries' },
    ],
  },
  { label: 'User Management', path: '/user-management', icon: Users, adminOnly: true },
]

const Sidebar = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { logout, isAdmin, hasPermission } = useAuth()
  const visibleItems = navItems.map((item) => {
    const children = item.children?.filter((child) => isAdmin || hasPermission(child.permission))
    return { ...item, path: !isAdmin && children?.length ? children[0].path : item.path, children }
  }).filter((item) => item.adminOnly ? isAdmin : item.children ? item.children.length > 0 : (isAdmin || !item.permission || hasPermission(item.permission)))

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
                    {item.children.map((child) => (
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
