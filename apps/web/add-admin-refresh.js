import * as fs from 'fs';

const filePath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/admin/AdminPanelClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add setShops, setUsageLogsData, setJobsData state
content = content.replace(
  `  const [shops, setShops] = useState<Shop[]>(initialShops);`,
  `  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [usageLogsData, setUsageLogsData] = useState<UsageLog[]>(usageLogs);
  const [jobsData, setJobsData] = useState<Job[]>(jobs);`
);

// Add fetchAdminData and useEffect
content = content.replace(
  `  useEffect(() => {
    if (!customSlug && shopName) {`,
  `  const fetchAdminData = async () => {
    const { data: s } = await supabase.from('shops').select('id, name, slug, phone, area, created_at').order('created_at', { ascending: false });
    const { data: ul } = await supabase.from('usage_logs').select('feature, action, created_at, shop_id');
    const { data: j } = await supabase.from('jobs').select('id, status, source, created_at, shop_id');
    if (s) setShops(s);
    if (ul) setUsageLogsData(ul);
    if (j) setJobsData(j);
  };

  useEffect(() => {
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  useEffect(() => {
    if (!customSlug && shopName) {`
);

// Update analyticsData dependency
content = content.replace(
  `  }, [shops, usageLogs, jobs]);`,
  `  }, [shops, usageLogsData, jobsData]);`
);
content = content.replace(
  `    const totalJobs = jobs.length;`,
  `    const totalJobs = jobsData.length;`
);
content = content.replace(
  `    const jobsByStatus = jobs.reduce((acc, job) => {`,
  `    const jobsByStatus = jobsData.reduce((acc, job) => {`
);
content = content.replace(
  `    const featureUsage = usageLogs.reduce((acc, log) => {`,
  `    const featureUsage = usageLogsData.reduce((acc, log) => {`
);
content = content.replace(
  `    const qrQueueCount = jobs.filter(j => j.source === 'qr').length;`,
  `    const qrQueueCount = jobsData.filter(j => j.source === 'qr').length;`
);

// Add manual refresh button next to "Deep Analytics"
content = content.replace(
  `      {/* Tabs */}
      <div className="flex border-b border-border mb-8 gap-6">`,
  `      {/* Tabs and Actions */}
      <div className="flex border-b border-border mb-8 gap-6 justify-between">
        <div className="flex gap-6">`
);

content = content.replace(
  `          <i className="bx bx-store mr-2"></i>
          Shop Management
        </button>
      </div>`,
  `          <i className="bx bx-store mr-2"></i>
          Shop Management
        </button>
        </div>
        <button onClick={fetchAdminData} className="pb-4 font-bold text-sm text-primary hover:text-primary/80 transition-all flex items-center">
          <i className="bx bx-refresh text-lg mr-1"></i> Refresh Data
        </button>
      </div>`
);

fs.writeFileSync(filePath, content);
console.log('Super Admin Auto-Refresh added.');
