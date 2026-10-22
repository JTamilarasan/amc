import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { otherFollowUpService } from '../../services/otherFollowUpService'

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const OtherFollowUp = () => {
  const { user, userProfile, hasPermission } = useAuth()
  const canAdd = hasPermission('otherFollowUps', 'add')
  const canEdit = hasPermission('otherFollowUps', 'edit')
  const navigate = useNavigate()
  const location = useLocation()
  const editingId = location.state?.editOtherFollowUpId || ''
  const returnTo = location.state?.returnTo || ''
  const returnState = location.state?.returnState || {}
  const executiveName = userProfile?.displayName || userProfile?.name || user?.displayName || user?.email || ''
  const initialForm = () => ({ date: today(), status: 'Open', remarks: '' })
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loadingRecord, setLoadingRecord] = useState(Boolean(editingId))

  useEffect(() => {
    let active = true
    setForm(initialForm())
    setError('')
    setMessage('')
    if (!editingId || !user?.uid) { setLoadingRecord(false); return () => { active = false } }
    setLoadingRecord(true)
    otherFollowUpService.getOtherFollowUps(user.uid).then((items) => {
      if (!active) return
      const record = items.find((item) => item.id === editingId)
      if (!record) { setError('Unable to find this follow-up record.'); return }
      setForm({ date: record.date || today(), status: record.status || 'Open', remarks: record.remarks || '' })
    }).catch(() => { if (active) setError('Unable to load this follow-up record.') }).finally(() => { if (active) setLoadingRecord(false) })
    return () => { active = false }
  }, [user?.uid, editingId])

  const save = async (event) => {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      if (editingId) {
        if (!canEdit) throw new Error('You do not have permission to edit follow-up records.')
        await otherFollowUpService.updateOtherFollowUp(editingId, form)
        if (returnTo) {
          navigate(returnTo, { replace: true, state: { ...returnState, message: 'Follow-up updated successfully.' } })
          return
        }
        setMessage('Other follow-up updated successfully.')
      } else {
        await otherFollowUpService.createOtherFollowUp({ ...form, userId: user?.uid || '', executiveName })
        setForm(initialForm())
        setMessage('Other follow-up saved successfully.')
      }
    } catch (reason) {
      setError(reason.message || 'Unable to save other follow-up.')
    } finally { setSaving(false) }
  }

  const cancel = () => { setForm(initialForm()); setError(''); setMessage(''); navigate(returnTo || '/dashboard/other-follow-up', { state: returnTo ? returnState : undefined }) }

  return <div className="page-stack">
    <PageHeader title={editingId ? 'Edit Other Follow Up' : 'Other Follow Up'} subtitle="Record and track follow-ups outside the regular voucher flow." action={<Button type="button" variant="secondary" onClick={() => navigate('/reports/other-follow-up')}>View Report</Button>} />
    <form className="panel-card form-card" onSubmit={save}>
      <div className="panel-heading"><h2>{editingId ? 'Edit Follow Up Details' : 'Follow Up Details'}</h2><span>Enter the executive, date, status, and remarks.</span></div>
      <div className="form-grid two-col" style={{ gap: 18 }}>
        <label className="field"><span>Executive</span><input value={executiveName} readOnly disabled /></label>
        <label className="field"><span>Date *</span><input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required /></label>
        <label className="field"><span>Status *</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="Open">Open</option><option value="Closed">Closed</option></select></label>
        <label className="field"><span>Remarks</span><textarea value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} rows={4} placeholder="Enter follow-up remarks" /></label>
      </div>
      {(error || message) && <div className={message ? 'auth-success' : 'auth-error'} style={{ marginTop: 12 }}>{message || error}</div>}
      <div className="form-actions voucher-save-actions">{(editingId ? canEdit : canAdd) && <Button type="submit" disabled={saving || loadingRecord}>{saving ? (editingId ? 'Updating...' : 'Saving...') : editingId ? 'Update' : 'Save'}</Button>}<Button type="button" variant="secondary" onClick={cancel} disabled={saving}>{editingId ? 'Back' : 'Cancel'}</Button></div>
    </form>
  </div>
}

export default OtherFollowUp
