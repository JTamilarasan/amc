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
import { getCurrentMonthDateRange } from '../../utils/reportDateRange'
import { enquiryDateValue, isUpcomingEnquiry, matchesEnquiryExecutive } from '../../utils/enquiryFilters'

const dateValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const EnquiryReport = () => {
  const dispatch = useDispatch(); const navigate = useNavigate(); const location = useLocation()
  const { items, loading, error } = useSelector(selectEnquiryState)
  const executives = useSelector(selectActiveExecutives)
  const returned = location.state || {}
  const defaultRange = getCurrentMonthDateRange()
  const initialFromDate = returned.fromDashboard ? (returned.fromDate || '') : (returned.fromDate || defaultRange.fromDate)
  const initialToDate = returned.fromDashboard ? (returned.toDate || '') : (returned.toDate || defaultRange.toDate)
  const [fromDate, setFromDate] = useState(initialFromDate); const [toDate, setToDate] = useState(initialToDate)
  const [followUpLeadId, setFollowUpLeadId] = useState(returned.followUpLeadId || ''); const [range, setRange] = useState({ fromDashboard: Boolean(returned.fromDashboard), fromDate: initialFromDate, toDate: initialToDate, followUpLeadId: returned.followUpLeadId || '', disposition: returned.disposition || '', dashboardFilter: returned.dashboardFilter || '' })
  const [searchText, setSearchText] = useState(''); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const [validation, setValidation] = useState({})
  useEffect(() => { dispatch(fetchEnquiries()); dispatch(fetchExecutives()) }, [dispatch])
  const leadOptions = useMemo(() => { const options = new Map(items.filter((item) => item.followUpLeadId).map((item) => [item.followUpLeadId, { id: item.followUpLeadId, name: item.followUpLeadName }])); executives.forEach((executive) => { const existing = [...options.values()].find((lead) => lead.name?.toLowerCase() === executive.name?.toLowerCase()); if (!existing) options.set(executive.id, { id: executive.id, name: executive.name }) }); if (returned.followUpLeadId && !options.has(returned.followUpLeadId)) options.set(returned.followUpLeadId, { id: returned.followUpLeadId, name: returned.followUpLeadName || 'Selected Follow Up Lead' }); return [...options.values()].sort((a, b) => (a.name || '').localeCompare(b.name || '')) }, [items, executives, returned.followUpLeadId, returned.followUpLeadName])
  const generated = useMemo(() => items.filter((item) => {
    if (!matchesEnquiryExecutive(item, range.followUpLeadId)) return false
    if (range.dashboardFilter === 'upcoming') return isUpcomingEnquiry(item, dateValue(new Date()))
    const filterDate = enquiryDateValue(range.fromDashboard ? item.nextFollowUp : (item.leadCreationDate || item.enquiryDate))
    return (!range.fromDate || filterDate >= range.fromDate)
      && (!range.toDate || filterDate <= range.toDate)
      && (!range.disposition || item.callDisposition === range.disposition)
  }), [items, range])
  const filtered = useMemo(() => { const search = searchText.trim().toLowerCase(); return generated.filter((item) => !search || [item.contactName, item.companyName, item.customerName, item.contactNumber, item.areaName, item.leadGeneratedBy, item.followUpLeadName].some((value) => String(value || '').toLowerCase().includes(search))) }, [generated, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const generate = () => { const next = {}; if (fromDate && toDate && toDate < fromDate) next.toDate = 'To Date cannot be earlier than From Date.'; setValidation(next); if (Object.keys(next).length) return; setRange({ fromDashboard: false, fromDate, toDate, followUpLeadId, disposition: '', dashboardFilter: '' }); setPage(1) }
  const clear = () => { setFromDate(defaultRange.fromDate); setToDate(defaultRange.toDate); setFollowUpLeadId(''); setRange({ ...defaultRange, fromDashboard: false, followUpLeadId: '', disposition: '', dashboardFilter: '' }); setSearchText(''); setValidation({}); setPage(1) }
  const download = () => exportToCsv({ filename: 'enquiry-report.csv', headers: ['S.No', 'Lead Creation Date', 'Customer Name', 'Contact Name', 'Contact Number', 'Area', 'Product', 'Priority', 'Next Follow Up', 'Call Disposition', 'Follow Up Lead'], rows: filtered.map((item, index) => [index + 1, formatReportDate(item.leadCreationDate || item.enquiryDate), item.customerName, item.contactName || item.companyName, item.contactNumber, item.areaName, item.productName, item.priority, formatReportDate(item.nextFollowUp), item.callDisposition, item.followUpLeadName]) })
  const edit = (item) => navigate('/enquiry', { state: { editEnquiryId: item.id, returnTo: '/reports/enquiry-report', reportRange: { ...range, followUpLeadName: returned.followUpLeadName } } })
  if (loading && !items.length) return <div className="page-stack"><PageHeader title="Enquiry Report" subtitle="View enquiry and follow-up records." /><section className="panel-card"><Loader label="Loading enquiry report..." /></section></div>
  return <div className="page-stack enquiry-report"><PageHeader title="Enquiry Report" subtitle="View enquiry and follow-up records." />{error && <div className="auth-error">Unable to load enquiry report.</div>}{returned.message && <div className="auth-success">{returned.message}</div>}<section className="panel-card report-section">{range.followUpLeadId && <div className="auth-success">Follow Up Lead: {leadOptions.find((lead) => lead.id === range.followUpLeadId)?.name || returned.followUpLeadName || 'Selected'}</div>}
    <div className="report-filter-grid enquiry-report-filters"><label className="field"><span>From Date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label className="field"><span>To Date</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setValidation({}) }} />{validation.toDate && <div className="field-message">{validation.toDate}</div>}</label><label className="field"><span>Follow Up Lead</span><select value={followUpLeadId} onChange={(event) => setFollowUpLeadId(event.target.value)}><option value="">All Follow Up Leads</option>{leadOptions.map((lead) => <option value={lead.id} key={lead.id}>{lead.name}</option>)}</select></label></div>
    <div className="form-actions report-actions"><Button type="button" onClick={generate}>Generate Report</Button><Button type="button" variant="secondary" onClick={clear}>Clear</Button><Button type="button" variant="ghost" onClick={download} disabled={!filtered.length}><Download size={15} /> Download Report</Button></div>
    <div className="toolbar report-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search customer, contact, area, source or follow-up lead..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
    <div className="table-wrap report-table enquiry-report-table"><table><thead><tr><th>S.No</th><th>Lead Creation Date</th><th>Customer Name</th><th>Contact Name</th><th>Contact Number</th><th>Area</th><th>Product</th><th>Priority</th><th>Next Follow Up</th><th>Call Disposition</th><th>Follow Up Lead</th><th>Actions</th></tr></thead><tbody>{!filtered.length && <tr><td colSpan="12" className="text-center">No enquiry records found.</td></tr>}{paged.map((item, index) => <tr key={item.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{formatReportDate(item.leadCreationDate || item.enquiryDate)}</td><td>{emptyReportValue(item.customerName)}</td><td>{emptyReportValue(item.contactName || item.companyName)}</td><td>{emptyReportValue(item.contactNumber)}</td><td>{emptyReportValue(item.areaName)}</td><td>{emptyReportValue(item.productName)}</td><td>{emptyReportValue(item.priority)}</td><td>{formatReportDate(item.nextFollowUp)}</td><td>{emptyReportValue(item.callDisposition)}</td><td>{emptyReportValue(item.followUpLeadName)}</td><td><button type="button" className="executive-action-btn" onClick={() => edit(item)}><Pencil size={13} /> Edit</button></td></tr>)}</tbody></table></div>
    <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} className="report-pagination" />
  </section></div>
}
export default EnquiryReport
