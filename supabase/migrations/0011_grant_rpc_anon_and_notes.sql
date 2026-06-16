-- ============================================================
-- MIGRATION 0011: Grant RPC execute to anon + add notes param
-- Root cause: anon role had no EXECUTE on create_job_with_sequence
-- ============================================================

-- Grant execute permission to both anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_job_with_sequence(uuid, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_job_with_sequence(uuid, text, text, text) TO authenticated;

-- Replace function to also accept notes (avoids separate UPDATE that requires auth)
CREATE OR REPLACE FUNCTION public.create_job_with_sequence(
  p_shop_id       uuid,
  p_customer_name text,
  p_source        text,
  p_customer_phone text DEFAULT NULL,
  p_notes         text DEFAULT NULL
)
RETURNS TABLE (
  id           uuid,
  word_token   text,
  queue_position int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_id       uuid;
  v_token_number int;
  v_word_token   text;
  v_queue_pos    int;
BEGIN
  -- Advisory lock on the shop row to prevent race conditions
  PERFORM 1 FROM public.shops WHERE shops.id = p_shop_id FOR UPDATE;

  -- Next daily token number
  SELECT COALESCE(MAX(NULLIF(regexp_replace(jobs.word_token, '\D', '', 'g'), '')::int), 0) + 1
    INTO v_token_number
    FROM public.jobs
   WHERE jobs.shop_id = p_shop_id
     AND date_trunc('day', jobs.created_at AT TIME ZONE 'UTC') = date_trunc('day', now() AT TIME ZONE 'UTC');

  v_word_token := v_token_number::text;

  -- Queue position (pending + printing jobs ahead)
  SELECT count(*)
    INTO v_queue_pos
    FROM public.jobs
   WHERE jobs.shop_id = p_shop_id
     AND jobs.status IN ('pending', 'printing')
     AND jobs.created_at::date = now()::date;

  -- Insert job (includes notes so no separate UPDATE needed)
  INSERT INTO public.jobs (
    shop_id, customer_name, customer_phone,
    word_token, source, status, queue_position, notes
  ) VALUES (
    p_shop_id, p_customer_name, p_customer_phone,
    v_word_token, p_source, 'pending', v_queue_pos + 1,
    NULLIF(trim(COALESCE(p_notes, '')), '')
  )
  RETURNING jobs.id INTO v_new_id;

  RETURN QUERY SELECT v_new_id, v_word_token, v_queue_pos + 1;
END;
$$;

-- Re-grant after CREATE OR REPLACE (replaces the function, grants need reapplying)
GRANT EXECUTE ON FUNCTION public.create_job_with_sequence(uuid, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_job_with_sequence(uuid, text, text, text, text) TO authenticated;
