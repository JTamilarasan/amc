import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import DetailsModal from './DetailsModal'
import Button from './Button'
import { formatDate } from '../../utils/dateUtils'
import { emptyReportValue } from '../../utils/reportUtils'

const CallDetailsModal = ({ isOpen, executiveName, filter, vouchers, onClose }) => {
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const filtered = useMemo(() => { const search = searchText.trim().toLowerCase(); return vouchers.filter((voucher) => !search || [voucher.voucherNumber, voucher.partyName, voucher.category, voucher.callStatus, voucher.callSubStatus, voucher.nextAction].some((value) => String(value || '').toLowerCase().includes(search))) }, [vouchers, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const label = filter === 'Open' ? 'Open Calls' : filter === 'Closed' ? 'Closed Calls' : 'All Calls'
  return <DetailsModal isOpen={isOpen} title={`${executiveName} - ${label}`} onClose={onClose} size="large">
    <div className="toolbar report-toolbar call-details-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search voucher, customer, category or status..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
    <div className="table-wrap call-details-table"><table><thead><tr><th>S.No</th><th>Voucher No</th><th>Date</th><th>Customer Name</th><th>Category</th><th>Call Status</th><th>Call Sub Status</th><th>Next Action</th><th>When</th></tr></thead><tbody>
      {!paged.length && <tr><td colSpan="9" className="text-center">No call details found.</td></tr>}
      {paged.map((voucher, index) => <tr key={voucher.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{emptyReportValue(voucher.voucherNumber)}</td><td>{formatDate(voucher.date)}</td><td>{emptyReportValue(voucher.partyName)}</td><td>{emptyReportValue(voucher.category)}</td><td>{emptyReportValue(voucher.callStatus)}</td><td>{emptyReportValue(voucher.callSubStatus)}</td><td>{voucher.callStatus === 'Closed' ? '-' : emptyReportValue(voucher.nextAction)}</td><td>{voucher.callStatus === 'Closed' ? '-' : formatDate(voucher.when)}</td></tr>)}
    </tbody></table></div>
    <div className="form-actions compact report-pagination"><Button type="button" variant="ghost" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Previous</Button><span>Page {page} of {totalPages}</span><Button type="button" variant="ghost" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>Next</Button></div>
  </DetailsModal>
}

export default CallDetailsModal
