import * as fs from 'fs';

const filePath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/dashboard/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add state
content = content.replace(
  `  const [preview, setPreview] = useState<PreviewModal | null>(null);`,
  `  const [preview, setPreview] = useState<PreviewModal | null>(null);
  const [editingItem, setEditingItem] = useState<JobItem | null>(null);
  const [editSettings, setEditSettings] = useState<any>({});`
);

// Add handlers
content = content.replace(
  `  const handleView = async (item: JobItem) => {`,
  `  const handleEditClick = (e: React.MouseEvent, item: JobItem) => {
    e.stopPropagation();
    setEditingItem(item);
    setEditSettings(item.settings || { color: 'bw', copies: 1, page_range: 'all', paper_size: 'A4' });
  };

  const handleSaveSettings = async () => {
    if (!editingItem) return;
    setJobs(prev => prev.map(job => ({
      ...job,
      job_items: job.job_items.map(ji => ji.id === editingItem.id ? { ...ji, settings: editSettings } : ji)
    })));
    const targetId = editingItem.id;
    setEditingItem(null);
    await supabase.from('job_items').update({ settings: editSettings }).eq('id', targetId);
  };

  const handleView = async (item: JobItem) => {`
);

// Add Gear button to UI
content = content.replace(
  `                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition shrink-0">
                        <i className="bx bx-show text-lg"></i>
                      </div>`,
  `                      <div className="flex gap-1 shrink-0">
                        <button onClick={(e) => handleEditClick(e, item)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition">
                          <i className="bx bx-cog text-lg"></i>
                        </button>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition">
                          <i className="bx bx-show text-lg"></i>
                        </div>
                      </div>`
);

// Add modal render block at the bottom
const editModalStr = `      {/* Edit Settings Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1f2c34] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-bold">Edit Print Settings</h3>
              <button onClick={() => setEditingItem(null)} className="text-white/60 hover:text-white">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-white/50 text-xs font-semibold mb-1 block">Color Mode</label>
                <div className="flex gap-2">
                  <button onClick={() => setEditSettings({ ...editSettings, color: 'bw' })} className={\`flex-1 py-2 rounded-xl text-sm font-bold transition \${editSettings.color === 'bw' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}\`}>B&W</button>
                  <button onClick={() => setEditSettings({ ...editSettings, color: 'color' })} className={\`flex-1 py-2 rounded-xl text-sm font-bold transition \${editSettings.color === 'color' ? 'bg-[#C084FC] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}\`}>Color</button>
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs font-semibold mb-1 block">Copies</label>
                <div className="flex items-center gap-4 bg-white/5 rounded-xl p-2">
                  <button onClick={() => setEditSettings({ ...editSettings, copies: Math.max(1, (editSettings.copies || 1) - 1) })} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">-</button>
                  <span className="flex-1 text-center text-white font-bold">{editSettings.copies || 1}</span>
                  <button onClick={() => setEditSettings({ ...editSettings, copies: (editSettings.copies || 1) + 1 })} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">+</button>
                </div>
              </div>
              <div>
                <label className="text-white/50 text-xs font-semibold mb-1 block">Paper Size</label>
                <select value={editSettings.paper_size || 'A4'} onChange={e => setEditSettings({ ...editSettings, paper_size: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500">
                  <option value="A4" className="bg-[#1f2c34]">A4 (Standard)</option>
                  <option value="A3" className="bg-[#1f2c34]">A3 (Large)</option>
                  <option value="Letter" className="bg-[#1f2c34]">US Letter</option>
                </select>
              </div>
              <button onClick={handleSaveSettings} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold mt-2 transition">Save Settings</button>
            </div>
          </div>
        </div>
      )}`;

content = content.replace(
  `      {preview && (`,
  editModalStr + `\n\n      {preview && (`
);

fs.writeFileSync(filePath, content);
console.log('Editable settings added to dashboard.');
