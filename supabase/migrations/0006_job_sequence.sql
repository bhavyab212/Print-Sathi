-- Function to create a job and assign a sequential token for the day
CREATE OR REPLACE FUNCTION public.create_job_with_sequence(
  p_shop_id uuid,
  p_customer_name text,
  p_source text,
  p_customer_phone text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  word_token text,
  queue_position int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_id uuid;
  v_token_number int;
  v_word_token text;
  v_queue_position int;
BEGIN
  -- 1. Lock the jobs table for this shop to prevent race conditions
  -- We just need a soft advisory lock or lock the shop row, but since we are inserting
  -- into jobs, we can lock the shop row specifically for this transaction.
  PERFORM 1 FROM public.shops WHERE shops.id = p_shop_id FOR UPDATE;

  -- 2. Calculate the next daily token number for this shop
  SELECT COALESCE(MAX(NULLIF(regexp_replace(jobs.word_token, '\D', '', 'g'), '')::int), 0) + 1
  INTO v_token_number
  FROM public.jobs
  WHERE jobs.shop_id = p_shop_id
    AND date_trunc('day', jobs.created_at AT TIME ZONE 'UTC') = date_trunc('day', now() AT TIME ZONE 'UTC');

  v_word_token := v_token_number::text;

  -- 3. Calculate queue position (how many 'pending' or 'printing' jobs are ahead of them today)
  SELECT count(*)
  INTO v_queue_position
  FROM public.jobs
  WHERE jobs.shop_id = p_shop_id
    AND jobs.status IN ('pending', 'printing')
    AND jobs.created_at::date = now()::date;

  -- 4. Insert the new job
  INSERT INTO public.jobs (
    shop_id,
    customer_name,
    customer_phone,
    word_token,
    source,
    status,
    queue_position
  ) VALUES (
    p_shop_id,
    p_customer_name,
    p_customer_phone,
    v_word_token,
    p_source,
    'pending',
    v_queue_position + 1
  )
  RETURNING jobs.id INTO v_new_id;

  -- Return the new job info
  RETURN QUERY SELECT v_new_id, v_word_token, v_queue_position + 1;
END;
$$;
