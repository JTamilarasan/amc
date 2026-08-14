import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, Pencil, Search, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import DetailsModal from '../../components/common/DetailsModal'
import Loader from '../../components/common/Loader'
import { fetchCustomers, selectActiveCustomers } from '../../features/customers/customerSlice'
import { fetchExecutives, selectActiveExecutives } from '../../features/executives/executiveSlice'
import { callReceiptVoucherService } from '../../services/callReceiptVoucherService'
import { formatDate } from '../../utils/dateUtils'
import { emptyReportValue } from '../../utils/reportUtils'

const todayValue = () => new Date().toLocaleDateString('en-CA')
const initialForm = () => ({ date: todayValue(), partyId: '', partyName: '', customerExpiryDate: null, executiveId: '', executiveName: '', category: '', category2: '', callReceiptRemarks: '', callStatus: '', callSubStatus: '', nextAction: '', when: '' })
const currentYear = () => new Date().getFullYear()

const CallReceiptVoucher = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const editVoucherId = location.state?.editVoucherId || ''
  const [historyEditId, setHistoryEditId] = useState('')
  const activeEditId = historyEditId || editVoucherId
  const isEditing = Boolean(activeEditId)
  const customers = useSelector(selectActiveCustomers)
  const executives = useSelector(selectActiveExecutives)
  const [voucherNumber, setVoucherNumber] = useState('')
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [customerOpen, setCustomerOpen] = useState(false)
  const [executiveOpen, setExecutiveOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loadingVoucher, setLoadingVoucher] = useState(isEditing)
  const [vouchers, setVouchers] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewVoucher, setViewVoucher] = useState(null)
  const [deleteVoucher, setDeleteVoucher] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720)

  const loadHistory = async () => {
    setLoadingHistory(true)
    try { setVouchers(await callReceiptVoucherService.getCallReceiptVouchers()) }
    catch { setErrors((current) => ({ ...current, history: 'Unable to load saved call receipt vouchers.' })) }
    finally { setLoadingHistory(false) }
  }

  const loadNextNumber = async () => {
    try { setVoucherNumber(await callReceiptVoucherService.getNextCallReceiptVoucherNumber()) }
    catch { setErrors({ voucherNumber: 'Unable to load the next voucher number.' }) }
  }
  useEffect(() => {
    let active = true
    dispatch(fetchCustomers()); dispatch(fetchExecutives())
    if (editVoucherId) {
      callReceiptVoucherService.getCallReceiptVoucherById(editVoucherId)
        .then((voucher) => {
          if (!active) return
          if (!voucher) { setErrors({ form: 'Call receipt voucher not found.' }); return }
          setVoucherNumber(voucher.voucherNumber || '')
          setForm({
            date: voucher.date || todayValue(), partyId: voucher.partyId || '', partyName: voucher.partyName || '', customerExpiryDate: voucher.customerExpiryDate || null,
            executiveId: voucher.executiveId || '', executiveName: voucher.executiveName || '', category: voucher.category || '', category2: voucher.category2 || '',
            callReceiptRemarks: voucher.callReceiptRemarks || '', callStatus: voucher.callStatus || '', callSubStatus: voucher.callSubStatus || '', nextAction: voucher.nextAction || '', when: voucher.when || '',
          })
        })
        .catch(() => { if (active) setErrors({ form: 'Unable to load the call receipt voucher.' }) })
        .finally(() => { if (active) setLoadingVoucher(false) })
    } else {
      callReceiptVoucherService.getNextCallReceiptVoucherNumber()
        .then((number) => { if (active) setVoucherNumber(number) })
        .catch(() => { if (active) setErrors({ voucherNumber: 'Unable to load the next voucher number.' }) })
    }
    return () => { active = false }
  }, [dispatch, editVoucherId])
  useEffect(() => { loadHistory() }, [])
  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 720)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const filteredVouchers = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    return vouchers.filter((voucher) => !search || [voucher.voucherNumber, voucher.partyName, voucher.executiveName, voucher.category, voucher.category2, voucher.callStatus].some((value) => String(value || '').toLowerCase().includes(search)))
  }, [vouchers, searchText])
  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / pageSize))
  const pagedVouchers = filteredVouchers.slice((page - 1) * pageSize, page * pageSize)
  const filteredCustomers = useMemo(() => customers.filter((item) => !form.partyName || item.customerName.toLowerCase().includes(form.partyName.toLowerCase())), [customers, form.partyName])
  const filteredExecutives = useMemo(() => executives.filter((item) => !form.executiveName || item.name.toLowerCase().includes(form.executiveName.toLowerCase())), [executives, form.executiveName])
  const setField = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: '' })); setMessage('') }
  const validate = () => {
    const next = {}
    if (!form.partyId) next.partyId = 'Select a valid party from Customer Master.'
    if (!form.executiveId) next.executiveId = 'Select a valid executive.'
    if (!form.category) next.category = 'Category is required.'
    if (!form.category2) next.category2 = 'Category 2 is required.'
    if (!form.callStatus) next.callStatus = 'Call status is required.'
    if (!form.callSubStatus) next.callSubStatus = 'Call sub status is required.'
    if (form.callStatus === 'Open' && !form.nextAction) next.nextAction = 'Next action is required.'
    if (form.callStatus === 'Open' && form.nextAction && !form.when) next.when = 'Action date is required.'
    setErrors(next)
    return !Object.keys(next).length
  }
  const returnToReport = () => navigate(location.state?.returnTo || '/reports/customer-calls-history', { state: location.state?.reportRange || null })
  const reset = async () => {
    if (editVoucherId) { returnToReport(); return }
    setHistoryEditId('')
    setForm(initialForm()); setErrors({}); setMessage(''); await loadNextNumber()
  }
  const save = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (isEditing) {
        const saved = await callReceiptVoucherService.updateCallReceiptVoucher(activeEditId, form)
        if (editVoucherId) {
          navigate(location.state?.returnTo || '/reports/customer-calls-history', { state: { ...(location.state?.reportRange || {}), message: `Call receipt voucher ${saved.voucherNumber} updated successfully.` } })
        } else {
          setHistoryEditId(''); setForm(initialForm()); setErrors({}); setPage(1); await loadNextNumber(); setMessage(`Call receipt voucher ${saved.voucherNumber} updated successfully.`); await loadHistory()
        }
      } else {
        const saved = await callReceiptVoucherService.createCallReceiptVoucher(form)
        await reset(); setPage(1); setMessage(`Call receipt voucher ${saved.voucherNumber} saved successfully.`); await loadHistory()
      }
    } catch (error) { setErrors({ form: error.message || 'Unable to save the call receipt voucher.' }) }
    finally { setSaving(false) }
  }
  const changeStatus = (value) => {
    setForm((current) => ({ ...current, callStatus: value, ...(value === 'Closed' ? { nextAction: '', when: '' } : {}) }))
    setErrors((current) => ({ ...current, callStatus: '', ...(value === 'Closed' ? { nextAction: '', when: '' } : {}) }))
    setMessage('')
  }
  const changeCustomer = (value) => { const match = customers.find((item) => item.customerName.toLowerCase() === value.trim().toLowerCase()); setForm((current) => ({ ...current, partyName: value, partyId: match?.id || '' })); setErrors((current) => ({ ...current, partyId: '' })) }
  const changeExecutive = (value) => { const match = executives.find((item) => item.name.toLowerCase() === value.trim().toLowerCase()); setForm((current) => ({ ...current, executiveName: value, executiveId: match?.id || '' })); setErrors((current) => ({ ...current, executiveId: '' })) }
  const editFromHistory = (voucher) => {
    setHistoryEditId(voucher.id); setVoucherNumber(voucher.voucherNumber || '')
    setForm({
      date: voucher.date || todayValue(), partyId: voucher.partyId || '', partyName: voucher.partyName || '', customerExpiryDate: voucher.customerExpiryDate || null,
      executiveId: voucher.executiveId || '', executiveName: voucher.executiveName || '', category: voucher.category || '', category2: voucher.category2 || '',
      callReceiptRemarks: voucher.callReceiptRemarks || '', callStatus: voucher.callStatus || '', callSubStatus: voucher.callSubStatus || '', nextAction: voucher.nextAction || '', when: voucher.when || '',
    })
    setErrors({}); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const confirmDelete = async () => {
    if (!deleteVoucher) return
    setDeleting(true)
    try {
      await callReceiptVoucherService.deleteCallReceiptVoucher(deleteVoucher.id)
      if (historyEditId === deleteVoucher.id) { setHistoryEditId(''); setForm(initialForm()); await loadNextNumber() }
      setDeleteVoucher(null); setPage(1); setMessage('Call receipt voucher deleted successfully.'); await loadHistory()
    } catch (error) { setErrors((current) => ({ ...current, history: error.message || 'Unable to delete the call receipt voucher.' })) }
    finally { setDeleting(false) }
  }

  return <div className="page-stack">
    <PageHeader title="Call Receipt Voucher" subtitle="Record customer support and installation calls." />
    <section className="panel-card form-card">
      <div className="form-grid two-col" style={{ gap: 18 }}>
        <label className="field"><span>Voucher Number</span><input value={isEditing ? voucherNumber : voucherNumber ? `${voucherNumber}/${currentYear()}` : ''} readOnly disabled />{errors.voucherNumber && <div className="field-message">{errors.voucherNumber}</div>}</label>
        <label className="field"><span>Date</span><input type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} /></label>
        <label className="field"><span>Party Name *</span><div className="searchable-select"><input value={form.partyName} onChange={(event) => { changeCustomer(event.target.value); setCustomerOpen(true) }} onFocus={() => setCustomerOpen(true)} onBlur={() => window.setTimeout(() => setCustomerOpen(false), 150)} placeholder="Search and select customer" autoComplete="off" />{customerOpen && <div className="searchable-options">{filteredCustomers.length ? filteredCustomers.map((customer) => <button type="button" key={customer.id} onMouseDown={async () => { setForm((current) => ({ ...current, partyId: customer.id, partyName: customer.customerName, customerExpiryDate: null })); setErrors((current) => ({ ...current, partyId: '' })); setCustomerOpen(false); const expiry = await callReceiptVoucherService.getCustomerExpiryDate(customer.id); setForm((current) => current.partyId === customer.id ? { ...current, customerExpiryDate: expiry } : current) }}>{customer.customerName}</button>) : <div className="searchable-empty">No matching customers</div>}</div>}</div>{errors.partyId && <div className="field-message">{errors.partyId}</div>}</label>
        <label className="field"><span>Executive *</span><div className="searchable-select"><input value={form.executiveName} onChange={(event) => { changeExecutive(event.target.value); setExecutiveOpen(true) }} onFocus={() => setExecutiveOpen(true)} onBlur={() => window.setTimeout(() => setExecutiveOpen(false), 150)} placeholder="Search and select executive" autoComplete="off" />{executiveOpen && <div className="searchable-options">{filteredExecutives.length ? filteredExecutives.map((executive) => <button type="button" key={executive.id} onMouseDown={() => { setForm((current) => ({ ...current, executiveId: executive.id, executiveName: executive.name })); setErrors((current) => ({ ...current, executiveId: '' })); setExecutiveOpen(false) }}>{executive.name}</button>) : <div className="searchable-empty">No matching executives</div>}</div>}</div>{errors.executiveId && <div className="field-message">{errors.executiveId}</div>}</label>
        <label className="field"><span>Category *</span><select value={form.category} onChange={(event) => setField('category', event.target.value)}><option value="">Select category</option><option>Support</option><option>Installation</option><option>Monthly Backup</option></select>{errors.category && <div className="field-message">{errors.category}</div>}</label>
        <label className="field"><span>Category 2 *</span><select value={form.category2} onChange={(event) => setField('category2', event.target.value)}><option value="">Select category 2</option><option>Call</option><option>Visit</option></select>{errors.category2 && <div className="field-message">{errors.category2}</div>}</label>
        <label className="field"><span>Call Status *</span><select value={form.callStatus} onChange={(event) => changeStatus(event.target.value)}><option value="">Select status</option><option>Open</option><option>Closed</option></select>{errors.callStatus && <div className="field-message">{errors.callStatus}</div>}</label>
        <label className="field"><span>Call Sub Status *</span><select value={form.callSubStatus} onChange={(event) => setField('callSubStatus', event.target.value)}><option value="">Select sub status</option><option>Successful</option><option>Unsuccessful</option><option>Cancelled</option></select>{errors.callSubStatus && <div className="field-message">{errors.callSubStatus}</div>}</label>
        {form.callStatus === 'Open' && <label className="field"><span>Next Action *</span><select value={form.nextAction} onChange={(event) => setField('nextAction', event.target.value)}><option value="">Select next action</option><option>Call</option><option>Visit</option></select>{errors.nextAction && <div className="field-message">{errors.nextAction}</div>}</label>}
        {form.callStatus === 'Open' && <label className="field"><span>When *</span><input type="date" value={form.when} onChange={(event) => setField('when', event.target.value)} />{errors.when && <div className="field-message">{errors.when}</div>}</label>}
      </div>
      <label className="field" style={{ marginTop: 18 }}><span>Call Receipt Remarks</span><textarea value={form.callReceiptRemarks} onChange={(event) => setField('callReceiptRemarks', event.target.value)} placeholder="Enter call receipt remarks..." /></label>
      {errors.form && <div className="field-message" style={{ marginTop: 12 }}>{errors.form}</div>}{message && <div className="auth-success" style={{ marginTop: 12 }}>{message}</div>}
      <div className="form-actions voucher-save-actions"><Button type="button" onClick={save} disabled={saving || loadingVoucher}>{saving ? (isEditing ? 'Updating...' : 'Saving...') : isEditing ? 'Update Voucher' : 'Save'}</Button><Button type="button" variant="secondary" onClick={reset} disabled={saving}>{isEditing ? 'Back' : 'Cancel'}</Button></div>
    </section>

    <section className="panel-card" style={{ marginTop: 18 }}>
      <div className="panel-heading"><h2>Call Receipt Voucher History</h2><span>Saved voucher history</span></div>
      <div className="toolbar" style={{ marginBottom: 12 }}><div className="search-box" style={{ width: '100%' }}><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search by voucher number or customer..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
      {errors.history && <div className="field-message" style={{ marginBottom: 12 }}>{errors.history}</div>}
      {loadingHistory && !vouchers.length ? <Loader size="small" label="Loading call receipt vouchers..." /> : isMobile ? <div className="customer-mobile-list">{pagedVouchers.map((voucher) => <div className="customer-mobile-card" key={voucher.id}>
        <div className="customer-mobile-row"><span className="customer-mobile-label">Voucher</span><span>#{emptyReportValue(voucher.voucherNumber)}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Date</span><span>{formatDate(voucher.date)}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Party</span><span>{emptyReportValue(voucher.partyName)}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Executive</span><span>{emptyReportValue(voucher.executiveName)}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Category</span><span>{emptyReportValue(voucher.category)}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Category 2</span><span>{emptyReportValue(voucher.category2)}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Call Status</span><span>{emptyReportValue(voucher.callStatus)}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Call Sub Status</span><span>{emptyReportValue(voucher.callSubStatus)}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Created</span><span>{formatDate(voucher.createdAt)}</span></div>
        <div className="customer-mobile-actions"><button className="executive-action-btn" onClick={() => setViewVoucher(voucher)}><Eye size={13} /> View</button><button className="executive-action-btn" onClick={() => editFromHistory(voucher)}><Pencil size={13} /> Edit</button><button className="executive-action-btn delete" onClick={() => setDeleteVoucher(voucher)}><Trash2 size={13} /> Delete</button></div>
      </div>)}</div> : <div className="table-wrap"><table><thead><tr><th>S.No</th><th>Voucher No</th><th>Date</th><th>Party Name</th><th>Executive</th><th>Category</th><th>Category 2</th><th>Call Status</th><th>Call Sub Status</th><th>Created Date</th><th>Actions</th></tr></thead><tbody>
        {!loadingHistory && !filteredVouchers.length && <tr><td colSpan="11" className="text-center">{searchText ? 'No matching vouchers found.' : 'No vouchers found.'}</td></tr>}
        {pagedVouchers.map((voucher, index) => <tr key={voucher.id}><td>{(page - 1) * pageSize + index + 1}</td><td>#{emptyReportValue(voucher.voucherNumber)}</td><td>{formatDate(voucher.date)}</td><td>{emptyReportValue(voucher.partyName)}</td><td>{emptyReportValue(voucher.executiveName)}</td><td>{emptyReportValue(voucher.category)}</td><td>{emptyReportValue(voucher.category2)}</td><td>{emptyReportValue(voucher.callStatus)}</td><td>{emptyReportValue(voucher.callSubStatus)}</td><td>{formatDate(voucher.createdAt)}</td><td><div className="table-actions"><button className="executive-action-btn" onClick={() => setViewVoucher(voucher)}><Eye size={13} /> View</button><button className="executive-action-btn" onClick={() => editFromHistory(voucher)}><Pencil size={13} /> Edit</button><button className="executive-action-btn delete" onClick={() => setDeleteVoucher(voucher)}><Trash2 size={13} /> Delete</button></div></td></tr>)}
      </tbody></table></div>}
      <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filteredVouchers.length} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(totalPages, current + 1))} className="history-pagination" />
    </section>

    <DetailsModal isOpen={Boolean(viewVoucher)} title="Call Receipt Voucher Details" onClose={() => setViewVoucher(null)} size="medium">
      {viewVoucher && <><div className="voucher-modal-number">Voucher #{emptyReportValue(viewVoucher.voucherNumber)}</div><div className="details-grid">
        <div className="detail-field"><span>Date</span><strong>{formatDate(viewVoucher.date)}</strong></div><div className="detail-field"><span>Party Name</span><strong>{emptyReportValue(viewVoucher.partyName)}</strong></div><div className="detail-field"><span>Executive</span><strong>{emptyReportValue(viewVoucher.executiveName)}</strong></div><div className="detail-field"><span>Category</span><strong>{emptyReportValue(viewVoucher.category)}</strong></div><div className="detail-field"><span>Category 2</span><strong>{emptyReportValue(viewVoucher.category2)}</strong></div><div className="detail-field"><span>Call Status</span><strong>{emptyReportValue(viewVoucher.callStatus)}</strong></div><div className="detail-field"><span>Call Sub Status</span><strong>{emptyReportValue(viewVoucher.callSubStatus)}</strong></div><div className="detail-field"><span>Next Action</span><strong>{viewVoucher.callStatus === 'Open' ? emptyReportValue(viewVoucher.nextAction) : '-'}</strong></div><div className="detail-field"><span>When</span><strong>{viewVoucher.callStatus === 'Open' ? formatDate(viewVoucher.when) : '-'}</strong></div><div className="detail-field"><span>Remarks</span><strong>{emptyReportValue(viewVoucher.callReceiptRemarks)}</strong></div>
      </div></>}
    </DetailsModal>

    {deleteVoucher && <div className="overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'grid', placeItems: 'center', zIndex: 110 }}><div className="panel-card" style={{ maxWidth: 380, width: '90%' }}><h3 style={{ marginTop: 0 }}>Delete call receipt voucher</h3><p>Are you sure you want to delete voucher #{deleteVoucher.voucherNumber}?</p><div className="form-actions"><Button type="button" variant="secondary" onClick={() => setDeleteVoucher(null)} disabled={deleting}>Cancel</Button><Button type="button" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button></div></div></div>}
  </div>
}

export default CallReceiptVoucher
