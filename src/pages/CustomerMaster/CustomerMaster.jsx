import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Pencil, Trash2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import Loader from '../../components/common/Loader'
import { addCustomer, clearCustomerMessage, editCustomer, fetchCustomers, removeCustomer, selectCustomerState } from '../../features/customers/customerSlice'
import { fetchAreas, selectAreas } from '../../features/areas/areaSlice'
import { formatDate } from '../../utils/dateUtils'
import { INDIAN_STATES } from '../../data/indianStates'
import { customerService } from '../../services/customerService'
import { ENQUIRY_LEAD_SOURCES } from '../../data/enquiryOptions'

const leadSourceLabel = (value) => value.replaceAll('Reference', 'Ref')
const CUSTOMER_CATEGORY_2_OPTIONS = ['Direct', 'Reference', ...ENQUIRY_LEAD_SOURCES].filter((value, index, options) => options.indexOf(value) === index)

const initialForm = {
  customerName: '',
  mobileNo: '',
  email: '',
  areaId: '',
  areaName: '',
  address: '',
  pincode: '',
  country: 'India',
  state: '',
  gstin: '',
  category1: 'AMC',
  category2: 'Direct',
  notes: '',
}

const CustomerMaster = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { items, loading, error, successMessage } = useSelector(selectCustomerState)
  const areas = useSelector(selectAreas)
  const [returnContext] = useState(() => location.state?.returnTo ? location.state : null)
  const returnedCustomerState = location.state?.createdAreaId ? location.state : null
  const [form, setForm] = useState(() => returnedCustomerState ? {
    ...initialForm,
    ...(returnedCustomerState.customerForm || {}),
    areaId: returnedCustomerState.createdAreaId,
    areaName: returnedCustomerState.createdAreaName || '',
  } : initialForm)
  const [editingId, setEditingId] = useState(() => returnedCustomerState?.customerEditingId || null)
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720)
  const [validationErrors, setValidationErrors] = useState({})
  const [areaOpen, setAreaOpen] = useState(false)
  const [customerUsage, setCustomerUsage] = useState(null)

  useEffect(() => {
    dispatch(fetchCustomers())
    dispatch(fetchAreas())
    customerService.getCustomerUsage().then((usage) => setCustomerUsage({ ids: new Set(usage.ids), legacyNames: new Set(usage.legacyNames) })).catch(() => setCustomerUsage(null))
  }, [dispatch])

  useEffect(() => {
    const returnedState = location.state
    if (!returnedState?.createdAreaId) return
    dispatch(fetchAreas())
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, dispatch, navigate])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 720)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (successMessage || error) {
      const timer = window.setTimeout(() => dispatch(clearCustomerMessage()), 3000)
      return () => window.clearTimeout(timer)
    }
  }, [successMessage, error, dispatch])

  const filteredCustomers = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) {
      return items
    }

    return items.filter((customer) => [customer.customerName, customer.mobileNo, customer.email, customer.areaName, customer.state].some((value) => (value || '').toLowerCase().includes(query)))
  }, [items, searchText])

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize))
  const customerIsUsed = (customer) => customerUsage?.ids.has(customer.id) || customerUsage?.legacyNames.has((customer.customerName || '').trim().toLowerCase())
  const pagedCustomers = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredCustomers.slice(startIndex, startIndex + pageSize)
  }, [filteredCustomers, page, pageSize])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setValidationErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const filteredAreas = useMemo(() => {
    const query = form.areaName.trim().toLowerCase()
    return areas.filter((area) => !query || area.areaName.toLowerCase().includes(query))
  }, [areas, form.areaName])
  const areaSearchText = form.areaName.trim()
  const exactAreaExists = areas.some((area) => area.areaName.toLowerCase() === areaSearchText.toLowerCase())

  const handleAreaInput = (value) => {
    const match = areas.find((area) => area.areaName.toLowerCase() === value.trim().toLowerCase())
    setForm((prev) => ({ ...prev, areaName: value, areaId: match?.id || '' }))
    setValidationErrors((prev) => ({ ...prev, areaId: '' }))
  }

  const selectArea = (area) => {
    setForm((prev) => ({ ...prev, areaId: area.id, areaName: area.areaName }))
    setValidationErrors((prev) => ({ ...prev, areaId: '' }))
    setAreaOpen(false)
  }

  const navigateToCreateArea = () => {
    if (!areaSearchText || exactAreaExists) return
    navigate('/masters/areas', {
      state: {
        newAreaName: areaSearchText,
        returnTo: '/masters/customers',
        customerForm: form,
        customerEditingId: editingId,
        customerReturnContext: returnContext,
      },
    })
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!form.customerName.trim() || form.customerName.trim().length < 2) {
      nextErrors.customerName = 'Customer name is required.'
    }
    if (!form.state) nextErrors.state = 'Please select State'
    if (!form.mobileNo.trim()) nextErrors.mobileNo = 'Mobile number is required.'
    else if (!/^\d{10}$/.test(form.mobileNo.trim())) nextErrors.mobileNo = 'Enter a valid 10-digit mobile number.'
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim())) {
      nextErrors.pincode = 'Pincode must be 6 digits.'
    }

    setValidationErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setValidationErrors({})
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    const payload = {
      ...form,
      customerName: form.customerName.trim(),
      mobileNo: form.mobileNo.trim(),
      email: form.email.trim().toLowerCase(),
      address: form.address.trim(),
      pincode: form.pincode.trim(),
      country: form.country.trim(),
      state: form.state.trim(),
      gstin: form.gstin.trim(),
      notes: form.notes.trim(),
    }

    try {
      if (editingId) {
        await dispatch(editCustomer({ id: editingId, customerData: payload })).unwrap()
      } else {
        const savedCustomer = await dispatch(addCustomer(payload)).unwrap()
        const context = returnContext?.customerReturnContext || returnContext
        if (context?.returnTo) {
          navigate(context.returnTo, { state: { ...context, createdCustomerId: savedCustomer.id, createdCustomerName: savedCustomer.customerName, createdCustomerMobileNo: savedCustomer.mobileNo || payload.mobileNo } })
          return
        }
      }
      resetForm()
    } catch {
      // Error handled via Redux state
    }
  }

  const handleEdit = (customer) => {
    setEditingId(customer.id)
    setForm({
      customerName: customer.customerName,
      mobileNo: customer.mobileNo || '',
      email: customer.email || '',
      areaId: customer.areaId || '',
      areaName: customer.areaName || '',
      address: customer.address,
      pincode: customer.pincode,
      country: customer.country,
      state: customer.state || '',
      gstin: customer.gstin,
      category1: customer.category1,
      category2: customer.category2,
      notes: customer.notes,
    })
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) {
      return
    }

    try {
      await dispatch(removeCustomer(confirmDeleteId)).unwrap()
      setConfirmDeleteId(null)
    } catch {
      // Error handled via Redux state
    }
  }

  return (
    <div className="page-stack">
      <PageHeader title="Customer Master" subtitle="Create and maintain customer details." />

      <section className="panel-card form-card">
        <div className="panel-heading">
          <h2>{editingId ? 'Edit Customer' : 'Customer Details'}</h2>
          <span>Professional customer profile entry</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid two-col" style={{ gap: 18 }}>
            <label className="field">
              <span>Customer Name *</span>
              <input name="customerName" value={form.customerName} onChange={handleChange} placeholder="Enter customer name" />
              {validationErrors.customerName ? <div className="field-message field-error">{validationErrors.customerName}</div> : null}
            </label>
            <label className="field">
              <span>Area</span>
              <div className="searchable-select">
                <input value={form.areaName} onChange={(event) => { handleAreaInput(event.target.value); setAreaOpen(true) }} onFocus={() => setAreaOpen(true)} onBlur={() => window.setTimeout(() => setAreaOpen(false), 150)} placeholder="Search and select area" autoComplete="off" />
                {areaOpen ? <div className="searchable-options">
                  {filteredAreas.length ? filteredAreas.map((area) => <button type="button" key={area.id} onMouseDown={() => selectArea(area)}>{area.areaName}</button>) : <div className="searchable-empty">No matching areas</div>}
                  {areaSearchText && !exactAreaExists ? <button type="button" className="searchable-create-option" onMouseDown={navigateToCreateArea}>+ Create &quot;{areaSearchText}&quot; Area</button> : null}
                </div> : null}
              </div>
              {validationErrors.areaId ? <div className="field-message field-error">{validationErrors.areaId}</div> : null}
            </label>
            <label className="field">
              <span>Mobile No *</span>
              <input name="mobileNo" inputMode="numeric" maxLength="10" value={form.mobileNo} onChange={(event) => handleChange({ target: { name: 'mobileNo', value: event.target.value.replace(/\D/g, '').slice(0, 10) } })} placeholder="9876543210" />
              {validationErrors.mobileNo ? <div className="field-message field-error">{validationErrors.mobileNo}</div> : null}
            </label>
            <label className="field">
              <span>Email ID</span>
              <input name="email" type="text" inputMode="email" value={form.email} onChange={handleChange} placeholder="customer@example.com" />
              {validationErrors.email ? <div className="field-message field-error">{validationErrors.email}</div> : null}
            </label>
            <label className="field">
              <span>Address</span>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Enter address" />
              {validationErrors.address ? <div className="field-message field-error">{validationErrors.address}</div> : null}
            </label>
            <label className="field">
              <span>Pincode</span>
              <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="400001" />
              {validationErrors.pincode ? <div className="field-message field-error">{validationErrors.pincode}</div> : null}
            </label>
            <label className="field">
              <span>Country</span>
              <input name="country" value={form.country} onChange={handleChange} placeholder="India" />
              {validationErrors.country ? <div className="field-message field-error">{validationErrors.country}</div> : null}
            </label>
            <label className="field">
              <span>State *</span>
              <select name="state" value={form.state} onChange={handleChange}>
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => <option value={state} key={state}>{state}</option>)}
              </select>
              {validationErrors.state ? <div className="field-message field-error">{validationErrors.state}</div> : null}
            </label>
            <label className="field">
              <span>GSTIN</span>
              <input name="gstin" value={form.gstin} onChange={handleChange} placeholder="27AAAPL1234C1Z5" />
              {validationErrors.gstin ? <div className="field-message field-error">{validationErrors.gstin}</div> : null}
            </label>
          </div>

          <div className="form-grid two-col" style={{ gap: 18, marginTop: 8 }}>
            <label className="field">
              <span>Category 1</span>
              <select name="category1" value={form.category1} onChange={handleChange}>
                <option value="AMC">AMC</option>
                <option value="Remote AMC">Remote AMC</option>
                <option value="Support">Support</option>
                <option value="New">New</option>
                <option value="Renewal">Renewal</option>
                <option value="Others">Others</option>
              </select>
              {validationErrors.category1 ? <div className="field-message field-error">{validationErrors.category1}</div> : null}
            </label>
            <label className="field">
              <span>Category 2</span>
              <select name="category2" value={form.category2} onChange={handleChange}>
                {CUSTOMER_CATEGORY_2_OPTIONS.map((value) => <option value={value} key={value}>{leadSourceLabel(value)}</option>)}
              </select>
              {validationErrors.category2 ? <div className="field-message field-error">{validationErrors.category2}</div> : null}
            </label>
            <label className="field">
              <span>Notes</span>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Enter customer notes..."></textarea>
            </label>
          </div>
          {(error || successMessage) ? <div className={successMessage ? 'auth-success' : 'auth-error'} style={{ marginTop: 16 }}>{error || successMessage}</div> : null}
          <div className="form-actions master-form-actions">
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update Customer' : 'Save Customer'}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Clear</Button>
            {/* <Button type="button" variant="ghost" onClick={() => setForm(initialForm)}>Cancel</Button> */}
          </div>
        </form>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Existing Customers</h2>
          <span>Current client roster</span>
        </div>
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <div className="search-box" style={{ minWidth: 240, width: '100%' }}>
            <Search size={16} />
            <input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search name, mobile, email, area or state..." />
          </div>
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        {loading && items.length === 0 ? <Loader size="small" label="Loading customers..." /> : isMobile ? (
          <div className="customer-mobile-list">
            {pagedCustomers.map((customer) => (
              <div className="customer-mobile-card" key={customer.id}>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Customer</span><span>{customer.customerName}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Mobile</span><span>{customer.mobileNo || '—'}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Email</span><span>{customer.email || '—'}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Area</span><span>{customer.areaName || '—'}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">State</span><span>{customer.state || '—'}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Category</span><span>{customer.category1}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Created</span><span>{formatDate(customer.createdAt)}</span></div>
                <div className="customer-mobile-actions">
                  <button className="executive-action-btn" onClick={() => handleEdit(customer)}><Pencil size={13} /><span>Edit</span></button>
                  {customerUsage && !customerIsUsed(customer) ? <button className="executive-action-btn delete" onClick={() => setConfirmDeleteId(customer.id)}><Trash2 size={13} /><span>Delete</span></button> : null}
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
                  <th>Customer Name</th>
                  <th>Mobile No</th>
                  <th>Email ID</th>
                  <th>Area</th>
                  <th>State</th>
                  <th>Category 1</th>
                  <th>Executive</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? <tr><td colSpan="11"><Loader size="small" label="Loading customers..." /></td></tr> : null}
                {!loading && filteredCustomers.length === 0 ? <tr><td colSpan="11" className="text-center">{searchText ? 'No matching customers found.' : 'No customers found.'}</td></tr> : null}
                {pagedCustomers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>{customer.customerName}</td>
                    <td>{customer.mobileNo || '—'}</td>
                    <td>{customer.email || '—'}</td>
                    <td>{customer.areaName || '—'}</td>
                    <td>{customer.state || '—'}</td>
                    <td>{customer.category1}</td>
                    <td>{customer.executiveName || '—'}</td>
                    <td>{formatDate(customer.createdAt)}</td>
                    <td><span className={`status-badge ${customer.status === 'Active' ? 'green' : 'amber'}`}>{customer.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="executive-action-btn" onClick={() => handleEdit(customer)}><Pencil size={13} /><span>Edit</span></button>
                        {customerUsage && !customerIsUsed(customer) ? <button className="executive-action-btn delete" onClick={() => setConfirmDeleteId(customer.id)}><Trash2 size={13} /><span>Delete</span></button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filteredCustomers.length} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(totalPages, current + 1))} />
      </section>

      {confirmDeleteId ? (
        <div className="overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div className="panel-card" style={{ maxWidth: 360, width: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Delete customer</h3>
            <p>Are you sure you want to delete this customer?</p>
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

export default CustomerMaster
