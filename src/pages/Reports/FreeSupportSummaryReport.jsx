import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, XCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import Loader from '../../components/common/Loader'
import { freeSupportVoucherService } from '../../services/freeSupportVoucherService'
import { formatDate } from '../../utils/dateUtils'
import { formatReportCurrency } from '../../utils/reportUtils'
import { useAuth } from '../../context/AuthContext'

const definitions = { active: 'Active Free Support Customers', expired: 'Expired Free Support Customers', new: 'New Free Support', 'going-to-expire': 'Free Support Going to Expire', dropped: 'Dropped Free Support Customers' }
const FreeSupportSummaryReport = () => {
  const { type } = useParams(); const navigate = useNavigate(); const { hasPermission } = useAuth(); const canEdit = hasPermission('salesVouchers', 'edit'); const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [message, setMessage] = useState('')
  const load = async () => { setLoading(true); try { setData(await freeSupportVoucherService.getFreeSupportDashboardData()) } finally { setLoading(false) } }
  useEffect(() => { let active = true; freeSupportVoucherService.getFreeSupportDashboardData().then((result) => { if (active) setData(result) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  const records = useMemo(() => type === 'new' ? data?.newFs || [] : type === 'going-to-expire' ? data?.goingToExpire || [] : data?.[type] || [], [data, type])
  const filtered = useMemo(() => records.filter((record) => !search || [record.customerName, record.executiveName, record.item?.itemName].some((value) => String(value || '').toLowerCase().includes(search.toLowerCase()))), [records, search]); const pageSize = 10; const pages = Math.max(1, Math.ceil(filtered.length / pageSize)); const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const renew = (record) => navigate('/free-support-voucher', { state: { renewalMode: true, renewVoucher: record } })
  const drop = async (record) => { await freeSupportVoucherService.markFreeSupportDropped(record.id); setMessage(`${record.customerName} marked as Dropped.`); await load() }
  if (loading) return <div className="page-stack"><PageHeader title={definitions[type] || 'Free Support Report'} /><section className="panel-card"><Loader /></section></div>
  return <div className="page-stack"><PageHeader title={definitions[type] || 'Free Support Report'} subtitle="Free Support customer status details." />{message && <div className="auth-success">{message}</div>}<section className="panel-card"><div className="toolbar"><div className="search-box"><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search customer, executive or product..." /></div></div><div className="table-wrap report-table"><table><thead><tr><th>S.No</th><th>Customer</th><th>Executive</th><th>Product</th><th>Duration</th><th>From</th><th>To</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>{!paged.length && <tr><td colSpan="10" className="text-center">No records found.</td></tr>}{paged.map((record, index) => { const item = record.item || record.items?.[0] || {}; return <tr key={record.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{record.customerName}</td><td>{record.executiveName}</td><td>{item.itemName}</td><td>{item.duration}</td><td>{formatDate(item.amcFromDate)}</td><td>{formatDate(item.amcToDate)}</td><td>{formatReportCurrency(item.amount)}</td><td>{record.status}</td><td><div className="table-actions">{type === 'expired' && canEdit && <Button type="button" variant="secondary" onClick={() => drop(record)}><XCircle size={13} /> Mark Dropped</Button>}{type === 'dropped' && canEdit && <Button type="button" onClick={() => renew(record)}><RefreshCw size={13} /> Renew</Button>}</div></td></tr> })}</tbody></table></div><CommonPagination currentPage={page} totalPages={pages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(pages, value + 1))} /></section></div>
}
export default FreeSupportSummaryReport
