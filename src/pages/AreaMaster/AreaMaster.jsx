import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { clearAreaMessage, createArea, editArea, fetchAreas, removeArea, selectAreaState } from '../../features/areas/areaSlice'

const AreaMaster = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { items, loading, error, successMessage } = useSelector(selectAreaState)
  const [areaName, setAreaName] = useState(() => location.state?.newAreaName || '')
  const [editingId, setEditingId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [fieldError, setFieldError] = useState('')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720)

  useEffect(() => { dispatch(fetchAreas()) }, [dispatch])
  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 720)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  useEffect(() => {
    if (!successMessage && !error) return undefined
    const timer = window.setTimeout(() => dispatch(clearAreaMessage()), 3000)
    return () => window.clearTimeout(timer)
  }, [successMessage, error, dispatch])

  const filtered = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return items.filter((item) => !query || item.areaName.toLowerCase().includes(query))
  }, [items, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const formatDate = (value) => value?.toDate ? value.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const reset = () => { setAreaName(''); setEditingId(null); setFieldError('') }
  const submit = async (event) => {
    event.preventDefault()
    if (!areaName.trim()) { setFieldError('Area name is required.'); return }
    try {
      if (editingId) {
        await dispatch(editArea({ id: editingId, areaName: areaName.trim() })).unwrap()
      } else {
        const savedArea = await dispatch(createArea(areaName.trim())).unwrap()
        if (location.state?.returnTo) {
          navigate(location.state.returnTo, {
            state: {
              createdAreaId: savedArea.id,
              createdAreaName: savedArea.areaName,
              customerForm: location.state.customerForm,
              customerEditingId: location.state.customerEditingId,
            },
          })
          return
        }
      }
      reset()
    } catch { /* Redux displays the service error. */ }
  }

  return <div className="page-stack">
    <PageHeader title="Area Master" subtitle="Create and maintain service areas." />
    <section className="panel-card form-card"><div className="panel-heading"><h2>{editingId ? 'Edit Area' : 'Add Area'}</h2></div>
      <form onSubmit={submit}><label className="field"><span>Area Name *</span><input value={areaName} onChange={(event) => { setAreaName(event.target.value); setFieldError('') }} placeholder="Enter area name" />{fieldError && <div className="field-message">{fieldError}</div>}</label>
        {(error || successMessage) && <div className={successMessage ? 'auth-success' : 'auth-error'} style={{ marginTop: 14 }}>{error || successMessage}</div>}
        <div className="form-actions master-form-actions"><Button type="submit" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update Area' : 'Save Area'}</Button><Button type="button" variant="secondary" onClick={reset}>Clear</Button></div>
      </form>
    </section>
    <section className="panel-card"><div className="panel-heading"><h2>Existing Areas</h2></div>
      <div className="toolbar" style={{ marginBottom: 12 }}><div className="search-box" style={{ width: '100%' }}><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search area..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
      {isMobile ? <div className="executive-mobile-list">{paged.map((area) => <div className="executive-mobile-card" key={area.id}><div className="executive-mobile-row"><span className="executive-mobile-label">Area</span><span>{area.areaName}</span></div><div className="executive-mobile-row"><span className="executive-mobile-label">Created</span><span>{formatDate(area.createdAt)}</span></div><div className="executive-mobile-actions"><button className="executive-action-btn" onClick={() => { setEditingId(area.id); setAreaName(area.areaName) }}><Pencil size={13} /> Edit</button><button className="executive-action-btn delete" onClick={() => { if (window.confirm('Delete this area?')) dispatch(removeArea(area.id)) }}><Trash2 size={13} /> Delete</button></div></div>)}</div> :
        <div className="table-wrap"><table><thead><tr><th>S.No</th><th>Area Name</th><th>Created Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{!loading && !filtered.length && <tr><td colSpan="5" className="text-center">No areas found.</td></tr>}{paged.map((area, index) => <tr key={area.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{area.areaName}</td><td>{formatDate(area.createdAt)}</td><td><span className="status-badge green">{area.status}</span></td><td><div className="table-actions"><button className="executive-action-btn" onClick={() => { setEditingId(area.id); setAreaName(area.areaName) }}><Pencil size={13} /> Edit</button><button className="executive-action-btn delete" onClick={() => { if (window.confirm('Delete this area?')) dispatch(removeArea(area.id)) }}><Trash2 size={13} /> Delete</button></div></td></tr>)}</tbody></table></div>}
      <div className="form-actions compact history-pagination" style={{ justifyContent: 'space-between', alignItems: 'center' }}><Button type="button" variant="ghost" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Previous</Button><span>Page {page} of {totalPages}</span><Button type="button" variant="ghost" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>Next</Button></div>
    </section>
  </div>
}

export default AreaMaster
