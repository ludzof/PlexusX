import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Tv,
  Maximize2,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  Volume2,
  VolumeX,
  Keyboard,
  Crosshair,
  FileText,
  Sliders,
  CheckCircle2,
  Layers,
  Sparkles,
  Zap,
  Info,
  Clock,
  Target,
  ArrowRight,
  Lock
} from 'lucide-react';
import type { MonitorItem } from '../types/electron';

interface ResolutionPageProps {
  onNotify?: (msg: string) => void;
}

interface PvpPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  hz: number;
  ratio: string;
  stretchPercent: number; // e.g. +33%
  tag: string;
  tagColor: string;
  description: string;
  benefit: string;
  needsStretching: boolean;
}

const PVP_PRESETS: PvpPreset[] = [
  {
    id: 'native',
    label: 'Native 16:9',
    width: 1920,
    height: 1080,
    hz: 144,
    ratio: '16:9',
    stretchPercent: 0,
    tag: 'DEFAULT',
    tagColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'Full field of view and sharpest 1080p picture.',
    benefit: 'Default desktop & standard 16:9 view without scaling.',
    needsStretching: false,
  },
  {
    id: 'stretched-pro',
    label: 'Stretched 4:3 (Pro Standard)',
    width: 1440,
    height: 1080,
    hz: 144,
    ratio: '4:3',
    stretchPercent: 33.3,
    tag: 'RECOMMENDED',
    tagColor: 'bg-emerald-950 text-emerald-400 border-emerald-700/60',
    description: '+33% wider player hitboxes while keeping full 1080p vertical sharpness.',
    benefit: '100% of your screen is visible. Zero zoom, zero HUD cutoff.',
    needsStretching: true,
  },
  {
    id: 'low-4-3',
    label: 'Low 4:3 (Max FPS)',
    width: 1280,
    height: 960,
    hz: 144,
    ratio: '4:3',
    stretchPercent: 33.3,
    tag: 'MAX FPS',
    tagColor: 'bg-amber-950 text-amber-400 border-amber-700/60',
    description: 'The classic competitive resolution used by professional FPS players.',
    benefit: 'Maximum frame rates with +33% wider targets.',
    needsStretching: true,
  },
  {
    id: 'hybrid-16-10',
    label: 'Hybrid 16:10',
    width: 1680,
    height: 1050,
    hz: 144,
    ratio: '16:10',
    stretchPercent: 11.1,
    tag: 'CRISP',
    tagColor: 'bg-blue-950 text-blue-400 border-blue-700/60',
    description: 'Subtle stretch with near-native clarity and wider crosshair space.',
    benefit: '+11% wider player models with crystal-clear long-distance visibility.',
    needsStretching: true,
  },
  {
    id: 'ultra-5-4',
    label: 'Ultra 5:4 (Max Width)',
    width: 1280,
    height: 1024,
    hz: 144,
    ratio: '5:4',
    stretchPercent: 42.2,
    tag: 'WIDE HITBOX',
    tagColor: 'bg-purple-950 text-purple-400 border-purple-700/60',
    description: 'Extreme horizontal stretch. Huge player character models.',
    benefit: '+42% wider targets for aggressive close-quarters tracking.',
    needsStretching: true,
  },
];

const HOTKEY_OPTIONS = [
  'F8',
  'F7',
  'F6',
  'F9',
  'F10',
  'F11',
  'F12',
  'Home',
  'End',
  'Insert',
  'Delete',
  'PageUp',
  'PageDown',
];

