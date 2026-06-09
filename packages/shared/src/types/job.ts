export type JobStatus = 
  | 'pending' 
  | 'approved' 
  | 'printing' 
  | 'done' 
  | 'rejected';

export type JobType = 
  | 'passport_photo' 
  | 'document' 
  | 'scan'
  | 'direct_print';

export interface Job {
  id: string;
  shop_id: string;
  word_token: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: JobStatus;
  source: string;
  is_urgent: boolean;
  queue_position: number | null;
  workflow_type: JobType;
  calculated_bill: number | null;
  shopkeeper_note: string | null;
  preview_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  completed_at: string | null;
  archived_at: string | null;
  items?: JobItem[]; // Joined relation
}

export interface JobItem {
  id: string;
  job_id: string;
  file_url: string;
  file_name: string | null;
  file_type: string | null;
  file_size_bytes: number | null;
  settings: Record<string, unknown>; // JSONB
  file_hash: string | null;
  created_at: string;
}
