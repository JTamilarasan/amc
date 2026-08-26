import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Download, Eye, Pencil, Search } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import DetailsModal from '../../components/common/DetailsModal'
import { fetchCustomers, selectActiveCustomers } from '../../features/customers/customerSlice'
import { callReceiptVoucherService, getCallRegisterSummary, sortCallVouchersBySequence } from '../../services/callReceiptVoucherService'
import { exportToCsv } from '../../utils/exportCsv'
import { getCurrentMonthDateRange } from '../../utils/reportDateRange'
import { emptyReportValue, formatReportDate } from '../../utils/reportUtils'
import { useAuth } from '../../context/AuthContext'

const initialReturnedRange = (state) => state?.customerId && state?.fromDate && state?.toDate ? state : null
const matchesSearch = (voucher, search) => !search || [voucher.voucherNumber, voucher.executiveName, voucher.category, voucher.category2, voucher.callStatus, voucher.callSubStatus, voucher.callReceiptRemarks]
  .some((value) => String(value || '').toLowerCase().includes(search))

const SingleCustomerCallsHistoryReport = () => {
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('voucherSettings', 'edit')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const returned = initialReturnedRange(location.state)
  const defaultRange = getCurrentMonthDateRange()
  const customers = useSelector(selectActiveCustomers)
  const [customerId, setCustomerId] = useState(returned?.customerId || '')
  const [customerName, setCustomerName] = useState(returned?.customerName || '')
  const [customerOpen, setCustomerOpen] = useState(false)
  const [fromDate, setFromDate] = useState(returned?.fromDate || defaultRange.fromDate)
  const [toDate, setToDate] = useState(returned?.toDate || defaultRange.toDate)
  const [range, setRange] = useState(returned)
  const [records, setRecords] = useState([])
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState(location.state?.message || '')
  const [loading, setLoading] = useState(Boolean(returned))
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailList, setDetailList] = useState(null)
  const [viewVoucher, setViewVoucher] = useState(null)

  useEffect(() => { dispatch(fetchCustomers()) }, [dispatch])
  useEffect(() => {
    if (!returned) return undefined
    let active = true
    callReceiptVoucherService.getSingleCustomerCallHistory(returned.customerId, returned.customerName, returned.fromDate, returned.toDate)
      .then((result) => { if (active) setRecords(sortCallVouchersBySequence(result)) })
      .catch(() => { if (active) setError('Unable to load customer call history. Please try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [returned])

  const filteredCustomers = useMemo(() => customers.filter((customer) => !customerName || customer.customerName.toLowerCase().includes(customerName.toLowerCase())), [customers, customerName])
  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return records.filter((voucher) => matchesSearch(voucher, search))
  }, [records, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const summary = useMemo(() => getCallRegisterSummary(records), [records])

  const generate = async () => {
    const next = {}
    if (!customerId) next.customerId = 'Select a valid customer.'
    if (!fromDate) next.fromDate = 'From Date is required.'
    if (!toDate) next.toDate = 'To Date is required.'
    else if (fromDate && toDate < fromDate) next.toDate = 'To Date cannot be earlier than From Date.'
    setErrors(next); setError(''); setMessage(''); setPage(1)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      const result = await callReceiptVoucherService.getSingleCustomerCallHistory(customerId, customerName, fromDate, toDate)
      setRecords(sortCallVouchersBySequence(result)); setRange({ customerId, customerName, fromDate, toDate })
    } catch { setRecords([]); setError('Unable to load customer call history. Please try again.') }
    finally { setLoading(false) }
  }
  const clear = () => { setCustomerId(''); setCustomerName(''); setFromDate(''); setToDate(''); setRange(null); setRecords([]); setErrors({}); setError(''); setMessage(''); setSearchText(''); setPage(1) }
  const editVoucher = (voucher) => navigate('/call-management/call-receipt-voucher', { state: { editVoucherId: voucher.id, returnTo: '/reports/single-customer-calls-history', reportRange: range } })
  const download = () => {
    const rows = records.map((voucher, index) => [index + 1, voucher.voucherNumber, formatReportDate(voucher.date), voucher.partyName, voucher.executiveName, voucher.category, voucher.category2, voucher.callStatus, voucher.callSubStatus, voucher.nextAction, formatReportDate(voucher.when), voucher.callReceiptRemarks])
    const summaryRows = [[], ['Selected Customer', range.customerName], ['From Date', formatReportDate(range.fromDate)], ['To Date', formatReportDate(range.toDate)], [], ['TOTAL SUMMARY'], ['Total Calls Received', summary.totalEntries], ['Total Open', summary.totalOpenCalls], ['Total Closed', summary.totalClosedCalls], ['Total Call', summary.totalCalls], ['Total Visit', summary.totalVisits]]
    exportToCsv({ filename: `single-customer-calls-${range.fromDate}-to-${range.toDate}.csv`, headers: ['S.No', 'Voucher No', 'Date', 'Party Name', 'Executive', 'Category', 'Category 2', 'Call Status', 'Call Sub Status', 'Next Action', 'When', 'Call Receipt Remarks'], rows: [...rows, ...summaryRows] })
  }
  const openSummary = (title, predicate) => setDetailList({ title, records: records.filter(predicate) })

  return <div className="page-stack single-customer-calls-report">
    <PageHeader title="Single Customer Calls History Report" subtitle="View call history for any selected customer." />
    <section className="panel-card report-section">
      <div className="report-filter-grid single-customer-call-filters">
        <label className="field"><span>Customer Name *</span><div className="searchable-select"><input value={customerName} onChange={(event) => { const value = event.target.value; const match = customers.find((customer) => customer.customerName.toLowerCase() === value.trim().toLowerCase()); setCustomerName(value); setCustomerId(match?.id || ''); setCustomerOpen(true); setErrors((current) => ({ ...current, customerId: '' })) }} onFocus={() => setCustomerOpen(true)} onBlur={() => window.setTimeout(() => setCustomerOpen(false), 150)} placeholder="Search and select customer" autoComplete="off" />{customerOpen && <div className="searchable-options">{filteredCustomers.length ? filteredCustomers.map((customer) => <button type="button" key={customer.id} onMouseDown={() => { setCustomerId(customer.id); setCustomerName(customer.customerName); setCustomerOpen(false); setErrors((current) => ({ ...current, customerId: '' })) }}>{customer.customerName}</button>) : <div className="searchable-empty">No matching customers</div>}</div>}</div>{errors.customerId && <div className="field-message">{errors.customerId}</div>}</label>
        <label className="field"><span>From Date *</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setErrors((current) => ({ ...current, fromDate: '' })) }} />{errors.fromDate && <div className="field-message">{errors.fromDate}</div>}</label>
        <label className="field"><span>To Date *</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setErrors((current) => ({ ...current, toDate: '' })) }} />{errors.toDate && <div className="field-message">{errors.toDate}</div>}</label>
      </div>
      <div className="form-actions report-actions"><Button type="button" onClick={generate} disabled={loading}>{loading ? 'Generating...' : 'Generate Report'}</Button><Button type="button" variant="secondary" onClick={clear}>Clear</Button><Button type="button" variant="ghost" onClick={download} disabled={!records.length}><Download size={15} /> Download Report</Button></div>
      {error && <div className="field-message">{error}</div>}{message && <div className="auth-success">{message}</div>}
      {range && !records.length && !error && <div className="report-empty-warning" role="status"><AlertTriangle size={16} /><span>No call records found for the selected customer and date range.</span></div>}
      <div className="toolbar report-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search voucher, executive, category, status or remarks..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
      <div className="table-wrap report-table single-customer-call-table"><table><thead><tr><th>S.No</th><th>Voucher No</th><th>Date</th><th>Party Name</th><th>Executive</th><th>Category</th><th>Category 2</th><th>Call Status</th><th>Call Sub Status</th><th>Next Action</th><th>When</th><th>Call Receipt Remarks</th><th>Actions</th></tr></thead><tbody>
        {!range && <tr><td colSpan="13" className="text-center">Select a customer and date range, then generate the report.</td></tr>}{range && !filtered.length && <tr><td colSpan="13" className="text-center">No records found.</td></tr>}
        {paged.map((voucher, index) => <tr key={voucher.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{emptyReportValue(voucher.voucherNumber)}</td><td>{formatReportDate(voucher.date)}</td><td>{emptyReportValue(voucher.partyName)}</td><td>{emptyReportValue(voucher.executiveName)}</td><td>{emptyReportValue(voucher.category)}</td><td>{emptyReportValue(voucher.category2)}</td><td>{emptyReportValue(voucher.callStatus)}</td><td>{emptyReportValue(voucher.callSubStatus)}</td><td>{voucher.callStatus === 'Open' ? emptyReportValue(voucher.nextAction) : '-'}</td><td>{voucher.callStatus === 'Open' ? formatReportDate(voucher.when) : '-'}</td><td>{emptyReportValue(voucher.callReceiptRemarks)}</td><td><div className="table-actions"><button type="button" className="executive-action-btn" onClick={() => setViewVoucher(voucher)}><Eye size={13} /> View</button>{canEdit && <button type="button" className="executive-action-btn" onClick={() => editVoucher(voucher)}><Pencil size={13} /> Edit</button>}</div></td></tr>)}
      </tbody></table></div>
      {range && <><CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} className="report-pagination" /><div className="call-register-summary"><h3>TOTAL SUMMARY</h3><div><button type="button" className="report-count-link" onClick={() => openSummary('Total Calls Received', () => true)}><strong>Total Calls Received: {summary.totalEntries}</strong></button><button type="button" className="report-count-link" onClick={() => openSummary('Total Open', (voucher) => voucher.callStatus === 'Open')}><strong>Total Open: {summary.totalOpenCalls}</strong></button><button type="button" className="report-count-link" onClick={() => openSummary('Total Closed', (voucher) => voucher.callStatus === 'Closed')}><strong>Total Closed: {summary.totalClosedCalls}</strong></button><button type="button" className="report-count-link" onClick={() => openSummary('Total Call', (voucher) => voucher.category2 === 'Call')}><strong>Total Call: {summary.totalCalls}</strong></button><button type="button" className="report-count-link" onClick={() => openSummary('Total Visit', (voucher) => voucher.category2 === 'Visit')}><strong>Total Visit: {summary.totalVisits}</strong></button></div></div></>}
    </section>

    <DetailsModal isOpen={Boolean(detailList)} title={`${customerName} - ${detailList?.title || ''}`} onClose={() => setDetailList(null)} size="large"><div className="table-wrap call-details-table"><table><thead><tr><th>S.No</th><th>Voucher No</th><th>Date</th><th>Executive</th><th>Category</th><th>Category 2</th><th>Call Status</th><th>Actions</th></tr></thead><tbody>{!detailList?.records.length && <tr><td colSpan="8" className="text-center">No records found.</td></tr>}{detailList?.records.map((voucher, index) => <tr key={voucher.id}><td>{index + 1}</td><td>{emptyReportValue(voucher.voucherNumber)}</td><td>{formatReportDate(voucher.date)}</td><td>{emptyReportValue(voucher.executiveName)}</td><td>{emptyReportValue(voucher.category)}</td><td>{emptyReportValue(voucher.category2)}</td><td>{emptyReportValue(voucher.callStatus)}</td><td><div className="table-actions"><button type="button" className="executive-action-btn" onClick={() => setViewVoucher(voucher)}><Eye size={13} /> View</button>{canEdit && <button type="button" className="executive-action-btn" onClick={() => editVoucher(voucher)}><Pencil size={13} /> Edit</button>}</div></td></tr>)}</tbody></table></div></DetailsModal>
    <DetailsModal isOpen={Boolean(viewVoucher)} title="Call Receipt Voucher Details" onClose={() => setViewVoucher(null)} size="medium">{viewVoucher && <><div className="voucher-modal-number">Voucher #{emptyReportValue(viewVoucher.voucherNumber)}</div><div className="details-grid"><div className="detail-field"><span>Date</span><strong>{formatReportDate(viewVoucher.date)}</strong></div><div className="detail-field"><span>Party Name</span><strong>{emptyReportValue(viewVoucher.partyName)}</strong></div><div className="detail-field"><span>Executive</span><strong>{emptyReportValue(viewVoucher.executiveName)}</strong></div><div className="detail-field"><span>Category</span><strong>{emptyReportValue(viewVoucher.category)}</strong></div><div className="detail-field"><span>Category 2</span><strong>{emptyReportValue(viewVoucher.category2)}</strong></div><div className="detail-field"><span>Call Status</span><strong>{emptyReportValue(viewVoucher.callStatus)}</strong></div><div className="detail-field"><span>Call Sub Status</span><strong>{emptyReportValue(viewVoucher.callSubStatus)}</strong></div><div className="detail-field"><span>Next Action</span><strong>{viewVoucher.callStatus === 'Open' ? emptyReportValue(viewVoucher.nextAction) : '-'}</strong></div><div className="detail-field"><span>When</span><strong>{viewVoucher.callStatus === 'Open' ? formatReportDate(viewVoucher.when) : '-'}</strong></div><div className="detail-field"><span>Remarks</span><strong>{emptyReportValue(viewVoucher.callReceiptRemarks)}</strong></div></div></>}</DetailsModal>
  </div>
}

export default SingleCustomerCallsHistoryReport
