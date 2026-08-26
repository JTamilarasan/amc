import { useMemo, useState } from 'react'
import { Pencil, Search } from 'lucide-react'
import DetailsModal from './DetailsModal'
import CommonPagination from './CommonPagination'
import { emptyReportValue, formatReportDate } from '../../utils/reportUtils'
import { useAuth } from '../../context/AuthContext'

const EnquiryDetailsModal = ({ selection, enquiries, onClose, onEdit }) => {
  const { hasPermission } = useAuth(); const canEdit = hasPermission('enquiries', 'edit')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const close = () => { setSearchText(''); setPage(1); onClose() }
  const filtered = useMemo(() => { const search = searchText.trim().toLowerCase(); return enquiries.filter((item) => !search || [item.customerName, item.contactName, item.companyName, item.contactNumber, item.areaName, item.productName, item.followUpLeadName].some((value) => String(value || '').toLowerCase().includes(search))) }, [enquiries, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  return <DetailsModal isOpen={Boolean(selection)} title={`${selection?.status || ''} / ${selection?.source || ''} Enquiries`} onClose={close} size="large">
    <div className="toolbar report-toolbar call-details-toolbar"><div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search customer, contact, area, product or follow-up lead..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
    <div className="table-wrap call-details-table enquiry-report-table"><table><thead><tr><th>S.No</th><th>Lead Creation Date</th><th>Customer Name</th><th>Contact Name</th><th>Contact Number</th><th>Area</th><th>Product</th><th>Priority</th><th>Next Follow Up</th><th>Disposition</th><th>Follow Up Lead</th><th>Actions</th></tr></thead><tbody>
      {!paged.length && <tr><td colSpan="12" className="text-center">No enquiry records found.</td></tr>}
      {paged.map((item, index) => <tr key={item.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{formatReportDate(item.leadCreationDate || item.enquiryDate)}</td><td>{emptyReportValue(item.customerName)}</td><td>{emptyReportValue(item.contactName || item.companyName)}</td><td>{emptyReportValue(item.contactNumber)}</td><td>{emptyReportValue(item.areaName)}</td><td>{emptyReportValue(item.productName)}</td><td>{emptyReportValue(item.priority)}</td><td>{formatReportDate(item.nextFollowUp)}</td><td>{emptyReportValue(item.callDisposition)}</td><td>{emptyReportValue(item.followUpLeadName)}</td><td>{canEdit && <button type="button" className="executive-action-btn" onClick={() => onEdit(item)}><Pencil size={13} /> Edit</button>}</td></tr>)}
    </tbody></table></div>
    <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} className="report-pagination" />
  </DetailsModal>
}
export default EnquiryDetailsModal
