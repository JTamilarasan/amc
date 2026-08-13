import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import Loader from '../../components/common/Loader'
import { addProduct, clearProductMessage, editProduct, fetchProducts, removeProduct, selectProductState } from '../../features/products/productSlice'
import { formatDate } from '../../utils/dateUtils'

const initialForm = {
  itemName: '',
  itemGroup: 'Tally Software',
  unit: 'Nos',
  amcApplicable: true,
}

const ProductMaster = () => {
  const dispatch = useDispatch()
  const { items, loading, error, successMessage } = useSelector(selectProductState)
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720)
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 720)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (successMessage || error) {
      const timer = window.setTimeout(() => dispatch(clearProductMessage()), 3000)
      return () => window.clearTimeout(timer)
    }
  }, [successMessage, error, dispatch])

  useEffect(() => {
    setPage(1)
  }, [searchText])

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) {
      return items
    }

    return items.filter((product) => product.itemName.toLowerCase().includes(query))
  }, [items, searchText])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const pagedProducts = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredProducts.slice(startIndex, startIndex + pageSize)
  }, [filteredProducts, page, pageSize])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setValidationErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!form.itemName.trim()) {
      nextErrors.itemName = 'Item name is required.'
    }
    if (!form.itemGroup.trim()) {
      nextErrors.itemGroup = 'Item group is required.'
    }
    if (!form.unit.trim()) {
      nextErrors.unit = 'Unit is required.'
    }
    if (typeof form.amcApplicable !== 'boolean') {
      nextErrors.amcApplicable = 'AMC applicability is required.'
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
      itemName: form.itemName.trim(),
      itemGroup: form.itemGroup.trim(),
      unit: form.unit.trim(),
      amcApplicable: form.amcApplicable,
    }

    try {
      if (editingId) {
        await dispatch(editProduct({ id: editingId, productData: payload })).unwrap()
      } else {
        await dispatch(addProduct(payload)).unwrap()
      }
      resetForm()
    } catch {
      // Error handled via Redux state
    }
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setForm({
      itemName: product.itemName,
      itemGroup: product.itemGroup,
      unit: product.unit,
      amcApplicable: product.amcApplicable,
    })
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) {
      return
    }

    try {
      await dispatch(removeProduct(confirmDeleteId)).unwrap()
      setConfirmDeleteId(null)
    } catch {
      // Error handled via Redux state
    }
  }

  return (
    <div className="page-stack">
      <PageHeader title="Product Master" subtitle="Create and manage products and AMC settings." />

      <section className="panel-card form-card">
        <div className="panel-heading">
          <h2>{editingId ? 'Edit Product' : 'Product Entry'}</h2>
          {/* <span>Define product rules and AMC eligibility</span> */}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid two-col" style={{ gap: 18 }}>
            <label className="field">
              <span>Item Name *</span>
              <input name="itemName" value={form.itemName} onChange={handleChange} placeholder="Enter item name" />
              {validationErrors.itemName ? <div className="field-message field-error">{validationErrors.itemName}</div> : null}
            </label>
            <label className="field">
              <span>Item Group *</span>
              <select name="itemGroup" value={form.itemGroup} onChange={handleChange}>
                <option value="Tally Software">Tally Software</option>
                <option value="Tally Services">Tally Services</option>
                <option value="Add-ons">Add-ons</option>
                <option value="Support Services">Support Services</option>
                <option value="Other">Other</option>
              </select>
              {validationErrors.itemGroup ? <div className="field-message field-error">{validationErrors.itemGroup}</div> : null}
            </label>
            <label className="field">
              <span>Unit *</span>
              <select name="unit" value={form.unit} onChange={handleChange}>
                <option value="Nos">Nos</option>
                <option value="License">License</option>
                <option value="Service">Service</option>
                <option value="Year">Year</option>
                <option value="Month">Month</option>
              </select>
              {validationErrors.unit ? <div className="field-message field-error">{validationErrors.unit}</div> : null}
            </label>
            <label className="field">
              <span>AMC Applicable *</span>
              <div className="toggle-wrap">
                <button type="button" className={`toggle ${form.amcApplicable ? 'active' : ''}`} onClick={() => setForm((prev) => ({ ...prev, amcApplicable: true }))}>
                  Yes
                </button>
                <button type="button" className={`toggle ${!form.amcApplicable ? 'active' : ''}`} onClick={() => setForm((prev) => ({ ...prev, amcApplicable: false }))}>
                  No
                </button>
              </div>
              {validationErrors.amcApplicable ? <div className="field-message field-error">{validationErrors.amcApplicable}</div> : null}
            </label>
          </div>

          {(error || successMessage) ? <div className={successMessage ? 'auth-success' : 'auth-error'} style={{ marginTop: 16 }}>{error || successMessage}</div> : null}
          <div className="form-actions master-form-actions">
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}</Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Clear</Button>
          </div>
        </form>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Product List</h2>
          <span>Current inventory and service catalog</span>
        </div>
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <div className="search-box" style={{ minWidth: 240, width: '100%' }}>
            <Search size={16} />
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search product by item name..." />
          </div>
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        {loading && items.length === 0 ? <Loader size="small" label="Loading products..." /> : isMobile ? (
          <div className="customer-mobile-list">
            {pagedProducts.map((product) => (
              <div className="customer-mobile-card" key={product.id}>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Item Name</span><span>{product.itemName}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Group</span><span>{product.itemGroup}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Unit</span><span>{product.unit}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">AMC</span><span>{product.amcApplicable ? 'Yes' : 'No'}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Created</span><span>{formatDate(product.createdAt)}</span></div>
                <div className="customer-mobile-actions">
                  <button className="executive-action-btn" onClick={() => handleEdit(product)}><Pencil size={13} /><span>Edit</span></button>
                  <button className="executive-action-btn delete" onClick={() => setConfirmDeleteId(product.id)}><Trash2 size={13} /><span>Delete</span></button>
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
                  <th>Item Name</th>
                  <th>Item Group</th>
                  <th>Unit</th>
                  <th>AMC Applicable</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? <tr><td colSpan="8"><Loader size="small" label="Loading products..." /></td></tr> : null}
                {!loading && filteredProducts.length === 0 ? <tr><td colSpan="8" className="text-center">{searchText ? 'No matching products found.' : 'No products found.'}</td></tr> : null}
                {pagedProducts.map((product, index) => (
                  <tr key={product.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>{product.itemName}</td>
                    <td>{product.itemGroup}</td>
                    <td>{product.unit}</td>
                    <td>{product.amcApplicable ? 'Yes' : 'No'}</td>
                    <td>{formatDate(product.createdAt)}</td>
                    <td><span className={`status-badge ${product.status === 'Active' ? 'green' : 'amber'}`}>{product.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="executive-action-btn" onClick={() => handleEdit(product)}><Pencil size={13} /><span>Edit</span></button>
                        <button className="executive-action-btn delete" onClick={() => setConfirmDeleteId(product.id)}><Trash2 size={13} /><span>Delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filteredProducts.length} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(totalPages, current + 1))} />
      </section>

      {confirmDeleteId ? (
        <div className="overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div className="panel-card" style={{ maxWidth: 360, width: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Delete product</h3>
            <p>Are you sure you want to delete this product?</p>
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

export default ProductMaster
