import { useState } from 'react'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<{ error: string | null }>
}

const CONFIRM_PHRASE = 'DELETE'

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) {
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleClose = () => {
    setInput('')
    setError(null)
    onClose()
  }

  const handleConfirm = async () => {
    if (input.trim() !== CONFIRM_PHRASE) {
      setError(`Type ${CONFIRM_PHRASE} to confirm`)
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: err } = await onConfirm()
    setSubmitting(false)
    if (err) {
      setError(err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6">
        <p className="font-pixel text-[11px] uppercase tracking-[0.15em] text-[var(--danger)] mb-2">
          Danger zone
        </p>
        <h3 className="font-display text-2xl text-[var(--text-primary)] mb-3">Delete your account</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
          Your profile will be hidden from everyone immediately, all your connections will be
          closed, and your data will be permanently deleted after 30 days. You can sign back in
          within that window to cancel.
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mb-3">
          Type <span className="font-mono text-[var(--danger)]">{CONFIRM_PHRASE}</span> to confirm.
        </p>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={CONFIRM_PHRASE}
          className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:border-[var(--danger)] mb-4 font-mono"
        />

        {error && <p className="text-xs text-[var(--danger)] mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--bg-surface-hover)] disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || input.trim() !== CONFIRM_PHRASE}
            className="flex-1 py-2.5 rounded-lg bg-[var(--danger)] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </div>
    </div>
  )
}
