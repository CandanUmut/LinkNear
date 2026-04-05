import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConnections } from '../hooks/useConnections'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../contexts/RealtimeContext'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'

/**
 * A simple inbox: every accepted connection becomes a conversation preview.
 * Sorted by most recent first. Tapping a row opens the chat.
 */
export default function InboxPage() {
  const { user } = useAuth()
  const { connections, loading, getConnections } = useConnections()
  const { connectionsVersion } = useRealtime()
  const navigate = useNavigate()

  useEffect(() => {
    getConnections()
  }, [getConnections, connectionsVersion])

  if (loading && connections.length === 0) {
    return <LoadingSpinner message="Loading messages" />
  }

  const accepted = connections
    .filter(c => c.status === 'accepted')
    .sort((a, b) => {
      const aDate = a.responded_at || a.created_at
      const bDate = b.responded_at || b.created_at
      return bDate.localeCompare(aDate)
    })

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <p className="font-pixel text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-2">
        Inbox
      </p>
      <h1 className="font-display text-4xl md:text-5xl text-[var(--text-primary)] leading-[1.1] mb-10">
        Messages
      </h1>

      {accepted.length === 0 ? (
        <EmptyState
          icon="◌"
          title="No conversations yet."
          description="Once you accept a connection request, you can start messaging here."
          action={{ label: 'Find people to connect with', onClick: () => navigate('/discover') }}
        />
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {accepted.map(conn => {
            const other = conn.sender_id === user?.id ? conn.receiver : conn.sender
            if (!other) return null
            return (
              <li
                key={conn.id}
                onClick={() => navigate(`/chat/${conn.id}`)}
                className="flex items-center gap-4 py-6 cursor-pointer group"
              >
                <Avatar src={other.avatar_url} name={other.full_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-[var(--text-primary)] leading-tight group-hover:text-[var(--accent-primary)] transition-colors">
                    {other.full_name}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)] truncate mt-0.5">
                    {other.headline || 'Say hi and start a conversation'}
                  </p>
                </div>
                <span className="text-sm text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-colors">
                  →
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
