import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useModeration } from '../hooks/useModeration'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'

export default function BlockedUsersPage() {
  const { blocks, loading, getMyBlocks, unblockUser } = useModeration()
  const navigate = useNavigate()
  const [workingId, setWorkingId] = useState<string | null>(null)

  useEffect(() => {
    getMyBlocks()
  }, [getMyBlocks])

  const handleUnblock = async (blockedId: string) => {
    setWorkingId(blockedId)
    await unblockUser(blockedId)
    setWorkingId(null)
  }

  if (loading && blocks.length === 0) {
    return <LoadingSpinner message="Loading" />
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate('/settings')}
        className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-8"
      >
        ← Back to settings
      </button>

      <p className="font-pixel text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-2">
        Safety
      </p>
      <h1 className="font-display text-4xl md:text-5xl text-[var(--text-primary)] leading-[1.1] mb-4">
        Blocked users
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-10 max-w-xl">
        Users you've blocked cannot see your profile in discovery, send you connection requests, or
        message you. They aren't notified.
      </p>

      {blocks.length === 0 ? (
        <EmptyState
          icon="◌"
          title="You haven't blocked anyone."
          description="When you do, they'll show up here."
        />
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {blocks.map(block => {
            const other = block.blocked
            if (!other) return null
            return (
              <li key={block.id} className="flex items-center gap-4 py-5">
                <Avatar src={other.avatar_url} name={other.full_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-[var(--text-primary)] leading-tight">
                    {other.full_name}
                  </p>
                  {block.reason && (
                    <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                      Reason: {block.reason}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleUnblock(other.id)}
                  disabled={workingId === other.id}
                  className="text-sm text-[var(--accent-primary)] underline underline-offset-4 decoration-[var(--accent-primary)] hover:decoration-[2px] disabled:opacity-50 transition-all"
                >
                  {workingId === other.id ? 'Unblocking…' : 'Unblock'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
