import { useState } from 'react'
import { Clock3, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'

const ApprovalPending = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <main className="approval-pending-page">
      <section className="approval-pending-card" aria-labelledby="approval-pending-title">
        <div className="approval-pending-icon" aria-hidden="true"><Clock3 size={34} /></div>
        <p className="approval-pending-eyebrow">AMC Manager</p>
        <h1 id="approval-pending-title">Account Approval Pending</h1>
        <p>Your account has been created successfully and is currently awaiting administrator approval.</p>
        <p>You will be able to access AMC Manager once your account is approved. Please contact your administrator if you need assistance.</p>
        {user?.email && <div className="approval-pending-user"><span>Signed in as</span><strong>{user.email}</strong></div>}
        <p className="approval-pending-thanks">Thank you for your patience.</p>
        <Button type="button" className="approval-pending-signout" onClick={handleSignOut} disabled={signingOut}>
          <LogOut size={16} /> {signingOut ? 'Signing Out...' : 'Sign Out'}
        </Button>
      </section>
    </main>
  )
}

export default ApprovalPending
