import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { fetchExecutives, selectActiveExecutives } from '../../features/executives/executiveSlice'
import { callReceiptVoucherService } from '../../services/callReceiptVoucherService'
import { callAllocationVoucherService } from '../../services/callAllocationVoucherService'
import { formatDate } from '../../utils/dateUtils'

const todayValue = () => new Date().toLocaleDateString('en-CA')

const CallAllocationVoucher = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const executives = useSelector(selectActiveExecutives)
  const routedCall = location.state?.call
  const [allocationVoucherNumber, setAllocationVoucherNumber] = useState('')
  const [date, setDate] = useState(todayValue())
  const [executiveId, setExecutiveId] = useState(routedCall?.executiveId || '')
  const [executiveName, setExecutiveName] = useState(routedCall?.executiveName || '')
  const [executiveOpen, setExecutiveOpen] = useState(false)
  const [narration, setNarration] = useState('')
  const [calls, setCalls] = useState(routedCall ? [routedCall] : [])
  const [selectedCallId, setSelectedCallId] = useState(routedCall?.id || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [number, openCalls] = await Promise.all([
        callAllocationVoucherService.getNextCallAllocationVoucherNumber(),
        routedCall ? Promise.resolve([routedCall]) : callReceiptVoucherService.getOpenUnallocatedCalls(),
      ])
      setAllocationVoucherNumber(number)
      setCalls(openCalls)
    } catch (error) { setErrors({ form: error.message || 'Unable to load calls available for allocation.' }) }
    finally { setLoading(false) }
  }
  useEffect(() => {
    let active = true
    dispatch(fetchExecutives())
    Promise.all([
      callAllocationVoucherService.getNextCallAllocationVoucherNumber(),
      routedCall ? Promise.resolve([routedCall]) : callReceiptVoucherService.getOpenUnallocatedCalls(),
    ]).then(([number, openCalls]) => {
      if (!active) return
      setAllocationVoucherNumber(number); setCalls(openCalls); setLoading(false)
    }).catch((error) => {
      if (!active) return
      setErrors({ form: error.message || 'Unable to load calls available for allocation.' }); setLoading(false)
    })
    return () => { active = false }
  }, [dispatch, routedCall])
  const filteredExecutives = useMemo(() => executives.filter((item) => !executiveName || item.name.toLowerCase().includes(executiveName.toLowerCase())), [executives, executiveName])
  const selectedCall = calls.find((call) => call.id === selectedCallId)
  const changeExecutive = (value) => {
    const match = executives.find((item) => item.name.toLowerCase() === value.trim().toLowerCase())
    setExecutiveName(value); setExecutiveId(match?.id || ''); setErrors((current) => ({ ...current, executiveId: '' }))
  }
  const reset = async () => {
    setDate(todayValue()); setExecutiveId(''); setExecutiveName(''); setNarration(''); setSelectedCallId(''); setErrors({}); setMessage('')
    if (routedCall) navigate('/call-management/call-receipt-voucher')
    else await loadData()
  }
  const handleSave = async () => {
    const next = {}
    if (!executiveId) next.executiveId = 'Select a valid executive.'
    if (!selectedCall) next.call = 'Select one valid call to allocate.'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    try {
      const saved = await callAllocationVoucherService.createCallAllocationVoucher({
        date, executiveId, executiveName, narration, callReceiptVoucherId: selectedCall.id,
        callNumber: selectedCall.voucherNumber, partyId: selectedCall.partyId, partyName: selectedCall.partyName,
        receiptDate: selectedCall.date, callSubStatus: selectedCall.callSubStatus, nextAction: selectedCall.nextAction,
        actionDate: selectedCall.when, actionTime: '',
      })
      setMessage(`Allocation voucher #${saved.allocationVoucherNumber} saved successfully.`)
      setNarration(''); setSelectedCallId(''); setCalls((current) => current.filter((call) => call.id !== selectedCall.id))
      setAllocationVoucherNumber(Number(saved.allocationVoucherNumber) + 1)
    } catch (error) { setErrors({ form: error.message || 'Unable to save the allocation voucher.' }) }
    finally { setSaving(false) }
  }

  return <div className="page-stack">
    <PageHeader title="Add Call Allocation Voucher" subtitle="Assign an open customer call to an executive." />
    <section className="panel-card form-card">
      <div className="form-grid two-col" style={{ gap: 18 }}>
        <label className="field"><span>Allocation Voucher Number</span><input value={allocationVoucherNumber} readOnly disabled /></label>
        <label className="field"><span>Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="field"><span>Executive *</span><div className="searchable-select"><input value={executiveName} onChange={(event) => { changeExecutive(event.target.value); setExecutiveOpen(true) }} onFocus={() => setExecutiveOpen(true)} onBlur={() => window.setTimeout(() => setExecutiveOpen(false), 150)} placeholder="Search and select executive" autoComplete="off" />{executiveOpen && <div className="searchable-options">{filteredExecutives.length ? filteredExecutives.map((executive) => <button type="button" key={executive.id} onMouseDown={() => { setExecutiveId(executive.id); setExecutiveName(executive.name); setExecutiveOpen(false); setErrors((current) => ({ ...current, executiveId: '' })) }}>{executive.name}</button>) : <div className="searchable-empty">No matching executives</div>}</div>}</div>{errors.executiveId && <div className="field-message">{errors.executiveId}</div>}</label>
        <label className="field"><span>Narration</span><textarea value={narration} onChange={(event) => setNarration(event.target.value)} placeholder="Enter allocation narration..." /></label>
      </div>
    </section>
    <section className="panel-card">
      <div className="panel-heading"><h2>Calls Available for Allocation</h2><span>Select one call</span></div>
      {loading ? <Loader size="small" label="Loading open calls..." /> : <div className="table-wrap call-allocation-table"><table><thead><tr><th aria-label="Select call"></th><th>S.No</th><th>Call No</th><th>Receipt Date</th><th>Contact / Party</th><th>Sub Status</th><th>Next Action</th><th>Action Date</th><th>Action Time</th></tr></thead><tbody>
        {!calls.length && <tr><td colSpan="9" className="text-center">No open unallocated calls found.</td></tr>}
        {calls.map((call, index) => <tr key={call.id} className={selectedCallId === call.id ? 'selected-call-row' : ''} onClick={() => { setSelectedCallId(call.id); setErrors((current) => ({ ...current, call: '' })) }}><td><input type="radio" name="selectedCall" checked={selectedCallId === call.id} onChange={() => setSelectedCallId(call.id)} aria-label={`Select call ${call.voucherNumber}`} /></td><td>{index + 1}</td><td>#{call.voucherNumber}</td><td>{formatDate(call.date)}</td><td>{call.partyName}</td><td>{call.callSubStatus || '—'}</td><td>{call.nextAction || '—'}</td><td>{formatDate(call.when)}</td><td>{call.actionTime || '—'}</td></tr>)}
      </tbody></table></div>}
      {errors.call && <div className="field-message">{errors.call}</div>}{errors.form && <div className="field-message" style={{ marginTop: 12 }}>{errors.form}</div>}{message && <div className="auth-success" style={{ marginTop: 12 }}>{message}</div>}
      <div className="form-actions voucher-save-actions"><Button type="button" onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving...' : 'Save'}</Button><Button type="button" variant="secondary" onClick={reset} disabled={saving}>Cancel</Button></div>
    </section>
  </div>
}

export default CallAllocationVoucher
