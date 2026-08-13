import { CalendarClock, FileSpreadsheet, Headset, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'

const reportCards = [
  { title: 'Sales Register Report', description: 'View sales vouchers by selected date range.', path: '/reports/sales-register', icon: FileSpreadsheet },
  { title: 'Current Monthly Expiry Report', description: 'View AMC records expiring in the current month.', path: '/reports/current-month-expiry', icon: CalendarClock },
  { title: 'Customer Calls History Report', description: 'View customer call and monthly backup history.', path: '/reports/customer-calls-history', icon: Users },
  { title: 'Executive Calls Report', description: 'View executive call totals and detailed status history.', path: '/reports/executive-calls', icon: Headset },
]

const Reports = () => <div className="page-stack">
  <PageHeader title="Reports" subtitle="Choose a business report." />
  <div className="masters-grid">{reportCards.map((report) => {
    const Icon = report.icon
    return <article className="master-card" key={report.path}><div className="master-icon"><Icon size={24} /></div><h3>{report.title}</h3><p>{report.description}</p><div className="card-actions"><Link to={report.path}><Button>Open Report</Button></Link></div></article>
  })}</div>
</div>

export default Reports
