import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PermissionRoute from './components/auth/PermissionRoute'
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import Dashboard from './pages/Dashboard/Dashboard'
import FreeSupportDashboard from './pages/FreeSupportDashboard/FreeSupportDashboard'
import Masters from './pages/Masters/Masters'
import ExecutiveMaster from './pages/ExecutiveMaster/ExecutiveMaster'
import CustomerMaster from './pages/CustomerMaster/CustomerMaster'
import ProductMaster from './pages/ProductMaster/ProductMaster'
import AreaMaster from './pages/AreaMaster/AreaMaster'
import SalesVoucher from './pages/SalesVoucher/SalesVoucher'
import FreeSupportVoucher from './pages/FreeSupportVoucher/FreeSupportVoucher'
import AMCManagement from './pages/AMCManagement/AMCManagement'
import Reports from './pages/Reports/Reports'
import SalesRegisterReport from './pages/Reports/SalesRegisterReport'
import FreeSupportRegisterReport from './pages/Reports/FreeSupportRegisterReport'
import FreeSupportCallsHistoryReport from './pages/Reports/FreeSupportCallsHistoryReport'
import FreeSupportSummaryReport from './pages/Reports/FreeSupportSummaryReport'
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
import { PERMISSION_KEYS } from './constants/userAccess'

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
            <Route path="/dashboard/free-support" element={<PermissionRoute permission="dashboard"><FreeSupportDashboard /></PermissionRoute>} />
            <Route path="/dashboard/enquiry" element={<PermissionRoute permission="enquiries"><EnquiryDashboard /></PermissionRoute>} />
            <Route path="/enquiry" element={<PermissionRoute permission="enquiries"><Enquiry /></PermissionRoute>} />
            <Route path="/masters" element={<PermissionRoute anyOf={['customers', 'executives', 'products', 'areas']}><Masters /></PermissionRoute>} />
            <Route path="/masters/executives" element={<PermissionRoute permission="executives"><ExecutiveMaster /></PermissionRoute>} />
            <Route path="/masters/customers" element={<PermissionRoute permission="customers"><CustomerMaster /></PermissionRoute>} />
            <Route path="/masters/products" element={<PermissionRoute permission="products"><ProductMaster /></PermissionRoute>} />
            <Route path="/masters/areas" element={<PermissionRoute permission="areas"><AreaMaster /></PermissionRoute>} />
            <Route path="/sales-voucher" element={<PermissionRoute permission="salesVouchers"><SalesVoucher /></PermissionRoute>} />
            <Route path="/free-support-voucher" element={<PermissionRoute permission="salesVouchers"><FreeSupportVoucher /></PermissionRoute>} />
            <Route path="/amc" element={<PermissionRoute permission="salesVouchers"><AMCManagement /></PermissionRoute>} />
            <Route path="/call-management/call-receipt-voucher" element={<PermissionRoute permission="voucherSettings"><CallReceiptVoucher /></PermissionRoute>} />
            <Route path="/reports" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><Reports /></PermissionRoute>} />
            <Route path="/reports/sales-register" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><SalesRegisterReport /></PermissionRoute>} />
            <Route path="/reports/free-support-register" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><FreeSupportRegisterReport /></PermissionRoute>} />
            <Route path="/reports/free-support-calls-history" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><FreeSupportCallsHistoryReport /></PermissionRoute>} />
            <Route path="/reports/free-support-summary/:type" element={<PermissionRoute permission="dashboard"><FreeSupportSummaryReport /></PermissionRoute>} />
            <Route path="/reports/current-month-expiry" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><CurrentMonthlyExpiryReport /></PermissionRoute>} />
            <Route path="/reports/customer-calls-history" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><CustomerCallsHistoryReport /></PermissionRoute>} />
            <Route path="/reports/executive-calls" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><ExecutiveCallsReport /></PermissionRoute>} />
            <Route path="/reports/call-register" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><CallRegisterReport /></PermissionRoute>} />
            <Route path="/reports/single-customer-calls-history" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><SingleCustomerCallsHistoryReport /></PermissionRoute>} />
            <Route path="/reports/amc-active" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><ActiveAmcCustomersReport /></PermissionRoute>} />
            <Route path="/reports/amc-expired" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><ExpiredAmcCustomersReport /></PermissionRoute>} />
            <Route path="/reports/amc-new" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><NewAmcReport /></PermissionRoute>} />
            <Route path="/reports/amc-going-to-expire" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><GoingToExpireAmcReport /></PermissionRoute>} />
            <Route path="/reports/amc-renewed" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><RenewedAmcReport /></PermissionRoute>} />
            <Route path="/reports/enquiry-report" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><EnquiryReport /></PermissionRoute>} />
            <Route path="/reports/enquiry-leads" element={<PermissionRoute permission={PERMISSION_KEYS.reports}><EnquiryLeadsReport /></PermissionRoute>} />
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
