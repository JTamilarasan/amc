import { ArrowRight, CalendarClock, CircleDollarSign, PackageCheck, Users, Wallet2, BellRing } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import { expiringSoon, vouchers } from '../../data/mockData'
import Button from '../../components/common/Button'
import { formatDate } from '../../utils/dateUtils'

const dashboardStats = [
  { title: 'Total Customers', value: '1,250', subtitle: '+12% this month', icon: Users, accent: 'accent-blue' },
  { title: 'Active AMC', value: '920', subtitle: 'Healthy renewal base', icon: PackageCheck, accent: 'accent-green' },
  { title: 'AMC Expiring Soon', value: '145', subtitle: 'Next 30 days', icon: CalendarClock, accent: 'accent-amber' },
  { title: 'Expired AMC', value: '85', subtitle: 'Needs attention', icon: BellRing, accent: 'accent-red' },
  { title: "Today's Follow-ups", value: '32', subtitle: 'Scheduled tasks', icon: Users, accent: 'accent-indigo' },
  { title: 'Total Sales', value: '₹4,85,000', subtitle: 'YTD revenue', icon: CircleDollarSign, accent: 'accent-purple' },
]

const Dashboard = () => {
  return (
    <div className="page-stack">
      <PageHeader
        title="Good Morning, Admin"
        subtitle="Here's what's happening with your AMC business."
        action={<Button><span>+ New Sales Voucher</span></Button>}
      />

      <section className="stats-grid">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>AMC Expiring Soon</h2>
          <span>Priority follow-up list</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Product</th>
                <th>AMC End Date</th>
                <th>Days Left</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {expiringSoon.map((item) => (
                <tr key={item.customer}>
                  <td>{item.customer}</td>
                  <td>{item.mobile}</td>
                  <td>{item.product}</td>
                  <td>{formatDate(item.endDate)}</td>
                  <td>{item.daysLeft} days</td>
                  <td><span className="status-badge amber">{item.status}</span></td>
                  <td><button className="text-link">Call <ArrowRight size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Recent Sales Vouchers</h2>
          <span>Latest transactions</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Party Name</th>
                <th>Items</th>
                <th>Amount</th>
                <th>AMC</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td>{voucher.id}</td>
                  <td>{formatDate(voucher.date)}</td>
                  <td>{voucher.party}</td>
                  <td>{voucher.items}</td>
                  <td>{voucher.amount}</td>
                  <td><span className="status-badge green">{voucher.amc}</span></td>
                  <td><button className="text-link">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
