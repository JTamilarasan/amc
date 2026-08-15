import { useEffect, useMemo } from 'react'
import { CalendarClock, CheckCircle2, Flame, Snowflake, UserCheck, XCircle } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import { useAuth } from '../../context/AuthContext'
import { fetchEnquiries, selectEnquiryState } from '../../features/enquiries/enquirySlice'

const dateValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const getRanges = () => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1); const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1); const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)
  return { today: [dateValue(today), dateValue(today)], tomorrow: [dateValue(tomorrow), dateValue(tomorrow)], week: [dateValue(weekStart), dateValue(weekEnd)], month: [dateValue(monthStart), dateValue(monthEnd)], nextMonth: [dateValue(nextMonthStart), dateValue(nextMonthEnd)] }
}

const EnquiryDashboard = () => {
  const dispatch = useDispatch(); const navigate = useNavigate(); const { user } = useAuth()
  const { items, loading, error } = useSelector(selectEnquiryState)
  useEffect(() => { dispatch(fetchEnquiries()) }, [dispatch])
  const ranges = useMemo(() => getRanges(), [])
  const inRange = (item, range) => Boolean(item.nextFollowUp) && item.nextFollowUp >= range[0] && item.nextFollowUp <= range[1]
  const personal = items.filter((item) => item.followUpLeadId === user?.uid)
  const cards = [['Today Followup', ranges.today, CalendarClock, 'accent-blue'], ['Tomorrow Followup', ranges.tomorrow, UserCheck, 'accent-indigo'], ['This Week Followup', ranges.week, Flame, 'accent-amber'], ['This Month Followup', ranges.month, CalendarClock, 'accent-green'], ['Next Month Followup', ranges.nextMonth, Snowflake, 'accent-purple']].map(([title, range, icon, accent]) => ({ title, value: personal.filter((item) => inRange(item, range)).length, range, icon, accent, personalOnly: true }))
  const overallCards = [{ title: 'Overall Today Followup', value: items.filter((item) => inRange(item, ranges.today)).length, icon: CalendarClock, accent: 'accent-blue', range: ranges.today }, { title: 'Overall Dropped', value: items.filter((item) => item.callDisposition === 'DROPPED').length, icon: XCircle, accent: 'accent-red', disposition: 'DROPPED' }, { title: 'Overall Completed', value: items.filter((item) => item.callDisposition === 'COMPLETED').length, icon: CheckCircle2, accent: 'accent-green', disposition: 'COMPLETED' }]
  const openReport = (card) => navigate('/reports/enquiry-report', { state: { fromDate: card.range?.[0] || '', toDate: card.range?.[1] || '', followUpLeadId: card.personalOnly ? user?.uid : '', disposition: card.disposition || '' } })
  return <div className="page-stack"><PageHeader title="Enquiry Dashboard" subtitle="Enquiry follow-up and outcome summary." />{error && <div className="auth-error">Unable to load enquiry dashboard.</div>}{loading && !items.length ? <section className="panel-card">Loading enquiry summary...</section> : <section className="stats-grid enquiry-stats">{[...cards, ...overallCards].map((card) => <StatCard key={card.title} {...card} onClick={() => openReport(card)} />)}</section>}</div>
}

export default EnquiryDashboard
