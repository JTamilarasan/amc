import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { DEFAULT_ENQUIRY_PRODUCTS, ENQUIRY_DISPOSITIONS_BY_PRIORITY, ENQUIRY_LEAD_SOURCES, ENQUIRY_PRIORITIES } from '../../data/enquiryOptions'

const leadSourceLabel = (value) => value.replaceAll('Reference', 'Ref')
import { fetchAreas, selectAreas } from '../../features/areas/areaSlice'
import { fetchCustomers, selectActiveCustomers } from '../../features/customers/customerSlice'
import { addEnquiry, clearEnquiryMessage, editEnquiry, fetchEnquiries, selectEnquiryState } from '../../features/enquiries/enquirySlice'
import { fetchExecutives, selectActiveExecutives } from '../../features/executives/executiveSlice'
import { fetchProducts, selectActiveProducts } from '../../features/products/productSlice'
import { enquiryService } from '../../services/enquiryService'

const dateValue = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const initialForm = (user) => ({ leadCreationDate: dateValue(), contactName: '', contactNumber: '', leadGeneratedBy: '', priority: '', nextFollowUp: '', closedOn: '', remarks: '', customerId: '', customerName: '', areaId: '', areaName: '', receivedExecutiveId: '', receivedExecutiveName: '', productId: '', productName: '', callDisposition: '', assignedExecutiveId: '', assignedExecutiveName: '', followUpLeadId: user?.uid || '', followUpLeadName: user?.displayName || user?.email || '' })

