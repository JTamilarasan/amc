import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2, ClipboardList, Clock3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import Loader from '../../components/common/Loader'
import { otherFollowUpService } from '../../services/otherFollowUpService'

const dateValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const OtherFollowUpDashboard = () => {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    otherFollowUpService.getOtherFollowUps().then((items) => { if (active) setRecords(items) }).catch(() => { if (active) setError('Unable to load Other Follow Up dashboard.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const today = dateValue(new Date())
  const cards = [
    { title: 'Total Follow Ups', value: records.length, icon: ClipboardList, accent: 'accent-blue', status: '' },
    { title: 'Open Follow Ups', value: records.filter((item) => item.status === 'Open').length, icon: Clock3, accent: 'accent-amber', status: 'Open' },
    { title: 'Closed Follow Ups', value: records.filter((item) => item.status === 'Closed').length, icon: CheckCircle2, accent: 'accent-green', status: 'Closed' },
    { title: "Today's Follow Ups", value: records.filter((item) => item.date === today).length, icon: CalendarDays, accent: 'accent-indigo', status: '', date: today },
  ]

  return <div className="page-stack">
    <PageHeader title="Other Follow Up Dashboard" subtitle="Overview of open, closed, and upcoming follow-up records." />
    {error && <div className="auth-error">{error}</div>}
    {loading ? <section className="panel-card"><Loader label="Loading follow-up dashboard..." /></section> : <section className="stats-grid dashboard-five-stats">{cards.map((card) => <StatCard key={card.title} {...card} onClick={() => navigate('/reports/other-follow-up', { state: { status: card.status, fromDate: card.date || '', toDate: card.date || '' } })} />)}</section>}
  </div>
}

export default OtherFollowUpDashboard
