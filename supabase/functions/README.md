# Supabase Edge Functions

## purge-deleted-accounts

Hard-deletes profiles that were soft-deleted more than 30 days ago.

### Why this exists

The client calls `soft_delete_account()` which tombstones the profile (sets
`deleted_at`, nulls PII, cancels connections). After a 30-day grace period,
this function calls `supabase.auth.admin.deleteUser(id)` to remove the
`auth.users` row — which cascades through the FK chain and removes the
profile row, all connections, all messages, all blocks, all reports, and any
rate_limit rows belonging to the user.

Only the service role key can touch `auth.users`, so this must run server-side.

### Prerequisites

- Supabase CLI installed: `brew install supabase/tap/supabase`
- Logged in: `supabase login`
- Linked to your project: `supabase link --project-ref <your-ref>`

### Deploy

```bash
# From the repo root
supabase functions deploy purge-deleted-accounts
```

### Set secrets

```bash
supabase secrets set SUPABASE_URL=https://<your-ref>.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

You can find the service role key in your Supabase dashboard under
**Settings → API → service_role** (NOT the anon key).

### Schedule

Option A — Supabase dashboard: **Database → Functions (Cron)** → add a daily
schedule pointing at the deployed URL.

Option B — SQL via `pg_cron` + `pg_net`:

```sql
SELECT cron.schedule(
  'purge-deleted-accounts-daily',
  '0 3 * * *',  -- every day at 03:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://<your-ref>.functions.supabase.co/purge-deleted-accounts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <your-anon-key>',
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

### Manual invocation

```bash
curl -X POST \
  -H "Authorization: Bearer <your-anon-key>" \
  https://<your-ref>.functions.supabase.co/purge-deleted-accounts
```

Expected response shape:

```json
{
  "cutoff": "2026-03-05T00:00:00.000Z",
  "candidates": 3,
  "deleted": 3,
  "failed": 0,
  "results": [{"id": "...", "success": true}, ...]
}
```

### Rollback

Soft-deleted users can restore their profile themselves at any time before
the 30-day cutoff by signing back in — the onboarding flow will re-create
any fields that were nulled. After hard-delete, there is no rollback short
of a database backup restore.
