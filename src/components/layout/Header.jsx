import { Bell, ChevronDown, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Header = () => {
  const { user } = useAuth()
  const displayName = user?.displayName || user?.email || 'User'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={16} />
        <input placeholder="Search customers, vouchers..." />
      </div>
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
