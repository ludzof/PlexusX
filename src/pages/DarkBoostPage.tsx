import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Sparkles,
  Check,
  MonitorCheck,
  RotateCcw,
  Sliders,
  Zap,
  MousePointer,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

interface DarkBoostPageProps {
  onNotify?: (msg: string) => void;
}

interface SetupProfile {
  id: string;
  name: string;
  strength: number;
  colorMode: 'green' | 'clean' | 'amber' | 'cyan' | 'white';
  blackLevel: number;
}

export const DarkBoostPage: React.FC<DarkBoostPageProps> = ({ onNotify }) => {
  // Add-on unlocked by default (Pro lifetime active)
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [isActiveOnMonitor, setIsActiveOnMonitor] = useState(false);
  const [previewToggle, setPreviewToggle] = useState(true);

  // Setups (PlexusX setup tabs)
  const [setups, setSetups] = useState<SetupProfile[]>([
    { id: '1', name: 'Setup 1', strength: 0.75, colorMode: 'green', blackLevel: 0 },
    { id: '2', name: 'Setup 2', strength: 0.60, colorMode: 'cyan', blackLevel: 15 },
    { id: '3', name: 'Setup 3', strength: 0.85, colorMode: 'amber', blackLevel: 25 },
  ]);
  const [selectedSetupId, setSelectedSetupId] = useState<string>('1');

  // Boost tuning from active setup
  const currentSetup = setups.find((s) => s.id === selectedSetupId) || setups[0];
  const strength = currentSetup.strength;
  const colorMode = currentSetup.colorMode;
  const blackLevel = currentSetup.blackLevel;

  const updateCurrentSetup = (partial: Partial<SetupProfile>) => {
    setSetups((prev) =>
      prev.map((s) => (s.id === selectedSetupId ? { ...s, ...partial } : s))
    );
  };

  // Hold to zoom settings matching screenshot 2
  const [holdToZoom, setHoldToZoom] = useState<boolean>(true);
  const [zoomKey, setZoomKey] = useState<string>('Mouse 5');
  const [zoomLevel, setZoomLevel] = useState<number>(2.0);
  const [smooth, setSmooth] = useState<boolean>(false);
  const [smoothEdges, setSmoothEdges] = useState<boolean>(false);
  const [showKeyPicker, setShowKeyPicker] = useState<boolean>(false);
  const [isZooming, setIsZooming] = useState<boolean>(false);

  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const colors = [
    { id: 'green' as const, name: 'Night Green', hex: '#00f076', desc: 'Adds all colours together, so it pulls out the most detail.' },
    { id: 'clean' as const, name: 'Clean', hex: '#cbd5e1', desc: 'Preserves natural game colors with boosted shadow floor.' },
    { id: 'amber' as const, name: 'Amber Gold', hex: '#fbbf24', desc: 'Low eye-strain high luminance contrast.' },
    { id: 'cyan' as const, name: 'Cyan / Ice', hex: '#38bdf8', desc: 'Sharp high-frequency edge visibility in dark shadows.' },
    { id: 'white' as const, name: 'White', hex: '#f3f4f6', desc: 'Direct shadow luminance lift without color bias.' },
  ];

  // Draw procedural night scene to canvas matching PlexusX screenshot 1
  const drawScene = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    boost: boolean,
    boostStrength: number,
    mode: string
  ) => {
    ctx.clearRect(0, 0, width, height);

    // Sky
    if (!boost) {
      ctx.fillStyle = '#060709';
      ctx.fillRect(0, 0, width, height);
    } else {
      let skyColor = '#0b2011';
      if (mode === 'cyan') skyColor = '#0b1626';
      if (mode === 'amber') skyColor = '#241a08';
      if (mode === 'white') skyColor = '#1c1f24';
      if (mode === 'clean') skyColor = '#10141a';
      ctx.fillStyle = skyColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Stars
    ctx.fillStyle = boost ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 25; i++) {
      const sx = (i * 37) % width;
      const sy = (i * 23) % (height * 0.4);
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    // Distant Hills
    ctx.beginPath();
    ctx.moveTo(0, height * 0.7);
    ctx.bezierCurveTo(width * 0.25, height * 0.55, width * 0.5, height * 0.65, width, height * 0.62);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    if (!boost) {
      ctx.fillStyle = '#090a0d';
      ctx.fill();
    } else {
      let hillColor = `rgba(18, 65, 28, ${0.4 + boostStrength * 0.4})`;
      if (mode === 'cyan') hillColor = `rgba(18, 48, 85, ${0.4 + boostStrength * 0.4})`;
      if (mode === 'amber') hillColor = `rgba(68, 48, 15, ${0.4 + boostStrength * 0.4})`;
      if (mode === 'white') hillColor = `rgba(45, 50, 58, ${0.4 + boostStrength * 0.4})`;
      if (mode === 'clean') hillColor = `rgba(35, 42, 52, ${0.4 + boostStrength * 0.4})`;
      ctx.fillStyle = hillColor;
      ctx.fill();
    }

    // Foreground Rolling Terrain
    ctx.beginPath();
    ctx.moveTo(0, height * 0.75);
    ctx.bezierCurveTo(width * 0.3, height * 0.6, width * 0.7, height * 0.85, width, height * 0.68);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    if (!boost) {
      ctx.fillStyle = '#0d0e12';
      ctx.fill();
    } else {
      let fgColor = `rgba(10, 110, 40, ${0.5 + boostStrength * 0.45})`;
      if (mode === 'cyan') fgColor = `rgba(15, 80, 140, ${0.5 + boostStrength * 0.45})`;
      if (mode === 'amber') fgColor = `rgba(120, 85, 20, ${0.5 + boostStrength * 0.45})`;
      if (mode === 'white') fgColor = `rgba(70, 78, 90, ${0.5 + boostStrength * 0.45})`;
      if (mode === 'clean') fgColor = `rgba(50, 60, 75, ${0.5 + boostStrength * 0.45})`;
      ctx.fillStyle = fgColor;
      ctx.fill();
    }

    // Small terrain contours
    if (boost) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(width * 0.2, height * 0.88, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(width * 0.65, height * 0.89, 22, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Houses / Barn Silhouettes
    const drawHouse = (x: number, y: number, w: number, h: number) => {
      if (!boost) {
        ctx.fillStyle = '#101217';
        ctx.fillRect(x, y, w, h);
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + w / 2, y - h * 0.55);
        ctx.lineTo(x + w + 3, y);
        ctx.closePath();
        ctx.fillStyle = '#0b0c10';
        ctx.fill();
      } else {
        let bColor = `rgba(2, 45, 15, ${0.7 + boostStrength * 0.25})`;
        let rColor = `rgba(1, 35, 10, ${0.75 + boostStrength * 0.25})`;
        if (mode === 'cyan') {
          bColor = `rgba(8, 35, 65, ${0.7 + boostStrength * 0.25})`;
          rColor = `rgba(5, 25, 50, ${0.75 + boostStrength * 0.25})`;
        } else if (mode === 'amber') {
          bColor = `rgba(55, 35, 8, ${0.7 + boostStrength * 0.25})`;
          rColor = `rgba(40, 25, 5, ${0.75 + boostStrength * 0.25})`;
        } else if (mode === 'white' || mode === 'clean') {
          bColor = `rgba(30, 35, 42, ${0.7 + boostStrength * 0.25})`;
          rColor = `rgba(20, 24, 30, ${0.75 + boostStrength * 0.25})`;
        }

        ctx.fillStyle = bColor;
        ctx.fillRect(x, y, w, h);
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + w / 2, y - h * 0.55);
        ctx.lineTo(x + w + 3, y);
        ctx.closePath();
        ctx.fillStyle = rColor;
        ctx.fill();
      }
    };

    drawHouse(width * 0.08, height * 0.52, 28, 30);
    drawHouse(width * 0.65, height * 0.48, 34, 36);
    drawHouse(width * 0.82, height * 0.51, 30, 32);

    // Glowing Lantern / Window - exactly as in PlexusX screenshot!
    const lx = width * 0.5;
    const ly = height * 0.48;

    if (!boost) {
      // Very faint tiny warm box in darkness
      ctx.fillStyle = '#c28741';
      ctx.fillRect(lx - 4, ly - 4, 8, 8);
    } else {
      // High gain blooming sphere with bright core
      let glowColor = 'rgba(0, 240, 118, 0.45)';
      let boxColor = '#bbf7d0';
      if (mode === 'cyan') {
        glowColor = 'rgba(56, 189, 248, 0.45)';
        boxColor = '#a5f3fc';
      } else if (mode === 'amber') {
        glowColor = 'rgba(251, 191, 36, 0.45)';
        boxColor = '#fef08a';
      } else if (mode === 'white' || mode === 'clean') {
        glowColor = 'rgba(255, 255, 255, 0.35)';
        boxColor = '#ffffff';
      }

      const grad = ctx.createRadialGradient(lx, ly, 4, lx, ly, 38);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, 38, 0, Math.PI * 2);
      ctx.fill();

      // Sharp bright center square
      ctx.fillStyle = boxColor;
      ctx.fillRect(lx - 5, ly - 5, 10, 10);
    }

    // Small background distant light (top-left)
    const slx = width * 0.28;
    const sly = height * 0.48;
    if (!boost) {
      ctx.fillStyle = '#e5d1a8';
      ctx.fillRect(slx - 3, sly - 3, 6, 6);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(slx - 3, sly - 3, 6, 6);
    }
  };

  // Render previews
  useEffect(() => {
    if (leftCanvasRef.current) {
      const ctx = leftCanvasRef.current.getContext('2d');
      if (ctx) drawScene(ctx, 360, 180, false, 0, 'green');
    }
    if (rightCanvasRef.current) {
      const ctx = rightCanvasRef.current.getContext('2d');
      if (ctx) drawScene(ctx, 360, 180, previewToggle, strength, colorMode);
    }
  }, [strength, colorMode, previewToggle]);

  // LIVE MONITOR DISPLAY SYNC: Whenever active on monitor, update display instantly
  useEffect(() => {
    if (isActiveOnMonitor && window.electronAPI) {
      window.electronAPI.applyDisplaySettings({
        gamma: 1.25,
        brightness: 1.15,
        contrast: 1.1,
        darkBoost: strength,
        colorMode: colorMode,
        blackLevel: blackLevel,
      });
    }
  }, [isActiveOnMonitor, strength, colorMode, blackLevel]);

  // LIVE ZOOM CONFIG SYNC: Keep C# engine synchronized with zoom settings
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.setZoomConfig({
        holdToZoom,
        zoomKey,
        zoomLevel,
        smooth,
        smoothEdges,
      });
    }
  }, [holdToZoom, zoomKey, zoomLevel, smooth, smoothEdges]);

  // Register hotkey listeners
  useEffect(() => {
    if (!window.electronAPI) return;

    const unregDark = window.electronAPI.onDarkBoostToggle?.(() => {
      setIsActiveOnMonitor((prev) => {
        const next = !prev;
        if (next) {
          window.electronAPI?.applyDisplaySettings({
            gamma: 1.25,
            brightness: 1.15,
            contrast: 1.1,
            darkBoost: strength,
            colorMode: colorMode,
            blackLevel: blackLevel,
          });
          onNotify?.(`Dark Boost toggled ON (${colorMode.toUpperCase()})`);
        } else {
          window.electronAPI?.resetDisplaySettings();
          onNotify?.('Dark Boost toggled OFF');
        }
        return next;
      });
    });

    const unregZoom = window.electronAPI.onZoomToggle?.(() => {
      setIsZooming((prev) => {
        const next = !prev;
        if (next) {
          window.electronAPI?.triggerZoom(zoomLevel, smoothEdges);
          onNotify?.(`Zoom engaged (${zoomLevel.toFixed(1)}x)`);
        } else {
          window.electronAPI?.releaseZoom();
          onNotify?.('Zoom disengaged');
        }
        return next;
      });
    });

    return () => {
      unregDark?.();
      unregZoom?.();
    };
  }, [strength, colorMode, blackLevel, zoomLevel, smoothEdges]);

  // Primary toggle button
  const handleToggleMonitorBoost = async () => {
    const nextState = !isActiveOnMonitor;
    setIsActiveOnMonitor(nextState);

    if (window.electronAPI) {
      if (nextState) {
        await window.electronAPI.applyDisplaySettings({
          gamma: 1.25,
          brightness: 1.15,
          contrast: 1.1,
          darkBoost: strength,
          colorMode: colorMode,
          blackLevel: blackLevel,
        });
        onNotify?.(`Dark Boost (${colorMode.toUpperCase()}) applied to monitor!`);
      } else {
        await window.electronAPI.resetDisplaySettings();
        onNotify?.('Display restored to standard profile.');
      }
    } else {
      onNotify?.(nextState ? 'Dark Boost enabled in app.' : 'Dark Boost disabled.');
    }
  };

  const handleStartZoom = async () => {
    setIsZooming(true);
    if (window.electronAPI) {
      await window.electronAPI.triggerZoom(zoomLevel, smoothEdges);
    }
  };

  const handleStopZoom = async () => {
    setIsZooming(false);
    if (window.electronAPI) {
      await window.electronAPI.releaseZoom();
    }
  };

  const handleToggleZoomLens = async () => {
    if (isZooming) {
      handleStopZoom();
    } else {
      handleStartZoom();
    }
  };

  const handleSelectKey = (selectedKey: string) => {
    setZoomKey(selectedKey);
    setShowKeyPicker(false);
    onNotify?.(`Zoom key set to: ${selectedKey}`);
  };

  const handleAddSetup = () => {
    const newId = String(setups.length + 1);
    const newSetup: SetupProfile = {
      id: newId,
      name: `Setup ${newId}`,
      strength: 0.75,
      colorMode: 'green',
      blackLevel: 0,
    };
    setSetups([...setups, newSetup]);
    setSelectedSetupId(newId);
    onNotify?.(`Created ${newSetup.name}`);
  };

  const handleDeleteSetup = (id: string) => {
    if (setups.length <= 1) return;
    const remaining = setups.filter((s) => s.id !== id);
    setSetups(remaining);
    setSelectedSetupId(remaining[0].id);
    onNotify?.('Setup removed');
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 select-none bg-[#0c0d0f] text-gray-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Dark Boost & Zoom</h1>
            <span className="text-[11px] font-semibold bg-[#1a1d24] text-gray-300 border border-[#2b303d] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              Add-on: Active
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Brings out detail in very dark scenes. Hold a key to zoom in.
          </p>
        </div>

        {/* Quick Monitor Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleMonitorBoost}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-md active:scale-95 ${
              isActiveOnMonitor
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(0,240,118,0.5)] hover:bg-emerald-400'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <MonitorCheck className="w-4 h-4" />
            <span>{isActiveOnMonitor ? 'Active on Monitor' : 'Turn ON on Monitor'}</span>
          </button>
        </div>
      </div>

      {/* Warning Banner - Matching PlexusX Screenshot 1 */}
      <div className="bg-[#181112] border border-[#522325] rounded-xl p-4 text-[#e37e82] flex items-start space-x-3.5 shadow-sm">
        <AlertTriangle className="w-5 h-5 shrink-0 text-[#e06c71] mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#f39c9f] flex items-center space-x-2">
            <span>Dark Boost can get you banned</span>
          </h3>
          <p className="text-xs text-[#d87c80] leading-relaxed">
            Some games, like Rust, ban players who see in the dark. It mostly happens when another player
            reports you. PlexusX never touches the game, but the ban risk is yours.
          </p>
        </div>
      </div>

      {/* Side-by-Side Canvas Previews - Matching PlexusX Screenshot 1 */}
      <div className="bg-[#13151a] border border-[#1f232c] rounded-xl p-5 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {/* Left Canvas: Now / Off */}
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-[#232733] bg-[#060709] aspect-video flex items-center justify-center shadow-inner">
              <canvas
                ref={leftCanvasRef}
                width={360}
                height={180}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex justify-between items-center text-xs font-semibold px-1">
              <span className="text-gray-300">Now</span>
              <span className="text-gray-500 font-mono">Off</span>
            </div>
          </div>

          {/* Right Canvas: With Dark Boost / Your settings below */}
          <div className="space-y-2">
            <div
              onClick={() => setPreviewToggle(!previewToggle)}
              className="relative rounded-lg overflow-hidden border border-[#232733] bg-[#060709] aspect-video flex items-center justify-center cursor-pointer group shadow-inner"
              title="Click to toggle preview comparison"
            >
              <canvas
                ref={rightCanvasRef}
                width={360}
                height={180}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-0.5 rounded text-[10px] text-gray-300 font-mono">
                Click to compare
              </div>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold px-1">
              <span className="text-emerald-400">With Dark Boost</span>
              <span className="text-gray-400">Your settings below</span>
            </div>
          </div>
        </div>

        {/* Dynamic Caption matching PlexusX */}
        <p className="text-xs text-gray-400 pt-1 px-1">
          {colorMode === 'green' && 'Green adds all colours together, so it pulls out the most detail.'}
          {colorMode === 'clean' && 'Clean preserves natural colours with boosted shadow floor.'}
          {colorMode === 'amber' && 'Amber reduces blue light strain while pulling out high contrast.'}
          {colorMode === 'cyan' && 'Cyan highlights high frequency edges and silhouette borders.'}
          {colorMode === 'white' && 'White raises shadow gamma without color distortion.'}
        </p>
      </div>

      {/* Main Settings Card with Setup Tabs & Sliders */}
      <div className={`bg-[#13151a] border rounded-xl p-5 space-y-6 transition ${
        isActiveOnMonitor ? 'border-emerald-500/50 shadow-[0_0_25px_rgba(0,240,118,0.15)]' : 'border-[#1f232c]'
      }`}>
        <div className="flex items-center justify-between border-b border-[#1f232c] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-white">Dark Boost Settings</h2>
              {isActiveOnMonitor && (
                <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Hardware Display Hook Live</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Direct DWM hardware transform. Zero added input lag.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleMonitorBoost}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
                isActiveOnMonitor
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(0,240,118,0.4)] hover:bg-emerald-400'
                  : 'bg-white text-black hover:bg-gray-100 shadow-md active:scale-95'
              }`}
            >
              <MonitorCheck className="w-4 h-4" />
              <span>{isActiveOnMonitor ? 'Active (Click to Turn Off)' : 'Turn On Dark Boost'}</span>
            </button>
          </div>
        </div>

        {/* Setup Chips */}
        <div className="flex items-center space-x-2 border-b border-[#1f232c] pb-3">
          <span className="text-xs text-gray-400 mr-2 font-medium">Profiles:</span>
          {setups.map((s) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => setSelectedSetupId(s.id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  selectedSetupId === s.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#181a20] text-gray-400 hover:text-white border border-[#252833]'
                }`}
              >
                {s.name}
              </button>
              {setups.length > 1 && selectedSetupId === s.id && (
                <button
                  onClick={() => handleDeleteSetup(s.id)}
                  title="Delete setup"
                  className="ml-1 text-gray-500 hover:text-red-400 p-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {setups.length < 5 && (
            <button
              onClick={handleAddSetup}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#181a20] text-gray-400 hover:text-white border border-dashed border-[#2b303d] flex items-center space-x-1 transition cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New Setup</span>
            </button>
          )}
        </div>

        {/* Live Tuning Controls */}
        <div className="grid grid-cols-2 gap-6 pt-1">
          {/* Boost Strength Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-200">Strength (Soft to Full)</span>
              <span className="font-mono text-emerald-400 font-medium">
                {Math.round(strength * 100)}% ({strength < 0.4 ? 'Soft' : strength < 0.75 ? 'Balanced' : 'Full'})
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={strength}
              onChange={(e) => updateCurrentSetup({ strength: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-[#20242e] rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>Soft (10%)</span>
              <span>Medium (50%)</span>
              <span>Full (100%)</span>
            </div>
          </div>

          {/* Black Level Floor Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-200">Black Level Floor Lift</span>
              <span className="font-mono text-emerald-400 font-medium">{blackLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={blackLevel}
              onChange={(e) => updateCurrentSetup({ blackLevel: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-[#20242e] rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>0% (True Black)</span>
              <span>50% (Lifted)</span>
              <span>100% (High Floor)</span>
            </div>
          </div>

          {/* 5 Colours Swatches matching PlexusX */}
          <div className="col-span-2 space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-200">5 Colours to pick from</span>
              <span className="text-gray-400 capitalize">{colorMode}</span>
            </div>
            <div className="flex items-center space-x-3">
              {colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    updateCurrentSetup({ colorMode: c.id });
                    onNotify?.(`Selected ${c.name} palette`);
                  }}
                  title={`${c.name}: ${c.desc}`}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-2 transition border cursor-pointer ${
                    colorMode === c.id
                      ? 'border-white ring-2 ring-white/30 scale-102 bg-white/10'
                      : 'border-[#262a34] bg-[#16181f] hover:border-gray-500'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full block shadow-sm shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-xs font-semibold text-gray-200">{c.name}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400">
              {colors.find((c) => c.id === colorMode)?.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Hold to Zoom Section - Matching Screenshot 2 exactly */}
      <div className="bg-[#13151a] border border-[#1f232c] rounded-xl p-5 space-y-5">
        {/* Row 1: Hold to zoom title and toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white tracking-wide">Hold to zoom</h2>
          <button
            onClick={() => setHoldToZoom(!holdToZoom)}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
              holdToZoom ? 'bg-emerald-500' : 'bg-[#252833]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                holdToZoom ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Row 2: Zoom key */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300 font-medium">Zoom key</span>
          <div className="flex items-center space-x-3">
            <span className="text-gray-400 font-medium">{zoomKey}</span>
            <button
              onClick={() => setShowKeyPicker(true)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#1a1d24] text-gray-200 hover:text-white border border-[#2b303d] hover:border-gray-500 transition cursor-pointer"
            >
              Set
            </button>
          </div>
        </div>

        {/* Row 3: Zoom level & slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium">Zoom level</span>
            <span className="font-mono text-gray-200 font-semibold">{zoomLevel.toFixed(1)}x</span>
          </div>
          <div className="relative py-1">
            <input
              type="range"
              min="1.5"
              max="4.0"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#252833] rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>

        {/* Row 4: Smooth toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-300 font-medium">Smooth</span>
          <button
            onClick={() => {
              const next = !smooth;
              setSmooth(next);
              onNotify?.(`Smooth magnification: ${next ? 'ON' : 'OFF'}`);
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
              smooth ? 'bg-emerald-500' : 'bg-[#252833]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                smooth ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Row 5: Smooth edges toggle */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs text-gray-300 font-medium block">Smooth edges</span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">
              Off: sharp pixels. On: softer, a little blurry.
            </span>
          </div>
          <button
            onClick={() => {
              const next = !smoothEdges;
              setSmoothEdges(next);
              onNotify?.(`Smooth edges: ${next ? 'ON' : 'OFF'}`);
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
              smoothEdges ? 'bg-emerald-500' : 'bg-[#252833]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                smoothEdges ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Notes matching PlexusX screenshot */}
        <div className="pt-3 border-t border-[#1f232c] space-y-1.5 text-xs text-gray-400">
          <p>Zoom comes with the Dark Boost & Zoom add-on.</p>
          <p>Zoom uses Windows' own Magnifier. Some games' rules treat zoom as an advantage - check yours.</p>
        </div>

        {/* Interactive Zoom Test Controls */}
        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            onClick={handleToggleZoomLens}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-95 ${
              isZooming
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(0,240,118,0.3)]'
                : 'bg-[#181a20] text-gray-200 border-[#262a34] hover:border-gray-500'
            }`}
          >
            {isZooming ? `Close Zoom (${zoomLevel.toFixed(1)}x)` : `Toggle Zoom Lens (${zoomLevel.toFixed(1)}x)`}
          </button>
          <button
            onMouseDown={handleStartZoom}
            onMouseUp={handleStopZoom}
            onMouseLeave={handleStopZoom}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1a1e28] hover:bg-[#232838] text-emerald-400 border border-emerald-500/40 transition active:scale-95 cursor-pointer"
          >
            Hold to Test Zoom
          </button>
        </div>
      </div>

      {/* Key Picker Modal */}
      {showKeyPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#14161c] border border-[#2b303d] rounded-xl p-5 w-96 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232733] pb-3">
              <h3 className="text-sm font-bold text-white">Select Zoom Key</h3>
              <button
                onClick={() => setShowKeyPicker(false)}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Choose the button you want to hold to activate zoom during gameplay:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                'Mouse 5',
                'Mouse 4',
                'Right Click',
                'Middle Click',
                'Left Alt',
                'Left Ctrl',
                'Left Shift',
                'Space',
                'C',
                'V',
                'Z',
                'X',
              ].map((keyOption) => (
                <button
                  key={keyOption}
                  onClick={() => handleSelectKey(keyOption)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border text-center transition cursor-pointer ${
                    zoomKey === keyOption
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow'
                      : 'bg-[#191b22] text-gray-300 border-[#262a34] hover:border-gray-500 hover:bg-[#20232c]'
                  }`}
                >
                  {keyOption}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
