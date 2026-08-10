import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { resetPassword, authError, setAuthError } = useAuth()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setAuthError('')

    try {
      await resetPassword(email)
      setMessage('If an account exists for this email, a password reset link has been sent.')
    } catch {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon large">A</div>
          <div>
            <h1>AMC Manager</h1>
            <p>Recover access to your account securely.</p>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-intro">
            <h2>Reset Password</h2>
            <p>Enter your email address and we’ll send reset instructions.</p>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
            </label>

            {authError ? <div className="auth-error">{authError}</div> : null}
            {message ? <div className="auth-success">{message}</div> : null}

            <Button type="submit" className="login-btn" disabled={loading}>
              <ShieldCheck size={16} />
              <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
            </Button>
          </form>

          <div className="login-options">
            <Link to="/login" className="text-link">
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
