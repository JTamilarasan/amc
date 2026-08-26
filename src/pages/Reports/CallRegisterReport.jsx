import { Fragment, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Download, Pencil, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import Loader from '../../components/common/Loader'
import { callReceiptVoucherService, getCallRegisterSummary, groupCallVouchersByDate, sortCallVouchersBySequence } from '../../services/callReceiptVoucherService'
import { exportToCsv } from '../../utils/exportCsv'
import { getCurrentMonthDateRange } from '../../utils/reportDateRange'
import { emptyReportValue, formatReportDate } from '../../utils/reportUtils'
import { useAuth } from '../../context/AuthContext'

const matchesSearch = (voucher, search) => !search || [voucher.voucherNumber, voucher.partyName, voucher.executiveName, voucher.category, voucher.callStatus]
  .some((value) => String(value || '').toLowerCase().includes(search))

const Summary = ({ summary }) => <div className="call-register-summary">
  <h3>TOTAL SUMMARY</h3>
  <div><strong>Total Entries: {summary.totalEntries}</strong><strong>Total Open Calls: {summary.totalOpenCalls}</strong><strong>Total Closed Calls: {summary.totalClosedCalls}</strong><strong>Total Calls: {summary.totalCalls}</strong><strong>Total Visits: {summary.totalVisits}</strong></div>
</div>

const CallRegisterReport = () => {
  const { hasPermission } = useAuth(); const canEdit = hasPermission('voucherSettings', 'edit')
  const location = useLocation()
  const navigate = useNavigate()
  const returned = location.state?.fromDate && location.state?.toDate && location.state?.viewType ? location.state : null
  const defaultRange = getCurrentMonthDateRange()
  const [fromDate, setFromDate] = useState(returned?.fromDate || defaultRange.fromDate)
  const [toDate, setToDate] = useState(returned?.toDate || defaultRange.toDate)
  const [viewType, setViewType] = useState(returned?.viewType || '')
  const [range, setRange] = useState(returned ? { from: returned.fromDate, to: returned.toDate, viewType: returned.viewType } : null)
  const [records, setRecords] = useState([])
  const [errors, setErrors] = useState({})
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(Boolean(returned))
  const [message, setMessage] = useState(location.state?.message || '')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return records.filter((voucher) => matchesSearch(voucher, search))
  }, [records, searchText])
  const voucherWise = useMemo(() => sortCallVouchersBySequence(filtered), [filtered])
  const groups = useMemo(() => groupCallVouchersByDate(filtered), [filtered])
  const dayWise = range?.viewType === 'Day Wise'
  const totalPages = Math.max(1, Math.ceil((dayWise ? groups.length : voucherWise.length) / pageSize))
  const pagedVouchers = voucherWise.slice((page - 1) * pageSize, page * pageSize)
  const pagedGroups = groups.slice((page - 1) * pageSize, page * pageSize)
  const summary = useMemo(() => getCallRegisterSummary(filtered), [filtered])

  useEffect(() => {
    if (!returned) return undefined
    let active = true
    callReceiptVoucherService.getCallRegisterReport(returned.fromDate, returned.toDate).then((result) => { if (active) setRecords(result) }).catch(() => { if (active) setLoadError('Unable to load call register data. Please try again.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [returned])

  const generate = async () => {
    const next = {}
    if (!fromDate) next.fromDate = 'From Date is required.'
    if (!toDate) next.toDate = 'To Date is required.'
    else if (fromDate && toDate < fromDate) next.toDate = 'To Date cannot be earlier than From Date.'
    if (!viewType) next.viewType = 'View Type is required.'
    setErrors(next); setLoadError(''); setMessage(''); setPage(1)
    if (Object.keys(next).length) return
    setLoading(true)
    try { setRecords(await callReceiptVoucherService.getCallRegisterReport(fromDate, toDate)); setRange({ from: fromDate, to: toDate, viewType }) }
    catch { setRecords([]); setLoadError('Unable to load call register data. Please try again.') }
    finally { setLoading(false) }
  }
  const editVoucher = (voucher) => navigate('/call-management/call-receipt-voucher', { state: { editVoucherId: voucher.id, returnTo: '/reports/call-register', reportRange: { fromDate: range.from, toDate: range.to, viewType: range.viewType } } })
  const clear = () => { setFromDate(''); setToDate(''); setViewType(''); setRange(null); setRecords([]); setErrors({}); setLoadError(''); setSearchText(''); setPage(1) }
  const download = () => {
    const reportSummary = getCallRegisterSummary(records)
    const summaryRows = [[], ['TOTAL SUMMARY'], ['Total Entries', reportSummary.totalEntries], ['Total Open Calls', reportSummary.totalOpenCalls], ['Total Closed Calls', reportSummary.totalClosedCalls], ['Total Calls', reportSummary.totalCalls], ['Total Visits', reportSummary.totalVisits]]
    if (range.viewType === 'Day Wise') {
      const rows = groupCallVouchersByDate(records).flatMap((group) => [
        [formatReportDate(group.date)],
        ...group.entries.map((voucher) => ['', voucher.voucherNumber, voucher.partyName, voucher.executiveName, voucher.category, voucher.callStatus]),
        [`Total Entries: ${group.entries.length}`],
      ])
      exportToCsv({ filename: `call-register-day-wise-${range.from}-to-${range.to}.csv`, headers: ['Date', 'Voucher No', 'Party Name', 'Executive', 'Category', 'Call Status'], rows: [...rows, ...summaryRows] })
    } else {
      const rows = sortCallVouchersBySequence(records).map((voucher, index) => [index + 1, voucher.voucherNumber, formatReportDate(voucher.date), voucher.partyName, voucher.executiveName, voucher.category, voucher.callStatus, voucher.nextAction, formatReportDate(voucher.when)])
      exportToCsv({ filename: `call-register-voucher-wise-${range.from}-to-${range.to}.csv`, headers: ['S.No', 'Voucher No', 'Date', 'Party Name', 'Executive', 'Category', 'Call Status', 'Next Action', 'When'], rows: [...rows, ...summaryRows] })
    }
  }

  return <div className="page-stack call-register-report">
    <PageHeader title="Call Register Report" subtitle="View call receipt vouchers by date or voucher number." />
    <section className="panel-card report-section">
      <div className="report-filter-grid call-register-filters">
        <label className="field"><span>From Date *</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setErrors((value) => ({ ...value, fromDate: '' })) }} />{errors.fromDate && <div className="field-message">{errors.fromDate}</div>}</label>
        <label className="field"><span>To Date *</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setErrors((value) => ({ ...value, toDate: '' })) }} />{errors.toDate && <div className="field-message">{errors.toDate}</div>}</label>
        <label className="field"><span>View Type *</span><select value={viewType} onChange={(event) => { setViewType(event.target.value); setErrors((value) => ({ ...value, viewType: '' })) }}><option value="">Select view type</option><option>Day Wise</option><option>Voucher No Wise</option></select>{errors.viewType && <div className="field-message">{errors.viewType}</div>}</label>
      </div>
      <div className="form-actions report-actions"><Button type="button" onClick={generate} disabled={loading}>{loading ? 'Generating...' : 'Generate Report'}</Button><Button type="button" variant="secondary" onClick={clear}>Clear</Button><Button type="button" variant="ghost" onClick={download} disabled={!records.length}><Download size={15} /> Download Report</Button></div>
      {loadError && <div className="field-message">{loadError}</div>}{message && <div className="auth-success">{message}</div>}
      {range && !records.length && !loadError && <div className="report-empty-warning" role="status"><AlertTriangle size={16} /><span>No call records found for the selected date range.</span></div>}
      {loading ? <Loader label="Loading report data..." /> : <>
        <div className="toolbar report-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search voucher, party, executive, category or status..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
        <div className="table-wrap report-table call-register-table"><table><thead><tr>{dayWise ? <><th>Voucher No</th><th>Party Name</th><th>Executive</th><th>Category</th><th>Call Status</th><th>Actions</th></> : <><th>S.No</th><th>Voucher No</th><th>Date</th><th>Party Name</th><th>Executive</th><th>Category</th><th>Call Status</th><th>Next Action</th><th>When</th><th>Actions</th></>}</tr></thead><tbody>
          {!range && <tr><td colSpan={dayWise ? 6 : 10} className="text-center">Select a date range and view type, then generate the report.</td></tr>}
          {range && !filtered.length && <tr><td colSpan={dayWise ? 6 : 10} className="text-center">No records found.</td></tr>}
          {dayWise ? pagedGroups.map((group) => <Fragment key={group.date}><tr className="call-register-day-heading"><td colSpan="6"><strong>{formatReportDate(group.date)}</strong></td></tr>{group.entries.map((voucher) => <tr key={voucher.id}><td>{emptyReportValue(voucher.voucherNumber)}</td><td>{emptyReportValue(voucher.partyName)}</td><td>{emptyReportValue(voucher.executiveName)}</td><td>{emptyReportValue(voucher.category)}</td><td>{emptyReportValue(voucher.callStatus)}</td><td>{canEdit && <button type="button" className="executive-action-btn" onClick={() => editVoucher(voucher)}><Pencil size={13} /> Edit</button>}</td></tr>)}<tr className="call-register-day-total"><td colSpan="6"><strong>Total Entries: {group.entries.length}</strong></td></tr></Fragment>) : pagedVouchers.map((voucher, index) => <tr key={voucher.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{emptyReportValue(voucher.voucherNumber)}</td><td>{formatReportDate(voucher.date)}</td><td>{emptyReportValue(voucher.partyName)}</td><td>{emptyReportValue(voucher.executiveName)}</td><td>{emptyReportValue(voucher.category)}</td><td>{emptyReportValue(voucher.callStatus)}</td><td>{voucher.callStatus === 'Open' ? emptyReportValue(voucher.nextAction) : '-'}</td><td>{voucher.callStatus === 'Open' ? formatReportDate(voucher.when) : '-'}</td><td>{canEdit && <button type="button" className="executive-action-btn" onClick={() => editVoucher(voucher)}><Pencil size={13} /> Edit</button>}</td></tr>)}
        </tbody></table></div>
        {range && <><CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} className="report-pagination" /><Summary summary={summary} /></>}
      </>}
    </section>
  </div>
}

export default CallRegisterReport
