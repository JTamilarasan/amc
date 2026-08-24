import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import EnquiryDetailsModal from '../../components/common/EnquiryDetailsModal'
import { fetchEnquiries, selectEnquiryState } from '../../features/enquiries/enquirySlice'
import { fetchExecutives, selectActiveExecutives } from '../../features/executives/executiveSlice'
import { ENQUIRY_REPORT_LEAD_SOURCES } from '../../data/enquiryOptions'
import { exportToCsv } from '../../utils/exportCsv'
import { getCurrentMonthDateRange } from '../../utils/reportDateRange'
import { enquiryDateValue, matchesEnquiryExecutive } from '../../utils/enquiryFilters'

const STATUSES = ['Open', 'Closed', 'Dropped']
const ENQUIRY_LEAD_SOURCES = ENQUIRY_REPORT_LEAD_SOURCES
const sourceLabel = (value) => value.replaceAll('Reference', 'Ref')
const statusOf = (item) => {
  if (['HOT', 'WARM'].includes(item.priority) && item.callDisposition === 'COMPLETED') return 'Closed'
  if (item.priority === 'COLD' && item.callDisposition === 'DROPPED') return 'Dropped'
  if (['HOT', 'WARM'].includes(item.priority) && item.callDisposition === 'FOLLOWUP') return 'Open'
  return null
}
const sourceOf = (item) => ENQUIRY_LEAD_SOURCES.find((value) => value.toLowerCase() === String(item.leadGeneratedBy || '').trim().toLowerCase()) || 'Others'

const EnquiryLeadsReport = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const returned = useLocation().state || {}
  const { items, loading, error } = useSelector(selectEnquiryState)
  const executives = useSelector(selectActiveExecutives)
  const defaults = getCurrentMonthDateRange()
  const [fromDate, setFromDate] = useState(returned.fromDate || defaults.fromDate)
  const [toDate, setToDate] = useState(returned.toDate || defaults.toDate)
  const [followUpLeadId, setFollowUpLeadId] = useState(returned.followUpLeadId || '')
  const [range, setRange] = useState({ fromDate: returned.fromDate || defaults.fromDate, toDate: returned.toDate || defaults.toDate, followUpLeadId: returned.followUpLeadId || '' })
  const [validation, setValidation] = useState({})
  const [selection, setSelection] = useState(null)
  useEffect(() => { dispatch(fetchEnquiries()); dispatch(fetchExecutives()) }, [dispatch])
  const generated = useMemo(() => items.filter((item) => {
    const leadCreationDate = enquiryDateValue(item.leadCreationDate || item.enquiryDate)
    return (!range.fromDate || leadCreationDate >= range.fromDate)
      && (!range.toDate || leadCreationDate <= range.toDate)
      && matchesEnquiryExecutive(item, range.followUpLeadId)
  }), [items, range])
  const rows = useMemo(() => {
    const summary = Object.fromEntries(STATUSES.map((status) => [status, Object.fromEntries(ENQUIRY_LEAD_SOURCES.map((source) => [source, 0]))]))
    generated.forEach((item) => {
      const status = statusOf(item)
      const source = sourceOf(item)
      if (status) summary[status][source] += 1
    })
    return [...STATUSES, 'Total'].map((status) => {
      const counts = ENQUIRY_LEAD_SOURCES.map((source) => status === 'Total' ? STATUSES.reduce((sum, row) => sum + summary[row][source], 0) : summary[status][source])
      return [status, ...counts, counts.reduce((sum, count) => sum + count, 0)]
    })
  }, [generated])
  const selectedRecords = useMemo(() => !selection ? [] : generated.filter((item) => (selection.status === 'Total' || statusOf(item) === selection.status) && (selection.source === 'Total' || sourceOf(item) === selection.source) && Boolean(statusOf(item))), [generated, selection])
  const generate = () => { const next = {}; if (fromDate && toDate && toDate < fromDate) next.toDate = 'To Date cannot be earlier than From Date.'; setValidation(next); if (!Object.keys(next).length) setRange({ fromDate, toDate, followUpLeadId }) }
  const clear = () => { setFromDate(defaults.fromDate); setToDate(defaults.toDate); setFollowUpLeadId(''); setRange({ ...defaults, followUpLeadId: '' }); setValidation({}) }
  const download = () => exportToCsv({ filename: 'enquiry-leads-report.csv', headers: ['Status', ...ENQUIRY_LEAD_SOURCES.map(sourceLabel), 'Total'], rows })
  const edit = (item) => navigate('/enquiry', { state: { editEnquiryId: item.id, returnTo: '/reports/enquiry-leads', reportRange: range } })
  if (loading && !items.length) return <div className="page-stack"><PageHeader title="Enquiry Leads Report" subtitle="View enquiry lead-source totals." /><section className="panel-card"><Loader label="Loading enquiry leads report..." /></section></div>
  return <div className="page-stack enquiry-report"><PageHeader title="Enquiry Leads Report" subtitle="View enquiry lead-source totals." />{error && <div className="auth-error">Unable to load enquiry leads report.</div>}<section className="panel-card report-section">
    <div className="report-filter-grid enquiry-report-filters"><label className="field"><span>From Date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label className="field"><span>To Date</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setValidation({}) }} />{validation.toDate && <div className="field-message">{validation.toDate}</div>}</label><label className="field"><span>Follow Up Lead</span><select value={followUpLeadId} onChange={(event) => setFollowUpLeadId(event.target.value)}><option value="">All Follow Up Leads</option>{executives.map((lead) => <option value={lead.id} key={lead.id}>{lead.name}</option>)}</select></label></div>
    <div className="form-actions report-actions"><Button type="button" onClick={generate}>Generate Report</Button><Button type="button" variant="secondary" onClick={clear}>Clear</Button><Button type="button" variant="ghost" onClick={download}><Download size={15} /> Download Report</Button></div>
    <div className="enquiry-leads-summary"><h3>Enquiry Report Leads</h3><div className="table-wrap report-table enquiry-leads-summary-table"><table><thead><tr><th>Status</th>{ENQUIRY_LEAD_SOURCES.map((source) => <th key={source}>{sourceLabel(source)}</th>)}<th>Total</th></tr></thead><tbody>{rows.map(([status, ...counts]) => <tr key={status} className={status === 'Total' ? 'report-total-row' : undefined}><th scope="row">{status}</th>{counts.map((count, index) => { const source = index < ENQUIRY_LEAD_SOURCES.length ? ENQUIRY_LEAD_SOURCES[index] : 'Total'; return <td key={`${status}-${source}`}>{count > 0 ? <button type="button" className="report-count-link" onClick={() => setSelection({ status, source })}>{count}</button> : count}</td> })}</tr>)}</tbody></table></div></div>
  </section><EnquiryDetailsModal selection={selection} enquiries={selectedRecords} onClose={() => setSelection(null)} onEdit={edit} /></div>
}
export default EnquiryLeadsReport
