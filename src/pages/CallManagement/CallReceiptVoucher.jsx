import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { fetchCustomers, selectActiveCustomers } from '../../features/customers/customerSlice'
import { fetchExecutives, selectActiveExecutives } from '../../features/executives/executiveSlice'
import { callReceiptVoucherService } from '../../services/callReceiptVoucherService'

const todayValue = () => new Date().toLocaleDateString('en-CA')
const initialForm = () => ({ date: todayValue(), partyId: '', partyName: '', customerExpiryDate: null, executiveId: '', executiveName: '', category: '', callReceiptRemarks: '', callStatus: '', callSubStatus: '', nextAction: '', when: '' })
const voucherDatePart = (date) => (date || '').split('-').reverse().join('-')

const CallReceiptVoucher = () => {
  const dispatch = useDispatch()
  const customers = useSelector(selectActiveCustomers)
  const executives = useSelector(selectActiveExecutives)
  const [voucherNumber, setVoucherNumber] = useState('')
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [customerOpen, setCustomerOpen] = useState(false)
  const [executiveOpen, setExecutiveOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadNextNumber = async () => {
    try { setVoucherNumber(await callReceiptVoucherService.getNextCallReceiptVoucherNumber()) }
    catch { setErrors({ voucherNumber: 'Unable to load the next voucher number.' }) }
  }
  useEffect(() => {
    let active = true
    dispatch(fetchCustomers()); dispatch(fetchExecutives())
    callReceiptVoucherService.getNextCallReceiptVoucherNumber()
      .then((number) => { if (active) setVoucherNumber(number) })
      .catch(() => { if (active) setErrors({ voucherNumber: 'Unable to load the next voucher number.' }) })
    return () => { active = false }
  }, [dispatch])
  const filteredCustomers = useMemo(() => customers.filter((item) => !form.partyName || item.customerName.toLowerCase().includes(form.partyName.toLowerCase())), [customers, form.partyName])
  const filteredExecutives = useMemo(() => executives.filter((item) => !form.executiveName || item.name.toLowerCase().includes(form.executiveName.toLowerCase())), [executives, form.executiveName])
  const setField = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: '' })); setMessage('') }
  const validate = () => {
    const next = {}
    if (!form.partyId) next.partyId = 'Select a valid party from Customer Master.'
    if (!form.executiveId) next.executiveId = 'Select a valid executive.'
    if (!form.category) next.category = 'Category is required.'
    if (!form.callStatus) next.callStatus = 'Call status is required.'
    if (!form.callSubStatus) next.callSubStatus = 'Call sub status is required.'
    if (form.callStatus === 'Open' && !form.nextAction) next.nextAction = 'Next action is required.'
    if (form.callStatus === 'Open' && form.nextAction && !form.when) next.when = 'Action date is required.'
    setErrors(next)
    return !Object.keys(next).length
  }
  const reset = async () => { setForm(initialForm()); setErrors({}); setMessage(''); await loadNextNumber() }
  const save = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const saved = await callReceiptVoucherService.createCallReceiptVoucher(form)
      await reset(); setMessage(`Call receipt voucher ${saved.voucherNumber} saved successfully.`)
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

  return <div className="page-stack">
    <PageHeader title="Call Receipt Voucher" subtitle="Record customer support and installation calls." />
    <section className="panel-card form-card">
      <div className="form-grid two-col" style={{ gap: 18 }}>
        <label className="field"><span>Voucher Number / Date</span><input value={voucherNumber && form.date ? `${voucherNumber}/${voucherDatePart(form.date)}` : ''} readOnly disabled />{errors.voucherNumber && <div className="field-message">{errors.voucherNumber}</div>}</label>
        <label className="field"><span>Date</span><input type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} /></label>
        <label className="field"><span>Party Name *</span><div className="searchable-select"><input value={form.partyName} onChange={(event) => { changeCustomer(event.target.value); setCustomerOpen(true) }} onFocus={() => setCustomerOpen(true)} onBlur={() => window.setTimeout(() => setCustomerOpen(false), 150)} placeholder="Search and select customer" autoComplete="off" />{customerOpen && <div className="searchable-options">{filteredCustomers.length ? filteredCustomers.map((customer) => <button type="button" key={customer.id} onMouseDown={async () => { setForm((current) => ({ ...current, partyId: customer.id, partyName: customer.customerName, customerExpiryDate: null })); setErrors((current) => ({ ...current, partyId: '' })); setCustomerOpen(false); const expiry = await callReceiptVoucherService.getCustomerExpiryDate(customer.id); setForm((current) => current.partyId === customer.id ? { ...current, customerExpiryDate: expiry } : current) }}>{customer.customerName}</button>) : <div className="searchable-empty">No matching customers</div>}</div>}</div>{errors.partyId && <div className="field-message">{errors.partyId}</div>}</label>
        <label className="field"><span>Executive *</span><div className="searchable-select"><input value={form.executiveName} onChange={(event) => { changeExecutive(event.target.value); setExecutiveOpen(true) }} onFocus={() => setExecutiveOpen(true)} onBlur={() => window.setTimeout(() => setExecutiveOpen(false), 150)} placeholder="Search and select executive" autoComplete="off" />{executiveOpen && <div className="searchable-options">{filteredExecutives.length ? filteredExecutives.map((executive) => <button type="button" key={executive.id} onMouseDown={() => { setForm((current) => ({ ...current, executiveId: executive.id, executiveName: executive.name })); setErrors((current) => ({ ...current, executiveId: '' })); setExecutiveOpen(false) }}>{executive.name}</button>) : <div className="searchable-empty">No matching executives</div>}</div>}</div>{errors.executiveId && <div className="field-message">{errors.executiveId}</div>}</label>
        <label className="field"><span>Category *</span><select value={form.category} onChange={(event) => setField('category', event.target.value)}><option value="">Select category</option><option>Support</option><option>Installation</option><option>Monthly Backup</option></select>{errors.category && <div className="field-message">{errors.category}</div>}</label>
        <label className="field"><span>Call Status *</span><select value={form.callStatus} onChange={(event) => changeStatus(event.target.value)}><option value="">Select status</option><option>Open</option><option>Closed</option></select>{errors.callStatus && <div className="field-message">{errors.callStatus}</div>}</label>
        <label className="field"><span>Call Sub Status *</span><select value={form.callSubStatus} onChange={(event) => setField('callSubStatus', event.target.value)}><option value="">Select sub status</option><option>Successful</option><option>Unsuccessful</option><option>Cancelled</option></select>{errors.callSubStatus && <div className="field-message">{errors.callSubStatus}</div>}</label>
        {form.callStatus === 'Open' && <label className="field"><span>Next Action *</span><select value={form.nextAction} onChange={(event) => setField('nextAction', event.target.value)}><option value="">Select next action</option><option>Call</option><option>Visit</option></select>{errors.nextAction && <div className="field-message">{errors.nextAction}</div>}</label>}
        {form.callStatus === 'Open' && <label className="field"><span>When *</span><input type="date" value={form.when} onChange={(event) => setField('when', event.target.value)} />{errors.when && <div className="field-message">{errors.when}</div>}</label>}
      </div>
      <label className="field" style={{ marginTop: 18 }}><span>Call Receipt Remarks</span><textarea value={form.callReceiptRemarks} onChange={(event) => setField('callReceiptRemarks', event.target.value)} placeholder="Enter call receipt remarks..." /></label>
      {errors.form && <div className="field-message" style={{ marginTop: 12 }}>{errors.form}</div>}{message && <div className="auth-success" style={{ marginTop: 12 }}>{message}</div>}
      <div className="form-actions voucher-save-actions"><Button type="button" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button><Button type="button" variant="secondary" onClick={reset} disabled={saving}>Cancel</Button></div>
    </section>
  </div>
}

export default CallReceiptVoucher
