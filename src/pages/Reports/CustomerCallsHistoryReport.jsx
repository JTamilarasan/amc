import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Download, Eye, Pencil, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import DetailsModal from '../../components/common/DetailsModal'
import CommonPagination from '../../components/common/CommonPagination'
import { callReceiptVoucherService } from '../../services/callReceiptVoucherService'
import { exportToCsv } from '../../utils/exportCsv'
import { formatDate } from '../../utils/dateUtils'
import { emptyReportValue } from '../../utils/reportUtils'

const CustomerCallsHistoryReport = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const returnedFromDate = location.state?.fromDate || ''
  const returnedToDate = location.state?.toDate || ''
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
  const [backupDetails, setBackupDetails] = useState(null)
  const [viewVoucher, setViewVoucher] = useState(null)
  const filtered = useMemo(() => { const search = searchText.trim().toLowerCase(); return rows.filter((row) => !search || [row.partyName, row.customerExpiryDate, row.backupChecklist, row.totalCalls, row.totalVisits].some((value) => String(value || '').toLowerCase().includes(search))) }, [rows, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const loadReport = async (from, to) => {
    setLoading(true); setError('')
    try { setRows(await callReceiptVoucherService.getCustomerCallsReport(from, to)); setRange({ from, to }) }
    catch { setRows([]); setError('Unable to load call report data. Please try again.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!returnedFromDate || !returnedToDate) return undefined
    let active = true
    callReceiptVoucherService.getCustomerCallsReport(returnedFromDate, returnedToDate)
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
    setErrors(next); setError(''); setMessage(''); setPage(1)
    if (Object.keys(next).length) return
    await loadReport(fromDate, toDate)
  }
  const clear = () => { setFromDate(''); setToDate(''); setRange(null); setRows([]); setErrors({}); setError(''); setMessage(''); setSearchText(''); setPage(1) }
  const download = () => exportToCsv({ filename: `amc-customer-calls-history-${range.from}-to-${range.to}.csv`, headers: ['S.No', 'AMC Customer Name', 'AMC Expiry', 'Backup Count', 'Total Calls', 'Total Visits'], rows: filtered.map((row, index) => [index + 1, row.partyName, formatDate(row.customerExpiryDate), row.backupChecklist, row.totalCalls, row.totalVisits]) })
  const editVoucher = (voucher) => {
    setBackupDetails(null)
    navigate('/call-management/call-receipt-voucher', { state: { editVoucherId: voucher.id, returnTo: '/reports/customer-calls-history', reportRange: { fromDate: range.from, toDate: range.to } } })
  }

  return <div className="page-stack">
    <PageHeader title="AMC Customer Calls History" subtitle="View AMC customer calls, visits, and monthly backup history by date range." />
    <section className="panel-card report-section customer-calls-report-section">
      <div className="report-filter-grid">
        <label className="field"><span>From Date *</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setErrors((value) => ({ ...value, fromDate: '' })) }} />{errors.fromDate && <div className="field-message">{errors.fromDate}</div>}</label>
        <label className="field"><span>To Date *</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setErrors((value) => ({ ...value, toDate: '' })) }} />{errors.toDate && <div className="field-message">{errors.toDate}</div>}</label>
      </div>
      <div className="form-actions report-actions"><Button type="button" onClick={generate} disabled={loading}>{loading ? 'Generating...' : 'Generate Report'}</Button><Button type="button" variant="secondary" onClick={clear}>Clear</Button><Button type="button" variant="ghost" onClick={download} disabled={!filtered.length}><Download size={15} /> Download Report</Button></div>
      {error && <div className="field-message">{error}</div>}{message && <div className="auth-success">{message}</div>}
      {range && !rows.length && !error && <div className="report-empty-warning" role="status"><AlertTriangle size={16} /><span>No AMC customers found.</span></div>}
      <div className="toolbar report-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search customer, expiry, backups, calls or visits..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
      <div className="table-wrap report-table"><table><thead><tr><th>S.No</th><th>AMC Customer Name</th><th>AMC Expiry</th><th>Backup Count</th><th>Total Calls</th><th>Total Visits</th></tr></thead><tbody>
        {!range && <tr><td colSpan="6" className="text-center">Select a date range and generate the report.</td></tr>}
        {range && !filtered.length && <tr><td colSpan="6" className="text-center">No records found.</td></tr>}
        {paged.map((row, index) => <tr key={row.partyId}><td>{(page - 1) * pageSize + index + 1}</td><td>{emptyReportValue(row.partyName)}</td><td>{formatDate(row.customerExpiryDate)}</td><td><button type="button" className="report-count-link" onClick={() => setBackupDetails(row)}>{row.backupChecklist}</button></td><td>{row.totalCalls}</td><td>{row.totalVisits}</td></tr>)}
      </tbody></table></div>
      <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} className="report-pagination" />
    </section>

    <DetailsModal isOpen={Boolean(backupDetails)} title={`${backupDetails?.partyName || ''} - Monthly Backup Details`} onClose={() => setBackupDetails(null)} size="large">
      <div className="table-wrap call-details-table backup-details-table"><table><thead><tr><th>S.No</th><th>Voucher No</th><th>Date</th><th>Executive</th><th>Category</th><th>Category 2</th><th>Call Status</th><th>Call Sub Status</th><th>Remarks</th><th>Actions</th></tr></thead><tbody>
        {!backupDetails?.backupVouchers.length && <tr><td colSpan="10" className="text-center">No Monthly Backup entries found.</td></tr>}
        {backupDetails?.backupVouchers.map((voucher, index) => <tr key={voucher.id}><td>{index + 1}</td><td>{emptyReportValue(voucher.voucherNumber)}</td><td>{formatDate(voucher.date)}</td><td>{emptyReportValue(voucher.executiveName)}</td><td>{emptyReportValue(voucher.category)}</td><td>{emptyReportValue(voucher.category2)}</td><td>{emptyReportValue(voucher.callStatus)}</td><td>{emptyReportValue(voucher.callSubStatus)}</td><td>{emptyReportValue(voucher.callReceiptRemarks)}</td><td><div className="table-actions"><button type="button" className="executive-action-btn" onClick={() => setViewVoucher(voucher)}><Eye size={13} /> View</button><button type="button" className="executive-action-btn" onClick={() => editVoucher(voucher)}><Pencil size={13} /> Edit</button></div></td></tr>)}
      </tbody></table></div>
    </DetailsModal>

    <DetailsModal isOpen={Boolean(viewVoucher)} title="Call Receipt Voucher Details" onClose={() => setViewVoucher(null)} size="medium">
      {viewVoucher && <><div className="voucher-modal-number">Voucher #{emptyReportValue(viewVoucher.voucherNumber)}</div><div className="details-grid">
        <div className="detail-field"><span>Date</span><strong>{formatDate(viewVoucher.date)}</strong></div><div className="detail-field"><span>Party Name</span><strong>{emptyReportValue(viewVoucher.partyName)}</strong></div>
        <div className="detail-field"><span>Executive</span><strong>{emptyReportValue(viewVoucher.executiveName)}</strong></div><div className="detail-field"><span>Category</span><strong>{emptyReportValue(viewVoucher.category)}</strong></div>
        <div className="detail-field"><span>Category 2</span><strong>{emptyReportValue(viewVoucher.category2)}</strong></div><div className="detail-field"><span>Call Status</span><strong>{emptyReportValue(viewVoucher.callStatus)}</strong></div>
        <div className="detail-field"><span>Call Sub Status</span><strong>{emptyReportValue(viewVoucher.callSubStatus)}</strong></div><div className="detail-field"><span>Next Action</span><strong>{viewVoucher.callStatus === 'Open' ? emptyReportValue(viewVoucher.nextAction) : '-'}</strong></div>
        <div className="detail-field"><span>When</span><strong>{viewVoucher.callStatus === 'Open' ? formatDate(viewVoucher.when) : '-'}</strong></div><div className="detail-field"><span>Customer Expiry</span><strong>{formatDate(viewVoucher.customerExpiryDate)}</strong></div>
        <div className="detail-field"><span>Remarks</span><strong>{emptyReportValue(viewVoucher.callReceiptRemarks)}</strong></div>
      </div></>}
    </DetailsModal>
  </div>
}

export default CustomerCallsHistoryReport
