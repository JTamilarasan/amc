import { useEffect, useState } from 'react'
import { BellRing, CalendarClock, PackageCheck, Sparkles, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import Loader from '../../components/common/Loader'
import { freeSupportVoucherService } from '../../services/freeSupportVoucherService'

const FreeSupportDashboard = () => {
  const navigate = useNavigate(); const [data, setData] = useState(null); const [error, setError] = useState('')
  useEffect(() => { let active = true; freeSupportVoucherService.getFreeSupportDashboardData().then((result) => { if (active) setData(result) }).catch(() => { if (active) setError('Unable to load Free Support dashboard.') }); return () => { active = false } }, [])
  const cards = data ? [
    ['Total Active FS Customers', data.active.length, 'Active as of today', PackageCheck, 'accent-green', 'active'],
    ['Total Expired FS', data.expired.length, 'Free Support period completed', BellRing, 'accent-red', 'expired'],
    ['Total New FS', data.newFs.length, 'Free Support category: New', Sparkles, 'accent-blue', 'new'],
    ['Total Going to Expire', data.goingToExpire.length, 'Next 30 days', CalendarClock, 'accent-amber', 'going-to-expire'],
    ['Total Dropped', data.dropped.length, 'Available for renewal', XCircle, 'accent-purple', 'dropped'],
  ] : []
  return <div className="page-stack"><PageHeader title="Free Support Dashboard" subtitle="Current Free Support customer and voucher summary." />{error && <div className="auth-error">{error}</div>}{!data && !error ? <section className="panel-card"><Loader label="Loading Free Support totals..." /></section> : <section className="stats-grid dashboard-five-stats">{cards.map(([title, value, subtitle, icon, accent, type]) => <StatCard key={type} title={title} value={value} subtitle={subtitle} icon={icon} accent={accent} onClick={() => navigate(`/reports/free-support-summary/${type}`)} />)}</section>}</div>
}
export default FreeSupportDashboard
