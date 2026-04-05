import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Message } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../contexts/RealtimeContext'
import { rpcWithRetry } from '../lib/rpcRetry'

const PAGE_SIZE = 50

interface UseMessagesReturn {
  messages: Message[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  sendMessage: (body: string) => Promise<{ error: string | null }>
  loadMore: () => Promise<void>
  markRead: () => Promise<void>
}

/**
 * Fetches + live-subscribes to messages for one connection.
 *
 * - Initial load: newest page via `get_messages_page` (keyset by created_at).
 * - `loadMore`: fetches older messages using the oldest currently-loaded
 *   `created_at` as the cursor.
 * - Real-time: listens to the RealtimeContext's per-connection version
 *   counter — any INSERT/UPDATE/DELETE on this connection's messages
 *   triggers a refetch of the newest page (deduped on merge).
 */
export function useMessages(connectionId: string | undefined): UseMessagesReturn {
  const { user } = useAuth()
  const { getMessagesVersion } = useRealtime()
  const liveVersion = connectionId ? getMessagesVersion(connectionId) : 0

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const oldestCursorRef = useRef<string | null>(null)

  const loadInitial = useCallback(async () => {
    if (!connectionId) return
    setLoading(true)
    setError(null)
    try {
      const rows = await rpcWithRetry<Message[]>(() =>
        supabase.rpc('get_messages_page', {
          p_connection_id: connectionId,
          p_before: null,
          p_limit: PAGE_SIZE,
        })
      )
      // RPC returns newest-first; reverse to oldest-first for display.
      const ordered = (rows ?? []).slice().reverse()
      setMessages(ordered)
      setHasMore((rows ?? []).length === PAGE_SIZE)
      oldestCursorRef.current = ordered[0]?.created_at ?? null
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [connectionId])

  // Merge new rows from live events into current state without duplicates.
  const mergeNewest = useCallback(async () => {
    if (!connectionId) return
    try {
      const rows = await rpcWithRetry<Message[]>(() =>
        supabase.rpc('get_messages_page', {
          p_connection_id: connectionId,
          p_before: null,
          p_limit: PAGE_SIZE,
        })
      )
      const ordered = (rows ?? []).slice().reverse()
      setMessages(prev => {
        const byId = new Map(prev.map(m => [m.id, m]))
        ordered.forEach(m => byId.set(m.id, m))
        return Array.from(byId.values()).sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        )
      })
    } catch {
      // Swallow — next user action or refetch will recover.
    }
  }, [connectionId])

  const loadMore = useCallback(async () => {
    if (!connectionId || !hasMore || loadingMore || loading) return
    const cursor = oldestCursorRef.current
    if (!cursor) return
    setLoadingMore(true)
    try {
      const rows = await rpcWithRetry<Message[]>(() =>
        supabase.rpc('get_messages_page', {
          p_connection_id: connectionId,
          p_before: cursor,
          p_limit: PAGE_SIZE,
        })
      )
      const ordered = (rows ?? []).slice().reverse()
      if (ordered.length > 0) {
        setMessages(prev => [...ordered, ...prev])
        oldestCursorRef.current = ordered[0].created_at
      }
      setHasMore((rows ?? []).length === PAGE_SIZE)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingMore(false)
    }
  }, [connectionId, hasMore, loadingMore, loading])

  const sendMessage = async (body: string): Promise<{ error: string | null }> => {
    if (!connectionId || !user) return { error: 'Not ready' }
    const trimmed = body.trim()
    if (!trimmed) return { error: 'Message is empty' }
    if (trimmed.length > 2000) return { error: 'Message is too long (max 2000 chars)' }

    try {
      await rpcWithRetry<string>(() =>
        supabase.rpc('send_message', {
          p_connection_id: connectionId,
          p_body: trimmed,
        })
      )
      // Realtime will deliver the INSERT event, which triggers mergeNewest.
      // No optimistic update needed — latency is low.
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }

  const markRead = useCallback(async () => {
    if (!connectionId) return
    try {
      await rpcWithRetry<number>(() =>
        supabase.rpc('mark_messages_read', { p_connection_id: connectionId })
      )
    } catch {
      // Non-critical.
    }
  }, [connectionId])

  // Initial load when connection changes.
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  // Re-merge when the RealtimeContext reports a new event for this connection.
  useEffect(() => {
    if (liveVersion > 0) {
      void mergeNewest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveVersion])

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    sendMessage,
    loadMore,
    markRead,
  }
}
