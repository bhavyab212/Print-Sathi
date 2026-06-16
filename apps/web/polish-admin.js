import * as fs from 'fs';

const filePath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/admin/AdminPanelClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import toast
if (!content.includes("import toast from 'react-hot-toast'")) {
  content = content.replace(
    `import { usePresence, PresencePayload } from "@/hooks/usePresence";`,
    `import { usePresence, PresencePayload } from "@/hooks/usePresence";\nimport toast from 'react-hot-toast';`
  );
}

// 2. Remove success/error message states and add isRefreshing
content = content.replace(
  `const [successMsg, setSuccessMsg] = useState<string | null>(null);\n  const [errorMsg, setErrorMsg] = useState<string | null>(null);`,
  `const [isRefreshing, setIsRefreshing] = useState(false);`
);

// 3. Update fetchAdminData
content = content.replace(
  `const fetchAdminData = async () => {`,
  `const fetchAdminData = async () => {\n    setIsRefreshing(true);`
);
content = content.replace(
  `if (j) setJobsData(j);\n  };`,
  `if (j) setJobsData(j);\n    setIsRefreshing(false);\n  };`
);

// 4. Update handleSubmit to use toast
content = content.replace(
  `setSuccessMsg(null);\n    setErrorMsg(null);`,
  ``
);

content = content.replace(
  `setSuccessMsg(\`Shop "\${shopName}" and shopkeeper "\${email}" successfully created!\`);`,
  `toast.success(\`Shop "\${shopName}" and shopkeeper "\${email}" successfully created!\`);`
);

content = content.replace(
  `} catch (err: any) {\n      console.error(err);\n      setErrorMsg(err.message || "An unexpected error occurred.");\n    } finally {\n      setLoading(false);\n    }`,
  `} catch (err: any) {\n      console.error(err);\n      toast.error(err.message || "An unexpected error occurred.");\n    } finally {\n      setLoading(false);\n    }`
);

// 5. Update UI rendering of Success/Error messages (remove them since using toast)
const msgRegex = /\{errorMsg && \([^}]+\)\}\n\s*\{successMsg && \([^}]+\)\}/g;
content = content.replace(
  `          {errorMsg && (\n            <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm border border-red-500/30">\n              {errorMsg}\n            </div>\n          )}\n          {successMsg && (\n            <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm border border-emerald-500/30">\n              {successMsg}\n            </div>\n          )}`,
  ``
);

// 6. Update "Refresh Data" button
content = content.replace(
  `<button onClick={fetchAdminData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition">\n              <i className="bx bx-refresh text-lg"></i> Refresh Data\n            </button>`,
  `<button onClick={fetchAdminData} disabled={isRefreshing} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">\n              <i className={\`bx bx-refresh text-lg \${isRefreshing ? 'animate-spin' : ''}\`}></i> {isRefreshing ? 'Refreshing...' : 'Refresh Data'}\n            </button>`
);

// 7. Update "Create Shop" button
content = content.replace(
  `<button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4">\n                {loading ? "Creating..." : "Create Shop"}\n              </button>`,
  `<button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2">\n                {loading ? <i className="bx bx-loader-alt animate-spin text-xl"></i> : <i className="bx bx-plus-circle text-xl"></i>}\n                {loading ? "Creating..." : "Create Shop"}\n              </button>`
);

fs.writeFileSync(filePath, content);
console.log('Super Admin UI Polish applied.');
