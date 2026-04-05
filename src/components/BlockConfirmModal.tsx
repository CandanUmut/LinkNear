import { useState } from 'react'

interface BlockConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<{ error: string | null }>
  targetName: string
}

export default function BlockConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  targetName,
}: BlockConfirmModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    setReason('')
    setError(null)
    setConfirmed(false)
    onClose()
  }

  const handleConfirm = async () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: err } = await onConfirm(reason.trim())
    setSubmitting(false)
    if (err) {
      setError(err)
    } else {
      handleClose()
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
          Block user
        </p>
        <h3 className="font-display text-2xl text-[var(--text-primary)] mb-3">
          Block {targetName}?
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
          They will no longer see your profile in discovery, can't send you connection requests,
          and any existing connection between you will be closed. They won't be notified.
        </p>

        <label className="block text-xs text-[var(--text-tertiary)] mb-1.5">
          Reason (optional, only visible to you)
        </label>
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value.slice(0, 200))}
          placeholder="Why are you blocking this user?"
          className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:border-[var(--accent-primary)] mb-4"
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
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg bg-[var(--danger)] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Blocking…' : confirmed ? 'Confirm block' : 'Block'}
          </button>
        </div>
      </div>
    </div>
  )
}
