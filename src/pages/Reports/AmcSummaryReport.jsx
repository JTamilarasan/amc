import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Mail, RefreshCw, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import Loader from '../../components/common/Loader'
import { amcDashboardService } from '../../services/amcDashboardService'
import { customerService } from '../../services/customerService'
import { emailJsService } from '../../services/emailJsService'
import { exportToCsv } from '../../utils/exportCsv'
import { emptyReportValue, formatReportCurrency, formatReportDate, getVoucherItem } from '../../utils/reportUtils'

const config = {
  active: { title: 'Active AMC Customers Report', getter: 'getActiveAMCRecords', status: 'Active', customerBased: true },
  expired: { title: 'Expired AMC Customers Report', getter: 'getExpiredAMCRecords', status: 'Expired', customerBased: true, renewable: true, path: '/reports/amc-expired' },
  newAmc: { title: 'New AMC Report', getter: 'getNewAMCRecords', category: 'New' },
  goingToExpire: { title: 'Going to Expire AMC Report', getter: 'getGoingToExpireAMCRecords', status: 'Going to Expire', customerBased: true, warning: true, renewable: true, path: '/reports/amc-going-to-expire' },
  renewed: { title: 'Renewed AMC Report', getter: 'getRenewedAMCRecords', category: 'Renewal' },
}

