import { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

const CommonConfirmModal = ({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, loading = false }) => {
  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => { if (event.key === 'Escape' && !loading) onCancel() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, loading, onCancel])

  if (!isOpen) return null
  return <div className="details-modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onCancel() }}>
    <section className="details-modal details-modal-small" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <header className="details-modal-header"><h2 id="confirm-modal-title">{title}</h2><button type="button" className="details-modal-close" onClick={onCancel} disabled={loading} aria-label="Close modal"><X size={20} /></button></header>
      <div className="details-modal-body"><p className="confirm-modal-message">{message}</p></div>
      <footer className="details-modal-footer confirm-modal-actions"><Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>{cancelText}</Button><Button type="button" onClick={onConfirm} disabled={loading}>{loading ? 'Saving...' : confirmText}</Button></footer>
    </section>
  </div>
}

export default CommonConfirmModal
