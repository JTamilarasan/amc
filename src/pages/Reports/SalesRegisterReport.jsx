import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AlertTriangle, Download, Pencil, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import Loader from '../../components/common/Loader'
import { fetchSalesVouchers, selectSalesVoucherState, selectSalesVouchers } from '../../features/salesVouchers/salesVoucherSlice'
import { exportToCsv } from '../../utils/exportCsv'
import { emptyReportValue, formatReportCurrency, formatReportDate, getVoucherItem, voucherMatchesReportSearch } from '../../utils/reportUtils'

const voucherNumberParts = (voucher) => {
  const [sequencePart, yearPart] = String(voucher.voucherNumber ?? '').split('/')
  const sequence = Number(sequencePart)
  const voucherDateYear = Number(String(voucher.voucherDate || '').slice(0, 4))
  const parsedYear = Number(yearPart)
  return {
    year: Number.isFinite(parsedYear) ? parsedYear : Number.isFinite(voucherDateYear) ? voucherDateYear : 0,
    sequence: Number.isFinite(sequence) ? sequence : Number.MAX_SAFE_INTEGER,
  }
}

const compareVoucherNumbers = (left, right) => {
  const leftParts = voucherNumberParts(left)
  const rightParts = voucherNumberParts(right)
  return leftParts.year - rightParts.year || leftParts.sequence - rightParts.sequence
}

const SalesRegisterReport = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const vouchers = useSelector(selectSalesVouchers)
  const { loading, error } = useSelector(selectSalesVoucherState)
  const shouldFetch = useRef(vouchers.length === 0 && !loading)
  const [fromDate, setFromDate] = useState(location.state?.fromDate || '')
  const [toDate, setToDate] = useState(location.state?.toDate || '')
  const [range, setRange] = useState(location.state?.fromDate && location.state?.toDate ? { from: location.state.fromDate, to: location.state.toDate } : null)
  const [errors, setErrors] = useState({})
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { if (shouldFetch.current) dispatch(fetchSalesVouchers()) }, [dispatch])

  const generated = useMemo(() => !range ? [] : vouchers.filter((voucher) => voucher.voucherDate >= range.from && voucher.voucherDate <= range.to), [vouchers, range])
  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return generated.filter((voucher) => voucherMatchesReportSearch(voucher, search))
  }, [generated, searchText])
  const sorted = useMemo(() => [...filtered].sort(compareVoucherNumbers), [filtered])
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)
  const showNoResultsWarning = Boolean(range) && range.from === fromDate && range.to === toDate && generated.length === 0

  const generate = () => {
    const nextErrors = {}
    if (!fromDate) nextErrors.fromDate = 'From Date is required.'
    if (!toDate) nextErrors.toDate = 'To Date is required.'
    else if (fromDate && toDate < fromDate) nextErrors.toDate = 'To Date cannot be earlier than From Date.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setRange({ from: fromDate, to: toDate }); setPage(1)
  }
  const clear = () => { setFromDate(''); setToDate(''); setRange(null); setErrors({}); setSearchText(''); setPage(1) }
  const download = () => exportToCsv({
    filename: `sales-register-${range.from}-to-${range.to}.csv`,
    headers: ['Voucher No', 'Date', 'Customer Name', 'Executive', 'Category', 'Product', 'Serial No', 'Duration', 'AMC From', 'AMC To', 'Amount', 'Status'],
    rows: [...generated].sort(compareVoucherNumbers).map((voucher) => { const item = getVoucherItem(voucher); return [voucher.voucherNumber, formatReportDate(voucher.voucherDate), voucher.customerName, voucher.executiveName, voucher.category, item?.itemName, item?.serialNo, item?.duration, formatReportDate(item?.amcFromDate), formatReportDate(item?.amcToDate), item?.amount, voucher.status] }),
  })
  const editVoucher = (voucher) => navigate('/sales-voucher', { state: { editVoucherId: voucher.id, editVoucher: voucher, returnTo: '/reports/sales-register', reportRange: { fromDate: range.from, toDate: range.to } } })

  if (loading && !vouchers.length) return <div className="page-stack"><PageHeader title="Sales Register Report" subtitle="View sales vouchers by selected date range." /><section className="panel-card"><Loader label="Loading report data..." /></section></div>

  return <div className="page-stack">
    <PageHeader title="Sales Register Report" subtitle="View sales vouchers by selected date range." />
    {error && <div className="auth-error">Unable to load report data. Please try again.</div>}
    {location.state?.message && <div className="auth-success">{location.state.message}</div>}
    <section className="panel-card report-section">
      <div className="report-filter-grid">
        <label className="field"><span>From Date *</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setErrors((value) => ({ ...value, fromDate: '' })); setPage(1) }} />{errors.fromDate && <div className="field-message">{errors.fromDate}</div>}</label>
        <label className="field"><span>To Date *</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setErrors((value) => ({ ...value, toDate: '' })); setPage(1) }} />{errors.toDate && <div className="field-message">{errors.toDate}</div>}</label>
      </div>
      <div className="form-actions report-actions"><Button type="button" onClick={generate}>Generate Report</Button><Button type="button" variant="secondary" onClick={clear}>Clear</Button><Button type="button" variant="ghost" onClick={download} disabled={!generated.length}><Download size={15} /> Download Report</Button></div>
      {showNoResultsWarning && <div className="report-empty-warning" role="status"><AlertTriangle size={16} aria-hidden="true" /><span>No sales records found for the selected date range.</span></div>}
      <div className="toolbar report-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search voucher, customer, executive, product or serial no..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
      <div className="table-wrap report-table"><table><thead><tr><th>S.No</th><th>Voucher No</th><th>Date</th><th>Customer Name</th><th>Executive</th><th>Category</th><th>Product</th><th>Serial No</th><th>Duration</th><th>AMC From</th><th>AMC To</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {range && !filtered.length && <tr><td colSpan="14" className="text-center">No records found.</td></tr>}{!range && <tr><td colSpan="14" className="text-center">Select a date range and generate the report.</td></tr>}
        {paged.map((voucher, index) => { const item = getVoucherItem(voucher); return <tr key={voucher.id}><td>{(page - 1) * pageSize + index + 1}</td><td>#{emptyReportValue(voucher.voucherNumber)}</td><td>{formatReportDate(voucher.voucherDate)}</td><td>{emptyReportValue(voucher.customerName)}</td><td>{emptyReportValue(voucher.executiveName)}</td><td>{emptyReportValue(voucher.category)}</td><td>{emptyReportValue(item?.itemName)}</td><td>{emptyReportValue(item?.serialNo)}</td><td>{emptyReportValue(item?.duration)}</td><td>{formatReportDate(item?.amcFromDate)}</td><td>{formatReportDate(item?.amcToDate)}</td><td>{formatReportCurrency(item?.amount)}</td><td>{emptyReportValue(voucher.status)}</td><td><button type="button" className="executive-action-btn" onClick={() => editVoucher(voucher)}><Pencil size={13} /> Edit</button></td></tr> })}
      </tbody></table></div>
      <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} className="report-pagination" />
    </section>
  </div>
}

export default SalesRegisterReport