const AmcSummaryReport = ({ reportType }) => {
  const definition = config[reportType]
  const location = useLocation()
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const sendingMailLocks = useRef(new Set())
  const [sendingMailIds, setSendingMailIds] = useState(new Set())
  const [mailMessage, setMailMessage] = useState(null)

  useEffect(() => {
    let active = true
    amcDashboardService[definition.getter]().then((result) => { if (active) setRecords(result) }).catch(() => { if (active) setError('Unable to load AMC report data. Please try again.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [definition.getter])

  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return records.filter((record) => {
      const item = record.item || getVoucherItem(record)
      return !search || [record.voucherNumber, record.customerName, record.executiveName, record.category, item?.itemName, item?.serialNo].some((value) => String(value || '').toLowerCase().includes(search))
    })
  }, [records, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const daysRemaining = (record) => Math.max(0, Math.ceil((record.amcTo.getTime() - record.today.getTime()) / 86400000))
  const renew = (record) => navigate('/sales-voucher', { state: { renewalMode: true, renewVoucher: record, returnTo: definition.path } })
  const sendMail = async (record) => {
    if (sendingMailLocks.current.has(record.id)) return
    sendingMailLocks.current.add(record.id)
    setSendingMailIds((current) => new Set(current).add(record.id))
    setMailMessage(null)
    try {
      let customer = record.customerId ? await customerService.getCustomerById(record.customerId) : null
      if (!customer && !record.customerId) {
        const matches = await customerService.searchCustomers(record.customerName)
        customer = matches.find((item) => item.customerName.trim().toLowerCase() === String(record.customerName || '').trim().toLowerCase()) || null
      }
      const customerEmail = customer?.email?.trim()
      if (!customerEmail) {
        setMailMessage({ type: 'error', text: 'Customer email address is not available.' })
        return
      }
      const item = record.item || getVoucherItem(record)
      await emailJsService.sendAmcExpiryEmail({
        email: customerEmail,
        customerName: customer.customerName || record.customerName || 'Customer',
        expiryDate: formatReportDate(item?.amcToDate),
      })
      setMailMessage({ type: 'success', text: 'AMC expiry reminder email sent successfully.' })
    } catch (sendError) {
      console.error('Unable to send AMC expiry reminder email.', sendError)
      setMailMessage({ type: 'error', text: 'Unable to send AMC expiry reminder email. Please try again.' })
    } finally {
      sendingMailLocks.current.delete(record.id)
      setSendingMailIds((current) => { const next = new Set(current); next.delete(record.id); return next })
    }
  }
  const download = () => {
    if (definition.warning) return exportToCsv({ filename: 'going-to-expire-amc.csv', headers: ['S.No', 'Customer Name', 'AMC To Date', 'Days Remaining', 'Product', 'Executive', 'Amount', 'Status'], rows: filtered.map((record, index) => [index + 1, record.customerName, formatReportDate(record.item?.amcToDate), daysRemaining(record), record.item?.itemName, record.executiveName, record.item?.amount, definition.status]) })
    if (definition.customerBased) return exportToCsv({ filename: `${reportType}-amc-customers.csv`, headers: ['S.No', 'Customer Name', 'AMC From Date', 'AMC To Date', 'Product', 'Executive', 'Amount', 'Status'], rows: filtered.map((record, index) => [index + 1, record.customerName, formatReportDate(record.item?.amcFromDate), formatReportDate(record.item?.amcToDate), record.item?.itemName, record.executiveName, record.item?.amount, definition.status]) })
    return exportToCsv({ filename: `${reportType}-amc.csv`, headers: ['S.No', 'Voucher No', 'Date', 'Customer Name', 'Product', 'Executive', 'AMC From', 'AMC To', 'Amount', 'Category'], rows: filtered.map((record, index) => { const item = getVoucherItem(record); return [index + 1, record.voucherNumber, formatReportDate(record.voucherDate), record.customerName, item?.itemName, record.executiveName, formatReportDate(item?.amcFromDate), formatReportDate(item?.amcToDate), item?.amount, record.category] }) })
  }

  if (loading) return <div className="page-stack"><PageHeader title={definition.title} subtitle="AMC records from saved AMC Vouchers." /><section className="panel-card"><Loader label="Loading report data..." /></section></div>
  return <div className="page-stack amc-summary-report"><PageHeader title={definition.title} subtitle="AMC records from saved AMC Vouchers." />{error && <div className="auth-error">{error}</div>}{location.state?.message && <div className="auth-success">{location.state.message}</div>}{mailMessage && <div className={mailMessage.type === 'success' ? 'auth-success' : 'auth-error'}>{mailMessage.text}</div>}<section className="panel-card report-section">
    <div className="form-actions report-actions"><Button type="button" variant="ghost" onClick={download} disabled={!filtered.length}><Download size={15} /> Download Report</Button></div>
    <div className="toolbar report-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search customer, voucher, executive or product..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
    <div className="table-wrap report-table"><table><thead><tr>{definition.warning ? <><th>S.No</th><th>Customer Name</th><th>AMC To Date</th><th>Days Remaining</th><th>Product</th><th>Executive</th><th>Amount</th><th>Status</th>{definition.renewable && <th>Actions</th>}</> : definition.customerBased ? <><th>S.No</th><th>Customer Name</th><th>AMC From Date</th><th>AMC To Date</th><th>Product</th><th>Executive</th><th>Amount</th><th>Status</th>{definition.renewable && <th>Actions</th>}</> : <><th>S.No</th><th>Voucher No</th><th>Date</th><th>Customer Name</th><th>Product</th><th>Executive</th><th>AMC From</th><th>AMC To</th><th>Amount</th><th>Category</th></>}</tr></thead><tbody>
      {!filtered.length && <tr><td colSpan={definition.customerBased ? definition.renewable ? 9 : 8 : 10} className="text-center">No records found.</td></tr>}
      {paged.map((record, index) => { const item = record.item || getVoucherItem(record); return definition.warning ? <tr key={record.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{emptyReportValue(record.customerName)}</td><td>{formatReportDate(item?.amcToDate)}</td><td>{daysRemaining(record)}</td><td>{emptyReportValue(item?.itemName)}</td><td>{emptyReportValue(record.executiveName)}</td><td>{formatReportCurrency(item?.amount)}</td><td><strong>{definition.status}</strong></td>{definition.renewable && <td><div className="table-actions"><button type="button" className="executive-action-btn" onClick={() => renew(record)}><RefreshCw size={13} /> Renew</button><button type="button" className="executive-action-btn" onClick={() => sendMail(record)} disabled={sendingMailIds.has(record.id)}><Mail size={13} /> {sendingMailIds.has(record.id) ? 'Sending...' : 'Send Mail'}</button></div></td>}</tr> : definition.customerBased ? <tr key={record.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{emptyReportValue(record.customerName)}</td><td>{formatReportDate(item?.amcFromDate)}</td><td>{formatReportDate(item?.amcToDate)}</td><td>{emptyReportValue(item?.itemName)}</td><td>{emptyReportValue(record.executiveName)}</td><td>{formatReportCurrency(item?.amount)}</td><td><strong>{definition.status}</strong></td>{definition.renewable && <td><button type="button" className="executive-action-btn" onClick={() => renew(record)}><RefreshCw size={13} /> Renew</button></td>}</tr> : <tr key={record.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{emptyReportValue(record.voucherNumber)}</td><td>{formatReportDate(record.voucherDate)}</td><td>{emptyReportValue(record.customerName)}</td><td>{emptyReportValue(item?.itemName)}</td><td>{emptyReportValue(record.executiveName)}</td><td>{formatReportDate(item?.amcFromDate)}</td><td>{formatReportDate(item?.amcToDate)}</td><td>{formatReportCurrency(item?.amount)}</td><td><strong>{record.category}</strong></td></tr> })}
    </tbody></table></div><CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} className="report-pagination" />
  </section></div>
}

export default AmcSummaryReport
