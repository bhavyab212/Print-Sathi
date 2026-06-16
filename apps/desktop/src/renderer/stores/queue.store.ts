import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Job, JobStatus } from '@shared/types/job';

interface QueueState {
  jobs: Job[];
  isLoading: boolean;
  error: string | null;
  fetchJobs: (shopId: string) => Promise<void>;
  subscribeToJobs: (shopId: string) => void;
  unsubscribeFromJobs: () => void;
  updateJobStatus: (jobId: string, status: JobStatus, note?: string) => Promise<void>;
  toggleUrgent: (jobId: string, currentStatus: boolean) => Promise<void>;
  
  // Local state mutations
  _addOrUpdateJob: (job: Job) => void;
  _removeJob: (jobId: string) => void;
}

let realtimeChannel: any = null;

export const useQueueStore = create<QueueState>((set, get) => ({
  jobs: [],
  isLoading: false,
  error: null,

  fetchJobs: async (shopId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all non-completed/non-archived jobs
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          items:job_items(*)
        `)
        .eq('shop_id', shopId)
        .in('status', ['pending', 'approved', 'printing'])
        // Sort urgent first, then by position/creation
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ jobs: data as Job[], isLoading: false });
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  subscribeToJobs: (shopId: string) => {
    // Unsubscribe if already subscribed
    get().unsubscribeFromJobs();

    realtimeChannel = supabase.channel(`public:jobs:shop_id=eq.${shopId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `shop_id=eq.${shopId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch complete job with items
            const { data } = await supabase
              .from('jobs')
              .select(`*, items:job_items(*)`)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              get()._addOrUpdateJob(data as Job);
              // Trigger desktop notification if it's a new pending job
              if (data.status === 'pending') {
                new Notification('New Print Job', {
                  body: `${data.word_token} - ${data.workflow_type.replace('_', ' ')}`,
                });
                // Note: we can also trigger a sound here via an audio element
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('jobs')
              .select(`*, items:job_items(*)`)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              // If it moved to completed/rejected, we might want to remove it from the active queue
              if (['done', 'rejected'].includes(data.status)) {
                get()._removeJob(data.id);
              } else {
                get()._addOrUpdateJob(data as Job);
              }
            }
          } else if (payload.eventType === 'DELETE') {
            get()._removeJob(payload.old.id);
          }
        }
      )
      .subscribe();
  },

  unsubscribeFromJobs: () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },

  updateJobStatus: async (jobId: string, status: JobStatus, note?: string) => {
    try {
      const updateData: any = { status };
      
      // Update timestamps based on status
      if (status === 'approved') updateData.approved_at = new Date().toISOString();
      if (status === 'done' || status === 'rejected') updateData.completed_at = new Date().toISOString();
      if (note) updateData.shopkeeper_note = note;

      // Optimistic update
      const jobs = get().jobs;
      const jobIndex = jobs.findIndex(j => j.id === jobId);
      if (jobIndex >= 0) {
        if (['done', 'rejected'].includes(status)) {
          // Remove from active queue
          get()._removeJob(jobId);
        } else {
          // Update in place
          const updatedJobs = [...jobs];
          updatedJobs[jobIndex] = { ...updatedJobs[jobIndex], ...updateData };
          set({ jobs: updatedJobs });
        }
      }

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;
      
      // We don't necessarily need to add to job_status_log from client
      // A trigger or edge function might be better, but we can do it here:
      const job = jobs[jobIndex];
      if (job) {
        await supabase.from('job_status_log').insert({
          job_id: jobId,
          old_status: job.status,
          new_status: status,
          changed_by: 'shopkeeper',
          note: note || ''
        });
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      // Revert optimistic update by refetching
      const shopId = get().jobs[0]?.shop_id;
      if (shopId) get().fetchJobs(shopId);
    }
  },

  toggleUrgent: async (jobId: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      const jobs = get().jobs;
      const updatedJobs = jobs.map(j => 
        j.id === jobId ? { ...j, is_urgent: !currentStatus } : j
      );
      // Re-sort
      updatedJobs.sort((a, b) => {
        if (a.is_urgent !== b.is_urgent) return a.is_urgent ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      set({ jobs: updatedJobs });

      const { error } = await supabase
        .from('jobs')
        .update({ is_urgent: !currentStatus })
        .eq('id', jobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling urgent status:', error);
    }
  },

  _addOrUpdateJob: (job: Job) => {
    set(state => {
      const index = state.jobs.findIndex(j => j.id === job.id);
      let newJobs = [...state.jobs];
      if (index >= 0) {
        newJobs[index] = job;
      } else {
        newJobs.unshift(job);
      }
      
      // Keep sorted
      newJobs.sort((a, b) => {
        if (a.is_urgent !== b.is_urgent) return a.is_urgent ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      return { jobs: newJobs };
    });
  },

  _removeJob: (jobId: string) => {
    set(state => ({
      jobs: state.jobs.filter(j => j.id !== jobId)
    }));
  }
}));
