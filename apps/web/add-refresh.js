import * as fs from 'fs';

const filePath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/s/[slug]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const useEBlock = `  // Poll for status on success screen
  useEffect(() => {
    if (step !== 'success' || !jobId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from('jobs').select('status').eq('id', jobId).single();
      if (data && data.status !== 'pending') {
        router.push(\`/s/\${params.slug}/status/\${jobId}\`);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [step, jobId, params.slug, router, supabase]);

  const handleManualRefresh = async () => {
    if (!jobId) return;
    const { data } = await supabase.from('jobs').select('status').eq('id', jobId).single();
    if (data && data.status !== 'pending') {
      router.push(\`/s/\${params.slug}/status/\${jobId}\`);
    } else {
      addMessage({ type: 'bot', content: 'Status checked. Still pending shopkeeper approval.' });
    }
  };`;

// Insert the useEBlock right before the final return statement (which doesn't exist, it's just `return (`)
content = content.replace(
  `  return (
    <div className="min-h-[100dvh] max-h-[100dvh] flex flex-col relative"`,
  useEBlock + `\n\n  return (\n    <div className="min-h-[100dvh] max-h-[100dvh] flex flex-col relative"`
);

// In the success block, add the manual refresh button next to Track My Order
content = content.replace(
  `                <button
                  onClick={() => router.push(\`/s/\${params.slug}/status/\${jobId}\`)}
                  className="w-full py-3 text-sm font-bold rounded-xl transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#25D366', color: 'white' }}
                >
                  📱 Track My Order →
                </button>`,
  `                <button
                  onClick={() => router.push(\`/s/\${params.slug}/status/\${jobId}\`)}
                  className="w-full py-3 text-sm font-bold rounded-xl transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#25D366', color: 'white' }}
                >
                  📱 Track My Order →
                </button>
                <button
                  onClick={handleManualRefresh}
                  className="w-full py-3 text-sm font-bold rounded-xl transition-all hover:bg-white/10"
                  style={{ color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}
                >
                  <i className="bx bx-refresh text-lg align-middle"></i> Refresh Status
                </button>`
);

fs.writeFileSync(filePath, content);
console.log('Customer UI refresh updated.');
