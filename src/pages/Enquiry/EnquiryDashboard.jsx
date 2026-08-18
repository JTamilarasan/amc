import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarClock, CheckCircle2, Snowflake, UserCheck, Flame, XCircle } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import CallDetailsModal from '../../components/common/CallDetailsModal'
import { fetchEnquiries, selectEnquiryState } from '../../features/enquiries/enquirySlice'
import { fetchExecutives, selectActiveExecutives } from '../../features/executives/executiveSlice'
import { callReceiptVoucherService } from '../../services/callReceiptVoucherService'
import { toDisplayDate } from '../../utils/dateUtils'

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
  const [callVouchers, setCallVouchers] = useState([])
  const [supportError, setSupportError] = useState('')
  const [supportDetails, setSupportDetails] = useState(null)
  useEffect(() => {
    let active = true
    dispatch(fetchEnquiries()); dispatch(fetchExecutives())
    callReceiptVoucherService.getCallReceiptVouchers().then((records) => { if (active) setCallVouchers(records) }).catch(() => { if (active) setSupportError('Unable to load support dashboard.') })
    return () => { active = false }
  }, [dispatch])
  const ranges = useMemo(() => getRanges(), [])
  const inRange = (item, range) => Boolean(item.nextFollowUp) && item.nextFollowUp >= range[0] && item.nextFollowUp <= range[1]
  const isPending = (item) => item.callDisposition === 'FOLLOWUP'
  const selectedEnquiries = items.filter((item) => !followUpLeadId || item.followUpLeadId === followUpLeadId || item.assignedExecutiveId === followUpLeadId)
  const supportItems = callVouchers.filter((voucher) => !followUpLeadId || voucher.executiveId === followUpLeadId)
  const normalizedTime = (value) => { const date = toDisplayDate(value); return date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() : null }
  const rangeRecords = (range) => { const from = normalizedTime(range[0]); const to = normalizedTime(range[1]); return supportItems.filter((voucher) => { const when = normalizedTime(voucher.when); return when !== null && when >= from && when <= to }) }
  const todayTime = normalizedTime(ranges.today[0])
  const supportCardDefinitions = [
    ['Today Follow-up', rangeRecords(ranges.today), CalendarClock, 'accent-blue'],
    ['Tomorrow Follow-up', rangeRecords(ranges.tomorrow), UserCheck, 'accent-indigo'],
    ['This Week Follow-up', rangeRecords(ranges.week), Flame, 'accent-amber'],
    ['This Month Follow-up', rangeRecords(ranges.month), CalendarClock, 'accent-green'],
    ['Next Month Follow-up', rangeRecords(ranges.nextMonth), Snowflake, 'accent-purple'],
    ['Expired Follow-up', supportItems.filter((voucher) => voucher.callStatus === 'Open' && normalizedTime(voucher.when) !== null && normalizedTime(voucher.when) < todayTime), AlertTriangle, 'accent-red'],
    ['Upcoming Follow-up', supportItems.filter((voucher) => voucher.callStatus === 'Open' && normalizedTime(voucher.when) !== null && normalizedTime(voucher.when) > todayTime), CalendarClock, 'accent-indigo'],
  ]
  const supportCards = supportCardDefinitions.map(([title, records, icon, accent]) => ({ title, value: records.length, records, icon, accent }))
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const existingCards = [
    { title: 'Today Follow-up', value: selectedEnquiries.filter((item) => inRange(item, ranges.today)).length, icon: CalendarClock, accent: 'accent-blue', range: ranges.today },
    { title: 'Tomorrow Follow-up', value: selectedEnquiries.filter((item) => inRange(item, ranges.tomorrow)).length, icon: UserCheck, accent: 'accent-indigo', range: ranges.tomorrow },
    { title: 'Overall Today Followup', value: selectedEnquiries.filter((item) => inRange(item, ranges.today)).length, icon: CalendarClock, accent: 'accent-blue', range: ranges.today },
    { title: 'Overall Dropped', value: selectedEnquiries.filter((item) => item.callDisposition === 'DROPPED').length, icon: XCircle, accent: 'accent-red', disposition: 'DROPPED' },
    { title: 'Overall Completed', value: selectedEnquiries.filter((item) => item.callDisposition === 'COMPLETED').length, icon: CheckCircle2, accent: 'accent-green', disposition: 'COMPLETED' },
    { title: 'Next Month Followup', value: selectedEnquiries.filter((item) => inRange(item, ranges.nextMonth)).length, icon: Snowflake, accent: 'accent-purple', range: ranges.nextMonth },
    { title: 'Expired Follow-up', value: selectedEnquiries.filter((item) => isPending(item) && item.nextFollowUp && item.nextFollowUp < ranges.today[0]).length, icon: AlertTriangle, accent: 'accent-red', range: ['', dateValue(yesterday)], disposition: 'FOLLOWUP' },
    { title: 'Upcoming Follow-up', value: selectedEnquiries.filter((item) => isPending(item) && item.nextFollowUp > ranges.today[0]).length, icon: CalendarClock, accent: 'accent-indigo', range: [ranges.tomorrow[0], ''], disposition: 'FOLLOWUP' },
  ]
  const selectedLeadName = executives.find((lead) => lead.id === followUpLeadId)?.name || ''
  const openReport = (card) => navigate('/reports/enquiry-report', { state: { fromDate: card.range?.[0] || '', toDate: card.range?.[1] || '', followUpLeadId, followUpLeadName: selectedLeadName, disposition: card.disposition || '' } })
  return <div className="page-stack">
    <PageHeader title="Enquiry and Support Dashboard" subtitle="Enquiry follow-up and outcome summary." />
    <section className="panel-card"><label className="field"><span>Executive</span><select value={followUpLeadId} onChange={(event) => setFollowUpLeadId(event.target.value)}><option value="">All Executives</option>{executives.map((executive) => <option key={executive.id} value={executive.id}>{executive.name}</option>)}</select></label></section>
    {error && <div className="auth-error">Unable to load enquiry dashboard.</div>}
    {loading && !items.length ? <section className="panel-card">Loading enquiry summary...</section> : <section className="stats-grid enquiry-stats">{existingCards.map((card) => <StatCard key={card.title} {...card} onClick={() => openReport(card)} />)}</section>}
    <section className="panel-card" style={{ marginTop: 18 }}><div className="panel-heading"><h2>Support Dashboard</h2><span>Call Receipt Voucher follow-ups by When date</span></div>{supportError && <div className="auth-error">{supportError}</div>}</section>
    <section className="stats-grid enquiry-stats">{supportCards.map((card) => <StatCard key={card.title} {...card} onClick={() => setSupportDetails(card)} />)}</section>
    <CallDetailsModal isOpen={Boolean(supportDetails)} executiveName={`${selectedLeadName || 'All Executives'} - ${supportDetails?.title || ''}`} vouchers={supportDetails?.records || []} onClose={() => setSupportDetails(null)} onEdit={(voucher) => navigate('/call-management/call-receipt-voucher', { state: { editVoucherId: voucher.id } })} />
  </div>
}

export default EnquiryDashboard
