import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import Button from '../../components/common/Button'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon large">A</div>
          <div>
            <h1>AMC Manager</h1>
            <p>Professional service and AMC renewals platform</p>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-intro">
            <h2>Welcome Back</h2>
            <p>Sign in to manage your customers and AMC renewals.</p>
          </div>

          <label className="field">
            <span>Username / Email</span>
            <input type="text" placeholder="admin@amcmanager.com" />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} placeholder="Enter password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="login-options">
            <label className="checkbox-row">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#">Forgot Password?</a>
          </div>

          <Button onClick={() => navigate('/dashboard')} className="login-btn">
            <ShieldCheck size={16} />
            <span>Login</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Login
