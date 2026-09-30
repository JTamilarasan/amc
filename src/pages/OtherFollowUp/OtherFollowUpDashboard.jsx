import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, ClipboardList, Clock3, Flame, Snowflake, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import Loader from '../../components/common/Loader'
import { otherFollowUpService } from '../../services/otherFollowUpService'
import { useAuth } from '../../context/AuthContext'

const dateValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const getRanges = () => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
  const nextWeekStart = new Date(weekEnd); nextWeekStart.setDate(weekEnd.getDate() + 1)
  const nextWeekEnd = new Date(nextWeekStart); nextWeekEnd.setDate(nextWeekStart.getDate() + 6)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)
  return { today: [dateValue(today), dateValue(today)], tomorrow: [dateValue(tomorrow), dateValue(tomorrow)], week: [dateValue(weekStart), dateValue(weekEnd)], nextWeek: [dateValue(nextWeekStart), dateValue(nextWeekEnd)], month: [dateValue(monthStart), dateValue(monthEnd)], nextMonth: [dateValue(nextMonthStart), dateValue(nextMonthEnd)] }
}

const OtherFollowUpDashboard = () => {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const executiveName = userProfile?.displayName || userProfile?.name || user?.displayName || user?.email || ''
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    otherFollowUpService.getOtherFollowUps(user?.uid)
      .then((items) => { if (active) setRecords(items) })
      .catch(() => { if (active) setError('Unable to load Other Follow Up dashboard.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user?.uid])

  const ranges = useMemo(getRanges, [])
  const openRecords = records.filter((item) => item.status === 'Open')
  const closedRecords = records.filter((item) => item.status === 'Closed')
  const inRange = (item, range) => Boolean(item.date) && item.date >= range[0] && item.date <= range[1]
  const cards = [
    { title: 'Today Follow-up', records: openRecords.filter((item) => inRange(item, ranges.today)), icon: CalendarClock, accent: 'accent-blue', range: ranges.today, status: 'Open' },
    { title: 'Tomorrow Follow-up', records: openRecords.filter((item) => inRange(item, ranges.tomorrow)), icon: UserCheck, accent: 'accent-indigo', range: ranges.tomorrow, status: 'Open' },
    { title: 'This Week Follow-up', records: openRecords.filter((item) => inRange(item, ranges.week)), icon: Flame, accent: 'accent-amber', range: ranges.week, status: 'Open' },
    { title: 'Next Week Follow-up', records: openRecords.filter((item) => inRange(item, ranges.nextWeek)), icon: CalendarClock, accent: 'accent-indigo', range: ranges.nextWeek, status: 'Open' },
    { title: 'This Month Follow-up', records: openRecords.filter((item) => inRange(item, ranges.month)), icon: CalendarDays, accent: 'accent-green', range: ranges.month, status: 'Open' },
    { title: 'Overall Open', records: openRecords, icon: Clock3, accent: 'accent-amber', status: 'Open' },
    { title: 'Overall Closed', records: closedRecords, icon: CheckCircle2, accent: 'accent-green', status: 'Closed' },
    { title: 'Next Month Follow-up', records: openRecords.filter((item) => inRange(item, ranges.nextMonth)), icon: Snowflake, accent: 'accent-purple', range: ranges.nextMonth, status: 'Open' },
    { title: 'Expired Follow-up', records: openRecords.filter((item) => item.date < ranges.today[0]), icon: AlertTriangle, accent: 'accent-red', toDate: dateValue(new Date(Date.now() - 86400000)), status: 'Open' },
    { title: 'Upcoming Follow-up', records: openRecords.filter((item) => item.date > ranges.today[0]), icon: CalendarClock, accent: 'accent-indigo', fromDate: ranges.tomorrow[0], status: 'Open' },
  ].map((card) => ({ ...card, value: card.records.length }))
  const openReport = (card) => navigate('/reports/other-follow-up', { state: { status: card.status, fromDate: card.range?.[0] || card.fromDate || '', toDate: card.range?.[1] || card.toDate || '', executiveName } })

  return <div className="page-stack">
    <PageHeader title="Other Follow Up Dashboard" subtitle="Executive-wise follow-up summary by date and status." />
    {error && <div className="auth-error">{error}</div>}
    <section className="panel-card"><label className="field"><span>Executive</span><input value={executiveName} readOnly disabled /></label></section>
    {loading ? <section className="panel-card"><Loader label="Loading follow-up dashboard..." /></section> : <section className="stats-grid enquiry-stats">{cards.map((card) => <StatCard key={card.title} title={card.title} value={card.value} icon={card.icon} accent={card.accent} onClick={() => openReport(card)} />)}</section>}
  </div>
}

export default OtherFollowUpDashboard
