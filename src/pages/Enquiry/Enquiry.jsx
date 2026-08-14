import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, Eye, Flame, Pencil, Search, Snowflake, UserCheck, XCircle } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import DetailsModal from '../../components/common/DetailsModal'
import StatCard from '../../components/common/StatCard'
import { useAuth } from '../../context/AuthContext'
import { DEFAULT_ENQUIRY_PRODUCTS, ENQUIRY_DISPOSITIONS, ENQUIRY_LEAD_SOURCES, ENQUIRY_PRIORITIES } from '../../data/enquiryOptions'
import { fetchCustomers, selectActiveCustomers } from '../../features/customers/customerSlice'
import { addEnquiry, clearEnquiryMessage, editEnquiry, fetchEnquiries, selectEnquiryState } from '../../features/enquiries/enquirySlice'
import { fetchExecutives, selectActiveExecutives } from '../../features/executives/executiveSlice'
import { fetchProducts, selectActiveProducts } from '../../features/products/productSlice'
import { enquiryService } from '../../services/enquiryService'
import { formatDate } from '../../utils/dateUtils'
import { emptyReportValue } from '../../utils/reportUtils'

const dateValue = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const initialForm = (user) => ({ enquiryDate: dateValue(), companyName: '', contactNumber: '', leadGeneratedBy: '', priority: '', nextFollowUp: '', remarks: '', customerId: '', customerName: '', receivedExecutiveId: '', receivedExecutiveName: '', productId: '', productName: '', callDisposition: '', assignedExecutiveId: '', assignedExecutiveName: '', followUpLeadId: user?.uid || '', followUpLeadName: user?.displayName || user?.email || '' })
const rangeValues = () => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1); const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1); const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0)
  return { today: [dateValue(today), dateValue(today)], tomorrow: [dateValue(tomorrow), dateValue(tomorrow)], week: [dateValue(weekStart), dateValue(weekEnd)], month: [dateValue(monthStart), dateValue(monthEnd)], nextMonth: [dateValue(nextMonthStart), dateValue(nextMonthEnd)] }
}

