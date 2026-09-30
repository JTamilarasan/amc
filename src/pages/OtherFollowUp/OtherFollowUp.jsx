import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const executiveName = userProfile?.displayName || userProfile?.name || user?.displayName || user?.email || ''
  const initialForm = () => ({ date: today(), status: 'Open', remarks: '' })
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { setForm(initialForm()) }, [user?.uid])

  const save = async (event) => {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      await otherFollowUpService.createOtherFollowUp({ ...form, userId: user?.uid || '', executiveName })
      setForm(initialForm())
      setMessage('Other follow-up saved successfully.')
    } catch (reason) {
      setError(reason.message || 'Unable to save other follow-up.')
    } finally { setSaving(false) }
  }

  const cancel = () => { setForm(initialForm()); setError(''); setMessage(''); navigate('/dashboard/other-follow-up') }

  return <div className="page-stack">
    <PageHeader title="Other Follow Up" subtitle="Record and track follow-ups outside the regular voucher flow." action={<Button type="button" variant="secondary" onClick={() => navigate('/reports/other-follow-up')}>View Report</Button>} />
    <form className="panel-card form-card" onSubmit={save}>
      <div className="panel-heading"><h2>Follow Up Details</h2><span>Enter the executive, date, status, and remarks.</span></div>
      <div className="form-grid two-col" style={{ gap: 18 }}>
        <label className="field"><span>Executive</span><input value={executiveName} readOnly disabled /></label>
        <label className="field"><span>Date *</span><input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required /></label>
        <label className="field"><span>Status *</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="Open">Open</option><option value="Closed">Closed</option></select></label>
        <label className="field"><span>Remarks</span><textarea value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} rows={4} placeholder="Enter follow-up remarks" /></label>
      </div>
      {(error || message) && <div className={message ? 'auth-success' : 'auth-error'} style={{ marginTop: 12 }}>{message || error}</div>}
      <div className="form-actions voucher-save-actions">{canAdd && <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>}<Button type="button" variant="secondary" onClick={cancel} disabled={saving}>Cancel</Button></div>
    </form>
  </div>
}

export default OtherFollowUp
