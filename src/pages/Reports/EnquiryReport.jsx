import { useEffect, useMemo, useState } from 'react'
import { Download, Pencil, Search } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import Loader from '../../components/common/Loader'
import { fetchEnquiries, selectEnquiryState } from '../../features/enquiries/enquirySlice'
import { fetchExecutives, selectActiveExecutives } from '../../features/executives/executiveSlice'
import { exportToCsv } from '../../utils/exportCsv'
import { emptyReportValue, formatReportDate } from '../../utils/reportUtils'
import { ENQUIRY_LEAD_SOURCES } from '../../data/enquiryOptions'
import { getCurrentMonthDateRange } from '../../utils/reportDateRange'

const SUMMARY_STATUSES = ['Open', 'Closed', 'Dropped']
const getSummaryStatus = (item) => {
  if (['HOT', 'WARM'].includes(item.priority) && item.callDisposition === 'COMPLETED') return 'Closed'
  if (item.priority === 'COLD' && item.callDisposition === 'DROPPED') return 'Dropped'
  if (['HOT', 'WARM'].includes(item.priority) && item.callDisposition === 'FOLLOWUP') return 'Open'
  return null
}

const EnquiryReport = () => {
  const dispatch = useDispatch(); const navigate = useNavigate(); const location = useLocation()
  const { items, loading, error } = useSelector(selectEnquiryState)
  const executives = useSelector(selectActiveExecutives)
  const returned = location.state || {}
  const defaultRange = getCurrentMonthDateRange()
  const [fromDate, setFromDate] = useState(returned.fromDate || defaultRange.fromDate); const [toDate, setToDate] = useState(returned.toDate || defaultRange.toDate)
  const [followUpLeadId, setFollowUpLeadId] = useState(returned.followUpLeadId || ''); const [range, setRange] = useState({ fromDate: returned.fromDate || defaultRange.fromDate, toDate: returned.toDate || defaultRange.toDate, followUpLeadId: returned.followUpLeadId || '', disposition: returned.disposition || '' })
  const [searchText, setSearchText] = useState(''); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const [validation, setValidation] = useState({})
  useEffect(() => { dispatch(fetchEnquiries()); dispatch(fetchExecutives()) }, [dispatch])
  const leadOptions = useMemo(() => { const options = new Map(items.filter((item) => item.followUpLeadId).map((item) => [item.followUpLeadId, { id: item.followUpLeadId, name: item.followUpLeadName }])); executives.forEach((executive) => { const existing = [...options.values()].find((lead) => lead.name?.toLowerCase() === executive.name?.toLowerCase()); if (!existing) options.set(executive.id, { id: executive.id, name: executive.name }) }); if (returned.followUpLeadId && !options.has(returned.followUpLeadId)) options.set(returned.followUpLeadId, { id: returned.followUpLeadId, name: returned.followUpLeadName || 'Selected Follow Up Lead' }); return [...options.values()].sort((a, b) => (a.name || '').localeCompare(b.name || '')) }, [items, executives, returned.followUpLeadId, returned.followUpLeadName])
  const generated = useMemo(() => items.filter((item) => (!range.fromDate || item.nextFollowUp >= range.fromDate) && (!range.toDate || item.nextFollowUp <= range.toDate) && (!range.followUpLeadId || item.followUpLeadId === range.followUpLeadId) && (!range.disposition || item.callDisposition === range.disposition)), [items, range])
  const leadSources = useMemo(() => {
    const sources = [...ENQUIRY_LEAD_SOURCES]
    generated.forEach((item) => { const source = String(item.leadGeneratedBy || '').trim(); if (source && !sources.some((value) => value.toLowerCase() === source.toLowerCase())) sources.push(source) })
    return sources
  }, [generated])
  const leadSummary = useMemo(() => {
    const summary = Object.fromEntries(SUMMARY_STATUSES.map((status) => [status, Object.fromEntries(leadSources.map((source) => [source, 0]))]))
    generated.forEach((item) => {
      const status = getSummaryStatus(item); const savedSource = String(item.leadGeneratedBy || '').trim()
      const source = leadSources.find((value) => value.toLowerCase() === savedSource.toLowerCase())
      if (status && source) summary[status][source] += 1
    })
    return summary
  }, [generated, leadSources])
  const filtered = useMemo(() => { const search = searchText.trim().toLowerCase(); return generated.filter((item) => !search || [item.contactName, item.companyName, item.customerName, item.contactNumber, item.areaName, item.leadGeneratedBy, item.followUpLeadName].some((value) => String(value || '').toLowerCase().includes(search))) }, [generated, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const generate = () => { const next = {}; if (fromDate && toDate && toDate < fromDate) next.toDate = 'To Date cannot be earlier than From Date.'; setValidation(next); if (Object.keys(next).length) return; setRange({ fromDate, toDate, followUpLeadId, disposition: '' }); setPage(1) }
  const clear = () => { setFromDate(''); setToDate(''); setFollowUpLeadId(''); setRange({ fromDate: '', toDate: '', followUpLeadId: '', disposition: '' }); setSearchText(''); setValidation({}); setPage(1) }
  const summaryRows = [...SUMMARY_STATUSES, 'Total'].map((status) => {
    const counts = leadSources.map((source) => status === 'Total' ? SUMMARY_STATUSES.reduce((total, row) => total + leadSummary[row][source], 0) : leadSummary[status][source])
    return [status, ...counts, counts.reduce((total, count) => total + count, 0)]
  })
  const download = () => exportToCsv({ filename: 'enquiry-report.csv', headers: ['Enquiry Report Leads'], rows: [['Status', ...leadSources, 'Total'], ...summaryRows, [], ['S.No', 'Lead Creation Date', 'Customer Name', 'Contact Name', 'Contact Number', 'Area', 'Product', 'Priority', 'Next Follow Up', 'Call Disposition', 'Follow Up Lead'], ...filtered.map((item, index) => [index + 1, formatReportDate(item.leadCreationDate || item.enquiryDate), item.customerName, item.contactName || item.companyName, item.contactNumber, item.areaName, item.productName, item.priority, formatReportDate(item.nextFollowUp), item.callDisposition, item.followUpLeadName])] })
  const edit = (item) => navigate('/enquiry', { state: { editEnquiryId: item.id, returnTo: '/reports/enquiry-report', reportRange: { fromDate: range.fromDate, toDate: range.toDate, followUpLeadId: range.followUpLeadId, disposition: range.disposition } } })
  if (loading && !items.length) return <div className="page-stack"><PageHeader title="Enquiry Report" subtitle="View enquiry and follow-up records." /><section className="panel-card"><Loader label="Loading enquiry report..." /></section></div>
  return <div className="page-stack enquiry-report"><PageHeader title="Enquiry Report" subtitle="View enquiry and follow-up records." />{error && <div className="auth-error">Unable to load enquiry report.</div>}{returned.message && <div className="auth-success">{returned.message}</div>}<section className="panel-card report-section">{range.followUpLeadId && <div className="auth-success">Follow Up Lead: {leadOptions.find((lead) => lead.id === range.followUpLeadId)?.name || returned.followUpLeadName || 'Selected'}</div>}
    <div className="report-filter-grid enquiry-report-filters"><label className="field"><span>From Date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label className="field"><span>To Date</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setValidation({}) }} />{validation.toDate && <div className="field-message">{validation.toDate}</div>}</label><label className="field"><span>Follow Up Lead</span><select value={followUpLeadId} onChange={(event) => setFollowUpLeadId(event.target.value)}><option value="">All Follow Up Leads</option>{leadOptions.map((lead) => <option value={lead.id} key={lead.id}>{lead.name}</option>)}</select></label></div>
    <div className="form-actions report-actions"><Button type="button" onClick={generate}>Generate Report</Button><Button type="button" variant="secondary" onClick={clear}>Clear</Button><Button type="button" variant="ghost" onClick={download} disabled={!filtered.length}><Download size={15} /> Download Report</Button></div>
    <div className="enquiry-leads-summary"><h3>Enquiry Report Leads</h3><div className="table-wrap report-table enquiry-leads-summary-table"><table><thead><tr><th>Status</th>{leadSources.map((source) => <th key={source}>{source}</th>)}<th>Total</th></tr></thead><tbody>{summaryRows.map(([status, ...counts]) => <tr key={status} className={status === 'Total' ? 'report-total-row' : undefined}><th scope="row">{status}</th>{counts.map((count, index) => <td key={`${status}-${index}`}>{count}</td>)}</tr>)}</tbody></table></div></div>
    <div className="toolbar report-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search customer, contact, area, source or follow-up lead..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
    <div className="table-wrap report-table enquiry-report-table"><table><thead><tr><th>S.No</th><th>Lead Creation Date</th><th>Customer Name</th><th>Contact Name</th><th>Contact Number</th><th>Area</th><th>Product</th><th>Priority</th><th>Next Follow Up</th><th>Call Disposition</th><th>Follow Up Lead</th><th>Actions</th></tr></thead><tbody>{!filtered.length && <tr><td colSpan="12" className="text-center">No enquiry records found.</td></tr>}{paged.map((item, index) => <tr key={item.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{formatReportDate(item.leadCreationDate || item.enquiryDate)}</td><td>{emptyReportValue(item.customerName)}</td><td>{emptyReportValue(item.contactName || item.companyName)}</td><td>{emptyReportValue(item.contactNumber)}</td><td>{emptyReportValue(item.areaName)}</td><td>{emptyReportValue(item.productName)}</td><td>{emptyReportValue(item.priority)}</td><td>{formatReportDate(item.nextFollowUp)}</td><td>{emptyReportValue(item.callDisposition)}</td><td>{emptyReportValue(item.followUpLeadName)}</td><td><button type="button" className="executive-action-btn" onClick={() => edit(item)}><Pencil size={13} /> Edit</button></td></tr>)}</tbody></table></div>
    <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} className="report-pagination" />
  </section></div>
}
export default EnquiryReport
