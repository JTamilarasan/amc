import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Pencil, Trash2, Eye } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { fetchCustomers, selectCustomers } from '../../features/customers/customerSlice'
import { fetchProducts, selectProducts } from '../../features/products/productSlice'
import { addSalesVoucher, clearSalesVoucherMessage, editSalesVoucher, fetchNextVoucherNumber, fetchSalesVouchers, fetchVoucherSequence, initializeVoucherCounter, removeSalesVoucher, selectSalesVoucherState, selectSalesVouchers } from '../../features/salesVouchers/salesVoucherSlice'

const todayValue = () => new Date().toISOString().split('T')[0]

const SalesVoucher = () => {
  const dispatch = useDispatch()
  const customers = useSelector(selectCustomers)
  const products = useSelector(selectProducts)
  const vouchers = useSelector(selectSalesVouchers)
  const { loading, error, successMessage } = useSelector(selectSalesVoucherState)
  const [manualStartingNumber, setManualStartingNumber] = useState('100')
  const [voucherNumber, setVoucherNumber] = useState('')
  const [voucherDate, setVoucherDate] = useState(todayValue())
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const [narration, setNarration] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productPage, setProductPage] = useState(1)
  const [productPageSize, setProductPageSize] = useState(10)
  const [rowValues, setRowValues] = useState({})
  const [rowErrors, setRowErrors] = useState({})
  const [selectedProductId, setSelectedProductId] = useState('')
  const [editingVoucherId, setEditingVoucherId] = useState(null)
  const [formError, setFormError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720)

  useEffect(() => {
    dispatch(fetchCustomers())
    dispatch(fetchProducts())
    dispatch(fetchSalesVouchers())
  }, [dispatch])

  useEffect(() => {
    const loadVoucherNumber = async () => {
      try {
        const sequence = await dispatch(fetchVoucherSequence()).unwrap()
        if (sequence) {
          setManualStartingNumber(String(sequence.startingNumber))
          setVoucherNumber(sequence.nextVoucherNumber)
        } else {
          setManualStartingNumber('100')
          setVoucherNumber(await dispatch(initializeVoucherCounter(100)).unwrap())
        }
      } catch {
        setFormError('Unable to load the next voucher number.')
      }
    }
    loadVoucherNumber()
  }, [dispatch])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 720)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (successMessage || error) {
      const timer = window.setTimeout(() => dispatch(clearSalesVoucherMessage()), 3000)
      return () => window.clearTimeout(timer)
    }
  }, [successMessage, error, dispatch])

  const filteredVouchers = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) {
      return vouchers
    }

    return vouchers.filter((voucher) => {
      const number = String(voucher.voucherNumber || '')
      const customer = (voucher.customerName || '').toLowerCase()
      return number.includes(query) || customer.includes(query)
    })
  }, [vouchers, searchText])

  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / pageSize))
  const pagedVouchers = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredVouchers.slice(startIndex, startIndex + pageSize)
  }, [filteredVouchers, page, pageSize])

  const filteredCustomers = useMemo(() => {
    const value = customerName.trim().toLowerCase()
    return customers.filter((customer) => !value || customer.customerName.toLowerCase().includes(value))
  }, [customers, customerName])
  const filteredProducts = useMemo(() => {
    const value = productSearch.trim().toLowerCase()
    return products.filter((product) => !value || product.itemName.toLowerCase().includes(value))
  }, [products, productSearch])
  const productTotalPages = Math.max(1, Math.ceil(filteredProducts.length / productPageSize))
  const pagedProducts = useMemo(() => {
    const start = (productPage - 1) * productPageSize
    return filteredProducts.slice(start, start + productPageSize)
  }, [filteredProducts, productPage, productPageSize])

  const formatVoucherDate = (value) => {
    if (!value) return '—'
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (Number.isNaN(date.getTime())) return '—'
    return `${String(day).padStart(2, '0')} ${date.toLocaleString('en-GB', { month: 'short' })} ${year}`
  }

  const handleCustomerSelect = (event) => {
    const selectedValue = event.target.value
    const selectedCustomer = customers.find((customer) => customer.customerName.toLowerCase() === selectedValue.trim().toLowerCase())

    if (selectedCustomer) {
      setCustomerId(selectedCustomer.id)
      setCustomerName(selectedCustomer.customerName)
    } else {
      setCustomerId('')
      setCustomerName(event.target.value)
    }
  }

  const selectCustomer = (customer) => {
    setCustomerId(customer.id)
    setCustomerName(customer.customerName)
    setCustomerDropdownOpen(false)
  }

  const getRowValue = (productId) => rowValues[productId] || { quantity: 1, amcFromDate: '', amcToDate: '', amount: '' }

  const handleRowChange = (productId, field, value) => {
    setRowValues((current) => ({ ...current, [productId]: { quantity: 1, amcFromDate: '', amcToDate: '', amount: '', ...current[productId], [field]: value } }))
    setRowErrors((current) => ({ ...current, [productId]: '' }))
    if (selectedProductId === productId) setSelectedProductId('')
  }

  const validateProductRow = (product) => {
    const values = getRowValue(product.id)
    if (Number(values.quantity) < 1) return 'Quantity must be at least 1.'
    if (Number(values.amount) <= 0) return 'Amount must be greater than 0.'
    if (product.amcApplicable && (!values.amcFromDate || !values.amcToDate)) return 'AMC From Date and To Date are required.'
    if (product.amcApplicable && values.amcToDate < values.amcFromDate) return 'AMC To Date cannot be earlier than From Date.'
    return ''
  }

  const handleSelectProduct = (product) => {
    const rowError = validateProductRow(product)
    setRowErrors((current) => ({ ...current, [product.id]: rowError }))
    if (rowError) return
    setSelectedProductId(product.id)
    setFormError('')
  }

  const handleSaveVoucher = async () => {
    setFormError('')
    if (!voucherNumber) {
      setFormError('Set a valid manual starting number.')
      return
    }

    if (!voucherDate) {
      setFormError('Voucher date is required.')
      return
    }

    if (!customerId || !customerName) {
      setFormError('Select a valid party from Customer Master.')
      return
    }

    const selectedProduct = products.find((product) => product.id === selectedProductId)
    if (!selectedProduct) {
      setFormError('Please select an item.')
      return
    }

    const selectedError = validateProductRow(selectedProduct)
    if (selectedError) {
      setRowErrors((current) => ({ ...current, [selectedProduct.id]: selectedError }))
      setFormError(selectedError)
      return
    }

    const selectedValues = getRowValue(selectedProduct.id)
    const voucherItems = [{
      productId: selectedProduct.id,
      itemName: selectedProduct.itemName,
      quantity: Number(selectedValues.quantity),
      unit: selectedProduct.unit || '',
      amcApplicable: Boolean(selectedProduct.amcApplicable),
      amcFromDate: selectedValues.amcFromDate || '',
      amcToDate: selectedValues.amcToDate || '',
      amount: Number(selectedValues.amount),
    }]

    const payload = {
      voucherDate,
      customerId,
      customerName,
      narration: narration.trim(),
      items: voucherItems,
      totalAmount: Number(selectedValues.amount),
    }

    try {
      if (editingVoucherId) {
        await dispatch(editSalesVoucher({ id: editingVoucherId, voucherData: payload })).unwrap()
        const nextNumber = await dispatch(fetchNextVoucherNumber()).unwrap()
        setVoucherNumber(nextNumber)
      } else {
        const saved = await dispatch(addSalesVoucher(payload)).unwrap()
        setVoucherNumber(Number(saved.voucherNumber) + 1)
      }
      setVoucherDate(todayValue())
      setCustomerId('')
      setCustomerName('')
      setNarration('')
      setProductSearch('')
      setProductPage(1)
      setRowValues({})
      setRowErrors({})
      setSelectedProductId('')
      setEditingVoucherId(null)
    } catch {
      // Error handled via Redux state
    }
  }

  const handleClearVoucher = async () => {
    setVoucherDate(todayValue())
    setCustomerId('')
    setCustomerName('')
    setCustomerDropdownOpen(false)
    setNarration('')
    setProductSearch('')
    setProductPage(1)
    setRowValues({})
    setRowErrors({})
    setSelectedProductId('')
    setEditingVoucherId(null)
    setFormError('')
    try {
      const nextNumber = await dispatch(fetchNextVoucherNumber()).unwrap()
      if (nextNumber != null) setVoucherNumber(nextNumber)
    } catch {
      setFormError('Unable to refresh the next voucher number.')
    }
  }

  const handleStartingNumberBlur = async () => {
    try {
      const next = await dispatch(initializeVoucherCounter(Number(manualStartingNumber))).unwrap()
      setVoucherNumber(next)
      setFormError('')
    } catch (reason) {
      setFormError(typeof reason === 'string' ? reason : 'Unable to set starting number.')
    }
  }

  const handleStartingNumberChange = (event) => {
    const value = event.target.value
    setManualStartingNumber(value)
    const startingNumber = Number(value)
    setVoucherNumber(value !== '' && Number.isFinite(startingNumber) && startingNumber >= 0 ? startingNumber + 1 : '')
  }

  const handleEditVoucher = (voucher) => {
    setEditingVoucherId(voucher.id)
    setVoucherNumber(voucher.voucherNumber)
    setVoucherDate(voucher.voucherDate)
    setCustomerId(voucher.customerId)
    setCustomerName(voucher.customerName)
    setNarration(voucher.narration || '')
    const item = voucher.items?.[0]
    if (item) {
      setSelectedProductId(item.productId)
      setRowValues({ [item.productId]: { quantity: item.quantity, amcFromDate: item.amcFromDate || '', amcToDate: item.amcToDate || '', amount: item.amount } })
      const productIndex = products.findIndex((product) => product.id === item.productId)
      if (productIndex >= 0) setProductPage(Math.floor(productIndex / productPageSize) + 1)
    }
    setFormError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteVoucher = async (voucher) => {
    if (window.confirm(`Delete sales voucher #${voucher.voucherNumber}?`)) await dispatch(removeSalesVoucher(voucher.id))
  }

  const handleViewVoucher = (voucher) => {
    window.alert(`Voucher #${voucher.voucherNumber}\nParty: ${voucher.customerName}\nDate: ${voucher.voucherDate}\nItems: ${voucher.items?.length || 0}`)
  }

  return (
    <div className="page-stack">
      <PageHeader title="Sales Voucher" subtitle="Create a polished voucher entry for services and AMC billing." />

      <section className="panel-card form-card">
        <div className="voucher-main">
          <div className="form-grid two-col" style={{ gap: 18 }}>
            <label className="field">
              <span>Manual Starting Number</span>
              <input type="number" min="0" value={manualStartingNumber} onChange={handleStartingNumberChange} onBlur={handleStartingNumberBlur} disabled={Boolean(editingVoucherId)} />
            </label>
            <label className="field">
              <span>Voucher Number</span>
              <input value={voucherNumber} readOnly disabled />
            </label>
            <label className="field">
              <span>Date</span>
              <input type="date" value={voucherDate} onChange={(event) => setVoucherDate(event.target.value)} />
            </label>
            <label className="field">
              <span>Party Name *</span>
              <div className="searchable-select">
                <input
                  value={customerName}
                  onChange={(event) => { handleCustomerSelect(event); setCustomerDropdownOpen(true) }}
                  onFocus={() => setCustomerDropdownOpen(true)}
                  onBlur={() => window.setTimeout(() => setCustomerDropdownOpen(false), 150)}
                  placeholder="Search and select customer"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={customerDropdownOpen}
                />
                {customerDropdownOpen ? (
                  <div className="searchable-options" role="listbox">
                    {filteredCustomers.length ? filteredCustomers.map((customer) => (
                      <button type="button" key={customer.id} onMouseDown={() => selectCustomer(customer)}>{customer.customerName}</button>
                    )) : <div className="searchable-empty">No matching customers</div>}
                  </div>
                ) : null}
              </div>
            </label>
          </div>

          <label className="field">
            <span>Narration</span>
            <textarea value={narration} onChange={(event) => setNarration(event.target.value)} placeholder="Enter voucher narration..."></textarea>
          </label>

          <div className="panel-heading voucher-products-heading">
            <h2>Item Details</h2>
          </div>
          <div className="toolbar voucher-products-toolbar">
            <div className="search-box">
              <Search size={16} />
              <input value={productSearch} onChange={(event) => { setProductSearch(event.target.value); setProductPage(1) }} placeholder="Search Product..." />
            </div>
            <select value={productPageSize} onChange={(event) => { setProductPageSize(Number(event.target.value)); setProductPage(1) }} aria-label="Products per page">
              <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
            </select>
          </div>

          <div className="table-wrap voucher-items-table">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Item</th>
                  <th>Unit</th>
                  <th>AMC</th>
                  <th>Qty</th>
                  <th>AMC From</th>
                  <th>AMC To</th>
                  <th>Amount</th>
                  <th>Select</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.length === 0 ? <tr><td colSpan="9" className="text-center">No matching products found.</td></tr> : null}
                {pagedProducts.map((product, index) => {
                  const values = getRowValue(product.id)
                  const isSelected = selectedProductId === product.id
                  return <tr key={product.id} className={isSelected ? 'selected-product-row' : ''}>
                    <td>{(productPage - 1) * productPageSize + index + 1}</td>
                    <td>{product.itemName}</td>
                    <td>{product.unit || '—'}</td>
                    <td>{product.amcApplicable ? 'Yes' : 'No'}</td>
                    <td><input className="product-row-input qty-input" type="number" min="1" value={values.quantity} onChange={(event) => handleRowChange(product.id, 'quantity', event.target.value)} />{rowErrors[product.id]?.startsWith('Quantity') ? <div className="table-row-error">{rowErrors[product.id]}</div> : null}</td>
                    <td><input className="product-row-input date-input" type="date" value={values.amcFromDate} onChange={(event) => handleRowChange(product.id, 'amcFromDate', event.target.value)} />{rowErrors[product.id]?.startsWith('AMC') ? <div className="table-row-error">{rowErrors[product.id]}</div> : null}</td>
                    <td><input className="product-row-input date-input" type="date" value={values.amcToDate} onChange={(event) => handleRowChange(product.id, 'amcToDate', event.target.value)} /></td>
                    <td><input className="product-row-input amount-input" type="number" min="0.01" step="0.01" value={values.amount} onChange={(event) => handleRowChange(product.id, 'amount', event.target.value)} placeholder="Amount" />{rowErrors[product.id]?.startsWith('Amount') ? <div className="table-row-error">{rowErrors[product.id]}</div> : null}</td>
                    <td><Button type="button" variant={isSelected ? 'secondary' : 'primary'} onClick={() => handleSelectProduct(product)}>{isSelected ? 'Selected' : 'Select'}</Button></td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
          <div className="form-actions compact product-pagination">
            <Button type="button" variant="ghost" onClick={() => setProductPage((current) => Math.max(1, current - 1))} disabled={productPage === 1}>Previous</Button>
            <span>Page {productPage} of {productTotalPages}</span>
            <Button type="button" variant="ghost" onClick={() => setProductPage((current) => Math.min(productTotalPages, current + 1))} disabled={productPage === productTotalPages}>Next</Button>
          </div>

          {(formError || error || successMessage) ? <div className={successMessage && !formError && !error ? 'auth-success' : 'auth-error'} style={{ marginTop: 12 }}>{formError || error || successMessage}</div> : null}
          <div className="form-actions voucher-save-actions">
            <Button type="button" onClick={handleSaveVoucher} disabled={loading}>{loading ? 'Saving...' : editingVoucherId ? 'Update Voucher' : 'Save Voucher'}</Button>
            <Button type="button" variant="secondary" onClick={handleClearVoucher} disabled={loading}>Clear</Button>
          </div>
        </div>
      </section>

      <section className="panel-card" style={{ marginTop: 18 }}>
        <div className="panel-heading">
          <h2>Recent Sales Vouchers</h2>
          <span>Saved voucher history</span>
        </div>
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <div className="search-box" style={{ minWidth: 240, width: '100%' }}>
            <Search size={16} />
            <input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search by voucher number or customer..." />
          </div>
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        {isMobile ? (
          <div className="customer-mobile-list">
            {pagedVouchers.map((voucher) => (
              <div className="customer-mobile-card" key={voucher.id}>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Voucher</span><span>#{voucher.voucherNumber}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Party</span><span>{voucher.customerName}</span></div>
                <div className="customer-mobile-row"><span className="customer-mobile-label">Created</span><span>{formatVoucherDate(voucher.voucherDate)}</span></div>
                <div className="customer-mobile-actions">
                  <button className="executive-action-btn" onClick={() => handleViewVoucher(voucher)}><Eye size={13} /> View</button>
                  <button className="executive-action-btn" onClick={() => handleEditVoucher(voucher)}><Pencil size={13} /> Edit</button>
                  <button className="executive-action-btn delete" onClick={() => handleDeleteVoucher(voucher)}><Trash2 size={13} /> Delete</button>
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
                  <th>Voucher No</th>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Items</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && vouchers.length === 0 ? <tr><td colSpan="8" className="text-center">Loading vouchers...</td></tr> : null}
                {!loading && filteredVouchers.length === 0 ? <tr><td colSpan="8" className="text-center">{searchText ? 'No matching vouchers found.' : 'No vouchers found.'}</td></tr> : null}
                {pagedVouchers.map((voucher, index) => (
                  <tr key={voucher.id}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td>#{voucher.voucherNumber}</td>
                    <td>{formatVoucherDate(voucher.voucherDate)}</td>
                    <td>{voucher.customerName}</td>
                    <td>{voucher.items?.length || 0}</td>
                    <td>{formatVoucherDate(voucher.voucherDate)}</td>
                    <td><span className="status-badge green">{voucher.status}</span></td>
                    <td><div className="table-actions">
                      <button className="executive-action-btn" onClick={() => handleViewVoucher(voucher)}><Eye size={13} /><span>View</span></button>
                      <button className="executive-action-btn" onClick={() => handleEditVoucher(voucher)}><Pencil size={13} /><span>Edit</span></button>
                      <button className="executive-action-btn delete" onClick={() => handleDeleteVoucher(voucher)}><Trash2 size={13} /><span>Delete</span></button>
                    </div></td>
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

    </div>
  )
}

export default SalesVoucher
