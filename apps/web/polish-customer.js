import * as fs from 'fs';

const filePath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/s/[slug]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import toast
if (!content.includes("import toast from 'react-hot-toast'")) {
  content = content.replace(
    `import { createBrowserClient } from '@supabase/ssr';`,
    `import { createBrowserClient } from '@supabase/ssr';\nimport toast from 'react-hot-toast';`
  );
}

// 2. Add isSubmitting state to ShopLandingPage
content = content.replace(
  `const [jobId, setJobId] = useState<string | null>(null);`,
  `const [jobId, setJobId] = useState<string | null>(null);\n  const [isSubmitting, setIsSubmitting] = useState(false);`
);

// 3. Replace setError and alert with toast in the upload flow
// handleDoneWithFiles
content = content.replace(
  `if (files.length === 0) { setError('Please attach at least one file.'); return; }`,
  `if (files.length === 0) { toast.error('Please attach at least one file.'); return; }`
);

// In handleSubmit
content = content.replace(
  `const handleSubmit = async () => {`,
  `const handleSubmit = async () => {\n    setIsSubmitting(true);`
);

content = content.replace(
  `      setError('Shop configuration missing.');`,
  `      toast.error('Shop configuration missing.');\n      setIsSubmitting(false);`
);

content = content.replace(
  `        setError(\`File upload failed: \${uploadError.message}\`);`,
  `        toast.error(\`File upload failed: \${uploadError.message}\`);`
);

content = content.replace(
  `        setError(\`Failed to create job item: \${itemError.message}\`);`,
  `        toast.error(\`Failed to create job item: \${itemError.message}\`);`
);

content = content.replace(
  `      await supabase.from('jobs').delete().eq('id', jobData.id);`,
  `      await supabase.from('jobs').delete().eq('id', jobData.id);\n      setIsSubmitting(false);`
);

content = content.replace(
  `      setJobId(jobData.id);\n      setStep('success');`,
  `      setJobId(jobData.id);\n      setStep('success');\n      setIsSubmitting(false);`
);

content = content.replace(
  `} catch (err: any) {\n      console.error(err);\n      setError('An unexpected error occurred.');\n    }`,
  `} catch (err: any) {\n      console.error(err);\n      toast.error('An unexpected error occurred.');\n      setIsSubmitting(false);\n    }`
);

// 4. Update the "Confirm & Send" button to use isSubmitting and a spinner
const confirmButtonStr = `onClick={handleSubmit} className="w-full py-3 mt-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black transition"`;
const newConfirmButtonStr = `onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3 mt-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"`;

content = content.replace(
  confirmButtonStr,
  newConfirmButtonStr
);

content = content.replace(
  `Send to Print Queue 🚀</button>`,
  `{isSubmitting ? <i className="bx bx-loader-alt animate-spin text-xl"></i> : 'Send to Print Queue 🚀'}</button>`
);

// 5. Add active:scale-95 to other interactive buttons
content = content.replace(
  `className="w-full py-4 mt-8 rounded-2xl font-bold text-lg bg-emerald-500 hover:bg-emerald-400 text-black transition"`,
  `className="w-full py-4 mt-8 rounded-2xl font-bold text-lg bg-emerald-500 hover:bg-emerald-400 text-black transition active:scale-95"`
);

content = content.replace(
  `className="flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"`,
  `className="flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition active:scale-90"`
);

content = content.replace(
  `className="flex-1 py-4 font-bold text-sm bg-emerald-500 text-emerald-950 flex items-center justify-center gap-2 hover:bg-emerald-400 transition"`,
  `className="flex-1 py-4 font-bold text-sm bg-emerald-500 text-emerald-950 flex items-center justify-center gap-2 hover:bg-emerald-400 transition active:scale-95"`
);

content = content.replace(
  `className="flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 text-white/70 hover:text-white hover:bg-white/5 transition"`,
  `className="flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 text-white/70 hover:text-white hover:bg-white/5 transition active:scale-95"`
);

content = content.replace(
  `className="px-6 py-2.5 rounded-full font-bold text-sm bg-emerald-500 text-black hover:bg-emerald-400 transition"`,
  `className="px-6 py-2.5 rounded-full font-bold text-sm bg-emerald-500 text-black hover:bg-emerald-400 transition active:scale-95"`
);

fs.writeFileSync(filePath, content);
console.log('Customer UI Polish applied.');
