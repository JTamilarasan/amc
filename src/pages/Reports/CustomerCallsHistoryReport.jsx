import { useMemo, useState } from 'react'
import { AlertTriangle, Download, Search } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { callReceiptVoucherService } from '../../services/callReceiptVoucherService'
import { exportToCsv } from '../../utils/exportCsv'
import { formatDate } from '../../utils/dateUtils'
import { emptyReportValue } from '../../utils/reportUtils'

const CustomerCallsHistoryReport = () => {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [range, setRange] = useState(null)
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const filtered = useMemo(() => { const search = searchText.trim().toLowerCase(); return rows.filter((row) => !search || [row.partyName, row.customerExpiryDate, row.backupChecklist].some((value) => String(value || '').toLowerCase().includes(search))) }, [rows, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const generate = async () => {
    const next = {}
    if (!fromDate) next.fromDate = 'From Date is required.'
    if (!toDate) next.toDate = 'To Date is required.'
    else if (fromDate && toDate < fromDate) next.toDate = 'To Date cannot be earlier than From Date.'
    setErrors(next); setError(''); setPage(1)
    if (Object.keys(next).length) return
    setLoading(true)
    try { setRows(await callReceiptVoucherService.getCustomerCallsReport(fromDate, toDate)); setRange({ from: fromDate, to: toDate }) }
    catch { setRows([]); setError('Unable to load call report data. Please try again.') }
    finally { setLoading(false) }
  }
  const clear = () => { setFromDate(''); setToDate(''); setRange(null); setRows([]); setErrors({}); setError(''); setSearchText(''); setPage(1) }
  const download = () => exportToCsv({ filename: `customer-calls-history-${range.from}-to-${range.to}.csv`, headers: ['S.No', 'AMC Customer Name', 'AMC Expiry', 'Backup Checklist'], rows: filtered.map((row, index) => [index + 1, row.partyName, formatDate(row.customerExpiryDate), row.backupChecklist]) })

  return <div className="page-stack">
    <PageHeader title="Customer Calls History Report" subtitle="View customer call and monthly backup history by date range." />
    <section className="panel-card report-section customer-calls-report-section">
      <div className="report-filter-grid">
        <label className="field"><span>From Date *</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setErrors((value) => ({ ...value, fromDate: '' })) }} />{errors.fromDate && <div className="field-message">{errors.fromDate}</div>}</label>
        <label className="field"><span>To Date *</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setErrors((value) => ({ ...value, toDate: '' })) }} />{errors.toDate && <div className="field-message">{errors.toDate}</div>}</label>
      </div>
      <div className="form-actions report-actions"><Button type="button" onClick={generate} disabled={loading}>{loading ? 'Generating...' : 'Generate Report'}</Button><Button type="button" variant="secondary" onClick={clear}>Clear</Button><Button type="button" variant="ghost" onClick={download} disabled={!filtered.length}><Download size={15} /> Download Report</Button></div>
      {error && <div className="field-message">{error}</div>}
      {range && !rows.length && !error && <div className="report-empty-warning" role="status"><AlertTriangle size={16} /><span>No call records found for the selected date range.</span></div>}
      <div className="toolbar report-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search customer, expiry or backup count..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
      <div className="table-wrap report-table"><table><thead><tr><th>S.No</th><th>AMC Customer Name</th><th>AMC Expiry</th><th>Backup Checklist</th></tr></thead><tbody>
        {!range && <tr><td colSpan="4" className="text-center">Select a date range and generate the report.</td></tr>}
        {range && !filtered.length && <tr><td colSpan="4" className="text-center">No records found.</td></tr>}
        {paged.map((row, index) => <tr key={row.partyId || row.partyName}><td>{(page - 1) * pageSize + index + 1}</td><td>{emptyReportValue(row.partyName)}</td><td>{formatDate(row.customerExpiryDate)}</td><td>{row.backupChecklist}</td></tr>)}
      </tbody></table></div>
      <div className="form-actions compact report-pagination"><Button type="button" variant="ghost" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Previous</Button><span>Page {page} of {totalPages}</span><Button type="button" variant="ghost" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>Next</Button></div>
    </section>
  </div>
}

export default CustomerCallsHistoryReport
