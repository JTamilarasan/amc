import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BriefcaseBusiness,
  Headset,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Masters',
    path: '/masters',
    icon: BookOpen,
    children: [
      { label: 'Executive Master', path: '/masters/executives' },
      { label: 'Customer Master', path: '/masters/customers' },
      { label: 'Product Master', path: '/masters/products' },
      { label: 'Area Master', path: '/masters/areas' },
    ],
  },
  { label: 'Sales Voucher', path: '/sales-voucher', icon: FileText },
  { label: 'AMC Management', path: '/amc', icon: BriefcaseBusiness },
  {
    label: 'Call Management',
    path: '/call-management/call-receipt-voucher',
    icon: Headset,
    children: [
      { label: 'Call Receipt Voucher', path: '/call-management/call-receipt-voucher' },
    ],
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: BarChart3,
    children: [
      { label: 'Sales Register Report', path: '/reports/sales-register' },
      { label: 'Current Monthly Expiry Report', path: '/reports/current-month-expiry' },
      { label: 'Customer Calls History Report', path: '/reports/customer-calls-history' },
      { label: 'Executive Calls Report', path: '/reports/executive-calls' },
    ],
  },
]

const Sidebar = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

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
            {navItems.map((item) => (
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
