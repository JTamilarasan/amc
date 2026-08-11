import { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

const DetailsModal = ({ isOpen, title, onClose, children, size = 'large' }) => {
  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="details-modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={`details-modal details-modal-${size}`} role="dialog" aria-modal="true" aria-labelledby="details-modal-title">
        <header className="details-modal-header">
          <h2 id="details-modal-title">{title}</h2>
          <button type="button" className="details-modal-close" onClick={onClose} aria-label="Close modal"><X size={20} /></button>
        </header>
        <div className="details-modal-body">{children}</div>
        <footer className="details-modal-footer"><Button type="button" variant="secondary" onClick={onClose}>Close</Button></footer>
      </section>
    </div>
  )
}

export default DetailsModal
