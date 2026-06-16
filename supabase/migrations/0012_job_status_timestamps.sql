-- ============================================================
-- MIGRATION 0012: Add approved_at / completed_at to jobs
-- Root cause of "queue shows nothing": dashboard query selected
-- these columns before they existed, so PostgREST errored and
-- the failed fetch silently left the job list empty.
-- ============================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS approved_at  timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Auto-stamp approved_at/completed_at when status transitions,
-- so the dashboard timeline shows accurate per-event times
-- without the client having to set them manually.
CREATE OR REPLACE FUNCTION public.handle_job_status_timestamps()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    NEW.approved_at := now();
  END IF;
  IF NEW.status IN ('done', 'rejected') AND OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.completed_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_status_timestamps ON public.jobs;
CREATE TRIGGER jobs_status_timestamps
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_job_status_timestamps();
