const fs = require('fs');
const file = 'apps/web/src/app/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// We need to import jsPDF
if (!content.includes('import { jsPDF }')) {
    content = content.replace('import { createBrowserClient } from "@supabase/ssr";',
        'import { createBrowserClient } from "@supabase/ssr";\nimport { jsPDF } from "jspdf";');
}

const functionToAdd = `
  const handleConvertToPdf = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('print_jobs').download(fileUrl);
      if (error || !data) throw error || new Error('Failed to download image');
      
      const blobUrl = URL.createObjectURL(data);
      const img = new Image();
      img.crossOrigin = "Anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = blobUrl;
      });
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate aspect ratio
      const imgRatio = img.width / img.height;
      const pageRatio = pageWidth / pageHeight;
      
      let finalWidth = pageWidth;
      let finalHeight = pageWidth / imgRatio;
      
      if (finalHeight > pageHeight) {
        finalHeight = pageHeight;
        finalWidth = pageHeight * imgRatio;
      }
      
      // Center the image
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;
      
      pdf.addImage(img, 'JPEG', x, y, finalWidth, finalHeight);
      pdf.save(fileName.replace(/\\.[^/.]+$/, "") + '.pdf');
      
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Error converting to PDF:', e);
      alert('Failed to convert image to PDF');
    }
  };
`;

if (!content.includes('handleConvertToPdf')) {
    content = content.replace('const handleCompleteJob =', functionToAdd + '\n  const handleCompleteJob =');
}

const buttonHtml = `
                                            {item.file_type === 'image' && item.settings?.action !== 'passport_photo' && (
                                                <button
                                                    onClick={() => handleConvertToPdf(item.file_url, item.file_name)}
                                                    className="ml-2 px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors border border-slate-200 flex items-center gap-1 shadow-sm"
                                                    title="Convert to PDF for printing"
                                                >
                                                    <i className="bx bxs-file-pdf text-red-500"></i> Convert to PDF
                                                </button>
                                            )}
`;

content = content.replace(/<span className="text-xs font-medium text-slate-700 truncate max-w-\[150px\] md:max-w-\[200px\]">[^<]+<\/span>/g,
    `$&` + buttonHtml);

fs.writeFileSync(file, content);
console.log('Dashboard PDF conversion added successfully');
