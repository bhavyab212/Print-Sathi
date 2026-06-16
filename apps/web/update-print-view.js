import * as fs from 'fs';

const filePath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/dashboard/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update handlePrint
content = content.replace(
  `  const handlePrint = async (job: PrintJob) => {
    if (!job.job_items || job.job_items.length === 0) { alert('This print job has no files attached.'); return; }
    const printWindow = window.open('', '_blank');
    await updateStatus(job.id, 'printing');
    const item = job.job_items[0];
    const { data } = await supabase.storage.from('customer_uploads').createSignedUrl(item.file_url, 3600);
    if (data?.signedUrl && printWindow) printWindow.location.href = data.signedUrl;
    else if (data?.signedUrl) window.location.href = data.signedUrl;
    else if (printWindow) printWindow.close();
  };`,
  `  const handlePrint = async (job: PrintJob) => {
    if (!job.job_items || job.job_items.length === 0) { alert('This print job has no files attached.'); return; }
    await updateStatus(job.id, 'printing');
    
    if (job.job_items.length === 1) {
      const printWindow = window.open('', '_blank');
      const item = job.job_items[0];
      const { data, error } = await supabase.storage.from('customer_uploads').createSignedUrl(item.file_url, 3600);
      if (error) { alert('Could not access file: ' + error.message); if (printWindow) printWindow.close(); return; }
      if (data?.signedUrl && printWindow) printWindow.location.href = data.signedUrl;
      else if (data?.signedUrl) window.location.href = data.signedUrl;
      else if (printWindow) printWindow.close();
      return;
    }

    alert(\`This job has \${job.job_items.length} files. Please ensure your browser allows multiple popups to print them all.\`);
    for (const item of job.job_items) {
      const { data } = await supabase.storage.from('customer_uploads').createSignedUrl(item.file_url, 3600);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  };`
);

// Update handleView
content = content.replace(
  `  const handleView = async (item: JobItem) => {
    const fi = getFileInfo(item.file_name, item.file_type || item.settings?.file_type);
    const { data } = await supabase.storage.from('customer_uploads').createSignedUrl(item.file_url, 3600);
    if (data?.signedUrl) setPreview({ fileUrl: item.file_url, signedUrl: data.signedUrl, fileName: item.file_name, opensInBrowser: fi.opensInBrowser });
  };`,
  `  const handleView = async (item: JobItem) => {
    const fi = getFileInfo(item.file_name, item.file_type || item.settings?.file_type);
    const { data, error } = await supabase.storage.from('customer_uploads').createSignedUrl(item.file_url, 3600);
    if (error) { alert('Error opening file: ' + error.message); return; }
    if (data?.signedUrl) setPreview({ fileUrl: item.file_url, signedUrl: data.signedUrl, fileName: item.file_name, opensInBrowser: fi.opensInBrowser });
  };`
);

fs.writeFileSync(filePath, content);
console.log('Print/View logic updated.');
