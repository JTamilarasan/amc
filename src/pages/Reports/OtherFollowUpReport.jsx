import { useEffect, useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import Loader from '../../components/common/Loader'
import { otherFollowUpService } from '../../services/otherFollowUpService'
import { exportToCsv } from '../../utils/exportCsv'
import { formatReportDate } from '../../utils/reportUtils'

const OtherFollowUpReport = () => {
  const location = useLocation()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fromDate, setFromDate] = useState(location.state?.fromDate || '')
  const [toDate, setToDate] = useState(location.state?.toDate || '')
  const [status, setStatus] = useState(location.state?.status || '')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    let active = true
    otherFollowUpService.getOtherFollowUps().then((items) => { if (active) setRecords(items) }).catch(() => { if (active) setError('Unable to load Other Follow Up report.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return records.filter((item) => (!fromDate || item.date >= fromDate) && (!toDate || item.date <= toDate) && (!status || item.status === status) && (!search || [item.executiveName, item.status, item.remarks, item.date].some((value) => String(value || '').toLowerCase().includes(search))))
  }, [records, fromDate, toDate, status, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const clear = () => { setFromDate(''); setToDate(''); setStatus(''); setSearchText(''); setPage(1) }
  const download = () => exportToCsv({ filename: 'other-follow-up-report.csv', headers: ['S.No', 'Date', 'Executive', 'Status', 'Remarks'], rows: filtered.map((item, index) => [index + 1, formatReportDate(item.date), item.executiveName, item.status, item.remarks]) })

  return <div className="page-stack">
    <PageHeader title="Other Follow Up Report" subtitle="Review follow-up records by date, executive, status, and remarks." />
    {error && <div className="auth-error">{error}</div>}
    {loading ? <section className="panel-card"><Loader label="Loading follow-up report..." /></section> : <section className="panel-card report-section">
      <div className="report-filter-grid">
        <label className="field"><span>From Date</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1) }} /></label>
        <label className="field"><span>To Date</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1) }} /></label>
        <label className="field"><span>Status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">All Statuses</option><option value="Open">Open</option><option value="Closed">Closed</option></select></label>
      </div>
      <div className="form-actions report-actions"><Button type="button" variant="secondary" onClick={clear}>Clear Filters</Button><Button type="button" variant="ghost" onClick={download} disabled={!filtered.length}><Download size={15} /> Download Report</Button></div>
      <div className="toolbar report-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search executive, status, date or remarks..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
      <div className="table-wrap report-table"><table><thead><tr><th>S.No</th><th>Date</th><th>Executive</th><th>Status</th><th>Remarks</th></tr></thead><tbody>{!filtered.length && <tr><td colSpan="5" className="text-center">No follow-up records found.</td></tr>}{paged.map((item, index) => <tr key={item.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{formatReportDate(item.date)}</td><td>{item.executiveName || '—'}</td><td><span className={`status-badge ${item.status === 'Closed' ? 'green' : 'amber'}`}>{item.status}</span></td><td>{item.remarks || '—'}</td></tr>)}</tbody></table></div>
      <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} className="report-pagination" />
    </section>}
  </div>
}

export default OtherFollowUpReport
