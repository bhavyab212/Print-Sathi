import { useEffect } from 'react';
import { useQueueStore } from '../stores/queue.store';
import { useAuthStore } from '../stores/auth.store';
import { JobCard } from '../components/queue/JobCard';

export default function QueueDashboardView() {
  const { shop } = useAuthStore();
  const { jobs, isLoading, error, fetchJobs, subscribeToJobs, unsubscribeFromJobs } = useQueueStore();

  useEffect(() => {
    if (shop?.id) {
      fetchJobs(shop.id);
      subscribeToJobs(shop.id);
    }

    return () => {
      unsubscribeFromJobs();
    };
  }, [shop?.id, fetchJobs, subscribeToJobs, unsubscribeFromJobs]);

  const urgentJobs = jobs.filter(j => j.is_urgent);
  const regularJobs = jobs.filter(j => !j.is_urgent);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Queue Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time print jobs for {shop?.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            Live Updates
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoading && jobs.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <i className="bx bx-loader-alt animate-spin text-3xl text-blue-500"></i>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            <i className="bx bx-error-circle mb-2 text-3xl"></i>
            <p className="font-semibold">Failed to load queue</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-3xl text-gray-400">
              <i className="bx bx-inbox"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Queue is empty</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              No active print jobs right now. Customer submissions will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Urgent Jobs Section */}
            {urgentJobs.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <i className="bx bxs-flame text-xl text-orange-500"></i>
                  <h2 className="text-lg font-bold text-gray-900">Urgent</h2>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                    {urgentJobs.length}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {urgentJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}

            {/* Regular Jobs Section */}
            {regularJobs.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Up Next</h2>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                    {regularJobs.length}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {regularJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
