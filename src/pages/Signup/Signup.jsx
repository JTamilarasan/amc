import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const navigate = useNavigate()
  const { signup, authError, setAuthError } = useAuth()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (validationError) {
      setValidationError('')
    }
    if (authError) {
      setAuthError('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.fullName.trim()) {
      setValidationError('Please enter your full name.')
      return
    }

    if (!form.email.trim()) {
      setValidationError('Please enter your email address.')
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(form.email.trim())) {
      setValidationError('Please enter a valid email address.')
      return
    }

    if (form.password.length < 6) {
      setValidationError('Password must contain at least 6 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }

    setLoading(true)
    setValidationError('')

    try {
      await signup(form.email.trim(), form.password, form.fullName.trim(), true)
      navigate('/dashboard')
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
            <p>Create your account to keep renewals and customer service organized.</p>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-intro">
            <h2>Create Account</h2>
            <p>Sign up to access your AMC workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <label className="field">
              <span>Full Name</span>
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Alex Morgan" required />
            </label>

            <label className="field">
              <span>Email</span>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@company.com" required />
            </label>

            <label className="field">
              <span>Password</span>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="field">
              <span>Confirm Password</span>
              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Toggle confirm password visibility">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {validationError ? <div className="auth-error">{validationError}</div> : null}
            {authError ? <div className="auth-error">{authError}</div> : null}

            <Button type="submit" className="login-btn" disabled={loading}>
              <ShieldCheck size={16} />
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            </Button>
          </form>

          <div className="login-options">
            <span>Already have an account?</span>
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
