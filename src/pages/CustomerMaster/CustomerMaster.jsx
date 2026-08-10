import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { addCustomer, clearCustomerMessage, editCustomer, fetchCustomers, removeCustomer, selectCustomerState } from '../../features/customers/customerSlice'

const initialForm = {
  customerName: '',
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
  const { items, loading, error, successMessage } = useSelector(selectCustomerState)
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720)
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    dispatch(fetchCustomers())
  }, [dispatch])

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

  useEffect(() => {
    setPage(1)
  }, [searchText])

  const filteredCustomers = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) {
      return items
    }

    return items.filter((customer) => customer.customerName.toLowerCase().includes(query))
  }, [items, searchText])

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize))
  const pagedCustomers = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredCustomers.slice(startIndex, startIndex + pageSize)
  }, [filteredCustomers, page, pageSize])

  const formatDisplayDate = (timestamp) => {
    if (!timestamp?.toDate) {
      return '—'
    }

    const date = timestamp.toDate()
    return `${date.getDate().toString().padStart(2, '0')} ${date.toLocaleString('en-GB', { month: 'short' })} ${date.getFullYear()}`
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setValidationErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!form.customerName.trim() || form.customerName.trim().length < 2) {
      nextErrors.customerName = 'Customer name is required.'
    }
    if (!form.address.trim()) {
      nextErrors.address = 'Address is required.'
    }
    if (!form.pincode.trim()) {
      nextErrors.pincode = 'Pincode is required.'
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      nextErrors.pincode = 'Pincode must be 6 digits.'
    }
    if (!form.country.trim()) {
      nextErrors.country = 'Country is required.'
    }
    if (!form.state.trim()) {
      nextErrors.state = 'State is required.'
    }
    if (!form.category1) {
      nextErrors.category1 = 'Category 1 is required.'
    }
    if (!form.category2) {
      nextErrors.category2 = 'Category 2 is required.'
    }
    if (!form.gstin.trim()) {
      nextErrors.gstin = 'GSTIN is required.'
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
        await dispatch(addCustomer(payload)).unwrap()
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
      address: customer.address,
      pincode: customer.pincode,
      country: customer.country,
      state: customer.state,
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
              <span>Address *</span>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Enter address" />
              {validationErrors.address ? <div className="field-message field-error">{validationErrors.address}</div> : null}
            </label>
            <label className="field">
              <span>Pincode *</span>
              <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="400001" />
              {validationErrors.pincode ? <div className="field-message field-error">{validationErrors.pincode}</div> : null}
            </label>
            <label className="field">
              <span>Country *</span>
              <input name="country" value={form.country} onChange={handleChange} placeholder="India" />
              {validationErrors.country ? <div className="field-message field-error">{validationErrors.country}</div> : null}
            </label>
            <label className="field">
              <span>State *</span>
              <input name="state" value={form.state} onChange={handleChange} placeholder="Maharashtra" />
              {validationErrors.state ? <div className="field-message field-error">{validationErrors.state}</div> : null}
            </label>
            <label className="field">
              <span>GSTIN *</span>
              <input name="gstin" value={form.gstin} onChange={handleChange} placeholder="27AAAPL1234C1Z5" />
              {validationErrors.gstin ? <div className="field-message field-error">{validationErrors.gstin}</div> : null}
            </label>
          </div>

          <div className="form-grid two-col" style={{ gap: 18, marginTop: 8 }}>
            <label className="field">
              <span>Category 1 *</span>
              <select name="category1" value={form.category1} onChange={handleChange}>
                <option value="AMC">AMC</option>
                <option value="Remote AMC">Remote AMC</option>
                <option value="Support">Support</option>
              </select>
              {validationErrors.category1 ? <div className="field-message field-error">{validationErrors.category1}</div> : null}
            </label>
            <label className="field">
              <span>Category 2 *</span>
              <select name="category2" value={form.category2} onChange={handleChange}>
                <option value="Direct">Direct</option>
                <option value="Google">Google</option>
                <option value="IndiaMART">IndiaMART</option>
                <option value="Reference">Reference</option>
              </select>
              {validationErrors.category2 ? <div className="field-message field-error">{validationErrors.category2}</div> : null}
            </label>
            <label className="field">
              <span>Notes</span>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Enter customer notes..."></textarea>
            </label>
          </div>
          {(error || successMessage) ? <div className={successMessage ? 'auth-success' : 'auth-error'} style={{ marginTop: 16 }}>{error || successMessage}</div> : null}
          <div className="form-actions">
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
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search customer by name..." />
          </div>
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        {isMobile ? (
          <div className="customer-mobile-list">
            {pagedCustomers.map((customer) => (
              <div className="customer-mobile-card" key={customer.id}>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Customer</span><span>{customer.customerName}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">State</span><span>{customer.state}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Category</span><span>{customer.category1}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Created</span><span>{formatDisplayDate(customer.createdAt)}</span></div>
                <div className="customer-mobile-actions">
                  <button className="executive-action-btn" onClick={() => handleEdit(customer)}><Pencil size={13} /><span>Edit</span></button>
                  <button className="executive-action-btn delete" onClick={() => setConfirmDeleteId(customer.id)}><Trash2 size={13} /><span>Delete</span></button>
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
                  <th>Pincode</th>
                  <th>State</th>
                  <th>GSTIN</th>
                  <th>Category 1</th>
                  <th>Category 2</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? <tr><td colSpan="11" className="text-center">Loading customers...</td></tr> : null}
                {!loading && filteredCustomers.length === 0 ? <tr><td colSpan="11" className="text-center">{searchText ? 'No matching customers found.' : 'No customers found.'}</td></tr> : null}
                {pagedCustomers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>{customer.customerName}</td>
                    <td>{customer.pincode}</td>
                    <td>{customer.state}</td>
                    <td>{customer.gstin || '—'}</td>
                    <td>{customer.category1}</td>
                    <td>{customer.category2}</td>
                    <td>{formatDisplayDate(customer.createdAt)}</td>
                    <td><span className={`status-badge ${customer.status === 'Active' ? 'green' : 'amber'}`}>{customer.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="executive-action-btn" onClick={() => handleEdit(customer)}><Pencil size={13} /><span>Edit</span></button>
                        <button className="executive-action-btn delete" onClick={() => setConfirmDeleteId(customer.id)}><Trash2 size={13} /><span>Delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="form-actions compact" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Button type="button" variant="ghost" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Previous</Button>
          <span>Page {page} of {totalPages}</span>
          <Button type="button" variant="ghost" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>Next</Button>
        </div>
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