const Enquiry = () => {
  const dispatch = useDispatch(); const navigate = useNavigate(); const location = useLocation(); const { user } = useAuth()
  const customers = useSelector(selectActiveCustomers); const executives = useSelector(selectActiveExecutives); const products = useSelector(selectActiveProducts)
  const { items, loading, error, successMessage } = useSelector(selectEnquiryState)
  const routeEditId = location.state?.editEnquiryId || ''
  const [editingId, setEditingId] = useState(routeEditId)
  const [form, setForm] = useState(() => initialForm(user)); const [validation, setValidation] = useState({})
  const [searchText, setSearchText] = useState(''); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const [viewEnquiry, setViewEnquiry] = useState(null)

  useEffect(() => { dispatch(fetchCustomers()); dispatch(fetchExecutives()); dispatch(fetchProducts()); dispatch(fetchEnquiries()) }, [dispatch])
  useEffect(() => { if (!routeEditId) return; let active = true; enquiryService.getEnquiryById(routeEditId).then((record) => { if (active && record) setForm({ ...initialForm(user), ...record }) }); return () => { active = false } }, [routeEditId, user])
  useEffect(() => { if (!successMessage && !error) return undefined; const timer = window.setTimeout(() => dispatch(clearEnquiryMessage()), 3000); return () => window.clearTimeout(timer) }, [successMessage, error, dispatch])

  const productOptions = useMemo(() => {
    const map = new Map(DEFAULT_ENQUIRY_PRODUCTS.map((name) => [name.toLowerCase(), { id: '', itemName: name }]))
    products.forEach((product) => map.set(product.itemName.toLowerCase(), product))
    return [...map.values()].sort((a, b) => a.itemName.localeCompare(b.itemName))
  }, [products])
  const filtered = useMemo(() => { const search = searchText.trim().toLowerCase(); return items.filter((item) => !search || [item.companyName, item.customerName, item.contactNumber, item.followUpLeadName, item.assignedExecutiveName].some((value) => String(value || '').toLowerCase().includes(search))) }, [items, searchText])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const ranges = useMemo(() => rangeValues(), [])
  const personal = items.filter((item) => item.followUpLeadId === user?.uid)
  const inRange = (item, range) => Boolean(item.nextFollowUp) && item.nextFollowUp >= range[0] && item.nextFollowUp <= range[1]
  const cards = [
    ['Today Followup', ranges.today, CalendarClock, 'accent-blue'], ['Tomorrow Followup', ranges.tomorrow, UserCheck, 'accent-indigo'], ['This Week Followup', ranges.week, Flame, 'accent-amber'], ['This Month Followup', ranges.month, CalendarClock, 'accent-green'], ['Next Month Followup', ranges.nextMonth, Snowflake, 'accent-purple'],
  ].map(([title, range, icon, accent]) => ({ title, value: personal.filter((item) => inRange(item, range)).length, range, icon, accent }))
  const overallCards = [
    { title: 'Overall Today Followup', value: items.filter((item) => inRange(item, ranges.today)).length, icon: CalendarClock, accent: 'accent-blue', range: ranges.today },
    { title: 'Overall Dropped', value: items.filter((item) => item.callDisposition === 'DROPPED').length, icon: XCircle, accent: 'accent-red', disposition: 'DROPPED' },
    { title: 'Overall Completed', value: items.filter((item) => item.callDisposition === 'COMPLETED').length, icon: CheckCircle2, accent: 'accent-green', disposition: 'COMPLETED' },
  ]
  const setField = (field, value) => { setForm((current) => ({ ...current, [field]: value, ...(field === 'priority' && value === 'COLD' ? { nextFollowUp: '' } : {}) })); setValidation((current) => ({ ...current, [field]: '', ...(field === 'priority' ? { nextFollowUp: '' } : {}) })) }
  const selectReference = (field, idField, nameField, id, name) => setForm((current) => ({ ...current, [idField]: id, [nameField]: name, [field]: name }))
  const reset = () => { setEditingId(''); setForm(initialForm(user)); setValidation({}) }
  const save = async () => {
    const next = {}
    if (!form.companyName.trim()) next.companyName = 'Company Name is required.'
    if (!/^\d{10}$/.test(form.contactNumber)) next.contactNumber = 'Enter a valid 10-digit Contact Number.'
    if (!form.leadGeneratedBy) next.leadGeneratedBy = 'Lead Generated By is required.'
    if (!form.priority) next.priority = 'Priority is required.'
    if (form.priority && form.priority !== 'COLD' && !form.nextFollowUp) next.nextFollowUp = 'Next Follow Up is required.'
    setValidation(next); if (Object.keys(next).length) return
    if (editingId) {
      const saved = await dispatch(editEnquiry({ id: editingId, data: form })).unwrap()
      if (routeEditId && location.state?.returnTo) { navigate(location.state.returnTo, { state: { ...(location.state.reportRange || {}), message: `Enquiry ${saved.companyName} updated successfully.` } }); return }
    } else await dispatch(addEnquiry(form)).unwrap()
    reset(); await dispatch(fetchEnquiries())
  }
  const edit = (record) => { setEditingId(record.id); setForm({ ...initialForm(user), ...record }); setValidation({}); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const reportNavigation = (range, personalOnly = false, disposition = '') => navigate('/reports/enquiry-report', { state: { fromDate: range?.[0] || '', toDate: range?.[1] || '', followUpLeadId: personalOnly ? user?.uid : '', disposition } })

  return <div className="page-stack"><PageHeader title="Enquiry" subtitle="Create and manage sales enquiries and follow-ups." />
    <section className="panel-card form-card"><div className="panel-heading"><h2>{editingId ? 'Edit Enquiry' : 'Enquiry Details'}</h2><span>Lead and follow-up information</span></div><div className="form-grid two-col" style={{ gap: 18 }}>
      <label className="field"><span>Company Name *</span><input value={form.companyName} onChange={(event) => setField('companyName', event.target.value)} />{validation.companyName && <div className="field-message">{validation.companyName}</div>}</label>
      <label className="field"><span>Customer Name</span><select value={form.customerId} onChange={(event) => { const item = customers.find((value) => value.id === event.target.value); selectReference('customerName', 'customerId', 'customerName', item?.id || '', item?.customerName || '') }}><option value="">Select customer</option>{customers.map((item) => <option value={item.id} key={item.id}>{item.customerName}</option>)}</select></label>
      <label className="field"><span>Contact Number *</span><input inputMode="numeric" maxLength="10" value={form.contactNumber} onChange={(event) => setField('contactNumber', event.target.value.replace(/\D/g, '').slice(0, 10))} />{validation.contactNumber && <div className="field-message">{validation.contactNumber}</div>}</label>
      <label className="field"><span>Call Received By</span><select value={form.receivedExecutiveId} onChange={(event) => { const item = executives.find((value) => value.id === event.target.value); selectReference('receivedExecutiveName', 'receivedExecutiveId', 'receivedExecutiveName', item?.id || '', item?.name || '') }}><option value="">Select executive</option>{executives.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label className="field"><span>Lead Generated By *</span><select value={form.leadGeneratedBy} onChange={(event) => setField('leadGeneratedBy', event.target.value)}><option value="">Select source</option>{ENQUIRY_LEAD_SOURCES.map((value) => <option key={value}>{value}</option>)}</select>{validation.leadGeneratedBy && <div className="field-message">{validation.leadGeneratedBy}</div>}</label>
      <label className="field"><span>Product</span><select value={form.productName} onChange={(event) => { const item = productOptions.find((value) => value.itemName === event.target.value); selectReference('productName', 'productId', 'productName', item?.id || '', item?.itemName || '') }}><option value="">Select product</option>{productOptions.map((item) => <option value={item.itemName} key={`${item.id}-${item.itemName}`}>{item.itemName}</option>)}</select></label>
      <label className="field"><span>Priority *</span><select value={form.priority} onChange={(event) => setField('priority', event.target.value)}><option value="">Select priority</option>{ENQUIRY_PRIORITIES.map((value) => <option key={value}>{value}</option>)}</select>{validation.priority && <div className="field-message">{validation.priority}</div>}</label>
      <label className="field"><span>Call Disposition</span><select value={form.callDisposition} onChange={(event) => setField('callDisposition', event.target.value)}><option value="">Select disposition</option>{ENQUIRY_DISPOSITIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
      {form.priority !== 'COLD' && <label className="field"><span>Next Follow Up{form.priority ? ' *' : ''}</span><input type="date" value={form.nextFollowUp} onChange={(event) => setField('nextFollowUp', event.target.value)} />{validation.nextFollowUp && <div className="field-message">{validation.nextFollowUp}</div>}</label>}
      <label className="field"><span>Call Assigned To</span><select value={form.assignedExecutiveId} onChange={(event) => { const item = executives.find((value) => value.id === event.target.value); selectReference('assignedExecutiveName', 'assignedExecutiveId', 'assignedExecutiveName', item?.id || '', item?.name || '') }}><option value="">Select executive</option>{executives.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label className="field"><span>Remarks</span><textarea value={form.remarks} onChange={(event) => setField('remarks', event.target.value)} /></label>
      <label className="field"><span>Follow Up Lead</span><input value={form.followUpLeadName} readOnly disabled /></label>
    </div>{(error || successMessage) && <div className={successMessage ? 'auth-success' : 'auth-error'} style={{ marginTop: 12 }}>{error || successMessage}</div>}<div className="form-actions voucher-save-actions"><Button type="button" onClick={save} disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update' : 'Save'}</Button><Button type="button" variant="secondary" onClick={() => routeEditId && location.state?.returnTo ? navigate(location.state.returnTo, { state: location.state.reportRange || null }) : reset()}>Cancel</Button></div></section>
    <section className="stats-grid enquiry-stats">{cards.map((card) => <StatCard key={card.title} {...card} onClick={() => reportNavigation(card.range, true)} />)}{overallCards.map((card) => <StatCard key={card.title} {...card} onClick={() => reportNavigation(card.range, false, card.disposition)} />)}</section>
    <section className="panel-card"><div className="panel-heading"><h2>Saved Enquiries</h2><span>Enquiry history</span></div><div className="toolbar" style={{ marginBottom: 12 }}><div className="search-box" style={{ width: '100%' }}><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search company, customer, contact, lead or assignee..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div><div className="table-wrap"><table><thead><tr><th>S.No</th><th>Company Name</th><th>Customer Name</th><th>Contact Number</th><th>Next Follow Up</th><th>Call Disposition</th><th>Priority</th><th>Follow Up Lead</th><th>Actions</th></tr></thead><tbody>{!paged.length && <tr><td colSpan="9" className="text-center">No enquiries found.</td></tr>}{paged.map((record, index) => <tr key={record.id}><td>{(page - 1) * pageSize + index + 1}</td><td>{emptyReportValue(record.companyName)}</td><td>{emptyReportValue(record.customerName)}</td><td>{emptyReportValue(record.contactNumber)}</td><td>{formatDate(record.nextFollowUp)}</td><td>{emptyReportValue(record.callDisposition)}</td><td>{emptyReportValue(record.priority)}</td><td>{emptyReportValue(record.followUpLeadName)}</td><td><div className="table-actions"><button type="button" className="executive-action-btn" onClick={() => setViewEnquiry(record)}><Eye size={13} /> View</button><button type="button" className="executive-action-btn" onClick={() => edit(record)}><Pencil size={13} /> Edit</button></div></td></tr>)}</tbody></table></div><CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filtered.length} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} /></section>
    <DetailsModal isOpen={Boolean(viewEnquiry)} title="Enquiry Details" onClose={() => setViewEnquiry(null)}>{viewEnquiry && <div className="details-grid">{[['Company', viewEnquiry.companyName], ['Customer', viewEnquiry.customerName], ['Contact', viewEnquiry.contactNumber], ['Priority', viewEnquiry.priority], ['Next Follow Up', formatDate(viewEnquiry.nextFollowUp)], ['Disposition', viewEnquiry.callDisposition], ['Follow Up Lead', viewEnquiry.followUpLeadName], ['Remarks', viewEnquiry.remarks]].map(([label, value]) => <div className="detail-field" key={label}><span>{label}</span><strong>{emptyReportValue(value)}</strong></div>)}</div>}</DetailsModal>
  </div>
}
export default Enquiry
