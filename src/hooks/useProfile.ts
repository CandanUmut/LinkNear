import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { rpcWithRetry } from '../lib/rpcRetry'
import { validateAndCompress, ImagePipelineError } from '../lib/imagePipeline'

type UpdatableField =
  | 'full_name'
  | 'headline'
  | 'bio'
  | 'avatar_url'
  | 'skills'
  | 'interests'
  | 'looking_for'
  | 'latitude'
  | 'longitude'
  | 'location_name'
  | 'discovery_enabled'
  | 'date_of_birth'
  | 'terms_accepted_at'
  | 'onboarding_completed_at'

export interface UploadAvatarResult {
  url: string | null
  error: string | null
}

/**
 * Profile CRUD + avatar upload. All writes go through SECURITY DEFINER RPCs
 * that enforce rate limits, field whitelisting, and server-side constraints.
 * Direct table writes are kept only for the auto-create first-sign-in case
 * inside AuthContext.
 */
export function useProfile() {
  const getProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) return null
    return data as Profile | null
  }, [])

  const getMyProfile = useCallback(async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return getProfile(user.id)
  }, [getProfile])

  /**
   * Updates a subset of profile fields via the `update_profile_safe` RPC,
   * which whitelists keys, normalizes tags, applies rate limits, and honors
   * all CHECK constraints.
   */
  const updateProfile = useCallback(
    async (data: Partial<Pick<Profile, UpdatableField>>): Promise<{ error: string | null }> => {
      // Strip undefined so the RPC's COALESCE keeps the existing value.
      const payload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) payload[k] = v
      }

      try {
        await rpcWithRetry(() =>
          supabase.rpc('update_profile_safe', { p_payload: payload })
        )
        return { error: null }
      } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) }
      }
    },
    []
  )

  /**
   * Validates + compresses the file client-side, uploads to Supabase Storage
   * under `avatars/{userId}/{uuid}.webp`, then calls `set_avatar_url` RPC to
   * atomically swap the profile's avatar_url and queue the old path for
   * cleanup.
   */
  const uploadAvatar = useCallback(async (file: File): Promise<UploadAvatarResult> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { url: null, error: 'Not authenticated' }

    let processed
    try {
      processed = await validateAndCompress(file)
    } catch (e) {
      if (e instanceof ImagePipelineError) return { url: null, error: e.message }
      return { url: null, error: e instanceof Error ? e.message : String(e) }
    }

    const uuid = crypto.randomUUID()
    const path = `${user.id}/${uuid}.${processed.extension}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, processed.blob, {
        contentType: processed.mimeType,
        cacheControl: '31536000',
        upsert: false,
      })
    if (uploadError) {
      return { url: null, error: uploadError.message }
    }

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = publicData.publicUrl

    try {
      await rpcWithRetry(() =>
        supabase.rpc('set_avatar_url', { p_new_path: publicUrl })
      )
    } catch (e) {
      return { url: null, error: e instanceof Error ? e.message : String(e) }
    }

    return { url: publicUrl, error: null }
  }, [])

  /**
   * Soft-deletes the current user's profile: tombstones the row, nulls all
   * PII, cancels in-flight connections, and triggers sign-out. The server
   * keeps the row for 30 days (GDPR grace period), after which a scheduled
   * edge function hard-deletes from auth.users.
   */
  const deleteAccount = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      await rpcWithRetry(() => supabase.rpc('soft_delete_account'))
      await supabase.auth.signOut()
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }, [])

  return { getProfile, getMyProfile, updateProfile, uploadAvatar, deleteAccount }
}
