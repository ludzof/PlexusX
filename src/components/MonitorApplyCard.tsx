import React, { useState, useEffect, useRef } from 'react';
import { Check, Eye } from 'lucide-react';
import { MonitorItem } from '../types/electron';

interface MonitorApplyCardProps {
  onTickedMonitorsChange?: (tickedDeviceNames: string[]) => void;
  onNotify?: (msg: string) => void;
}

interface DisplayTileItem {
  id: number;
  name: string;
  deviceName: string;
  res: string;
  hz: number;
  main: boolean;
  ticked: boolean;
}

const MonitorApplyCardComponent: React.FC<MonitorApplyCardProps> = ({
  onTickedMonitorsChange,
  onNotify,
}) => {
  const [monitors, setMonitors] = useState<DisplayTileItem[]>([
    {
      id: 1,
      name: '24G2W1G4',
      deviceName: '\\\\.\\DISPLAY1',
      res: '1920 × 1080',
      hz: 144,
      main: true,
      ticked: true,
    },
    {
      id: 2,
      name: '22B1W',
      deviceName: '\\\\.\\DISPLAY2',
      res: '1080 × 1920',
      hz: 60,
      main: false,
      ticked: false,
    },
  ]);
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Load monitors from Electron system info or fallback
  useEffect(() => {
    const fetchMonitors = async () => {
      try {
        let loadedItems: DisplayTileItem[] = [];
        if (window.electronAPI?.getMonitorsList) {
          const raw = await window.electronAPI.getMonitorsList();
          if (raw && raw.length > 0) {
            loadedItems = raw.map((m, idx) => ({
              id: m.id || idx + 1,
              name: m.friendlyName || m.name || (m.isPrimary ? '24G2W1G4' : '22B1W'),
              deviceName: m.deviceName || (m.isPrimary ? '\\\\.\\DISPLAY1' : `\\\\.\\DISPLAY${idx + 1}`),
              res: m.res || `${m.width} × ${m.height}`,
              hz: m.hz || (m.isPrimary ? 144 : 60),
              main: !!m.isPrimary,
              ticked: m.isPrimary, // Default: primary ticked, secondary unticked (matching screenshot)
            }));
          }
        }

        // Restore saved ticked states from localStorage if available
        const savedTicked = localStorage.getItem('plexus_ticked_monitors');
        if (savedTicked) {
          try {
            const tickedNames = JSON.parse(savedTicked) as string[];
            if (loadedItems.length > 0) {
              loadedItems = loadedItems.map((m) => ({
                ...m,
                ticked: tickedNames.includes(m.deviceName) || (tickedNames.length === 0 && m.main),
              }));
            } else {
              setMonitors((prev) =>
                prev.map((m) => ({
                  ...m,
                  ticked: tickedNames.includes(m.deviceName),
                }))
              );
              return;
            }
          } catch {}
        }

        if (loadedItems.length > 0) {
          setMonitors(loadedItems);
        }
      } catch (err) {
        console.warn('Failed to load monitors:', err);
      }
    };

    fetchMonitors();
  }, []);

  const lastEmittedRef = useRef<string>('');

  // Sync ticked monitors with parent whenever monitors state changes
  useEffect(() => {
    const ticked = monitors.filter((m) => m.ticked).map((m) => m.deviceName);
    const serialized = JSON.stringify(ticked);
    if (lastEmittedRef.current !== serialized) {
      lastEmittedRef.current = serialized;
      localStorage.setItem('plexus_ticked_monitors', serialized);
      onTickedMonitorsChange?.(ticked);
    }
  }, [monitors]);

  const toggleMonitor = (id: number) => {
    setMonitors((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ticked: !m.ticked } : m))
    );
  };

  const handleIdentify = async () => {
    setIsIdentifying(true);
    if (window.electronAPI?.identifyScreens) {
      await window.electronAPI.identifyScreens();
    }
    onNotify?.('Identifying screens: displaying numbers on each physical monitor.');
    setTimeout(() => {
      setIsIdentifying(false);
    }, 2500);
  };

  const tickedList = monitors.filter((m) => m.ticked);
  const untickedList = monitors.filter((m) => !m.ticked);
  const tickedSummary =
    tickedList.length > 0
      ? tickedList.map((m) => `Monitor ${m.id}`).join(', ')
      : 'None';

  return (
    <div className="bg-[#12151b] border border-[#1e232e] rounded-xl p-5 shadow-sm space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Apply to
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Unticked monitors keep their own colours.
          </p>
        </div>

        <button
          onClick={handleIdentify}
          disabled={isIdentifying}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center space-x-1.5 cursor-pointer shadow-sm ${
            isIdentifying
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
              : 'bg-[#181d26] text-gray-200 hover:text-white hover:bg-[#202735] border-[#293244]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isIdentifying ? 'Identifying...' : 'Identify screens'}</span>
        </button>
      </div>

      {/* Monitor Selection Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {monitors.map((m) => (
          <div
            key={m.id}
            onClick={() => toggleMonitor(m.id)}
            role="checkbox"
            aria-checked={m.ticked}
            className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-150 ${
              m.ticked
                ? 'bg-[#151922] border-[#2c3649] text-white shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:border-gray-500'
                : 'bg-[#0e1015] border-[#1a1e27] text-gray-400 opacity-70 hover:opacity-90 hover:border-[#2b3140]'
            }`}
          >
            {/* Left: Monitor Graphic + Details */}
            <div className="flex items-center space-x-3.5 min-w-0">
              {/* Monitor Device Graphic */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-11 h-7 rounded border flex items-center justify-center font-bold text-sm tracking-tight transition ${
                    m.ticked
                      ? 'border-gray-200 text-white bg-[#1e2534]'
                      : 'border-gray-600 text-gray-400 bg-[#13161f]'
                  }`}
                >
                  {m.id}
                </div>
                {/* Stand Neck & Base */}
                <div
                  className={`w-3.5 h-1.5 rounded-b-sm transition ${
                    m.ticked ? 'bg-gray-300' : 'bg-gray-600'
                  }`}
                />
                <div
                  className={`w-6 h-0.5 rounded-full transition ${
                    m.ticked ? 'bg-gray-300' : 'bg-gray-600'
                  }`}
                />
              </div>

              {/* Monitor Info */}
              <div className="truncate">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="text-xs font-bold text-white truncate">
                    {m.name}
                  </span>
                  {m.main && (
                    <span className="text-[10px] font-semibold text-emerald-400 flex-shrink-0">
                      • main
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {m.res} · {m.hz} Hz
                </div>
              </div>
            </div>

            {/* Right: Checkbox */}
            <div
              className={`w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0 ml-3 ${
                m.ticked
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(0,240,118,0.45)]'
                  : 'border-2 border-gray-500 bg-transparent hover:border-gray-400'
              }`}
            >
              {m.ticked && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
            </div>
          </div>
        ))}
      </div>

      {/* Ticked Summary */}
      <div className="pt-1">
        <p className="text-[11px] font-medium text-gray-400">
          Ticked: <span className="text-gray-200">{tickedSummary}</span>
        </p>

        {/* Limitation Notice when unticked (Matching PlexusX MonitorSelectionCard.cs) */}
        {untickedList.length > 0 && tickedList.length > 0 && (
          <div className="mt-2.5 p-3 rounded-lg bg-[#181a20]/90 border border-[#2a2e3b] text-[11px] text-gray-300 leading-relaxed">
            Saturation, hue and other whole-desktop colour effects are paused
            while a monitor is unticked. Brightness, contrast, temperature,
            red/green/blue, gamma and NVIDIA Digital Vibrance use the ticked
            monitors.
          </div>
        )}

        {/* Notice when all are unticked */}
        {tickedList.length === 0 && (
          <div className="mt-2.5 p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-[11px] text-red-300 leading-relaxed">
            No monitors selected. Colour changes are paused.
          </div>
        )}
      </div>
    </div>
  );
};

export const MonitorApplyCard = React.memo(MonitorApplyCardComponent);