const Enquiry = () => {
  const dispatch = useDispatch(); const navigate = useNavigate(); const location = useLocation(); const { user, hasPermission } = useAuth()
  const canAdd = hasPermission('enquiries', 'add'); const canEdit = hasPermission('enquiries', 'edit'); const canAddCustomer = hasPermission('customers', 'add'); const canAddArea = hasPermission('areas', 'add')
  const customers = useSelector(selectActiveCustomers); const executives = useSelector(selectActiveExecutives); const products = useSelector(selectActiveProducts); const areas = useSelector(selectAreas)
  const { loading, error, successMessage } = useSelector(selectEnquiryState)
  const originalNavigation = location.state?.enquiryOriginalNavigation || location.state || {}
  const returnedForm = location.state?.enquiryReturnSource ? location.state.enquiryForm : null
  const routeEditId = location.state?.enquiryEditingId || originalNavigation.editEnquiryId || ''
  const [editingId, setEditingId] = useState(routeEditId)
  const [form, setForm] = useState(() => returnedForm ? { ...initialForm(user), ...returnedForm, ...(location.state.createdCustomerId ? { customerId: location.state.createdCustomerId, customerName: location.state.createdCustomerName || '', contactName: location.state.createdCustomerContactName || returnedForm.contactName || '', contactNumber: location.state.createdCustomerMobileNo || returnedForm.contactNumber || '', areaId: location.state.createdCustomerAreaId || returnedForm.areaId || '', areaName: location.state.createdCustomerAreaName || returnedForm.areaName || '' } : {}), ...(location.state.createdAreaId ? { areaId: location.state.createdAreaId, areaName: location.state.createdAreaName || '' } : {}) } : initialForm(user))
  const [validation, setValidation] = useState({}); const [customerOpen, setCustomerOpen] = useState(false); const [areaOpen, setAreaOpen] = useState(false)

  useEffect(() => { dispatch(fetchCustomers()); dispatch(fetchExecutives()); dispatch(fetchProducts()); dispatch(fetchAreas()); dispatch(fetchEnquiries()) }, [dispatch])
  useEffect(() => { if (!routeEditId) return; let active = true; enquiryService.getEnquiryById(routeEditId).then((record) => { if (active && record) setForm({ ...initialForm(user), ...record, contactName: record.contactName ?? record.companyName ?? '' }) }); return () => { active = false } }, [routeEditId, user])
  useEffect(() => { if (!successMessage && !error) return undefined; const timer = window.setTimeout(() => dispatch(clearEnquiryMessage()), 3000); return () => window.clearTimeout(timer) }, [successMessage, error, dispatch])

  const productOptions = useMemo(() => { const map = new Map(DEFAULT_ENQUIRY_PRODUCTS.map((name) => [name.toLowerCase(), { id: '', itemName: name }])); products.forEach((product) => map.set(product.itemName.toLowerCase(), product)); return [...map.values()].sort((a, b) => a.itemName.localeCompare(b.itemName)) }, [products])
  const filteredAreas = useMemo(() => { const query = form.areaName.trim().toLowerCase(); return areas.filter((area) => !query || area.areaName.toLowerCase().includes(query)) }, [areas, form.areaName])
  const filteredCustomers = useMemo(() => { const query = form.customerName.trim().toLowerCase(); return customers.filter((customer) => !query || customer.customerName.toLowerCase().includes(query)) }, [customers, form.customerName])
  const dispositions = ENQUIRY_DISPOSITIONS_BY_PRIORITY[form.priority] || []
  const requiresFollowUp = ['HOT', 'WARM'].includes(form.priority) && form.callDisposition === 'FOLLOWUP'
  const setField = (field, value) => { setForm((current) => { const next = { ...current, [field]: value }; if (field === 'priority') { next.callDisposition = ''; next.nextFollowUp = ''; next.closedOn = '' } if (field === 'callDisposition') { if (value !== 'FOLLOWUP') next.nextFollowUp = ''; next.closedOn = value === 'COMPLETED' ? (current.closedOn || dateValue()) : '' } return next }); setValidation((current) => ({ ...current, [field]: '', ...(field === 'priority' || field === 'callDisposition' ? { callDisposition: '', nextFollowUp: '', closedOn: '' } : {}) })) }
  const selectCustomer = (customer) => {
    setForm((current) => ({ ...current, customerId: customer?.id || '', customerName: customer?.customerName || '', contactName: customer?.contactName || '', contactNumber: customer?.mobileNo || '', areaId: customer?.areaId || '', areaName: customer?.areaName || '' }))
    setValidation((current) => ({ ...current, contactNumber: '' }))
    setCustomerOpen(false)
  }
  const selectReference = (idField, nameField, item, displayField) => setForm((current) => ({ ...current, [idField]: item?.id || '', [nameField]: item?.[displayField] || '' }))
  const reset = () => { setEditingId(''); setForm(initialForm(user)); setValidation({}) }
  const save = async () => {
    const payload = { ...form, followUpLeadId: form.assignedExecutiveId || form.followUpLeadId || user?.uid || '', followUpLeadName: form.assignedExecutiveName || form.followUpLeadName || user?.displayName || user?.email || '' }
    const next = {}
    if (!form.leadCreationDate) next.leadCreationDate = 'Lead Creation Date is required.'
    if (!/^\d{10}$/.test(form.contactNumber)) next.contactNumber = 'Enter a valid 10-digit Contact Number.'
    if (!form.leadGeneratedBy) next.leadGeneratedBy = 'Lead Generated By is required.'
    if (!form.priority) next.priority = 'Priority is required.'
    if (!form.callDisposition) next.callDisposition = 'Call Disposition is required.'
    if (requiresFollowUp && !form.nextFollowUp) next.nextFollowUp = 'Next Follow Up is required.'
    if (form.callDisposition === 'COMPLETED' && !form.closedOn) next.closedOn = 'Closed On date is required.'
    setValidation(next); if (Object.keys(next).length) return
    if (editingId) { const saved = await dispatch(editEnquiry({ id: editingId, data: payload })).unwrap(); if (routeEditId && originalNavigation.returnTo) { navigate(originalNavigation.returnTo, { state: { ...(originalNavigation.reportRange || {}), message: `Enquiry ${saved.contactName || saved.customerName || ''} updated successfully.` } }); return } } else await dispatch(addEnquiry(payload)).unwrap()
    reset(); await dispatch(fetchEnquiries())
  }

  return <div className="page-stack"><PageHeader title="Enquiry Voucher" subtitle="Create and manage enquiries and follow-ups." />
    <section className="panel-card form-card"><div className="panel-heading"><h2>{editingId ? 'Edit Enquiry' : 'Enquiry Details'}</h2><span>Lead and follow-up information</span></div><div className="form-grid two-col" style={{ gap: 18 }}>
      <label className="field"><span>Customer Name</span><div className="searchable-select"><input value={form.customerName} onChange={(event) => { const value = event.target.value; const match = customers.find((customer) => customer.customerName.toLowerCase() === value.trim().toLowerCase()); if (match) selectCustomer(match); else setForm((current) => ({ ...current, customerName: value, customerId: '', contactName: '', contactNumber: '', areaId: '', areaName: '' })); setCustomerOpen(true) }} onFocus={() => setCustomerOpen(true)} onBlur={() => window.setTimeout(() => setCustomerOpen(false), 150)} placeholder="Search and select customer" autoComplete="off" />{customerOpen && <div className="searchable-options">{filteredCustomers.length ? filteredCustomers.map((customer) => <button type="button" key={customer.id} onMouseDown={() => selectCustomer(customer)}>{customer.customerName}</button>) : <div className="searchable-empty">No matching customers</div>}{canAddCustomer && <button type="button" className="searchable-create-option" onMouseDown={() => navigate('/masters/customers', { state: { returnTo: '/enquiry', enquiryReturnSource: 'customer', enquiryForm: form, enquiryEditingId: editingId, enquiryOriginalNavigation: originalNavigation } })}>+ Create Customer</button>}</div>}</div></label>
      <label className="field"><span>Contact Name</span><input value={form.contactName} onChange={(event) => setField('contactName', event.target.value)} /></label>
      <label className="field"><span>Contact Number *</span><input inputMode="numeric" maxLength="10" value={form.contactNumber} onChange={(event) => setField('contactNumber', event.target.value.replace(/\D/g, '').slice(0, 10))} />{validation.contactNumber && <div className="field-message">{validation.contactNumber}</div>}</label>
      <label className="field"><span>Lead Creation Date *</span><input type="date" value={form.leadCreationDate} onChange={(event) => setField('leadCreationDate', event.target.value)} />{validation.leadCreationDate && <div className="field-message">{validation.leadCreationDate}</div>}</label>
      <label className="field"><span>Area</span><div className="searchable-select"><input value={form.areaName} onChange={(event) => { const value = event.target.value; const match = areas.find((area) => area.areaName.toLowerCase() === value.trim().toLowerCase()); setForm((current) => ({ ...current, areaName: value, areaId: match?.id || '' })); setAreaOpen(true) }} onFocus={() => setAreaOpen(true)} onBlur={() => window.setTimeout(() => setAreaOpen(false), 150)} placeholder="Search and select area" autoComplete="off" />{areaOpen && <div className="searchable-options">{filteredAreas.length ? filteredAreas.map((area) => <button type="button" key={area.id} onMouseDown={() => { setForm((current) => ({ ...current, areaId: area.id, areaName: area.areaName })); setAreaOpen(false) }}>{area.areaName}</button>) : <div className="searchable-empty">No matching areas</div>}{canAddArea && <button type="button" className="searchable-create-option" onMouseDown={() => navigate('/masters/areas', { state: { newAreaName: form.areaName.trim(), returnTo: '/enquiry', enquiryReturnSource: 'area', enquiryForm: form, enquiryEditingId: editingId, enquiryOriginalNavigation: originalNavigation } })}>+ Create Area</button>}</div>}</div></label>
      <label className="field"><span>Call Received By</span><select value={form.receivedExecutiveId} onChange={(event) => selectReference('receivedExecutiveId', 'receivedExecutiveName', executives.find((value) => value.id === event.target.value), 'name')}><option value="">Select executive</option>{executives.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label className="field"><span>Lead Generated By *</span><select value={form.leadGeneratedBy} onChange={(event) => setField('leadGeneratedBy', event.target.value)}><option value="">Select source</option>{ENQUIRY_LEAD_SOURCES.map((value) => <option key={value} value={value}>{leadSourceLabel(value)}</option>)}</select>{validation.leadGeneratedBy && <div className="field-message">{validation.leadGeneratedBy}</div>}</label>
      <label className="field"><span>Product</span><select value={form.productName} onChange={(event) => selectReference('productId', 'productName', productOptions.find((value) => value.itemName === event.target.value), 'itemName')}><option value="">Select product</option>{productOptions.map((item) => <option value={item.itemName} key={`${item.id}-${item.itemName}`}>{item.itemName}</option>)}</select></label>
      <label className="field"><span>Priority *</span><select value={form.priority} onChange={(event) => setField('priority', event.target.value)}><option value="">Select priority</option>{ENQUIRY_PRIORITIES.map((value) => <option key={value}>{value}</option>)}</select>{validation.priority && <div className="field-message">{validation.priority}</div>}</label>
      <label className="field"><span>Call Disposition *</span><select value={form.callDisposition} onChange={(event) => setField('callDisposition', event.target.value)} disabled={!form.priority}><option value="">Select disposition</option>{dispositions.map((value) => <option key={value}>{value}</option>)}</select>{validation.callDisposition && <div className="field-message">{validation.callDisposition}</div>}</label>
      {requiresFollowUp && <label className="field"><span>Next Follow Up *</span><input type="date" value={form.nextFollowUp} onChange={(event) => setField('nextFollowUp', event.target.value)} />{validation.nextFollowUp && <div className="field-message">{validation.nextFollowUp}</div>}</label>}
      {form.callDisposition === 'COMPLETED' && <label className="field"><span>Closed On *</span><input type="date" value={form.closedOn} onChange={(event) => setField('closedOn', event.target.value)} />{validation.closedOn && <div className="field-message">{validation.closedOn}</div>}</label>}
      <label className="field"><span>Call Assigned To</span><select value={form.assignedExecutiveId} onChange={(event) => { const executive = executives.find((value) => value.id === event.target.value); setForm((current) => ({ ...current, assignedExecutiveId: executive?.id || '', assignedExecutiveName: executive?.name || '', followUpLeadId: executive?.id || current.followUpLeadId, followUpLeadName: executive?.name || current.followUpLeadName })) }}><option value="">Select executive</option>{executives.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label className="field"><span>Remarks</span><textarea value={form.remarks} onChange={(event) => setField('remarks', event.target.value)} /></label><label className="field"><span>Follow Up Lead</span><input value={form.assignedExecutiveName || form.followUpLeadName || user?.displayName || user?.email || ''} readOnly disabled /></label>
    </div>{(error || successMessage) && <div className={successMessage ? 'auth-success' : 'auth-error'} style={{ marginTop: 12 }}>{error || successMessage}</div>}<div className="form-actions voucher-save-actions">{(editingId ? canEdit : canAdd) && <Button type="button" onClick={save} disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update' : 'Save'}</Button>}<Button type="button" variant="secondary" onClick={() => routeEditId && originalNavigation.returnTo ? navigate(originalNavigation.returnTo, { state: originalNavigation.reportRange || null }) : reset()}>Cancel</Button></div></section>
  </div>
}
export default Enquiry
