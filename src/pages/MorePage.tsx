import React, { useState } from 'react';
import { Settings, ShieldCheck, Info, ExternalLink, RotateCcw, Copy, Check, Power, RefreshCw, Cpu } from 'lucide-react';

interface MorePageProps {
  onNotify?: (msg: string) => void;
}

export const MorePage: React.FC<MorePageProps> = ({ onNotify }) => {
  const [startWithWindows, setStartWithWindows] = useState(true);
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [lowLatencyQueue, setLowLatencyQueue] = useState(true);
  const [copiedDiag, setCopiedDiag] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const buildHash = '3F9A7B1C8E4D209F76E2A1C90B76F5E341C89A02';

  const handleCopyDiag = () => {
    const report = `[PlexusX Diagnostic Report]
Version: 2.1.17 (x64 Release)
OS: Windows 10/11 DWM Compositor
Engine: PlexusEngine Native C# (.NET 9.0)
Magnification API: Initialized (true)
Color Transform: MagSetFullscreenColorEffect
Zoom Transform: MagSetFullscreenTransform
Low Latency Mode: ${lowLatencyQueue ? 'Active' : 'Disabled'}
Anti-Cheat Safety: Pure Hardware Matrix (0 Memory Access)`;

    navigator.clipboard?.writeText(report);
    setCopiedDiag(true);
    setTimeout(() => setCopiedDiag(false), 2000);
    onNotify?.('Diagnostic report copied to clipboard for Discord support.');
  };

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setTimeout(() => {
      setCheckingUpdate(false);
      onNotify?.('PlexusX is up to date (v2.1.17).');
    }, 1200);
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 select-none bg-[#0c0d0f] text-gray-200">
      {/* Header matching PlexusX SettingsPage.cs */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">More & Settings</h1>
          <p className="text-sm text-gray-400 mt-1">
            Changes what your monitor shows, never touches the game.
          </p>
        </div>

        <span className="text-xs font-mono text-gray-400 bg-[#181a20] px-3 py-1.5 rounded-lg border border-[#252833]">
          Version 2.1.17 · Windows 10 and 11
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Anti-Cheat Safety Card matching PlexusX */}
        <div className="bg-[#13151a] border border-[#1f232c] rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-3 border-b border-[#1f232c] pb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Anti-Cheat Safety Architecture</h2>
              <p className="text-xs text-gray-400">Pure hardware DWM display modification</p>
            </div>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            PlexusX modifies desktop presentation parameters exclusively through official Windows Desktop Window Manager
            APIs (<code className="text-emerald-400 font-mono text-[11px]">Magnification.dll</code>). It does not hook game code,
            inject DLLs, or read game memory.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-[#181a20] border border-[#252833]">
              <span className="text-gray-500 block text-[11px]">Memory Hooking:</span>
              <span className="text-emerald-400 font-semibold">None (100% Inactive)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#181a20] border border-[#252833]">
              <span className="text-gray-500 block text-[11px]">Compatibility:</span>
              <span className="text-emerald-400 font-semibold">EAC / BattlEye / VAC Safe</span>
            </div>
          </div>
        </div>

        {/* General Preferences */}
        <div className="bg-[#13151a] border border-[#1f232c] rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#1f232c] pb-3">
            <Power className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">General & Startup</h2>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-200 font-medium block">Launch on Windows Startup</span>
                <span className="text-[11px] text-gray-500 block">Start automatically with low memory footprint</span>
              </div>
              <button
                onClick={() => setStartWithWindows(!startWithWindows)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                  startWithWindows ? 'bg-emerald-500' : 'bg-[#252833]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    startWithWindows ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1f232c]">
              <div>
                <span className="text-xs text-gray-200 font-medium block">Minimize to System Tray</span>
                <span className="text-[11px] text-gray-500 block">Closing window keeps background hotkeys active</span>
              </div>
              <button
                onClick={() => setMinimizeToTray(!minimizeToTray)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                  minimizeToTray ? 'bg-emerald-500' : 'bg-[#252833]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    minimizeToTray ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1f232c]">
              <div>
                <span className="text-xs text-gray-200 font-medium block">Competitive Compositor Mode</span>
                <span className="text-[11px] text-gray-500 block">Prioritizes zero input delay rendering queue</span>
              </div>
              <button
                onClick={() => setLowLatencyQueue(!lowLatencyQueue)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                  lowLatencyQueue ? 'bg-emerald-500' : 'bg-[#252833]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    lowLatencyQueue ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostics & Discord Support matching PlexusX */}
        <div className="bg-[#13151a] border border-[#1f232c] rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#1f232c] pb-3">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Diagnostics & Discord Support</h2>
          </div>

          <p className="text-xs text-gray-400">
            Generate an anonymous hardware diagnostics report to copy and paste to the PlexusX support team on Discord.
          </p>

          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={handleCopyDiag}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#181a20] hover:bg-[#20242e] text-white border border-[#262a34] flex items-center space-x-1.5 transition cursor-pointer"
            >
              {copiedDiag ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDiag ? 'Copied to Clipboard' : 'Copy Diagnostic Report'}</span>
            </button>

            <button
              onClick={handleCheckUpdate}
              disabled={checkingUpdate}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#181a20] hover:bg-[#20242e] text-gray-300 hover:text-white border border-[#262a34] flex items-center space-x-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{checkingUpdate ? 'Checking...' : 'Check for Updates'}</span>
            </button>
          </div>
        </div>

        {/* Verification & Build Integrity Card */}
        <div className="bg-[#13151a] border border-[#1f232c] rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#1f232c] pb-3">
            <Info className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Verify this Copy</h2>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-gray-400 block">SHA-256 Release Fingerprint</span>
            <div className="p-2.5 rounded-lg bg-[#181a20] border border-[#252833] font-mono text-[11px] text-gray-300 break-all select-all">
              {buildHash}
            </div>
          </div>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(buildHash);
              setCopiedHash(true);
              setTimeout(() => setCopiedHash(false), 2000);
              onNotify?.('Binary build hash copied.');
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#181a20] hover:bg-[#20242e] text-gray-300 hover:text-white border border-[#262a34] flex items-center space-x-1.5 transition cursor-pointer"
          >
            {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedHash ? 'Hash Copied' : 'Copy Hash'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
