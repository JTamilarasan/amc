import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, CheckCircle2, Snowflake, UserCheck, Flame, XCircle } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import { fetchEnquiries, selectEnquiryState } from '../../features/enquiries/enquirySlice'
import { fetchExecutives, selectActiveExecutives } from '../../features/executives/executiveSlice'

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
  const dispatch = useDispatch(); const navigate = useNavigate()
  const { items, loading, error } = useSelector(selectEnquiryState)
  const executives = useSelector(selectActiveExecutives)
  const [followUpLeadId, setFollowUpLeadId] = useState('')
  useEffect(() => { dispatch(fetchEnquiries()); dispatch(fetchExecutives()) }, [dispatch])
  const ranges = useMemo(() => getRanges(), [])
  const inRange = (item, range) => Boolean(item.nextFollowUp) && item.nextFollowUp >= range[0] && item.nextFollowUp <= range[1]
  const isPending = (item) => item.callDisposition === 'FOLLOWUP'
  const supportItems = items.filter((item) => isPending(item) && (!followUpLeadId || item.followUpLeadId === followUpLeadId))
  const supportCards = [['Today Follow-up', ranges.today, CalendarClock, 'accent-blue'], ['Tomorrow Follow-up', ranges.tomorrow, UserCheck, 'accent-indigo'], ['This Week Follow-up', ranges.week, Flame, 'accent-amber'], ['This Month Follow-up', ranges.month, CalendarClock, 'accent-green']].map(([title, range, icon, accent]) => ({ title, value: supportItems.filter((item) => inRange(item, range)).length, range, icon, accent, disposition: 'FOLLOWUP' }))
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const existingCards = [
    { title: 'Overall Today Followup', value: items.filter((item) => inRange(item, ranges.today)).length, icon: CalendarClock, accent: 'accent-blue', range: ranges.today },
    { title: 'Overall Dropped', value: items.filter((item) => item.callDisposition === 'DROPPED').length, icon: XCircle, accent: 'accent-red', disposition: 'DROPPED' },
    { title: 'Overall Completed', value: items.filter((item) => item.callDisposition === 'COMPLETED').length, icon: CheckCircle2, accent: 'accent-green', disposition: 'COMPLETED' },
    { title: 'Next Month Followup', value: items.filter((item) => inRange(item, ranges.nextMonth)).length, icon: Snowflake, accent: 'accent-purple', range: ranges.nextMonth },
    { title: 'Expired Follow-up', value: items.filter((item) => isPending(item) && item.nextFollowUp && item.nextFollowUp < ranges.today[0]).length, icon: AlertTriangle, accent: 'accent-red', range: ['', dateValue(yesterday)], disposition: 'FOLLOWUP' },
  ]
  const selectedLeadName = executives.find((lead) => lead.id === followUpLeadId)?.name || ''
  const openReport = (card, filterLead = false) => navigate('/reports/enquiry-report', { state: { fromDate: card.range?.[0] || '', toDate: card.range?.[1] || '', followUpLeadId: filterLead ? followUpLeadId : '', followUpLeadName: filterLead ? selectedLeadName : '', disposition: card.disposition || '' } })
  return <div className="page-stack">
    <PageHeader title="Enquiry Dashboard" subtitle="Enquiry follow-up and outcome summary." />
    {error && <div className="auth-error">Unable to load enquiry dashboard.</div>}
    {loading && !items.length ? <section className="panel-card">Loading enquiry summary...</section> : <section className="stats-grid enquiry-stats">{existingCards.map((card) => <StatCard key={card.title} {...card} onClick={() => openReport(card)} />)}</section>}
    <section className="panel-card" style={{ marginTop: 18 }}><div className="panel-heading"><h2>Support Dashboard</h2><span>Pending enquiry follow-ups by due date</span></div><label className="field"><span>Executive / Follow-up Lead</span><select value={followUpLeadId} onChange={(event) => setFollowUpLeadId(event.target.value)}><option value="">All Executives</option>{executives.map((executive) => <option key={executive.id} value={executive.id}>{executive.name}</option>)}</select></label></section>
    <section className="stats-grid enquiry-stats">{supportCards.map((card) => <StatCard key={card.title} {...card} onClick={() => openReport(card, true)} />)}</section>
  </div>
}

export default EnquiryDashboard
