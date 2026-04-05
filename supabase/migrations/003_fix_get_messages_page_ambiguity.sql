-- =============================================================================
-- 002 — Fix `column reference "id" is ambiguous` in get_messages_page
-- =============================================================================
-- The previous definition of `get_messages_page` referenced `connections`
-- columns (`id`, `sender_id`) unqualified inside the participation check.
-- Because the function is declared `RETURNS TABLE (id UUID, connection_id UUID,
-- sender_id UUID, ...)`, those names also exist as OUT parameters in the
-- function's variable namespace. With the default
-- `plpgsql.variable_conflict = error`, plpgsql raises:
--
--     column reference "id" is ambiguous
--
-- every time the ChatPage tries to load messages (src/hooks/useMessages.ts).
--
-- This migration re-creates the function with a table alias so column and
-- variable namespaces no longer collide. Body-level behaviour is otherwise
-- unchanged.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION get_messages_page(
  p_connection_id UUID,
  p_before TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 50
) RETURNS TABLE (
  id UUID,
  connection_id UUID,
  sender_id UUID,
  body TEXT,
  created_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ
) AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_limit > 100 THEN p_limit := 100; END IF;

  -- Alias `connections` as `c` so column references don't collide with the
  -- function's OUT parameters (`id`, `sender_id`), which would otherwise
  -- raise `column reference "id" is ambiguous` in plpgsql.
  IF NOT EXISTS (
    SELECT 1 FROM connections c
    WHERE c.id = p_connection_id
      AND c.status = 'accepted'
      AND v_uid IN (c.sender_id, c.receiver_id)
      AND NOT is_blocked_between(c.sender_id, c.receiver_id)
  ) THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  RETURN QUERY
  SELECT m.id, m.connection_id, m.sender_id, m.body, m.created_at, m.read_at, m.edited_at
  FROM messages m
  WHERE m.connection_id = p_connection_id
    AND m.deleted_at IS NULL
    AND (p_before IS NULL OR m.created_at < p_before)
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_messages_page(UUID, TIMESTAMPTZ, INT) TO authenticated;

COMMIT;
