import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AlertTriangle, Download, Search } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { fetchSalesVouchers, selectSalesVoucherState, selectSalesVouchers } from '../../features/salesVouchers/salesVoucherSlice'
import { exportToCsv } from '../../utils/exportCsv'
import { formatDate } from '../../utils/dateUtils'
import { emptyReportValue, formatReportCurrency, getVoucherItem, voucherMatchesReportSearch } from '../../utils/reportUtils'

const formatFilenameDate = (value) => value.split('-').reverse().join('-')

const CurrentMonthlyExpiryReport = () => {
  const dispatch = useDispatch()
  const vouchers = useSelector(selectSalesVouchers)
  const { loading, error } = useSelector(selectSalesVoucherState)
  const shouldFetch = useRef(vouchers.length === 0 && !loading)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [range, setRange] = useState(null)
  const [errors, setErrors] = useState({})
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { if (shouldFetch.current) dispatch(fetchSalesVouchers()) }, [dispatch])

  const generated = useMemo(() => !range ? [] : vouchers.filter((voucher) => {
    const amcToDate = getVoucherItem(voucher)?.amcToDate
    return Boolean(amcToDate) && amcToDate >= range.from && amcToDate <= range.to
  }), [vouchers, range])
  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return generated.filter((voucher) => voucherMatchesReportSearch(voucher, search))
  }, [generated, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const showNoResultsWarning = Boolean(range) && range.from === fromDate && range.to === toDate && generated.length === 0

  const generate = () => {
    const nextErrors = {}
    if (!fromDate) nextErrors.fromDate = 'From Date is required.'
    if (!toDate) nextErrors.toDate = 'To Date is required.'
    else if (fromDate && toDate < fromDate) nextErrors.toDate = 'To Date cannot be earlier than From Date.'
    setErrors(nextErrors)
    setPage(1)
    if (Object.keys(nextErrors).length) return
    setRange({ from: fromDate, to: toDate })
  }

  const clear = () => {
    setFromDate('')
    setToDate('')
    setRange(null)
    setErrors({})
    setSearchText('')
    setPage(1)
  }

  const download = () => exportToCsv({
    filename: `current-monthly-expiry-${formatFilenameDate(range.from)}-to-${formatFilenameDate(range.to)}.csv`,
    headers: ['Customer Name', 'Executive', 'Category', 'Product', 'Serial No', 'AMC To Date', 'Amount'],
    rows: filtered.map((voucher) => {
      const item = getVoucherItem(voucher)
      return [voucher.customerName, voucher.executiveName, voucher.category, item?.itemName, item?.serialNo, formatDate(item?.amcToDate), item?.amount]
    }),
  })

  if (loading && !vouchers.length) return <div className="page-stack"><PageHeader title="Current Monthly Expiry Report" subtitle="View AMC records expiring in a selected date range." /><section className="panel-card"><Loader label="Loading report data..." /></section></div>

  return <div className="page-stack">
    <PageHeader title="Current Monthly Expiry Report" subtitle="View AMC records expiring in a selected date range." />
    {error && <div className="auth-error">Unable to load report data. Please try again.</div>}
    <section className="panel-card report-section expiry-report-section">
      <div className="report-filter-grid">
        <label className="field"><span>From Date *</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setErrors((value) => ({ ...value, fromDate: '' })); setPage(1) }} />{errors.fromDate && <div className="field-message">{errors.fromDate}</div>}</label>
        <label className="field"><span>To Date *</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setErrors((value) => ({ ...value, toDate: '' })); setPage(1) }} />{errors.toDate && <div className="field-message">{errors.toDate}</div>}</label>
      </div>
      <div className="form-actions report-actions"><Button type="button" onClick={generate}>Generate Report</Button><Button type="button" variant="secondary" onClick={clear}>Clear</Button><Button type="button" variant="ghost" onClick={download} disabled={!filtered.length}><Download size={15} /> Download Report</Button></div>
      {showNoResultsWarning && <div className="report-empty-warning" role="status"><AlertTriangle size={16} aria-hidden="true" /><span>No AMC expiry records found for the selected date range.</span></div>}
      <div className="toolbar report-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search customer, executive, category, product or serial no..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
      <div className="table-wrap report-table"><table><thead><tr><th>S.No</th><th>Customer Name</th><th>Executive</th><th>Category</th><th>Product</th><th>Serial No</th><th>To Date</th><th>Amount</th></tr></thead><tbody>
        {!range && <tr><td colSpan="8" className="text-center">Select a date range and generate the report.</td></tr>}
        {range && !filtered.length && <tr><td colSpan="8" className="text-center">No records found.</td></tr>}
        {paged.map((voucher, index) => { const item = getVoucherItem(voucher); return <tr key={voucher.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{emptyReportValue(voucher.customerName)}</td><td>{emptyReportValue(voucher.executiveName)}</td><td>{emptyReportValue(voucher.category)}</td><td>{emptyReportValue(item?.itemName)}</td><td>{emptyReportValue(item?.serialNo)}</td><td>{formatDate(item?.amcToDate)}</td><td>{formatReportCurrency(item?.amount)}</td></tr> })}
      </tbody></table></div>
      <div className="form-actions compact report-pagination"><Button type="button" variant="ghost" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Previous</Button><span>Page {page} of {totalPages}</span><Button type="button" variant="ghost" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>Next</Button></div>
    </section>
  </div>
}

export default CurrentMonthlyExpiryReport
