import React from 'react';

export function TitleBar() {
  const handleMinimize = () => window.electron.minimize();
  const handleMaximize = () => window.electron.maximize();
  const handleClose = () => window.electron.close();

  return (
    <div 
      className="flex h-10 w-full shrink-0 select-none items-center justify-between border-b border-gray-200 bg-white"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 pl-4">
        <i className="bx bx-printer text-blue-600"></i>
        <span className="text-sm font-medium text-gray-700">Print Sathi</span>
      </div>

      <div 
        className="flex h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button 
          onClick={handleMinimize}
          className="flex h-full w-12 items-center justify-center text-gray-500 hover:bg-gray-100"
        >
          <i className="bx bx-minus"></i>
        </button>
        <button 
          onClick={handleMaximize}
          className="flex h-full w-12 items-center justify-center text-gray-500 hover:bg-gray-100"
        >
          <i className="bx bx-window"></i>
        </button>
        <button 
          onClick={handleClose}
          className="flex h-full w-12 items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white"
        >
          <i className="bx bx-x text-lg"></i>
        </button>
      </div>
    </div>
  );
}
