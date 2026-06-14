import { useState } from 'react';
import { Job } from '@shared/types/job';
import { useQueueStore } from '../../stores/queue.store';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const { updateJobStatus, toggleUrgent } = useQueueStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (status: Job['status']) => {
    setIsUpdating(true);
    await updateJobStatus(job.id, status);
    setIsUpdating(false);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    printing: 'bg-purple-100 text-purple-800',
    done: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const workflowIcons: Record<string, string> = {
    passport_photo: 'bx-id-card text-blue-500',
    document: 'bx-file text-indigo-500',
    scan: 'bx-scan text-purple-500',
    direct_print: 'bx-printer text-gray-500',
  };

  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${job.is_urgent ? 'border-orange-200' : 'border-gray-200'}`}>
      {/* Top row */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
            <i className={`bx ${workflowIcons[job.workflow_type] || 'bx-file'} text-2xl`}></i>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{job.word_token}</h3>
            <p className="text-xs text-gray-500">{job.customer_name || 'Anonymous'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${statusColors[job.status]}`}>
            {job.status}
          </span>
          {job.calculated_bill && (
            <span className="text-sm font-semibold text-green-600">₹{job.calculated_bill}</span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mb-5 flex-1 space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <i className="bx bx-time-five text-gray-400"></i>
          <span>{new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-2">
          <i className="bx bx-copy-alt text-gray-400"></i>
          <span>{job.items?.length || 0} files</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2 pt-4 border-t border-gray-100">
        {job.status === 'pending' && (
          <>
            <button
              onClick={() => handleStatusChange('approved')}
              disabled={isUpdating}
              className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={isUpdating}
              className="rounded-xl border border-gray-200 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600 disabled:opacity-50"
              title="Reject"
            >
              <i className="bx bx-x text-lg"></i>
            </button>
          </>
        )}
        
        {job.status === 'approved' && (
          <button
            onClick={() => handleStatusChange('printing')}
            disabled={isUpdating}
            className="flex-1 rounded-xl bg-purple-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            Start Printing
          </button>
        )}

        {job.status === 'printing' && (
          <button
            onClick={() => handleStatusChange('done')}
            disabled={isUpdating}
            className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            Mark Done
          </button>
        )}

        <button
          onClick={() => toggleUrgent(job.id, job.is_urgent)}
          className={`rounded-xl border px-3 py-2 transition-colors ${
            job.is_urgent 
              ? 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100' 
              : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-orange-500'
          }`}
          title={job.is_urgent ? 'Remove urgent status' : 'Mark as urgent'}
        >
          <i className={job.is_urgent ? 'bx bxs-flame text-lg' : 'bx bx-flame text-lg'}></i>
        </button>
      </div>
    </div>
  );
}