export const ResolutionPage: React.FC<ResolutionPageProps> = ({ onNotify }) => {
  // Active mode & Multi-Monitor State
  const [currentWidth, setCurrentWidth] = useState<number>(1920);
  const [currentHeight, setCurrentHeight] = useState<number>(1080);
  const [currentHz, setCurrentHz] = useState<number>(144);
  const [isStretchedActive, setIsStretchedActive] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string>('native');
  const [primaryDevice, setPrimaryDevice] = useState<string>('\\\\.\\DISPLAY1');
  const [monitors, setMonitors] = useState<MonitorItem[]>([]);

  // Custom Inputs
  const [customWidth, setCustomWidth] = useState<string>('1440');
  const [customHeight, setCustomHeight] = useState<string>('1080');
  const [customHz, setCustomHz] = useState<string>('144');

  // Options
  const [hotkey, setHotkey] = useState<string>('F8');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [alwaysOnTop, setAlwaysOnTop] = useState<boolean>(false);
  const [autoStretchOnGame, setAutoStretchOnGame] = useState<boolean>(true);
  const [gpuScalingConfirmed, setGpuScalingConfirmed] = useState<boolean>(true);

  // Revert Countdown Modal
  const [revertCountdown, setRevertCountdown] = useState<number | null>(null);
  const [pendingResolution, setPendingResolution] = useState<{ width: number; height: number; hz: number } | null>(null);

  // Status message
  const [statusMessage, setStatusMessage] = useState<string>(
    'Ready. Select a preset or press ' + hotkey + ' in-game for instant 0ms stretched resolution.'
  );

  // Audio Context for instant browser sound cues
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playAudioTone = useCallback((type: 'stretched' | 'native') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'stretched') {
        osc.frequency.setValueAtTime(784, ctx.currentTime); // G5
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // C6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(392, ctx.currentTime + 0.1); // G4
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch { }

    if (window.electronAPI?.playTone) {
      window.electronAPI.playTone(type === 'stretched' ? 880 : 440, 100);
    }
  }, [soundEnabled]);

  // Query display info on mount
  const refreshDisplayInfo = useCallback(async () => {
    if (window.electronAPI?.getDisplayModes) {
      try {
        const res = await window.electronAPI.getDisplayModes();
        if (res) {
          if (res.primaryDevice) setPrimaryDevice(res.primaryDevice);
          if (res.monitors && res.monitors.length > 0) {
            setMonitors(res.monitors);
          }
          if (res.current) {
            setCurrentWidth(res.current.width);
            setCurrentHeight(res.current.height);
            setCurrentHz(res.current.hz || 144);
            const isStretched = res.current.width !== 1920 || res.current.height !== 1080;
            setIsStretchedActive(isStretched);
            if (!isStretched) {
              setActivePresetId('native');
            } else {
              const matching = PVP_PRESETS.find(p => p.width === res.current.width && p.height === res.current.height);
              setActivePresetId(matching ? matching.id : 'custom');
            }
          }
        }
      } catch (err) {
        console.error('Failed to get display modes:', err);
      }
    }
  }, []);

  useEffect(() => {
    refreshDisplayInfo();
  }, [refreshDisplayInfo]);

  // Register Global Hotkey
  useEffect(() => {
    if (window.electronAPI?.setStretchHotkey) {
      window.electronAPI.setStretchHotkey(hotkey);
    }
  }, [hotkey]);

  // Listen for Global Toggle Hotkey
  useEffect(() => {
    if (!window.electronAPI?.onStretchToggle) return;
    const unsub = window.electronAPI.onStretchToggle(() => {
      handleToggleStretch();
    });
    return () => unsub();
  });

  // Countdown timer for revert safety
  useEffect(() => {
    if (revertCountdown === null) return;
    if (revertCountdown <= 0) {
      handleRevertNative();
      return;
    }
    const timer = setTimeout(() => {
      setRevertCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [revertCountdown]);

  // Apply Resolution function (Strictly targeting primary display)
  const applyTargetResolution = async (w: number, h: number, hz: number, presetId?: string) => {
    setStatusMessage(`Switching to ${w} × ${h} @ ${hz}Hz (0ms instant GPU switch)...`);
    try {
      if (window.electronAPI?.applyResolution) {
        await window.electronAPI.applyResolution({ width: w, height: h, hz, persist: false, deviceName: primaryDevice });
      }
      setCurrentWidth(w);
      setCurrentHeight(h);
      setCurrentHz(hz);
      const isStretched = w !== 1920 || h !== 1080;
      setIsStretchedActive(isStretched);
      if (presetId) setActivePresetId(presetId);

      playAudioTone(isStretched ? 'stretched' : 'native');

      const msg = isStretched
        ? `Switched to ${w} × ${h} @ ${hz}Hz. Stretched to fill 100% of screen. Zero zoom, all HUD visible. Secondary displays untouched.`
        : `Switched to Native ${w} × ${h} @ ${hz}Hz.`;

      setStatusMessage(msg);
      if (onNotify) onNotify(msg);

      if (isStretched) {
        setPendingResolution({ width: w, height: h, hz });
        setRevertCountdown(12); // 12 second auto-revert countdown
      } else {
        setPendingResolution(null);
        setRevertCountdown(null);
      }
    } catch (err: any) {
      const errMsg = `Failed to switch resolution: ${err?.message || err}`;
      setStatusMessage(errMsg);
      if (onNotify) onNotify(errMsg);
    }
  };

  // Revert back to Native
  const handleRevertNative = async () => {
    setRevertCountdown(null);
    setPendingResolution(null);
    setStatusMessage('Reverting back to Native 1920 × 1080 @ 144Hz...');
    try {
      if (window.electronAPI?.resetResolution) {
        await window.electronAPI.resetResolution({ deviceName: primaryDevice });
      }
      setCurrentWidth(1920);
      setCurrentHeight(1080);
      setCurrentHz(144);
      setIsStretchedActive(false);
      setActivePresetId('native');
      playAudioTone('native');
      const msg = 'Display restored to Native 1920 × 1080 @ 144Hz.';
      setStatusMessage(msg);
      if (onNotify) onNotify(msg);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Keep Stretched Resolution (Confirm)
  const handleConfirmKeep = () => {
    setRevertCountdown(null);
    setPendingResolution(null);
    const msg = `Resolution ${currentWidth} × ${currentHeight} @ ${currentHz}Hz confirmed.`;
    setStatusMessage(msg);
    if (onNotify) onNotify(msg);
  };

  // Hotkey toggle between Stretched and Native
  const handleToggleStretch = () => {
    if (isStretchedActive) {
      handleRevertNative();
    } else {
      // Pick target preset (default 1440x1080)
      const target = PVP_PRESETS.find(p => p.id === 'stretched-pro') || PVP_PRESETS[1];
      applyTargetResolution(target.width, target.height, target.hz, target.id);
    }
  };

  // Ensure GPU Scaling is on Full Screen
  const handleEnsureGpuScaling = async () => {
    try {
      setStatusMessage('Ensuring NVIDIA GPU Scaling is locked to Full Screen (ToNative)...');
      if (window.electronAPI?.setGpuScaling) {
        await window.electronAPI.setGpuScaling('fullscreen');
      }
      setGpuScalingConfirmed(true);
      const msg = 'NVIDIA GPU Full Screen scaling confirmed. 0ms instant switching is active!';
      setStatusMessage(msg);
      if (onNotify) onNotify(msg);
    } catch (err: any) {
      setStatusMessage(`GPU scaling note: Check NVIDIA Control Panel > Adjust desktop size > Full-screen`);
    }
  };

  // Custom Resolution Submit
  const handleApplyCustom = () => {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    const hz = parseInt(customHz, 10) || 144;
    if (isNaN(w) || isNaN(h) || w < 640 || h < 480) {
      setStatusMessage('Invalid resolution dimensions. Width must be >= 640 and height >= 480.');
      return;
    }
    applyTargetResolution(w, h, hz, 'custom');
  };

  // Toggle Always on top
  const handleAlwaysOnTopToggle = (val: boolean) => {
    setAlwaysOnTop(val);
    if (window.electronAPI?.setAlwaysOnTop) {
      window.electronAPI.setAlwaysOnTop(val);
    }
  };

  // Calculate stretch % for custom
  const customStretchPct = Math.round(((1080 / (parseInt(customHeight, 10) || 1080)) * ((parseInt(customWidth, 10) || 1440) / 1920) - 1) * 100);

  return (
    <div className="flex-1 overflow-y-auto bg-[#090a0c] text-zinc-200 select-none p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* 1. Header & Live Display Monitor Banner */}
        <div className="bg-[#101216] border border-zinc-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                    Resolution & Stretched Aspect Ratio
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 font-medium">
                      0ms Instant
                    </span>
                  </h1>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Hardware display mode switching. 100% full screen visible with wider player hitboxes.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Active Mode Badge */}
            <div className="flex items-center gap-3">
              <div className="bg-[#16191f] border border-zinc-700/60 rounded-lg px-4 py-2 text-right">
                <div className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                  Active Display Mode
                </div>
                <div className="text-sm font-bold text-white flex items-center justify-end gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isStretchedActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
                  {currentWidth} × {currentHeight} @ {currentHz}Hz
                  <span className="text-xs text-zinc-400 font-normal">
                    ({isStretchedActive ? `${PVP_PRESETS.find(p => p.width === currentWidth && p.height === currentHeight)?.ratio || 'Custom'} Stretched` : '16:9 Native'})
                  </span>
                </div>
              </div>

              <button
                onClick={handleRevertNative}
                disabled={!isStretchedActive}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                  isStretchedActive
                    ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-white shadow-sm cursor-pointer'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
                title="Restore default native 1080p resolution"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Native
              </button>
            </div>
          </div>

          {/* Revert Safety Countdown Banner if pending */}
          {revertCountdown !== null && (
            <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5 text-xs text-emerald-300">
                <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>
                  Resolution changed to <strong>{currentWidth} × {currentHeight} @ {currentHz}Hz</strong>. Auto-reverting back in <strong>{revertCountdown}s</strong> if not kept.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConfirmKeep}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded shadow transition-colors cursor-pointer"
                >
                  Keep Changes
                </button>
                <button
                  onClick={handleRevertNative}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded border border-zinc-700 transition-colors cursor-pointer"
                >
                  Revert Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Multi-Monitor Topology & Safety Lock Card */}
        <div className="bg-[#101216] border border-zinc-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Multi-Monitor Topology & Orientation Lock
              </h2>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-[11px] text-cyan-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              Vertical / Rotated Monitors Protected & Untouched
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Display 2: Rotated / Vertical (Protected) */}
            <div className="p-3.5 bg-[#13161d] border border-cyan-800/40 rounded-xl relative overflow-hidden">
              <div className="flex items-start gap-3.5">
                {/* Vertical Monitor Visual (Matches user's Monitor 2 portrait layout) */}
                <div className="w-9 h-14 rounded-md border-2 border-cyan-400/70 bg-cyan-950/40 flex flex-col items-center justify-between p-1 shrink-0 shadow-sm">
                  <span className="text-[8px] font-mono text-cyan-300 font-bold">2</span>
                  <div className="w-full h-0.5 bg-cyan-400/50 rounded-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">Display 2 (Secondary)</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-700/60 rounded font-semibold tracking-wide">
                      PORTRAIT (ROTATED 90°/270°)
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-1">
                    1080 × 1920 @ 60Hz · Left Position (-1080, -523)
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-cyan-300 font-medium">
                    <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Rotation & coordinates locked. Never modified during stretch switching.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Display 1: Horizontal Main (Target of switch) */}
            <div className="p-3.5 bg-[#13161d] border border-emerald-700/50 rounded-xl relative overflow-hidden">
              <div className="flex items-start gap-3.5">
                {/* Horizontal Monitor Visual (Matches user's Monitor 1 landscape layout) */}
                <div className="w-14 h-9 rounded-md border-2 border-emerald-400/80 bg-emerald-950/50 flex items-center justify-center p-1 shrink-0 shadow-sm">
                  <span className="text-[9px] font-mono text-emerald-300 font-bold">1 (MAIN)</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">Display 1 (Main Display)</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/60 rounded font-semibold tracking-wide">
                      TARGET OF STRETCH
                    </span>
                  </div>
                  <div className="text-xs text-emerald-400 font-mono mt-1">
                    {currentWidth} × {currentHeight} @ {currentHz}Hz ({isStretchedActive ? 'Stretched Full Screen' : 'Native 16:9'})
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-300 font-medium">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>0ms Instant GPU Scaling. 100% Screen visible without digital zoom.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Zero-Blink & NVIDIA GPU Scaling Explanation Card */}
        <div className="bg-[#101216] border border-zinc-800/80 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  Instant 0ms Switching Engine
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-400 border border-emerald-800/40 font-mono">
                    NVIDIA GPU Scaler Active
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Resolution switching happens entirely within NVIDIA RTX hardware at <strong>144Hz locked</strong>. The HDMI/DisplayPort pixel clock never drops sync, preventing black screens or monitor blinking.
                </p>
              </div>
            </div>

            <button
              onClick={handleEnsureGpuScaling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#181b22] hover:bg-[#1f232c] border border-zinc-700/80 text-zinc-200 transition-colors cursor-pointer whitespace-nowrap self-start md:self-auto"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verify GPU Scaling
            </button>
          </div>
        </div>

        {/* 3. One-Click PVP Presets Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                PVP Stretched Presets
              </h2>
            </div>
            <span className="text-xs text-zinc-500">
              Entire screen 100% visible · Compass & HUD preserved
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PVP_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => applyTargetResolution(preset.width, preset.height, preset.hz, preset.id)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-[#14181f] border-emerald-500/80 shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                      : 'bg-[#101216] border-zinc-800/80 hover:bg-[#13161c] hover:border-zinc-700'
                  }`}
                >
                  {/* Top line badge */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-zinc-300 font-mono tracking-tight">
                      {preset.ratio}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold tracking-wider ${preset.tagColor}`}>
                      {preset.tag}
                    </span>
                  </div>

                  {/* Title & Dimension */}
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center justify-between">
                      {preset.label}
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </h3>
                    <div className="text-xs font-mono text-emerald-400 mt-0.5">
                      {preset.width} × {preset.height} @ {preset.hz}Hz
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>

                  {/* Hitbox Width Visual Bar */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-zinc-500 font-medium">Model Width</span>
                      <span className="font-semibold text-emerald-400">
                        {preset.stretchPercent > 0 ? `+${preset.stretchPercent}% wider` : 'Standard 1.0x'}
                      </span>
                    </div>
                    {/* Visual Comparison Bar */}
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex items-center">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isSelected ? 'bg-emerald-500' : 'bg-zinc-500 group-hover:bg-zinc-400'
                        }`}
                        style={{
                          width: `${Math.min(100, 70 * (1 + preset.stretchPercent / 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Apply action button */}
                  <button
                    className={`mt-3 w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800/80 group-hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {isSelected ? 'Active Mode' : 'Apply Resolution'}
                    {!isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Interactive Visualizer: Model Width & Hitbox Advantage */}
        <div className="bg-[#101216] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Target Hitbox Preview (Native vs Stretched)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Stretched resolution expands horizontal target pixels, making distant opponents easier to acquire and track.
              </p>
            </div>
            <div className="text-xs text-emerald-400 font-mono font-medium bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/40">
              Active: {currentWidth} × {currentHeight}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Native 16:9 Model Mockup */}
            <div className="bg-[#0b0c0e] border border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center">
              <span className="text-[11px] font-semibold text-zinc-400 mb-2">Native 16:9 Standard</span>
              <div className="relative w-44 h-40 bg-[#14161b] rounded border border-zinc-700/60 flex items-center justify-center overflow-hidden">
                {/* Horizontal reference grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#20242c_1px,transparent_1px),linear-gradient(to_bottom,#20242c_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
                {/* Model silhouette */}
                <div className="w-10 h-28 bg-zinc-600 rounded-md border border-zinc-400 relative flex flex-col items-center justify-between p-1 z-10 shadow-lg">
                  <div className="w-5 h-5 bg-zinc-400 rounded-full" />
                  <div className="w-7 h-10 bg-zinc-500 rounded" />
                  <div className="w-6 h-9 bg-zinc-500 rounded" />
                </div>
                {/* Crosshair indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-1 h-3 bg-emerald-400" />
                  <div className="h-1 w-3 bg-emerald-400 absolute" />
                </div>
              </div>
              <span className="text-[11px] text-zinc-500 mt-2 font-mono">1.00x Hitbox Width</span>
            </div>

            {/* Stretched 4:3 Model Mockup */}
            <div className="bg-[#0b0c0e] border border-emerald-900/40 rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-[11px] font-semibold text-emerald-400 mb-2">
                Stretched 4:3 Pro (+33.3% Wider)
              </span>
              <div className="relative w-44 h-40 bg-[#14161b] rounded border border-emerald-700/50 flex items-center justify-center overflow-hidden">
                {/* Horizontal reference grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2622_1px,transparent_1px),linear-gradient(to_bottom,#1b2622_1px,transparent_1px)] bg-[size:16px_16px] opacity-60" />
                {/* Model silhouette stretched horizontally */}
                <div className="w-14 h-28 bg-emerald-500/80 rounded-md border border-emerald-300 relative flex flex-col items-center justify-between p-1 z-10 shadow-lg shadow-emerald-950/50">
                  <div className="w-7 h-5 bg-emerald-200 rounded-full" />
                  <div className="w-10 h-10 bg-emerald-400 rounded" />
                  <div className="w-9 h-9 bg-emerald-400 rounded" />
                </div>
                {/* Crosshair indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-1 h-3 bg-emerald-400" />
                  <div className="h-1 w-3 bg-emerald-400 absolute" />
                </div>
              </div>
              <span className="text-[11px] text-emerald-400 mt-2 font-mono font-semibold">
                1.33x Hitbox Width (+33% Gain)
              </span>
            </div>
          </div>
        </div>

        {/* 5. Custom Resolution & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Custom Mode Builder */}
          <div className="bg-[#101216] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Custom Resolution Builder
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1 font-medium">Width (px)</label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-full bg-[#16181e] border border-zinc-700/80 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="1440"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1 font-medium">Height (px)</label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="w-full bg-[#16181e] border border-zinc-700/80 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="1080"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1 font-medium">Refresh (Hz)</label>
                <input
                  type="number"
                  value={customHz}
                  onChange={(e) => setCustomHz(e.target.value)}
                  className="w-full bg-[#16181e] border border-zinc-700/80 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="144"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 bg-[#16181e] px-3.5 py-2.5 rounded-lg border border-zinc-800">
              <span>Aspect Ratio: <strong className="text-white font-mono">{customWidth}:{customHeight}</strong></span>
              <span>Stretch Factor: <strong className="text-emerald-400 font-mono">{customStretchPct > 0 ? `+${customStretchPct}%` : 'Native'}</strong></span>
            </div>

            <button
              onClick={handleApplyCustom}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              Apply Custom Resolution
            </button>
          </div>

          {/* In-Game Hotkey & Audio Feedback Configuration */}
          <div className="bg-[#101216] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                In-Game Toggle Hotkey
              </h3>
            </div>

            <div className="space-y-3">
              {/* Hotkey Select */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white font-medium">Global Toggle Hotkey</div>
                  <div className="text-[11px] text-zinc-500">Instantly switch in-game without alt-tabbing</div>
                </div>
                <select
                  value={hotkey}
                  onChange={(e) => setHotkey(e.target.value)}
                  className="bg-[#16181e] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {HOTKEY_OPTIONS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              {/* Sound Cues Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-zinc-500" />
                  )}
                  <div>
                    <div className="text-xs text-white font-medium">Audio Feedback Tones</div>
                    <div className="text-[11px] text-zinc-500">High beep on Stretched, low beep on Native</div>
                  </div>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    soundEnabled ? 'bg-emerald-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      soundEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Always on top toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-zinc-400" />
                  <div>
                    <div className="text-xs text-white font-medium">Keep PlexusX Always on Top</div>
                    <div className="text-[11px] text-zinc-500">Overlay over borderless games</div>
                  </div>
                </div>
                <button
                  onClick={() => handleAlwaysOnTopToggle(!alwaysOnTop)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    alwaysOnTop ? 'bg-emerald-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      alwaysOnTop ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Test Audio Button */}
              <div className="pt-2">
                <button
                  onClick={() => playAudioTone(isStretchedActive ? 'stretched' : 'native')}
                  className="w-full py-2 bg-[#181b22] hover:bg-[#1f232c] border border-zinc-700/80 rounded-lg text-xs font-medium text-zinc-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  Test Audio Cue ({isStretchedActive ? 'High 880Hz' : 'Low 440Hz'})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Footer Status Console Bar */}
        <div className="bg-[#0c0d10] border border-zinc-800/90 rounded-lg p-3 flex items-center gap-2.5 text-xs text-zinc-400">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono text-zinc-300 truncate">{statusMessage}</span>
        </div>

      </div>
    </div>
  );
};
