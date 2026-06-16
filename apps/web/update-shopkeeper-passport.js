import * as fs from 'fs';

const filePath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/dashboard/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Ensure jsPDF is imported
if (!content.includes('import { jsPDF }')) {
  content = content.replace(
    `import { createClient } from "@/lib/supabase/client";`,
    `import { createClient } from "@/lib/supabase/client";\nimport { jsPDF } from "jspdf";`
  );
}

// Add the new handler functions after handleView
const passportHandlersStr = `  const handleGeneratePassportLayout = async (item: JobItem) => {
    try {
      const { data } = await supabase.storage.from('customer_uploads').createSignedUrl(item.file_url, 3600);
      if (!data?.signedUrl) throw new Error("Could not access file");
      
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = data.signedUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [152.4, 101.6]
      });
      
      const columns = 4;
      const rows = 2;
      const photoW = 35;
      const photoH = 45;
      const spacingX = (152.4 - (columns * photoW)) / (columns + 1);
      const spacingY = (101.6 - (rows * photoH)) / (rows + 1);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          const x = spacingX + c * (photoW + spacingX);
          const y = spacingY + r * (photoH + spacingY);
          doc.addImage(img, 'JPEG', x, y, photoW, photoH);
          doc.setDrawColor(200, 200, 200);
          doc.rect(x, y, photoW, photoH);
        }
      }
      
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (err: any) {
      alert("Error generating layout: " + err.message);
    }
  };

  const handleRemoveBackground = (item: JobItem) => {
    alert("Background Removal API is not yet connected.\\nPlease integrate with an API like Remove.bg or Photoroom to use this feature.");
  };`;

content = content.replace(
  `  const handleView = async (item: JobItem) => {`,
  passportHandlersStr + '\n\n  const handleView = async (item: JobItem) => {'
);

// Add the Passport Toolset UI inside the file bubble
const passportToolsetStr = `                    {/* Passport Toolset */}
                    {item.settings?.action === 'passport_photo' && (
                      <div className="border-t border-white/10 mt-2 p-3 space-y-2" style={{ background: 'rgba(0,0,0,0.15)' }}>
                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-2"><i className="bx bx-id-card"></i> Passport Tools</p>
                        <div className="flex flex-col gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleGeneratePassportLayout(item); }} className="w-full py-2 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 transition flex items-center justify-center gap-1 shadow-md shadow-amber-500/20">
                            <i className="bx bx-grid-alt text-sm"></i> Auto 4x6 Layout (8 copies)
                          </button>
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); handleRemoveBackground(item); }} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center gap-1 border border-white/10">
                              <i className="bx bx-cut"></i> Remove BG (AI)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}`;

content = content.replace(
  `                      <span className={\`text-[10px] px-2 py-0.5 rounded-full font-semibold \${fi.opensInBrowser ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}\`}>
                        {fi.opensInBrowser ? '👁️ Preview' : '⬇️ Download'}
                      </span>
                    </div>`,
  `                      <span className={\`text-[10px] px-2 py-0.5 rounded-full font-semibold \${fi.opensInBrowser ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}\`}>
                        {fi.opensInBrowser ? '👁️ Preview' : '⬇️ Download'}
                      </span>
                    </div>
${passportToolsetStr}`
);

fs.writeFileSync(filePath, content);
console.log('Shopkeeper dashboard updated with Passport Toolset.');
