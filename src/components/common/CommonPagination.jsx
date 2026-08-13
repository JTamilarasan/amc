import Button from './Button'

const CommonPagination = ({ currentPage, totalPages, totalRecords, onPrevious, onNext, className = '' }) => {
  const safeTotalPages = Math.max(1, totalPages || 1)
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages)

  return <div className={`form-actions compact common-pagination ${className}`.trim()}>
    <Button type="button" variant="ghost" onClick={onPrevious} disabled={safeCurrentPage === 1}>Previous</Button>
    <div className="common-pagination-summary"><strong>Total Records: {totalRecords || 0}</strong><strong>Page {safeCurrentPage} of {safeTotalPages}</strong></div>
    <Button type="button" variant="ghost" onClick={onNext} disabled={safeCurrentPage === safeTotalPages}>Next</Button>
  </div>
}

export default CommonPagination
