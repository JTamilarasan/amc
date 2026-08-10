import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Masters from './pages/Masters/Masters'
import ExecutiveMaster from './pages/ExecutiveMaster/ExecutiveMaster'
import CustomerMaster from './pages/CustomerMaster/CustomerMaster'
import ProductMaster from './pages/ProductMaster/ProductMaster'
import SalesVoucher from './pages/SalesVoucher/SalesVoucher'
import AMCManagement from './pages/AMCManagement/AMCManagement'
import Reports from './pages/Reports/Reports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/masters" element={<Masters />} />
          <Route path="/masters/executives" element={<ExecutiveMaster />} />
          <Route path="/masters/customers" element={<CustomerMaster />} />
          <Route path="/masters/products" element={<ProductMaster />} />
          <Route path="/sales-voucher" element={<SalesVoucher />} />
          <Route path="/amc" element={<AMCManagement />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
