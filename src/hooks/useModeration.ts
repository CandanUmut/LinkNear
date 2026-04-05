import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Block, Profile, ReportCategory } from '../types'
import { rpcWithRetry } from '../lib/rpcRetry'

interface BlockWithProfile extends Block {
  blocked?: Profile
}

interface UseModerationReturn {
  blocks: BlockWithProfile[]
  loading: boolean
  error: string | null
  blockUser: (blockedId: string, reason?: string) => Promise<{ error: string | null }>
  unblockUser: (blockedId: string) => Promise<{ error: string | null }>
  reportUser: (
    reportedId: string,
    category: ReportCategory,
    details?: string,
    messageId?: string
  ) => Promise<{ error: string | null }>
  getMyBlocks: () => Promise<void>
}

export function useModeration(): UseModerationReturn {
  const [blocks, setBlocks] = useState<BlockWithProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getMyBlocks = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('blocks')
      .select('*, blocked:profiles!blocked_id(*)')
      .order('created_at', { ascending: false })
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setBlocks((data || []) as BlockWithProfile[])
    }
    setLoading(false)
  }, [])

  const blockUser = async (
    blockedId: string,
    reason?: string
  ): Promise<{ error: string | null }> => {
    try {
      await rpcWithRetry(() =>
        supabase.rpc('block_user', {
          p_blocked_id: blockedId,
          p_reason: reason ?? null,
        })
      )
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }

  const unblockUser = async (blockedId: string): Promise<{ error: string | null }> => {
    try {
      await rpcWithRetry(() =>
        supabase.rpc('unblock_user', { p_blocked_id: blockedId })
      )
      setBlocks(prev => prev.filter(b => b.blocked_id !== blockedId))
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }

  const reportUser = async (
    reportedId: string,
    category: ReportCategory,
    details?: string,
    messageId?: string
  ): Promise<{ error: string | null }> => {
    try {
      await rpcWithRetry<string>(() =>
        supabase.rpc('report_user', {
          p_reported_id: reportedId,
          p_category: category,
          p_details: details ?? null,
          p_message_id: messageId ?? null,
        })
      )
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }

  return { blocks, loading, error, blockUser, unblockUser, reportUser, getMyBlocks }
}
