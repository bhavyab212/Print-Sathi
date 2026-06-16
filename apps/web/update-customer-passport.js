import * as fs from 'fs';

const filePath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/s/[slug]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update PrintAction type
content = content.replace(
  `type PrintAction = 'direct_print' | 'edit';`,
  `type PrintAction = 'direct_print' | 'edit' | 'passport_photo';`
);

// Update Quick Replies in MessageBubble
const cropButtonStr = `                  {/* Crop button for images */}
                  {fileItem.file.type.startsWith('image/') && (
                    <button onClick={() => setCropFileId(fileItem.id)}
                      className="w-full py-1.5 rounded-lg text-[11px] font-bold bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 transition border border-purple-500/30 flex items-center justify-center gap-1.5"
                    >
                      <i className="bx bx-crop text-sm"></i> ✂️ Crop / Rotate
                    </button>
                  )}`;

const passportPhotoToggleStr = `                  {/* Passport Photo Toggle */}
                  {fileItem.file.type.startsWith('image/') && (
                    <button onClick={() => updateFileSetting(fileItem.id, 'action', fileItem.action === 'passport_photo' ? 'direct_print' : 'passport_photo')}
                      className={\`mt-2 w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border \${fileItem.action === 'passport_photo' ? 'bg-amber-500 text-white border-amber-400' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20'}\`}
                    >
                      <i className="bx bx-id-card text-lg"></i>
                      {fileItem.action === 'passport_photo' ? '🛂 Passport Photo (Selected)' : 'Make Passport Photo'}
                    </button>
                  )}`;

content = content.replace(
  cropButtonStr,
  cropButtonStr + '\n' + passportPhotoToggleStr
);

fs.writeFileSync(filePath, content);
console.log('Customer UI updated with Passport Photo option.');
