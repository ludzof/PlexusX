import React, { useEffect, useState } from 'react';
import { Monitor, CheckCircle2, RefreshCw, Cpu, Layers, Sparkles } from 'lucide-react';
import { SystemInfo } from '../types/electron';

interface MonitorPageProps {
  onNotify?: (msg: string) => void;
}

export const MonitorPage: React.FC<MonitorPageProps> = ({ onNotify }) => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [selectedMonitor, setSelectedMonitor] = useState<number>(1);
  const [showIdentity, setShowIdentity] = useState(false);
  const [syncDisplays, setSyncDisplays] = useState(true);

  const fetchSystemInfo = async () => {
    if (window.electronAPI) {
      const info = await window.electronAPI.getSystemInfo();
      setSystemInfo(info);
    } else {
      setSystemInfo({
        displays: [
          {
            id: 1,
            index: 1,
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            scaleFactor: 1.0,
            isPrimary: true,
          },
        ],
        version: '2.1.17',
        app: 'PlexusX',
      });
    }
  };

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const handleIdentify = () => {
    setShowIdentity(true);
    setTimeout(() => setShowIdentity(false), 2500);
    onNotify?.('Identifying active monitors...');
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 select-none bg-[#0c0d0f] text-gray-200">
      {/* Big Monitor Identifier Overlay if active */}
      {showIdentity && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-48 h-48 rounded-3xl bg-[#14161c]/95 border-4 border-emerald-400 shadow-[0_0_80px_rgba(0,240,118,0.6)] flex flex-col items-center justify-center">
            <span className="text-7xl font-bold font-mono text-emerald-400">{selectedMonitor}</span>
            <span className="text-xs font-semibold text-gray-300 mt-2">Display {selectedMonitor}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Monitor Setup</h1>
          <p className="text-sm text-gray-400 mt-1">
            Detect and synchronize color balance, DWM desktop composition, and refresh rates across displays.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleIdentify}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#181a20] text-gray-300 hover:text-white border border-[#262a34] flex items-center space-x-1.5 transition cursor-pointer"
          >
            <span>Identify Displays</span>
          </button>

          <button
            onClick={fetchSystemInfo}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#181a20] text-gray-300 hover:text-white border border-[#262a34] flex items-center space-x-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rescan Hardware</span>
          </button>
        </div>
      </div>

      {/* Monitor Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {systemInfo?.displays.map((disp) => {
          const isSelected = selectedMonitor === disp.index;
          return (
            <div
              key={disp.id}
              onClick={() => setSelectedMonitor(disp.index)}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#151c17] border-emerald-500/50 shadow-[0_0_15px_rgba(0,240,118,0.1)]'
                  : 'bg-[#13151a] border-[#1f232c] hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-[#181b22] border border-[#252a36] text-emerald-400">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Display {disp.index}</h3>
                    <p className="text-xs text-gray-400">
                      {disp.isPrimary ? 'Primary Gaming Monitor' : 'Secondary Display'}
                    </p>
                  </div>
                </div>

                {disp.isPrimary && (
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                    PRIMARY
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-[#1f232c]">
                <div>
                  <span className="text-gray-500 block">Resolution:</span>
                  <span className="font-mono text-gray-200 font-medium">
                    {disp.bounds.width} × {disp.bounds.height}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Scaling Factor:</span>
                  <span className="font-mono text-gray-200 font-medium">
                    {Math.round(disp.scaleFactor * 100)}% DWM Scale
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">DWM Composition:</span>
                  <span className="text-emerald-400 font-medium">Active (Hardware Mode)</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Color Transform Hook:</span>
                  <span className="text-emerald-400 font-medium">Magnification.dll Ready</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Synchronization Settings Card */}
      <div className="bg-[#13151a] border border-[#1f232c] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Display Synchronization</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Automatically apply Dark Boost, Digital Vibrance, and Color Grading across all monitors.
            </p>
          </div>
          <button
            onClick={() => {
              const next = !syncDisplays;
              setSyncDisplays(next);
              onNotify?.(`Multi-display synchronization: ${next ? 'ON' : 'OFF'}`);
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
              syncDisplays ? 'bg-emerald-500' : 'bg-[#252833]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                syncDisplays ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
