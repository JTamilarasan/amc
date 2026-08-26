import { CalendarClock, FileSpreadsheet, Headset, MessageSquareText, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'

const reportCards = [
  { title: 'AMC Register Report', description: 'View AMC vouchers by selected date range.', path: '/reports/sales-register', icon: FileSpreadsheet, permission: 'salesVouchers' },
  { title: 'Call Register Report', description: 'View call receipt vouchers by date or voucher number.', path: '/reports/call-register', icon: Headset, permission: 'voucherSettings' },
  { title: 'Single Customer Calls History Report', description: 'View complete call history for any selected customer.', path: '/reports/single-customer-calls-history', icon: Users, permission: 'customers' },
  { title: 'Current Monthly Expiry Report', description: 'View AMC records expiring in the current month.', path: '/reports/current-month-expiry', icon: CalendarClock, permission: 'salesVouchers' },
  { title: 'AMC Customer Calls History', description: 'View AMC customer call and monthly backup history.', path: '/reports/customer-calls-history', icon: Users, permission: 'customers' },
  { title: 'Executive Calls Report', description: 'View executive call totals and detailed status history.', path: '/reports/executive-calls', icon: Headset, permission: 'executives' },
  { title: 'Enquiry Report', description: 'View enquiry and follow-up records.', path: '/reports/enquiry-report', icon: MessageSquareText, permission: 'enquiries' },
  { title: 'Enquiry Leads Report', description: 'View enquiry lead-source totals.', path: '/reports/enquiry-leads', icon: MessageSquareText, permission: 'enquiries' },
]

const Reports = () => { const { isAdmin, hasPermission } = useAuth(); const visibleReports = reportCards.filter((report) => isAdmin || hasPermission(report.permission)); return <div className="page-stack">
  <PageHeader title="Reports" subtitle="Choose a business report." />
  <div className="masters-grid">{visibleReports.map((report) => {
    const Icon = report.icon
    return <article className="master-card" key={report.path}><div className="master-icon"><Icon size={24} /></div><h3>{report.title}</h3><p>{report.description}</p><div className="card-actions"><Link to={report.path}><Button>Open Report</Button></Link></div></article>
  })}</div>
</div>
}

export default Reports
