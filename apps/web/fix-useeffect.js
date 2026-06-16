import * as fs from 'fs';

const filePath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/s/[slug]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The block to extract:
const useEffectStr = `  // Poll for status on success screen
  useEffect(() => {
    if (step !== 'success' || !jobId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from('jobs').select('status').eq('id', jobId).single();
      if (data && data.status !== 'pending') {
        router.push(\`/s/\${params.slug}/status/\${jobId}\`);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [step, jobId, params.slug, router, supabase]);`;

// Remove it from current location
content = content.replace(useEffectStr, '');

// Insert it before the early returns
const insertionPoint = `  // Fetch shop info on load`;
content = content.replace(
  insertionPoint,
  useEffectStr + '\n\n  // Fetch shop info on load'
);

fs.writeFileSync(filePath, content);
console.log('Fixed useEffect position.');
