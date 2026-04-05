// Supabase Edge Function: purge-deleted-accounts
//
// Scheduled (daily) job that hard-deletes profiles which were soft-deleted
// more than 30 days ago. Soft delete happens via the `soft_delete_account()`
// RPC from the client; this function completes the GDPR right-to-be-forgotten
// by removing the auth.users row (which CASCADE-deletes the profile row and
// every child record via the FK chain).
//
// IMPORTANT: Requires the service-role key to call `auth.admin.deleteUser`.
// Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as function secrets:
//
//   supabase secrets set SUPABASE_URL=https://<ref>.supabase.co
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
//
// Deploy and schedule:
//
//   supabase functions deploy purge-deleted-accounts
//   # Set up a cron schedule via the Supabase dashboard or:
//   # SELECT cron.schedule('purge-deleted-accounts', '0 3 * * *',
//   #   $$SELECT net.http_post(
//   #     url:='https://<ref>.functions.supabase.co/purge-deleted-accounts',
//   #     headers:=jsonb_build_object('Authorization', 'Bearer <anon-key>')
//   #   )$$);

// @ts-expect-error — Deno runtime on Supabase Edge, not a Node module.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-expect-error — Deno runtime globals
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
// @ts-expect-error — Deno runtime globals
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const GRACE_PERIOD_DAYS = 30

interface DeletedProfile {
  id: string
  deleted_at: string
}

// @ts-expect-error — Deno.serve is the standard Supabase Edge entry point.
Deno.serve(async (_req: Request) => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'missing_env', message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: toPurge, error: queryError } = await admin
    .from('profiles')
    .select('id, deleted_at')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff)
    .limit(500)

  if (queryError) {
    return new Response(
      JSON.stringify({ error: 'query_failed', details: queryError.message }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }

  const profiles = (toPurge ?? []) as DeletedProfile[]
  const results: Array<{ id: string; success: boolean; error?: string }> = []

  for (const profile of profiles) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(profile.id)
    if (deleteError) {
      results.push({ id: profile.id, success: false, error: deleteError.message })
    } else {
      results.push({ id: profile.id, success: true })
    }
  }

  return new Response(
    JSON.stringify({
      cutoff,
      candidates: profiles.length,
      deleted: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )
})
