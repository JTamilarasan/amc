import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, Pencil, Search, Trash2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import CommonPagination from '../../components/common/CommonPagination'
import DetailsModal from '../../components/common/DetailsModal'
import Loader from '../../components/common/Loader'
import { fetchCustomers, selectCustomers } from '../../features/customers/customerSlice'
import { fetchExecutives, selectExecutives } from '../../features/executives/executiveSlice'
import { fetchProducts, selectProducts } from '../../features/products/productSlice'
import {
  addSalesVoucher, clearSalesVoucherMessage, editSalesVoucher, fetchNextVoucherNumber,
  fetchSalesVouchers, fetchVoucherSequence, initializeVoucherCounter, removeSalesVoucher,
  selectSalesVoucherState, selectSalesVouchers,
} from '../../features/salesVouchers/salesVoucherSlice'
import { formatDate } from '../../utils/dateUtils'

const todayValue = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const emptyItem = {
  serialNo: '', productId: '', itemName: '', duration: '', unit: '', amcApplicable: false,
  amcFromDate: '', amcToDate: '', amount: '',
}

const calculateAmcToDate = (fromDate, duration, amcApplicable) => {
  if (!amcApplicable || !fromDate || !duration) return ''
  const [year, month, day] = fromDate.split('-').map(Number)
  const monthsToAdd = duration === '6 Months' ? 6 : 12
  const targetMonthIndex = month - 1 + monthsToAdd
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const targetMonth = targetMonthIndex % 12
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate()
  const result = new Date(targetYear, targetMonth, Math.min(day, lastDay))
  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`
}

const SalesVoucher = () => {
  const dispatch = useDispatch()
  const customers = useSelector(selectCustomers)
  const executives = useSelector(selectExecutives)
  const products = useSelector(selectProducts)
  const vouchers = useSelector(selectSalesVouchers)
  const { loading, error, successMessage } = useSelector(selectSalesVoucherState)

  const [manualStartingNumber, setManualStartingNumber] = useState('100')
  const [voucherNumber, setVoucherNumber] = useState('')
  const [voucherDate, setVoucherDate] = useState(todayValue())
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerOpen, setCustomerOpen] = useState(false)
  const [partyError, setPartyError] = useState('')
  const [executiveId, setExecutiveId] = useState('')
  const [executiveName, setExecutiveName] = useState('')
  const [executiveOpen, setExecutiveOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [narration, setNarration] = useState('')
  const [itemForm, setItemForm] = useState(emptyItem)
  const [productSearchText, setProductSearchText] = useState('')
  const [productOpen, setProductOpen] = useState(false)
  const [editingVoucherId, setEditingVoucherId] = useState(null)
  const [formError, setFormError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const voucherLookupId = useRef(0)

  useEffect(() => {
    dispatch(fetchCustomers())
    dispatch(fetchExecutives())
    dispatch(fetchProducts())
    dispatch(fetchSalesVouchers())
  }, [dispatch])

  useEffect(() => {
    const loadSequence = async () => {
      try {
        const sequence = await dispatch(fetchVoucherSequence()).unwrap()
        if (sequence) {
          setManualStartingNumber(String(sequence.startingNumber))
          setVoucherNumber(sequence.nextVoucherNumber)
        } else {
          setVoucherNumber(await dispatch(initializeVoucherCounter(100)).unwrap())
        }
      } catch {
        setFormError('Unable to load the next voucher number.')
      }
    }
    loadSequence()
  }, [dispatch])

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth < 720)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    if (!successMessage && !error) return undefined
    const timer = window.setTimeout(() => dispatch(clearSalesVoucherMessage()), 3000)
    return () => window.clearTimeout(timer)
  }, [successMessage, error, dispatch])

  const filteredCustomers = useMemo(() => {
    const query = customerName.trim().toLowerCase()
    return customers.filter((item) => !query || item.customerName.toLowerCase().includes(query))
  }, [customers, customerName])
  const filteredExecutives = useMemo(() => {
    const query = executiveName.trim().toLowerCase()
    return executives.filter((item) => !query || item.name.toLowerCase().includes(query))
  }, [executives, executiveName])
  const filteredProducts = useMemo(() => {
    const query = productSearchText.trim().toLowerCase()
    return products.filter((item) => !query || item.itemName.toLowerCase().includes(query))
  }, [products, productSearchText])
  const filteredVouchers = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return vouchers.filter((voucher) => !query || String(voucher.voucherNumber).includes(query) || (voucher.customerName || '').toLowerCase().includes(query))
  }, [vouchers, searchText])
  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / pageSize))
  const pagedVouchers = useMemo(() => filteredVouchers.slice((page - 1) * pageSize, page * pageSize), [filteredVouchers, page, pageSize])

  const handleCustomerInput = (value) => {
    const match = customers.find((item) => item.customerName.toLowerCase() === value.trim().toLowerCase())
    setCustomerName(value)
    setCustomerId(match?.id || '')
  }
  const selectCustomer = (customer) => {
    setCustomerId(customer.id); setCustomerName(customer.customerName); setCustomerOpen(false); setPartyError('')
  }
  const handleExecutiveInput = (value) => {
    const match = executives.find((item) => item.name.toLowerCase() === value.trim().toLowerCase())
    setExecutiveName(value)
    setExecutiveId(match?.id || '')
  }
  const selectExecutive = (executive) => {
    setExecutiveId(executive.id); setExecutiveName(executive.name); setExecutiveOpen(false)
  }
  const handleProductInput = (value) => {
    setProductSearchText(value)
    const match = products.find((item) => item.itemName.toLowerCase() === value.trim().toLowerCase())
    setItemForm((current) => ({
      ...current, productId: match?.id || '', itemName: value, unit: match?.unit || '',
      amcApplicable: Boolean(match?.amcApplicable), amcFromDate: '', amcToDate: '',
    }))
  }
  const selectProduct = (product) => {
    setItemForm((current) => ({
      ...current, productId: product.id, itemName: product.itemName, unit: product.unit || '',
      amcApplicable: Boolean(product.amcApplicable), amcFromDate: '', amcToDate: '',
    }))
    setProductSearchText('')
    setProductOpen(false)
  }
  const changeItemField = (field, value) => {
    setItemForm((current) => {
      const next = { ...current, [field]: value }
      if (field === 'duration' || field === 'amcFromDate') {
        next.amcToDate = calculateAmcToDate(next.amcFromDate, next.duration, next.amcApplicable)
      }
      return next
    })
  }
  const resetItemForm = () => { setItemForm(emptyItem); setProductSearchText(''); setProductOpen(false) }

  const clearVoucher = async () => {
    setVoucherDate(todayValue()); setCustomerId(''); setCustomerName(''); setExecutiveId(''); setExecutiveName('')
    setCategory(''); setNarration(''); setEditingVoucherId(null); setFormError(''); setPartyError(''); resetItemForm()
    try {
      const next = await dispatch(fetchNextVoucherNumber(Number(manualStartingNumber))).unwrap()
      if (next != null) setVoucherNumber(next)
    } catch { setFormError('Unable to refresh the next voucher number.') }
  }
  const handleSaveVoucher = async () => {
    setFormError('')
    if (!voucherNumber) return setFormError('Set a valid manual starting number.')
    if (!voucherDate) return setFormError('Voucher date is required.')
    if (!customerId) { setPartyError('Please select a party.'); return }
    if (!executiveId) return setFormError('Select a valid Executive.')
    if (!category) return setFormError('Category is required.')
    if (!itemForm.productId) return setFormError('Select a valid item from Product Master.')
    if (!itemForm.duration) return setFormError('Please select a duration.')
    if (itemForm.amcApplicable && !itemForm.amcFromDate) return setFormError('AMC From Date is required.')
    if (itemForm.amcApplicable && !itemForm.amcToDate) return setFormError('AMC To Date is required.')
    if (itemForm.amcApplicable && itemForm.amcToDate < itemForm.amcFromDate) return setFormError('AMC To Date cannot be earlier than AMC From Date.')
    if (Number(itemForm.amount) <= 0) return setFormError('Amount must be greater than 0.')
    const voucherItem = {
      serialNo: itemForm.serialNo.trim(), productId: itemForm.productId, itemName: itemForm.itemName,
      duration: itemForm.duration, unit: itemForm.unit, amcApplicable: itemForm.amcApplicable,
      amcFromDate: itemForm.amcFromDate, amcToDate: itemForm.amcToDate, amount: Number(itemForm.amount),
    }
    const payload = {
      voucherNumber: Number(voucherNumber), voucherDate, customerId, customerName, executiveId, executiveName, category,
      narration: narration.trim(), items: [voucherItem], totalAmount: Number(itemForm.amount),
    }
    try {
      if (editingVoucherId) {
        await dispatch(editSalesVoucher({ id: editingVoucherId, voucherData: payload })).unwrap()
      } else {
        const saved = await dispatch(addSalesVoucher(payload)).unwrap()
        setVoucherNumber(Number(saved.voucherNumber) + 1)
      }
      await clearVoucher()
    } catch { /* Redux displays the service error. */ }
  }

  const handleStartingNumberChange = async (value) => {
    setManualStartingNumber(value)
    const lookupId = ++voucherLookupId.current
    const start = Number(value)
    if (value === '' || !Number.isFinite(start) || start < 0) { setVoucherNumber(''); return }
    try {
      const next = await dispatch(fetchNextVoucherNumber(start)).unwrap()
      if (lookupId === voucherLookupId.current) setVoucherNumber(next)
    }
    catch { setFormError('Unable to calculate the next voucher number.') }
  }
  const handleStartingNumberBlur = async () => {
    try { setVoucherNumber(await dispatch(initializeVoucherCounter(Number(manualStartingNumber))).unwrap()); setFormError('') }
    catch (reason) { setFormError(typeof reason === 'string' ? reason : 'Unable to set starting number.') }
  }
  const handleEditVoucher = (voucher) => {
    setEditingVoucherId(voucher.id); setVoucherNumber(voucher.voucherNumber); setVoucherDate(voucher.voucherDate)
    setCustomerId(voucher.customerId || ''); setCustomerName(voucher.customerName || '')
    setExecutiveId(voucher.executiveId || ''); setExecutiveName(voucher.executiveName || '')
    setCategory(voucher.category || ''); setNarration(voucher.narration || '')
    const item = voucher.items?.[0] || voucher.item
    setItemForm(item ? { ...emptyItem, ...item, amount: String(item.amount || '') } : emptyItem)
    setFormError(''); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleDeleteVoucher = async (voucher) => {
    if (!window.confirm(`Delete sales voucher #${voucher.voucherNumber}?`)) return
    await dispatch(removeSalesVoucher(voucher.id)).unwrap()
    setVoucherNumber(await dispatch(fetchNextVoucherNumber(Number(manualStartingNumber))).unwrap())
  }
  const getVoucherItemNames = (voucher) => {
    if (Array.isArray(voucher.items)) return voucher.items.map((item) => item?.itemName).filter(Boolean).join(', ') || '—'
    return voucher.item?.itemName || '—'
  }
  const handleViewVoucher = (voucher) => { setSelectedVoucher(voucher); setViewModalOpen(true) }
  const handleCloseView = () => { setViewModalOpen(false); setSelectedVoucher(null) }
  const selectedVoucherItem = selectedVoucher?.items?.[0] || selectedVoucher?.item || null
  const displayValue = (value) => value === undefined || value === null || value === '' ? '—' : value
  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === '') return '—'
    const amount = Number(value)
    return Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : '—'
  }

  return <div className="page-stack">
    <PageHeader title="Sales Voucher" subtitle="Create sales and AMC vouchers." />
    <section className="panel-card form-card">
      <div className="form-grid two-col" style={{ gap: 18 }}>
        <label className="field"><span>Manual Starting Number</span><input type="number" min="0" value={manualStartingNumber} onChange={(event) => handleStartingNumberChange(event.target.value)} onBlur={handleStartingNumberBlur} disabled={Boolean(editingVoucherId)} /></label>
        <label className="field"><span>Voucher Number</span><input value={voucherNumber} readOnly disabled /></label>
        <label className="field"><span>Date</span><input type="date" value={voucherDate} onChange={(event) => setVoucherDate(event.target.value)} /></label>
        <label className="field"><span>Party Name *</span><div className="searchable-select">
          <input value={customerName} onChange={(event) => { handleCustomerInput(event.target.value); setCustomerOpen(true) }} onFocus={() => setCustomerOpen(true)} onBlur={() => window.setTimeout(() => setCustomerOpen(false), 150)} placeholder="Search and select customer" autoComplete="off" />
          {customerOpen && <div className="searchable-options">{filteredCustomers.length ? filteredCustomers.map((customer) => <button type="button" key={customer.id} onMouseDown={() => selectCustomer(customer)}>{customer.customerName}</button>) : <div className="searchable-empty">No matching customers</div>}</div>}
        </div>{partyError && <div className="field-message">{partyError}</div>}</label>
        <label className="field"><span>Executive *</span><div className="searchable-select">
          <input value={executiveName} onChange={(event) => { handleExecutiveInput(event.target.value); setExecutiveOpen(true) }} onFocus={() => setExecutiveOpen(true)} onBlur={() => window.setTimeout(() => setExecutiveOpen(false), 150)} placeholder="Search and select executive" autoComplete="off" />
          {executiveOpen && <div className="searchable-options">{filteredExecutives.length ? filteredExecutives.map((executive) => <button type="button" key={executive.id} onMouseDown={() => selectExecutive(executive)}>{executive.name}</button>) : <div className="searchable-empty">No matching executives</div>}</div>}
        </div></label>
        <label className="field"><span>Category *</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Select category</option><option value="New">New</option><option value="Renewal">Renewal</option></select></label>
      </div>
      <label className="field"><span>Narration</span><textarea value={narration} onChange={(event) => setNarration(event.target.value)} placeholder="Enter voucher narration..." /></label>

      <div className="panel-heading voucher-products-heading"><h2>Item Details</h2></div>
      <div className="form-grid voucher-item-grid">
        <label className="field compact-field"><span>Serial No</span><input value={itemForm.serialNo} onChange={(event) => changeItemField('serialNo', event.target.value)} placeholder="SN001" /></label>
        <label className="field"><span>Item *</span><div className="searchable-select">
          <input value={itemForm.itemName} onChange={(event) => { handleProductInput(event.target.value); setProductOpen(true) }} onFocus={(event) => { setProductSearchText(''); setProductOpen(true); event.currentTarget.select() }} onBlur={() => window.setTimeout(() => setProductOpen(false), 150)} placeholder="Search and select product" autoComplete="off" />
          {productOpen && <div className="searchable-options">{filteredProducts.length ? filteredProducts.map((product) => <button type="button" key={product.id} onMouseDown={() => selectProduct(product)}>{product.itemName}</button>) : <div className="searchable-empty">No matching products</div>}</div>}
        </div></label>
        <label className="field"><span>Duration *</span><select value={itemForm.duration} onChange={(event) => changeItemField('duration', event.target.value)}><option value="">Select duration</option><option value="6 Months">6 Months</option><option value="1 Year">1 Year</option></select></label>
        <label className="field"><span>Unit</span><input value={itemForm.unit} readOnly /></label>
        <label className="field"><span>AMC</span><input value={itemForm.amcApplicable ? 'Yes' : 'No'} readOnly /></label>
        <label className="field"><span>Amount *</span><input type="number" min="0.01" step="0.01" value={itemForm.amount} onChange={(event) => changeItemField('amount', event.target.value)} placeholder="Amount" /></label>
        <label className="field"><span>AMC From{itemForm.amcApplicable ? ' *' : ''}</span><input type="date" value={itemForm.amcFromDate} onChange={(event) => changeItemField('amcFromDate', event.target.value)} /></label>
        <label className="field"><span>AMC To{itemForm.amcApplicable ? ' *' : ''}</span><input type="date" min={itemForm.amcFromDate || undefined} value={itemForm.amcToDate} onChange={(event) => changeItemField('amcToDate', event.target.value)} /></label>
      </div>
      {(formError || error || successMessage) && <div className={successMessage && !formError && !error ? 'auth-success' : 'auth-error'} style={{ marginTop: 12 }}>{formError || error || successMessage}</div>}
      <div className="form-actions voucher-save-actions"><Button type="button" onClick={handleSaveVoucher} disabled={loading}>{loading ? 'Saving...' : editingVoucherId ? 'Update Voucher' : 'Save Voucher'}</Button><Button type="button" variant="secondary" onClick={clearVoucher} disabled={loading}>Clear</Button></div>
    </section>

    <section className="panel-card" style={{ marginTop: 18 }}>
      <div className="panel-heading"><h2>Recent Sales Vouchers</h2><span>Saved voucher history</span></div>
      <div className="toolbar" style={{ marginBottom: 12 }}><div className="search-box" style={{ width: '100%' }}><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1) }} placeholder="Search by voucher number or customer..." /></div><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></div>
      {loading && !vouchers.length ? <Loader size="small" label="Loading vouchers..." /> : isMobile ? <div className="customer-mobile-list">{pagedVouchers.map((voucher) => <div className="customer-mobile-card" key={voucher.id}>
        <div className="customer-mobile-row"><span className="customer-mobile-label">Voucher</span><span>#{voucher.voucherNumber}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Party</span><span>{voucher.customerName}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Executive</span><span>{voucher.executiveName || '—'}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Category</span><span>{voucher.category || '—'}</span></div><div className="customer-mobile-row"><span className="customer-mobile-label">Created</span><span>{formatDate(voucher.voucherDate)}</span></div>
        <div className="customer-mobile-actions"><button className="executive-action-btn" onClick={() => handleViewVoucher(voucher)}><Eye size={13} /> View</button><button className="executive-action-btn" onClick={() => handleEditVoucher(voucher)}><Pencil size={13} /> Edit</button><button className="executive-action-btn delete" onClick={() => handleDeleteVoucher(voucher)}><Trash2 size={13} /> Delete</button></div>
      </div>)}</div> : <div className="table-wrap"><table><thead><tr><th>S.No</th><th>Voucher No</th><th>Date</th><th>Party Name</th><th>Executive</th><th>Category</th><th>Items</th><th>Created Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {loading && !vouchers.length && <tr><td colSpan="10"><Loader size="small" label="Loading vouchers..." /></td></tr>}{!loading && !filteredVouchers.length && <tr><td colSpan="10" className="text-center">{searchText ? 'No matching vouchers found.' : 'No vouchers found.'}</td></tr>}
        {pagedVouchers.map((voucher, index) => <tr key={voucher.id}><td>{(page - 1) * pageSize + index + 1}</td><td>#{voucher.voucherNumber}</td><td>{formatDate(voucher.voucherDate)}</td><td>{voucher.customerName}</td><td>{voucher.executiveName || '—'}</td><td>{voucher.category || '—'}</td><td>{getVoucherItemNames(voucher)}</td><td>{formatDate(voucher.voucherDate)}</td><td><span className="status-badge green">{voucher.status}</span></td><td><div className="table-actions"><button className="executive-action-btn" onClick={() => handleViewVoucher(voucher)}><Eye size={13} /> View</button><button className="executive-action-btn" onClick={() => handleEditVoucher(voucher)}><Pencil size={13} /> Edit</button><button className="executive-action-btn delete" onClick={() => handleDeleteVoucher(voucher)}><Trash2 size={13} /> Delete</button></div></td></tr>)}
      </tbody></table></div>}
      <CommonPagination currentPage={page} totalPages={totalPages} totalRecords={filteredVouchers.length} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(totalPages, current + 1))} className="history-pagination" />
    </section>

    <DetailsModal isOpen={viewModalOpen} title="Sales Voucher Details" onClose={handleCloseView}>
      {selectedVoucher && <>
        <div className="voucher-modal-number">Voucher #{displayValue(selectedVoucher.voucherNumber)}</div>
        <h3 className="details-section-title">Voucher Information</h3>
        <div className="details-grid">
          <div className="detail-field"><span>Voucher Number</span><strong>#{displayValue(selectedVoucher.voucherNumber)}</strong></div>
          <div className="detail-field"><span>Voucher Date</span><strong>{formatDate(selectedVoucher.voucherDate)}</strong></div>
          <div className="detail-field"><span>Party Name</span><strong>{displayValue(selectedVoucher.customerName)}</strong></div>
          <div className="detail-field"><span>Executive</span><strong>{displayValue(selectedVoucher.executiveName)}</strong></div>
          <div className="detail-field"><span>Category</span><strong>{displayValue(selectedVoucher.category)}</strong></div>
          <div className="detail-field"><span>Status</span><strong>{displayValue(selectedVoucher.status)}</strong></div>
          <div className="detail-field detail-field-wide"><span>Narration</span><strong>{displayValue(selectedVoucher.narration)}</strong></div>
          <div className="detail-field"><span>Created Date</span><strong>{formatDate(selectedVoucher.voucherDate)}</strong></div>
        </div>
        <h3 className="details-section-title">Item Details</h3>
        <div className="details-grid">
          <div className="detail-field"><span>Serial No</span><strong>{displayValue(selectedVoucherItem?.serialNo)}</strong></div>
          <div className="detail-field"><span>Item</span><strong>{displayValue(selectedVoucherItem?.itemName)}</strong></div>
          <div className="detail-field"><span>Duration</span><strong>{displayValue(selectedVoucherItem?.duration)}</strong></div>
          <div className="detail-field"><span>Unit</span><strong>{displayValue(selectedVoucherItem?.unit)}</strong></div>
          <div className="detail-field"><span>AMC</span><strong>{selectedVoucherItem ? selectedVoucherItem.amcApplicable ? 'Yes' : 'No' : '—'}</strong></div>
          <div className="detail-field"><span>Amount</span><strong>{formatCurrency(selectedVoucherItem?.amount)}</strong></div>
          <div className="detail-field"><span>AMC From</span><strong>{formatDate(selectedVoucherItem?.amcFromDate)}</strong></div>
          <div className="detail-field"><span>AMC To</span><strong>{formatDate(selectedVoucherItem?.amcToDate)}</strong></div>
        </div>
      </>}
    </DetailsModal>
  </div>
}

export default SalesVoucher
