import { useState } from 'react'
import type { ReportCategory } from '../types'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (category: ReportCategory, details: string) => Promise<{ error: string | null }>
  targetName: string
}

const CATEGORIES: { value: ReportCategory; label: string; description: string }[] = [
  { value: 'harassment', label: 'Harassment', description: 'Bullying, threats, or unwanted contact' },
  { value: 'spam', label: 'Spam', description: 'Promotional or repetitive messages' },
  { value: 'inappropriate', label: 'Inappropriate content', description: 'Explicit, offensive, or illegal material' },
  { value: 'fake', label: 'Fake profile', description: 'Impersonation or misrepresentation' },
  { value: 'underage', label: 'Underage user', description: 'Account appears to belong to someone under 13' },
  { value: 'other', label: 'Other', description: 'Something else' },
]

export default function ReportModal({ isOpen, onClose, onSubmit, targetName }: ReportModalProps) {
  const [category, setCategory] = useState<ReportCategory | null>(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    setCategory(null)
    setDetails('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!category) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await onSubmit(category, details.trim())
    setSubmitting(false)
    if (err) {
      setError(err)
    } else {
      setSuccess(true)
      setTimeout(handleClose, 1500)
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
        <p className="font-pixel text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-2">
          Report
        </p>
        <h3 className="font-display text-2xl text-[var(--text-primary)] mb-4">
          Report {targetName}
        </h3>

        {success ? (
          <div className="py-8 text-center">
            <p className="font-display text-lg text-[var(--text-primary)] mb-1">Thank you.</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Your report has been submitted for review.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Choose the reason that best fits:
            </p>
            <div className="space-y-2 mb-4 max-h-72 overflow-y-auto">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    category === c.value
                      ? 'border-[var(--accent-primary)] bg-[rgba(0,191,166,0.08)]'
                      : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{c.label}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{c.description}</p>
                </button>
              ))}
            </div>

            <label className="block text-xs text-[var(--text-tertiary)] mb-1.5">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value.slice(0, 1000))}
              placeholder="Share any additional context that will help us review"
              rows={3}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm resize-none focus:outline-none focus:border-[var(--accent-primary)] mb-4"
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
                onClick={handleSubmit}
                disabled={!category || submitting}
                className="flex-1 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
