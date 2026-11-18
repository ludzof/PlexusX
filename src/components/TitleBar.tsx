import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximize();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.close();
    } else {
      window.close();
    }
  };

  const noDragStyle = {
    WebkitAppRegion: 'no-drag',
  } as any;

  return (
    <div
      style={{ WebkitAppRegion: 'drag' } as any}
      className="h-9 w-full bg-[#0c0d0f] border-b border-[#1c1f26] flex items-center justify-between px-3.5 select-none z-50 shrink-0"
    >
      {/* Brand Logo & Title - Exact 8-spoke PlexusX asterisk */}
      <div style={noDragStyle} className="flex items-center space-x-2">
        <svg
          className="w-4 h-4 text-white fill-current"
          viewBox="0 0 24 24"
        >
          {/* 8-spoke rounded starburst from PlexusX */}
          <path d="M12 1.5C12.55 1.5 13 1.95 13 2.5V7.8L16.75 4.05C17.14 3.66 17.77 3.66 18.16 4.05C18.55 4.44 18.55 5.07 18.16 5.46L14.41 9.21H19.71C20.26 9.21 20.71 9.66 20.71 10.21C20.71 10.76 20.26 11.21 19.71 11.21H14.41L18.16 14.96C18.55 15.35 18.55 15.98 18.16 16.37C17.77 16.76 17.14 16.76 16.75 16.37L13 12.62V17.92C13 18.47 12.55 18.92 12 18.92C11.45 18.92 11 18.47 11 17.92V12.62L7.25 16.37C6.86 16.76 6.23 16.76 5.84 16.37C5.45 15.98 5.45 15.35 5.84 14.96L9.59 11.21H4.29C3.74 11.21 3.29 10.76 3.29 10.21C3.29 9.66 3.74 9.21 4.29 9.21H9.59L5.84 5.46C5.45 5.07 5.45 4.44 5.84 4.05C6.23 3.66 6.86 3.66 7.25 4.05L11 7.8V2.5C11 1.95 11.45 1.5 12 1.5Z" />
        </svg>
        <span className="font-bold text-sm tracking-wide text-white">PlexusX</span>
      </div>

      {/* Window Controls */}
      <div style={noDragStyle} className="flex items-center space-x-1">
        <button
          style={noDragStyle}
          onClick={handleMinimize}
          className="p-1.5 hover:bg-[#20242d] text-gray-400 hover:text-gray-100 rounded transition cursor-pointer"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          style={noDragStyle}
          onClick={handleMaximize}
          className="p-1.5 hover:bg-[#20242d] text-gray-400 hover:text-gray-100 rounded transition cursor-pointer"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          style={noDragStyle}
          onClick={handleClose}
          className="p-1.5 hover:bg-red-600/80 text-gray-400 hover:text-white rounded transition cursor-pointer"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
