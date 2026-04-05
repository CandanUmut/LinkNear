import type { Message } from '../types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showTimestamp?: boolean
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function MessageBubble({ message, isOwn, showTimestamp = true }: MessageBubbleProps) {
  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-3`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isOwn
            ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-br-sm'
            : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm'
        }`}
      >
        {message.body}
      </div>
      {showTimestamp && (
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="font-pixel text-[9px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] tabular-nums">
            {formatTime(message.created_at)}
          </span>
          {isOwn && message.read_at && (
            <span className="font-pixel text-[9px] uppercase tracking-[0.08em] text-[var(--accent-primary)]">
              · Read
            </span>
          )}
        </div>
      )}
    </div>
  )
}
