import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import Dashboard from './pages/Dashboard/Dashboard'
import Masters from './pages/Masters/Masters'
import ExecutiveMaster from './pages/ExecutiveMaster/ExecutiveMaster'
import CustomerMaster from './pages/CustomerMaster/CustomerMaster'
import ProductMaster from './pages/ProductMaster/ProductMaster'
import AreaMaster from './pages/AreaMaster/AreaMaster'
import SalesVoucher from './pages/SalesVoucher/SalesVoucher'
import AMCManagement from './pages/AMCManagement/AMCManagement'
import Reports from './pages/Reports/Reports'
import SalesRegisterReport from './pages/Reports/SalesRegisterReport'
import CurrentMonthlyExpiryReport from './pages/Reports/CurrentMonthlyExpiryReport'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/masters" element={<Masters />} />
            <Route path="/masters/executives" element={<ExecutiveMaster />} />
            <Route path="/masters/customers" element={<CustomerMaster />} />
            <Route path="/masters/products" element={<ProductMaster />} />
            <Route path="/masters/areas" element={<AreaMaster />} />
            <Route path="/sales-voucher" element={<SalesVoucher />} />
            <Route path="/amc" element={<AMCManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/sales-register" element={<SalesRegisterReport />} />
            <Route path="/reports/current-month-expiry" element={<CurrentMonthlyExpiryReport />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
