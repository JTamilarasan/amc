import { useMemo, useState } from 'react'
import { Eye, Pencil, Search } from 'lucide-react'
import DetailsModal from './DetailsModal'
import CommonPagination from './CommonPagination'
import { formatDate } from '../../utils/dateUtils'
import { emptyReportValue } from '../../utils/reportUtils'
import { useAuth } from '../../context/AuthContext'

const CallDetailsModal = ({ isOpen, executiveName, filter, vouchers, onClose, onEdit }) => {
  const { hasPermission } = useAuth(); const canEdit = hasPermission('voucherSettings', 'edit')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewVoucher, setViewVoucher] = useState(null)
  const filtered = useMemo(() => { const search = searchText.trim().toLowerCase(); return vouchers.filter((voucher) => !search || [voucher.voucherNumber, voucher.partyName, voucher.category, voucher.category2, voucher.callStatus, voucher.callSubStatus, voucher.nextAction].some((value) => String(value || '').toLowerCase().includes(search))) }, [vouchers, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const label = filter === 'Open' ? 'Open Calls' : filter === 'Closed' ? 'Closed Calls' : filter === 'Visit' ? 'Visit Details' : 'All Calls'

  return <>
    <DetailsModal isOpen={isOpen} title={`${executiveName} - ${label}`} onClose={onClose} size="large">
      <div className="toolbar report-toolbar call-details-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search voucher, customer, category or status..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
      <div className="table-wrap call-details-table executive-call-details-table"><table><thead><tr><th>S.No</th><th>Voucher No</th><th>Date</th><th>Customer Name</th><th>Executive Name</th><th>Category</th><th>Category 2</th><th>Call Status</th><th>Next Action</th><th>When</th><th>Actions</th></tr></thead><tbody>
        {!paged.length && <tr><td colSpan="11" className="text-center">No call details found.</td></tr>}
        {paged.map((voucher, index) => <tr key={voucher.id}><td>{(page - 1) * pageSize + index + 1}</td><td><button type="button" className="report-count-link" onClick={() => setViewVoucher(voucher)}>{emptyReportValue(voucher.voucherNumber)}</button></td><td>{formatDate(voucher.date)}</td><td>{emptyReportValue(voucher.partyName)}</td><td>{emptyReportValue(voucher.executiveName)}</td><td>{emptyReportValue(voucher.category)}</td><td>{emptyReportValue(voucher.category2)}</td><td>{emptyReportValue(voucher.callStatus)}</td><td>{voucher.callStatus === 'Closed' ? '-' : emptyReportValue(voucher.nextAction)}</td><td>{voucher.callStatus === 'Closed' ? '-' : formatDate(voucher.when)}</td><td><div className="table-actions"><button type="button" className="executive-action-btn" onClick={() => setViewVoucher(voucher)}><Eye size={13} /> View</button>{canEdit && <button type="button" className="executive-action-btn" onClick={() => onEdit(voucher)}><Pencil size={13} /> Edit</button>}</div></td></tr>)}
      </tbody></table></div>
      <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} className="report-pagination" />
    </DetailsModal>

    <DetailsModal isOpen={Boolean(viewVoucher)} title="Call Receipt Voucher Details" onClose={() => setViewVoucher(null)} size="medium">
      {viewVoucher && <><div className="voucher-modal-number">Voucher #{emptyReportValue(viewVoucher.voucherNumber)}</div><div className="details-grid">
        <div className="detail-field"><span>Date</span><strong>{formatDate(viewVoucher.date)}</strong></div><div className="detail-field"><span>Party Name</span><strong>{emptyReportValue(viewVoucher.partyName)}</strong></div>
        <div className="detail-field"><span>Executive</span><strong>{emptyReportValue(viewVoucher.executiveName)}</strong></div><div className="detail-field"><span>Category</span><strong>{emptyReportValue(viewVoucher.category)}</strong></div>
        <div className="detail-field"><span>Category 2</span><strong>{emptyReportValue(viewVoucher.category2)}</strong></div><div className="detail-field"><span>Call Status</span><strong>{emptyReportValue(viewVoucher.callStatus)}</strong></div>
        <div className="detail-field"><span>Call Sub Status</span><strong>{emptyReportValue(viewVoucher.callSubStatus)}</strong></div><div className="detail-field"><span>Next Action</span><strong>{viewVoucher.callStatus === 'Open' ? emptyReportValue(viewVoucher.nextAction) : '-'}</strong></div>
        <div className="detail-field"><span>When</span><strong>{viewVoucher.callStatus === 'Open' ? formatDate(viewVoucher.when) : '-'}</strong></div><div className="detail-field"><span>AMC Expiry</span><strong>{formatDate(viewVoucher.customerExpiryDate)}</strong></div>
        <div className="detail-field"><span>Remarks</span><strong>{emptyReportValue(viewVoucher.callReceiptRemarks)}</strong></div>
      </div></>}
    </DetailsModal>
  </>
}

export default CallDetailsModal
