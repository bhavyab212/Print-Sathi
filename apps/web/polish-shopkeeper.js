import * as fs from 'fs';

const filePath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/dashboard/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import toast
if (!content.includes("import toast from 'react-hot-toast'")) {
  content = content.replace(
    `import AnalyticsTab from "./AnalyticsTab";`,
    `import AnalyticsTab from "./AnalyticsTab";\nimport toast from 'react-hot-toast';`
  );
}

// 2. Add loading state maps
content = content.replace(
  `const [shops, setShops] = useState<{ id: string; name: string }[]>([]);`,
  `const [shops, setShops] = useState<{ id: string; name: string }[]>([]);\n  const [actionLoading, setActionLoading] = useState<Record<string, string>>({}); // jobId -> actionName ('approve', 'reject', 'print', 'passport')\n  const [isInitialLoad, setIsInitialLoad] = useState(true);`
);

content = content.replace(
  `if (error) console.error("Error fetching jobs:", error);`,
  `if (error) toast.error("Error fetching jobs");`
);
content = content.replace(
  `setJobs(data as unknown as PrintJob[]);`,
  `setJobs(data as unknown as PrintJob[]);\n      setIsInitialLoad(false);`
);

// 3. Update updateStatus
content = content.replace(
  `const updateStatus = async (jobId: string, status: string) => {`,
  `const updateStatus = async (jobId: string, status: string) => {\n    setActionLoading(prev => ({ ...prev, [jobId]: status }));`
);
content = content.replace(
  `if (error) console.error("Update error:", error);`,
  `if (error) { toast.error("Update failed"); }\n    else { toast.success(\`Job marked as \${status}\`); }\n    setActionLoading(prev => ({ ...prev, [jobId]: '' }));`
);

// 4. Update handlePrint
content = content.replace(
  `const handlePrint = async (job: PrintJob) => {`,
  `const handlePrint = async (job: PrintJob) => {\n    setActionLoading(prev => ({ ...prev, [job.id]: 'print' }));`
);
content = content.replace(
  `if (job.status !== 'printing') {`,
  `if (job.status !== 'printing') {` // Just a marker
);
// In handlePrint error and finally:
content = content.replace(
  `} catch (err) {\n      console.error("Print error:", err);\n      alert("Could not open some files for printing.");\n    }`,
  `} catch (err) {\n      console.error("Print error:", err);\n      toast.error("Could not open some files for printing.");\n    } finally {\n      setActionLoading(prev => ({ ...prev, [job.id]: '' }));\n    }`
);

// 5. Update handleGeneratePassportLayout
content = content.replace(
  `const handleGeneratePassportLayout = async (item: JobItem) => {`,
  `const handleGeneratePassportLayout = async (item: JobItem, jobId: string) => {\n    const loadingId = toast.loading('Generating 4x6 Layout...');\n    setActionLoading(prev => ({ ...prev, [jobId]: 'passport' }));`
);
content = content.replace(
  `window.open(pdfUrl, '_blank');\n    } catch (err: any) {\n      alert("Error generating layout: " + err.message);\n    }`,
  `window.open(pdfUrl, '_blank');\n      toast.success('Layout generated', { id: loadingId });\n    } catch (err: any) {\n      toast.error("Error generating layout: " + err.message, { id: loadingId });\n    } finally {\n      setActionLoading(prev => ({ ...prev, [jobId]: '' }));\n    }`
);

content = content.replace(
  `handleGeneratePassportLayout(item)`,
  `handleGeneratePassportLayout(item, selectedJob.id)`
);

// 6. Update handleRemoveBackground
content = content.replace(
  `const handleRemoveBackground = (item: JobItem) => {\n    alert("Background Removal API is not yet connected.\\nPlease integrate with an API like Remove.bg or Photoroom to use this feature.");\n  };`,
  `const handleRemoveBackground = (item: JobItem) => {\n    toast.error("Background Removal API is not connected. Please integrate an API like Remove.bg to use this.");\n  };`
);

// 7. Update UI buttons to show loaders
const rejectBtnStr = `onClick={() => updateStatus(selectedJob.id, 'rejected')}\n                className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"\n                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}`;
content = content.replace(
  rejectBtnStr,
  `onClick={() => updateStatus(selectedJob.id, 'rejected')} disabled={actionLoading[selectedJob.id] === 'rejected'}\n                className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"\n                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}`
);
content = content.replace(
  `<i className="bx bx-x text-xl"></i> Reject`,
  `{actionLoading[selectedJob.id] === 'rejected' ? <i className="bx bx-loader-alt animate-spin text-xl"></i> : <><i className="bx bx-x text-xl"></i> Reject</>}`
);

const approveBtnStr = `onClick={() => updateStatus(selectedJob.id, 'approved')}\n                className="flex-2 flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-lg"\n                style={{ background: '#25D366', color: 'white' }}`;
content = content.replace(
  approveBtnStr,
  `onClick={() => updateStatus(selectedJob.id, 'approved')} disabled={actionLoading[selectedJob.id] === 'approved'}\n                className="flex-2 flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"\n                style={{ background: '#25D366', color: 'white' }}`
);
content = content.replace(
  `<i className="bx bx-check text-xl"></i> Approve ✓`,
  `{actionLoading[selectedJob.id] === 'approved' ? <i className="bx bx-loader-alt animate-spin text-xl"></i> : <><i className="bx bx-check text-xl"></i> Approve ✓</>}`
);

const printNowBtnStr = `onClick={() => handlePrint(selectedJob)}\n              className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-95 shadow-xl"\n              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white' }}`;
content = content.replace(
  printNowBtnStr,
  `onClick={() => handlePrint(selectedJob)} disabled={actionLoading[selectedJob.id] === 'print'}\n              className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"\n              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white' }}`
);
content = content.replace(
  `<i className="bx bx-printer text-2xl"></i> Print Now 🖨️`,
  `{actionLoading[selectedJob.id] === 'print' ? <i className="bx bx-loader-alt animate-spin text-2xl"></i> : <><i className="bx bx-printer text-2xl"></i> Print Now 🖨️</>}`
);

// Initial jobs loading state in left panel
const leftPanelContent = `<div className="flex-1 overflow-y-auto hidden md:block border-r relative" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>`;
const skeletonLoader = `{isInitialLoad ? (
  <div className="p-4 space-y-4">
    {[1,2,3,4].map(i => (
      <div key={i} className="flex gap-3 items-center animate-pulse">
        <div className="w-12 h-12 rounded-full bg-white/5 shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
          <div className="h-2 bg-white/5 rounded w-1/3"></div>
        </div>
      </div>
    ))}
  </div>
) : `;
content = content.replace(
  `{['pending', 'approved', 'printing', 'done', 'rejected'].map(statusGroup => {`,
  skeletonLoader + `{['pending', 'approved', 'printing', 'done', 'rejected'].map(statusGroup => {`
);
content = content.replace(
  `          {filteredJobs.length === 0 && (
            <div className="text-center p-8">
              <i className="bx bx-coffee text-4xl text-white/20 mb-3"></i>
              <p className="text-white/40 text-sm">No jobs in queue.</p>
            </div>
          )}
        </div>`,
  `          {filteredJobs.length === 0 && (
            <div className="text-center p-8">
              <i className="bx bx-coffee text-4xl text-white/20 mb-3"></i>
              <p className="text-white/40 text-sm">No jobs in queue.</p>
            </div>
          )}
        )}</div>`
);

fs.writeFileSync(filePath, content);
console.log('Shopkeeper UI Polish applied.');
