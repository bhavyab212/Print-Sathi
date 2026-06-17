import re
import os

file_path = 'apps/web/src/app/s/[slug]/page.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Make sure we don't double replace
if 'dark:text-white' not in content:
    # Text colors
    content = re.sub(r'\btext-white/10\b', 'text-slate-200 dark:text-white/10', content)
    content = re.sub(r'\btext-white/20\b', 'text-slate-300 dark:text-white/20', content)
    content = re.sub(r'\btext-white/30\b', 'text-slate-400 dark:text-white/30', content)
    content = re.sub(r'\btext-white/40\b', 'text-slate-500 dark:text-white/40', content)
    content = re.sub(r'\btext-white/50\b', 'text-slate-500 dark:text-white/50', content)
    content = re.sub(r'\btext-white/60\b', 'text-slate-600 dark:text-white/60', content)
    content = re.sub(r'\btext-white/70\b', 'text-slate-600 dark:text-white/70', content)
    content = re.sub(r'\btext-white/80\b', 'text-slate-700 dark:text-white/80', content)
    content = re.sub(r'\btext-white/90\b', 'text-slate-800 dark:text-white/90', content)
    content = re.sub(r'\btext-white(?!/)\b', 'text-slate-800 dark:text-white', content)
    
    # Background colors
    content = re.sub(r'\bbg-white/5\b', 'bg-slate-200 dark:bg-white/5', content)
    content = re.sub(r'\bbg-white/10\b', 'bg-slate-200 dark:bg-white/10', content)
    content = re.sub(r'\bbg-white/15\b', 'bg-slate-300 dark:bg-white/15', content)
    content = re.sub(r'\bbg-white/20\b', 'bg-slate-300 dark:bg-white/20', content)
    content = re.sub(r'\bbg-white/30\b', 'bg-slate-400 dark:bg-white/30', content)
    
    # Border colors
    content = re.sub(r'\bborder-white/10\b', 'border-slate-300 dark:border-white/10', content)
    content = re.sub(r'\bborder-white/20\b', 'border-slate-300 dark:border-white/20', content)
    content = re.sub(r'\bborder-white/30\b', 'border-slate-400 dark:border-white/30', content)
    
    # Root div dark mode
    content = content.replace('style={{ background: isDarkMode ? \'#0b141a\' : \'#f8fafc\', color: isDarkMode ? \'#ffffff\' : \'#0f172a\' }}',
                              '')
    content = content.replace('className="relative min-h-[100dvh] flex flex-col font-sans transition-colors duration-500 overflow-hidden"',
                              'className={`relative min-h-[100dvh] flex flex-col font-sans transition-colors duration-500 overflow-hidden bg-slate-50 dark:bg-[#0b141a] text-slate-900 dark:text-white ${isDarkMode ? "dark" : ""}`}')

with open(file_path, 'w') as f:
    f.write(content)

print("Light/Dark mode replacement done.")
