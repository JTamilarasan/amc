import { Bell, ChevronDown, Search } from 'lucide-react'

const Header = () => {
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
          <div className="avatar">A</div>
          <div>
            <strong>Welcome, Admin</strong>
            <p>Super Admin</p>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  )
}

export default Header
