import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Download, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CallDetailsModal from '../../components/common/CallDetailsModal'
import CommonPagination from '../../components/common/CommonPagination'
import { callReceiptVoucherService } from '../../services/callReceiptVoucherService'
import { exportToCsv } from '../../utils/exportCsv'
import { getCurrentMonthDateRange } from '../../utils/reportDateRange'
import { emptyReportValue } from '../../utils/reportUtils'

const ExecutiveCallsReport = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const defaultRange = getCurrentMonthDateRange()
  const returnedFromDate = location.state?.fromDate || defaultRange.fromDate
  const returnedToDate = location.state?.toDate || defaultRange.toDate
  const [fromDate, setFromDate] = useState(returnedFromDate)
  const [toDate, setToDate] = useState(returnedToDate)
  const [range, setRange] = useState(returnedFromDate && returnedToDate ? { from: returnedFromDate, to: returnedToDate } : null)
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState(location.state?.message || '')
  const [loading, setLoading] = useState(Boolean(returnedFromDate && returnedToDate))
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [details, setDetails] = useState(null)
  const filtered = useMemo(() => { const search = searchText.trim().toLowerCase(); return rows.filter((row) => !search || [row.executiveName, row.callsReceived, row.callsOpen, row.callsClosed, row.totalVisits].some((value) => String(value || '').toLowerCase().includes(search))) }, [rows, searchText])
  const totals = useMemo(() => rows.reduce((result, row) => ({ callsReceived: result.callsReceived + row.callsReceived, callsOpen: result.callsOpen + row.callsOpen, callsClosed: result.callsClosed + row.callsClosed, totalVisits: result.totalVisits + row.totalVisits }), { callsReceived: 0, callsOpen: 0, callsClosed: 0, totalVisits: 0 }), [rows])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    if (!returnedFromDate || !returnedToDate) return undefined
    let active = true
    callReceiptVoucherService.getExecutiveCallsReport(returnedFromDate, returnedToDate)
      .then((result) => { if (active) setRows(result) })
      .catch(() => { if (active) { setRows([]); setError('Unable to load call report data. Please try again.') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [returnedFromDate, returnedToDate])

  const generate = async () => {
    const next = {}
    if (!fromDate) next.fromDate = 'From Date is required.'
    if (!toDate) next.toDate = 'To Date is required.'
    else if (fromDate && toDate < fromDate) next.toDate = 'To Date cannot be earlier than From Date.'
    setErrors(next); setError(''); setMessage(''); setDetails(null); setPage(1)
    if (Object.keys(next).length) return
    setLoading(true)
    try { setRows(await callReceiptVoucherService.getExecutiveCallsReport(fromDate, toDate)); setRange({ from: fromDate, to: toDate }) }
    catch { setRows([]); setError('Unable to load call report data. Please try again.') }
    finally { setLoading(false) }
  }
  const clear = () => { setFromDate(''); setToDate(''); setRange(null); setRows([]); setErrors({}); setError(''); setMessage(''); setSearchText(''); setDetails(null); setPage(1) }
  const download = () => exportToCsv({ filename: `executive-calls-${range.from}-to-${range.to}.csv`, headers: ['S.No', 'Executive Name', 'Calls Received', 'Calls Open', 'Calls Closed', 'Total Visits'], rows: [...rows.map((row, index) => [index + 1, row.executiveName, row.callsReceived, row.callsOpen, row.callsClosed, row.totalVisits]), ['TOTAL', '', totals.callsReceived, totals.callsOpen, totals.callsClosed, totals.totalVisits]] })
  const openDetails = (row, filter) => setDetails({ executiveName: row.executiveName, filter, vouchers: row.vouchers.filter((voucher) => !filter || (filter === 'Visit' ? voucher.category2 === 'Visit' : voucher.callStatus === filter)) })
  const editVoucher = (voucher) => {
    setDetails(null)
    navigate('/call-management/call-receipt-voucher', { state: { editVoucherId: voucher.id, returnTo: '/reports/executive-calls', reportRange: { fromDate: range.from, toDate: range.to } } })
  }

  return <div className="page-stack">
    <PageHeader title="Executive Calls Report" subtitle="View executive call totals and status details by date range." />
    <section className="panel-card report-section executive-calls-report-section">
      <div className="report-filter-grid">
        <label className="field"><span>From Date *</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setErrors((value) => ({ ...value, fromDate: '' })) }} />{errors.fromDate && <div className="field-message">{errors.fromDate}</div>}</label>
        <label className="field"><span>To Date *</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setErrors((value) => ({ ...value, toDate: '' })) }} />{errors.toDate && <div className="field-message">{errors.toDate}</div>}</label>
      </div>
      <div className="form-actions report-actions"><Button type="button" onClick={generate} disabled={loading}>{loading ? 'Generating...' : 'Generate Report'}</Button><Button type="button" variant="secondary" onClick={clear}>Clear</Button><Button type="button" variant="ghost" onClick={download} disabled={!rows.length}><Download size={15} /> Download Report</Button></div>
      {error && <div className="field-message">{error}</div>}{message && <div className="auth-success">{message}</div>}
      {range && !rows.length && !error && <div className="report-empty-warning" role="status"><AlertTriangle size={16} /><span>No call records found for the selected date range.</span></div>}
      <div className="toolbar report-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search executive or call count..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
      <div className="table-wrap report-table"><table><thead><tr><th>S.No</th><th>Executive Name</th><th>Calls Received</th><th>Calls Open</th><th>Calls Closed</th><th>Total Visits</th></tr></thead><tbody>
        {!range && <tr><td colSpan="6" className="text-center">Select a date range and generate the report.</td></tr>}
        {range && !filtered.length && <tr><td colSpan="6" className="text-center">No records found.</td></tr>}
        {paged.map((row, index) => <tr key={row.executiveId || row.executiveName}><td>{(page - 1) * pageSize + index + 1}</td><td>{emptyReportValue(row.executiveName)}</td><td><button type="button" className="report-count-link" onClick={() => openDetails(row, null)}>{row.callsReceived}</button></td><td><button type="button" className="report-count-link" onClick={() => openDetails(row, 'Open')}>{row.callsOpen}</button></td><td><button type="button" className="report-count-link" onClick={() => openDetails(row, 'Closed')}>{row.callsClosed}</button></td><td><button type="button" className="report-count-link" onClick={() => openDetails(row, 'Visit')}>{row.totalVisits}</button></td></tr>)}
        {range && rows.length > 0 && <tr className="report-total-row"><td><strong>TOTAL</strong></td><td></td><td><strong>{totals.callsReceived}</strong></td><td><strong>{totals.callsOpen}</strong></td><td><strong>{totals.callsClosed}</strong></td><td><strong>{totals.totalVisits}</strong></td></tr>}
      </tbody></table></div>
      <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} className="report-pagination" />
    </section>
    <CallDetailsModal isOpen={Boolean(details)} executiveName={details?.executiveName || ''} filter={details?.filter || null} vouchers={details?.vouchers || []} onClose={() => setDetails(null)} onEdit={editVoucher} />
  </div>
}

export default ExecutiveCallsReport
