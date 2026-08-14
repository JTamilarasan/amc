import { BellRing, CalendarClock, PackageCheck, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import Loader from '../../components/common/Loader'
import { amcDashboardService, EXPIRY_WARNING_DAYS } from '../../services/amcDashboardService'

const Dashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    amcDashboardService.getAmcDashboardData().then((result) => { if (active) setData(result) }).catch(() => { if (active) setError('Unable to load dashboard AMC totals. Please try again.') })
    return () => { active = false }
  }, [])

  const stats = data ? [
    { title: 'Total Active AMC Customers', value: data.active.length, subtitle: 'Active as of today', icon: PackageCheck, accent: 'accent-green', path: '/reports/amc-active' },
    { title: 'Total Expired Customers', value: data.expired.length, subtitle: 'AMC period completed', icon: BellRing, accent: 'accent-red', path: '/reports/amc-expired' },
    { title: 'Total New AMC', value: data.newAmc.length, subtitle: 'Sales Voucher category: New', icon: Sparkles, accent: 'accent-blue', path: '/reports/amc-new' },
    { title: 'Total Going to Expire', value: data.goingToExpire.length, subtitle: `Next ${EXPIRY_WARNING_DAYS} days`, icon: CalendarClock, accent: 'accent-amber', path: '/reports/amc-going-to-expire' },
    { title: 'Total Renewed AMC', value: data.renewed.length, subtitle: 'Sales Voucher category: Renewal', icon: RefreshCw, accent: 'accent-purple', path: '/reports/amc-renewed' },
  ] : []

  return <div className="page-stack dashboard-amc-summary">
    <PageHeader title="AMC Dashboard" subtitle="Current AMC customer and voucher summary." />
    {error && <div className="auth-error">{error}</div>}
    {!data && !error ? <section className="panel-card"><Loader label="Loading dashboard totals..." /></section> : <section className="stats-grid dashboard-five-stats">{stats.map((stat) => <StatCard key={stat.title} {...stat} onClick={() => navigate(stat.path)} />)}</section>}
  </div>
}

export default Dashboard
