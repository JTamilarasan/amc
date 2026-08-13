import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import Loader from '../../components/common/Loader'
import { formatDate } from '../../utils/dateUtils'
import { addExecutive, clearExecutiveMessage, editExecutive, fetchExecutives, removeExecutive, selectExecutiveState } from '../../features/executives/executiveSlice'

const ExecutiveMaster = () => {
  const dispatch = useDispatch()
  const { items, loading, error, successMessage } = useSelector(selectExecutiveState)
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720)

  useEffect(() => {
    dispatch(fetchExecutives())
  }, [dispatch])

  useEffect(() => {
    if (successMessage || error) {
      const timer = window.setTimeout(() => dispatch(clearExecutiveMessage()), 3000)
      return () => window.clearTimeout(timer)
    }
  }, [successMessage, error, dispatch])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 720)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchText])

  const filteredExecutives = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) {
      return items
    }

    return items.filter((executive) => executive.name.toLowerCase().includes(query))
  }, [items, searchText])

  const totalPages = Math.max(1, Math.ceil(filteredExecutives.length / pageSize))
  const pagedExecutives = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredExecutives.slice(startIndex, startIndex + pageSize)
  }, [filteredExecutives, page, pageSize])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName || trimmedName.length < 2) {
      return
    }

    try {
      if (editingId) {
        await dispatch(editExecutive({ id: editingId, name: trimmedName })).unwrap()
      } else {
        await dispatch(addExecutive(trimmedName)).unwrap()
      }
      setName('')
      setEditingId(null)
    } catch {
      // Error handled via Redux state
    }
  }

  const handleEdit = (executive) => {
    setEditingId(executive.id)
    setName(executive.name)
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) {
      return
    }

    try {
      await dispatch(removeExecutive(confirmDeleteId)).unwrap()
      setConfirmDeleteId(null)
    } catch {
      // Error handled via Redux state
    }
  }

  const resetForm = () => {
    setName('')
    setEditingId(null)
  }

  const renderTableContent = () => {
    if (loading && items.length === 0) {
      return <tr><td colSpan="5"><Loader size="small" label="Loading executives..." /></td></tr>
    }

    if (!loading && filteredExecutives.length === 0) {
      return <tr><td colSpan="5" className="text-center">{searchText ? 'No matching executives found.' : 'No executives found.'}</td></tr>
    }

    return pagedExecutives.map((executive, index) => (
      <tr key={executive.id}>
        <td>{(page - 1) * pageSize + index + 1}</td>
        <td>{executive.name}</td>
        <td>{formatDate(executive.createdAt)}</td>
        <td><span className={`status-badge ${executive.status === 'Active' ? 'green' : 'amber'}`}>{executive.status}</span></td>
        <td>
          <div className="table-actions">
            <button className="executive-action-btn" onClick={() => handleEdit(executive)}>
              <Pencil size={13} />
              <span>Edit</span>
            </button>
            <button className="executive-action-btn delete" onClick={() => setConfirmDeleteId(executive.id)}>
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    ))
  }

  return (
    <div className="page-stack">
      <PageHeader title="Executive Master" 
      subtitle="Manage executives responsible for customer sales and follow-ups." 
      />
       {/* <PageHeader title="Executive Master" 
      subtitle="Manage executives responsible for customer sales and follow-ups." 
      action={<Button onClick={resetForm}><Plus size={16} /> 
      <span>{editingId ? 'Update Executive' : 'Add Executive'}</span>
      </Button>} /> */}
      <section className="panel-card form-card">
        <div className="panel-heading">
          <h2>{editingId ? 'Edit Executive' : 'Add Executive'}</h2>
          {/* <span>Capture key sales team contacts</span> */}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid two-col">
            <label className="field">
              <span>Executive Name *</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter executive name" />
              {(error || successMessage) ? <div className={successMessage ? 'field-message field-success' : 'field-message field-error'}>{error || successMessage}</div> : null}
            </label>
          </div>
          <div className="form-actions master-form-actions">
            <Button type="submit" disabled={loading}>{loading ? (editingId ? 'Updating...' : 'Saving...') : (editingId ? 'Update Executive' : 'Save Executive')}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Clear</Button>
            {/* <Button type="button" variant="ghost" onClick={() => setName('')}>Cancel</Button> */}
          </div>
        </form>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Existing Executives</h2>
          <span>Current team roster</span>
        </div>
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <div className="search-box" style={{ minWidth: 240, width: '100%' }}>
            <Search size={16} />
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search executive by name..." />
          </div>
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        {loading && items.length === 0 ? <Loader size="small" label="Loading executives..." /> : isMobile ? (
          <div className="executive-mobile-list">
            {pagedExecutives.map((executive, index) => (
              <div className="executive-mobile-card" key={executive.id}>
                <div className="executive-mobile-row">
                  <span className="executive-mobile-label">Executive Name</span>
                  <span>{executive.name}</span>
                </div>
                <div className="executive-mobile-row">
                  <span className="executive-mobile-label">Status</span>
                  <span className={`status-badge ${executive.status === 'Active' ? 'green' : 'amber'}`}>{executive.status}</span>
                </div>
                <div className="executive-mobile-row">
                  <span className="executive-mobile-label">Created</span>
                  <span>{formatDate(executive.createdAt)}</span>
                </div>
                <div className="executive-mobile-actions">
                  <button className="executive-action-btn" onClick={() => handleEdit(executive)}>
                    <Pencil size={13} />
                    <span>Edit</span>
                  </button>
                  <button className="executive-action-btn delete" onClick={() => setConfirmDeleteId(executive.id)}>
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Executive Name</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{renderTableContent()}</tbody>
            </table>
          </div>
        )}
        <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filteredExecutives.length} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(totalPages, current + 1))} />
      </section>

      {confirmDeleteId ? (
        <div className="overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div className="panel-card" style={{ maxWidth: 360, width: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Delete executive</h3>
            <p>Are you sure you want to delete this executive?</p>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
              <Button type="button" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ExecutiveMaster
