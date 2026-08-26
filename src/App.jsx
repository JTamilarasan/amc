import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PermissionRoute from './components/auth/PermissionRoute'
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
import CallReceiptVoucher from './pages/CallManagement/CallReceiptVoucher'
import CustomerCallsHistoryReport from './pages/Reports/CustomerCallsHistoryReport'
import ExecutiveCallsReport from './pages/Reports/ExecutiveCallsReport'
import CallRegisterReport from './pages/Reports/CallRegisterReport'
import SingleCustomerCallsHistoryReport from './pages/Reports/SingleCustomerCallsHistoryReport'
import ActiveAmcCustomersReport from './pages/Reports/ActiveAmcCustomersReport'
import ExpiredAmcCustomersReport from './pages/Reports/ExpiredAmcCustomersReport'
import NewAmcReport from './pages/Reports/NewAmcReport'
import GoingToExpireAmcReport from './pages/Reports/GoingToExpireAmcReport'
import RenewedAmcReport from './pages/Reports/RenewedAmcReport'
import Enquiry from './pages/Enquiry/Enquiry'
import EnquiryDashboard from './pages/Enquiry/EnquiryDashboard'
import EnquiryReport from './pages/Reports/EnquiryReport'
import EnquiryLeadsReport from './pages/Reports/EnquiryLeadsReport'
import UserManagement from './pages/UserManagement/UserManagement'
import Unauthorized from './pages/Unauthorized/Unauthorized'
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
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/dashboard" element={<PermissionRoute permission="dashboard"><Dashboard /></PermissionRoute>} />
            <Route path="/dashboard/enquiry" element={<PermissionRoute permission="enquiries"><EnquiryDashboard /></PermissionRoute>} />
            <Route path="/enquiry" element={<PermissionRoute permission="enquiries"><Enquiry /></PermissionRoute>} />
            <Route path="/masters" element={<PermissionRoute anyOf={['customers', 'executives', 'products', 'areas']}><Masters /></PermissionRoute>} />
            <Route path="/masters/executives" element={<PermissionRoute permission="executives"><ExecutiveMaster /></PermissionRoute>} />
            <Route path="/masters/customers" element={<PermissionRoute permission="customers"><CustomerMaster /></PermissionRoute>} />
            <Route path="/masters/products" element={<PermissionRoute permission="products"><ProductMaster /></PermissionRoute>} />
            <Route path="/masters/areas" element={<PermissionRoute permission="areas"><AreaMaster /></PermissionRoute>} />
            <Route path="/sales-voucher" element={<PermissionRoute permission="salesVouchers"><SalesVoucher /></PermissionRoute>} />
            <Route path="/amc" element={<PermissionRoute permission="salesVouchers"><AMCManagement /></PermissionRoute>} />
            <Route path="/call-management/call-receipt-voucher" element={<PermissionRoute permission="voucherSettings"><CallReceiptVoucher /></PermissionRoute>} />
            <Route path="/reports" element={<PermissionRoute anyOf={['customers', 'enquiries', 'executives', 'salesVouchers', 'voucherSettings']}><Reports /></PermissionRoute>} />
            <Route path="/reports/sales-register" element={<PermissionRoute permission="salesVouchers"><SalesRegisterReport /></PermissionRoute>} />
            <Route path="/reports/current-month-expiry" element={<PermissionRoute permission="salesVouchers"><CurrentMonthlyExpiryReport /></PermissionRoute>} />
            <Route path="/reports/customer-calls-history" element={<PermissionRoute permission="customers"><CustomerCallsHistoryReport /></PermissionRoute>} />
            <Route path="/reports/executive-calls" element={<PermissionRoute permission="executives"><ExecutiveCallsReport /></PermissionRoute>} />
            <Route path="/reports/call-register" element={<PermissionRoute permission="voucherSettings"><CallRegisterReport /></PermissionRoute>} />
            <Route path="/reports/single-customer-calls-history" element={<PermissionRoute permission="customers"><SingleCustomerCallsHistoryReport /></PermissionRoute>} />
            <Route path="/reports/amc-active" element={<PermissionRoute permission="salesVouchers"><ActiveAmcCustomersReport /></PermissionRoute>} />
            <Route path="/reports/amc-expired" element={<PermissionRoute permission="salesVouchers"><ExpiredAmcCustomersReport /></PermissionRoute>} />
            <Route path="/reports/amc-new" element={<PermissionRoute permission="salesVouchers"><NewAmcReport /></PermissionRoute>} />
            <Route path="/reports/amc-going-to-expire" element={<PermissionRoute permission="salesVouchers"><GoingToExpireAmcReport /></PermissionRoute>} />
            <Route path="/reports/amc-renewed" element={<PermissionRoute permission="salesVouchers"><RenewedAmcReport /></PermissionRoute>} />
            <Route path="/reports/enquiry-report" element={<PermissionRoute permission="enquiries"><EnquiryReport /></PermissionRoute>} />
            <Route path="/reports/enquiry-leads" element={<PermissionRoute permission="enquiries"><EnquiryLeadsReport /></PermissionRoute>} />
            <Route path="/user-management" element={<PermissionRoute adminOnly><UserManagement /></PermissionRoute>} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
