import * as fs from 'fs';

const filePath = '/media/bhavya/backup and etc/Project/Printo_/apps/web/src/app/s/[slug]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add ChatSteps
content = content.replace(
  "type ChatStep = 'greeting' | 'name' | 'files' | 'notes' | 'confirm' | 'uploading' | 'success';",
  "type ChatStep = 'intro' | 'greeting' | 'name' | 'files' | 'combine_prompt' | 'notes' | 'confirm' | 'uploading' | 'success';"
);

// 2. Default step is intro
content = content.replace(
  "const [step, setStep] = useState<ChatStep>('greeting');",
  "const [step, setStep] = useState<ChatStep>('intro');"
);

// 3. Remove combineImages state from being hardcoded
content = content.replace(
  "const [combineImages] = useState(true);",
  "const [combineImages, setCombineImages] = useState(false);"
);

// 4. Update the greeting useEffect
content = content.replace(
  `  useEffect(() => {
    if (isInitializing || error) return;
    const startGreeting = async () => {
      await botSay(\`👋 Hey! Welcome to **\${shopName || 'Print Shop'}**.\\n\\nI'm your print assistant. What's your name?\`, 600);
      setStep('name');
    };
    startGreeting();
  }, [isInitializing, error, shopName]);`,
  `  useEffect(() => {
    if (isInitializing || error || step !== 'greeting') return;
    const startGreeting = async () => {
      await botSay(\`👋 Hey! Welcome to **\${shopName || 'Print Shop'}**.\\n\\nI'm your print assistant. How can I help you today?\`, 600);
      setStep('files');
    };
    startGreeting();
  }, [isInitializing, error, shopName, step]);`
);

// 5. We don't need handleSendName because the name is entered in the intro screen!
content = content.replace(
  `  const handleSendName = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || trimmed.length < 2) return;
    addMessage({ type: 'user', content: trimmed });
    setName(trimmed);
    setInputValue('');
    setStep('files');
    await botSay(\`Nice to meet you, **\${trimmed}**! 🎉\\n\\nPlease tap the 📎 button below to attach the files you want to print.\\n\\nSupported: PDF, JPG, PNG, DOCX, XLSX (max 25MB each)\`);
  };`,
  `  const handleStartChat = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) return;
    setStep('greeting');
  };`
);

// 6. Fix `addFiles` to trigger prompt if multiple images
content = content.replace(
  `      setIsBotTyping(true);
      await new Promise(r => setTimeout(r, 600));
      setIsBotTyping(false);
      addMessage({ type: 'bot', content: \`Got your file! Configure the print settings below:\`, fileItem: newItem });
      scrollToBottom();
    }

    if (errors.length > 0) setError(errors.join('\\n'));
  }, [shopId, addMessage, scrollToBottom]);`,
  `      setIsBotTyping(true);
      await new Promise(r => setTimeout(r, 600));
      setIsBotTyping(false);
      addMessage({ type: 'bot', content: \`Got your file! Configure the print settings below:\`, fileItem: newItem });
      scrollToBottom();
    }

    const imageCount = newRawFiles.filter(f => f.type.startsWith('image/')).length;
    if (imageCount > 1) {
      setStep('combine_prompt');
      await botSay(\`You've uploaded \${imageCount} photos. Do you want to combine them into a single PDF document, or keep them separate?\`);
    }

    if (errors.length > 0) setError(errors.join('\\n'));
  }, [shopId, addMessage, scrollToBottom]);`
);

// 7. Add prompt handlers
content = content.replace(
  `  const handleDoneWithFiles = async () => {`,
  `  const handleCombineChoice = async (combine: boolean) => {
    setCombineImages(combine);
    addMessage({ type: 'user', content: combine ? 'Combine into 1 PDF' : 'Keep Separate' });
    setStep('files');
    await botSay(combine ? 'Great, they will be combined.' : 'Got it, they will be printed separately.');
  };

  const handleDoneWithFiles = async () => {`
);

// 8. Replace step === 'name' input logic
content = content.replace(
  `          {step === 'name' && (
            <>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendName()}
                placeholder="Type your name..."
                maxLength={30}
                className="flex-1 rounded-full px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                style={{ background: '#2a3942' }}
                autoFocus
              />
              <button
                onClick={handleSendName}
                disabled={inputValue.trim().length < 2}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-all active:scale-90 shrink-0"
                style={{ background: '#25D366' }}
              >
                <i className="bx bx-send text-lg"></i>
              </button>
            </>
          )}`,
  `          {step === 'combine_prompt' && (
            <div className="flex-1 flex gap-2">
              <button onClick={() => handleCombineChoice(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full py-3 text-sm font-bold transition">Combine to PDF</button>
              <button onClick={() => handleCombineChoice(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-full py-3 text-sm font-bold transition">Keep Separate</button>
            </div>
          )}`
);

// 9. Add the intro screen renderer at the top of the chat area
content = content.replace(
  `      <div className="flex-1 overflow-y-auto p-4 space-y-4"`,
  `      {step === 'intro' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-700/20 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
            <i className="bx bx-printer text-emerald-400 text-4xl"></i>
          </div>
          <h1 className="text-white font-black text-2xl mb-2">Welcome to {shopName || 'Print Shop'}!</h1>
          <p className="text-white/60 text-sm mb-8">Please enter your name to start printing.</p>
          <div className="w-full max-w-xs space-y-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStartChat()}
              placeholder="Your Name"
              className="w-full rounded-2xl px-5 py-4 text-center text-lg font-bold text-white placeholder-white/20 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
              style={{ background: '#1f2c34' }}
              autoFocus
            />
            <button
              onClick={handleStartChat}
              disabled={name.trim().length < 2}
              className="w-full py-4 font-black text-white rounded-2xl transition-all disabled:opacity-50 disabled:scale-100 hover:scale-[1.02] active:scale-95 shadow-xl shadow-emerald-500/20"
              style={{ background: '#25D366' }}
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto p-4 space-y-4"`
);

// close the new div block correctly at the end of the chat area
content = content.replace(
  `        <div ref={chatEndRef}></div>
      </div>

      {/* Bottom Input Bar */}`,
  `        <div ref={chatEndRef}></div>
      </div>
      )}

      {/* Bottom Input Bar */}`
);

fs.writeFileSync(filePath, content);
console.log('Customer UI updated.');
