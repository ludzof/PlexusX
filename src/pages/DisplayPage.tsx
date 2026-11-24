import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  RotateCcw,
  Check,
  Smartphone,
  Copy,
  Layers,
  Trash2,
  Bookmark,
  ChevronDown,
  Info,
  Tv,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ColorWheel } from '../components/ColorWheel';
import { QuickVibranceModal } from '../components/QuickVibranceModal';
import { MonitorApplyCard } from '../components/MonitorApplyCard';

interface DisplayPageProps {
  onNotify?: (msg: string) => void;
}

// Preset definitions from entitlement data
const GAME_PRESETS: Record<string, any[]> = {
  Rust: [
    { name: 'Balanced', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'BlueGrey', sat: 300, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 200, darkenHue: 120, hueTurn: 29, hueAmount: 75, cv: 0 },
    { name: 'Blue-grey', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 400, darkenHue: 120, hueTurn: 55, hueAmount: 0, cv: 0 },
    { name: 'Vivid', sat: 221, vib: 100, bri: 90, gam: 0.8, con: 140, temp: -46, high: -12, shad: 2, black: 26, white: -30, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Forest', sat: 230, vib: 100, bri: 104, gam: 1.12, con: 98, temp: -14, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Desert', sat: 225, vib: 100, bri: 94, gam: 0.98, con: 108, temp: -26, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Snow', sat: 215, vib: 100, bri: 90, gam: 0.96, con: 106, temp: 22, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Black Holo', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 4 },
  ],
  CS2: [
    { name: 'Balanced', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'BlueGrey', sat: 300, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 200, darkenHue: 120, hueTurn: 29, hueAmount: 75, cv: 0 },
    { name: 'Blue-grey', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 400, darkenHue: 120, hueTurn: 55, hueAmount: 0, cv: 0 },
    { name: 'Vivid', sat: 221, vib: 100, bri: 90, gam: 0.8, con: 140, temp: -46, high: -12, shad: 2, black: 26, white: -30, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Dust', sat: 230, vib: 100, bri: 96, gam: 1.0, con: 106, temp: -24, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Concrete', sat: 240, vib: 110, bri: 100, gam: 1.02, con: 112, temp: -12, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Shadows', sat: 230, vib: 100, bri: 102, gam: 1.14, con: 96, temp: -8, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
  ],
  Fortnite: [
    { name: 'Balanced', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'BlueGrey', sat: 300, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 200, darkenHue: 120, hueTurn: 29, hueAmount: 75, cv: 0 },
    { name: 'Blue-grey', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 400, darkenHue: 120, hueTurn: 55, hueAmount: 0, cv: 0 },
    { name: 'Vivid', sat: 221, vib: 100, bri: 90, gam: 0.8, con: 140, temp: -46, high: -12, shad: 2, black: 26, white: -30, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Daylight', sat: 215, vib: 100, bri: 98, gam: 1.0, con: 108, temp: -10, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Town', sat: 220, vib: 100, bri: 100, gam: 1.02, con: 106, temp: -8, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Night', sat: 230, vib: 100, bri: 104, gam: 1.16, con: 96, temp: -6, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
  ],
  PUBG: [
    { name: 'Balanced', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'BlueGrey', sat: 300, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 200, darkenHue: 120, hueTurn: 29, hueAmount: 75, cv: 0 },
    { name: 'Blue-grey', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 400, darkenHue: 120, hueTurn: 55, hueAmount: 0, cv: 0 },
    { name: 'Vivid', sat: 221, vib: 100, bri: 90, gam: 0.8, con: 140, temp: -46, high: -12, shad: 2, black: 26, white: -30, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Desert', sat: 230, vib: 100, bri: 96, gam: 1.0, con: 108, temp: -22, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Jungle', sat: 235, vib: 100, bri: 104, gam: 1.12, con: 98, temp: -12, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Urban', sat: 240, vib: 110, bri: 100, gam: 1.04, con: 110, temp: -10, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
  ],
  Valorant: [
    { name: 'Balanced', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'BlueGrey', sat: 300, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 200, darkenHue: 120, hueTurn: 29, hueAmount: 75, cv: 0 },
    { name: 'Blue-grey', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 400, darkenHue: 120, hueTurn: 55, hueAmount: 0, cv: 0 },
    { name: 'Vivid', sat: 221, vib: 100, bri: 90, gam: 0.8, con: 140, temp: -46, high: -12, shad: 2, black: 26, white: -30, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Outlines', sat: 165, vib: 100, bri: 98, gam: 1.0, con: 106, temp: 0, high: -12, shad: 6, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Bright', sat: 150, vib: 100, bri: 94, gam: 1.0, con: 102, temp: 0, high: -24, shad: 8, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Shade', sat: 160, vib: 100, bri: 100, gam: 1.06, con: 100, temp: 0, high: -16, shad: 18, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
  ],
  'Rainbow Six Siege': [
    { name: 'Balanced', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'BlueGrey', sat: 300, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 200, darkenHue: 120, hueTurn: 29, hueAmount: 75, cv: 0 },
    { name: 'Blue-grey', sat: 100, vib: 100, bri: 100, gam: 1.0, con: 100, temp: 0, high: 0, shad: 0, black: 0, white: 0, formula: 6, darken: 400, darkenHue: 120, hueTurn: 55, hueAmount: 0, cv: 0 },
    { name: 'Vivid', sat: 221, vib: 100, bri: 90, gam: 0.8, con: 140, temp: -46, high: -12, shad: 2, black: 26, white: -30, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Corners', sat: 160, vib: 100, bri: 100, gam: 1.1, con: 102, temp: 0, high: -20, shad: 28, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Doorways', sat: 170, vib: 100, bri: 98, gam: 1.06, con: 106, temp: 0, high: -24, shad: 20, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
    { name: 'Daylight', sat: 155, vib: 100, bri: 96, gam: 1.0, con: 104, temp: 0, high: -26, shad: 10, black: 0, white: 0, formula: 0, darken: 0, darkenHue: 120, hueTurn: 0, hueAmount: 100, cv: 0 },
  ],
};

const FORMULA_LIST = [
  'Rec.709',
  'Average',
  'Rec.601',
  'Green-lock',
  'Perceptual',
  'Red-grey',
  'Blue-grey',
  'Skin-sparing',
  'Deep blue',
];

const COLOUR_VISION_OPTIONS = [
  { id: 0, label: 'Normal' },
  { id: 1, label: 'Green-weak' },
  { id: 2, label: 'Red-weak' },
  { id: 3, label: 'Blue-weak' },
];

export const DisplayPage: React.FC<DisplayPageProps> = ({ onNotify }) => {
  // Monitors State (Selected display device names for multi-monitor isolation)
  const [tickedMonitors, setTickedMonitors] = useState<string[]>([
    '\\\\.\\DISPLAY1',
  ]);

  const handleTickedMonitorsChange = useCallback((ticked: string[]) => {
    setTickedMonitors((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(ticked)) return prev;
      return ticked;
    });
  }, []);

  // Primary Sliders
  const [saturation, setSaturation] = useState<number>(100); // 0–300%
  const [vibrance, setVibrance] = useState<number>(100);     // 0–350%

  // Fine Tune (10 Sliders)
  const [brightness, setBrightness] = useState<number>(100); // 50–170%
  const [contrast, setContrast] = useState<number>(100);     // 50–150%
  const [highlights, setHighlights] = useState<number>(0);   // -100 to 100
  const [blacks, setBlacks] = useState<number>(0);           // -100 to 100
  const [shadowTint, setShadowTint] = useState<number>(0);   // -100 to 100

  const [gamma, setGamma] = useState<number>(1.0);           // 0.50–1.50
  const [temperature, setTemperature] = useState<number>(0); // -100 to 100
  const [shadows, setShadows] = useState<number>(0);         // -100 to 100
  const [whites, setWhites] = useState<number>(0);           // -100 to 100
  const [highlightTint, setHighlightTint] = useState<number>(0); // -100 to 100

  // Presets
  const [selectedGame, setSelectedGame] = useState<string>('Rust');
  const [activePreset, setActivePreset] = useState<string>('Balanced');
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false);

  // Colour Depth & Wheels
  const [formulaIndex, setFormulaIndex] = useState<number>(0); // 0..8
  const [hueTurn, setHueTurn] = useState<number>(0);           // -180..180
  const [hueTurnAmount, setHueTurnAmount] = useState<number>(100); // 0..100
  const [darken, setDarken] = useState<number>(0);             // 0..400
  const [darkenHue, setDarkenHue] = useState<number>(120);     // 0..360
  const [hueComplement, setHueComplement] = useState<number>(0); // 0..100

  // Colour Vision
  const [colourVisionMode, setColourVisionMode] = useState<number>(0); // 0..3 or 4

  // Eye Care
  const [eyeCareWarmth, setEyeCareWarmth] = useState<number>(0); // 0..100
  const [eyeCareDim, setEyeCareDim] = useState<number>(0);       // 0..80

  // UI state
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [showQuickModal, setShowQuickModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedSetup, setCopiedSetup] = useState<boolean>(false);
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [pastedCode, setPastedCode] = useState<string>('');

  // Generate dynamic share code string (calculated synchronously with zero extra render pass)
  const shareCode = useMemo(() => {
    const s = Math.round(saturation).toString(16).toUpperCase();
    const v = Math.round(vibrance).toString(16).toUpperCase();
    const g = Math.round(gamma * 100).toString(16).toUpperCase();
    return `PX-${s}${v}3M${g}3M565656227P3M3M3M22225T7Z5622D`;
  }, [saturation, vibrance, gamma]);

  const lastSentParamsRef = useRef<string>('');
  const isDispatchingRef = useRef<boolean>(false);
  const nextParamsRef = useRef<any>(null);

  // Live apply to C# engine: non-blocking single-flight queue coalescer.
  // When you click: applies instantly.
  // When you drag: streams at maximum GPU speed without ever lagging or queuing up.
  useEffect(() => {
    const params = {
      targetMonitors: tickedMonitors,
      saturation: saturation / 100.0,
      vibrance: vibrance / 100.0,
      brightness: brightness / 100.0,
      contrast: contrast / 100.0,
      gamma: gamma,
      temperature: temperature,
      highlights: highlights,
      shadows: shadows,
      blacks: blacks,
      whites: whites,
      shadowTint: shadowTint,
      highlightTint: highlightTint,
      formula: formulaIndex,
      darken: darken,
      darkenHue: darkenHue,
      hueTurn: hueTurn,
      hueTurnAmount: hueTurnAmount,
      hueComplement: hueComplement,
      colourVision: colourVisionMode,
      eyeCareWarmth: eyeCareWarmth,
      eyeCareDim: eyeCareDim,
      previewNeutral: isComparing,
    };

    const serialized = JSON.stringify(params);
    if (lastSentParamsRef.current === serialized) return;
    lastSentParamsRef.current = serialized;

    nextParamsRef.current = params;

    if (!isDispatchingRef.current) {
      isDispatchingRef.current = true;
      (async () => {
        while (nextParamsRef.current) {
          const toSend = nextParamsRef.current;
          nextParamsRef.current = null;
          if (window.electronAPI) {
            try {
              await window.electronAPI.applyDisplaySettings(toSend);
            } catch {}
          }
        }
        isDispatchingRef.current = false;
      })();
    }
  }, [
    tickedMonitors,
    saturation,
    vibrance,
    brightness,
    contrast,
    gamma,
    temperature,
    highlights,
    shadows,
    blacks,
    whites,
    shadowTint,
    highlightTint,
    formulaIndex,
    darken,
    darkenHue,
    hueTurn,
    hueTurnAmount,
    hueComplement,
    colourVisionMode,
    eyeCareWarmth,
    eyeCareDim,
    isComparing,
  ]);

  // Listen for global shortcut Ctrl+Alt+V
  useEffect(() => {
    if (window.electronAPI?.onQuickVibranceToggle) {
      const unsub = window.electronAPI.onQuickVibranceToggle(() => {
        setShowQuickModal((prev) => !prev);
      });
      return unsub;
    }
  }, []);

  // Listen for global shortcut Ctrl+Alt+S
  useEffect(() => {
    if (window.electronAPI?.onScreenshot) {
      const unsub = window.electronAPI.onScreenshot(() => {
        onNotify?.('Screenshot captured with display colours.');
      });
      return unsub;
    }
  }, [onNotify]);

  // Apply a preset
  const handleApplyPreset = (preset: any) => {
    setActivePreset(preset.name);
    setSaturation(preset.sat ?? 100);
    setVibrance(preset.vib ?? 100);
    setBrightness(preset.bri ?? 100);
    setGamma(preset.gam ?? 1.0);
    setContrast(preset.con ?? 100);
    setTemperature(preset.temp ?? 0);
    setHighlights(preset.high ?? 0);
    setShadows(preset.shad ?? 0);
    setBlacks(preset.black ?? 0);
    setWhites(preset.white ?? 0);
    setFormulaIndex(preset.formula ?? 0);
    setDarken(preset.darken ?? 0);
    setDarkenHue(preset.darkenHue ?? 120);
    setHueTurn(preset.hueTurn ?? 0);
    setHueTurnAmount(preset.hueAmount ?? 100);
    setColourVisionMode(preset.cv ?? 0);
    onNotify?.(`Preset "${preset.name}" applied.`);
  };

  // Reset all to default neutral
  const handleResetAll = async () => {
    setSaturation(100);
    setVibrance(100);
    setBrightness(100);
    setContrast(100);
    setHighlights(0);
    setBlacks(0);
    setShadowTint(0);
    setGamma(1.0);
    setTemperature(0);
    setShadows(0);
    setWhites(0);
    setHighlightTint(0);
    setFormulaIndex(0);
    setDarken(0);
    setDarkenHue(120);
    setHueTurn(0);
    setHueTurnAmount(100);
    setHueComplement(0);
    setColourVisionMode(0);
    setEyeCareWarmth(0);
    setEyeCareDim(0);
    setActivePreset('Balanced');
    if (window.electronAPI) {
      await window.electronAPI.resetDisplaySettings();
    }
    onNotify?.('Display reset to neutral.');
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(shareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    onNotify?.('Look code copied!');
  };

  const handleCopySetup = () => {
    navigator.clipboard?.writeText(`PXF-${shareCode}.PXC-STATIC-DOT.PXM-1920X1080`);
    setCopiedSetup(true);
    setTimeout(() => setCopiedSetup(false), 2000);
    onNotify?.('Whole setup code copied!');
  };

  const getHueName = (deg: number) => {
    const d = (deg % 360 + 360) % 360;
    if (d >= 330 || d < 30) return 'Red';
    if (d >= 30 && d < 90) return 'Yellow';
    if (d >= 90 && d < 150) return 'Green';
    if (d >= 150 && d < 210) return 'Cyan';
    if (d >= 210 && d < 270) return 'Blue';
    return 'Magenta';
  };

  const currentPresets = GAME_PRESETS[selectedGame] || GAME_PRESETS['Rust'];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 select-none bg-[#0c0d0f] text-gray-200">
      {/* 1. Header Row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Display</h1>
          <p className="text-xs text-gray-400 mt-1">
            Scenes are starting points. The sliders work whatever you play.
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center space-x-2.5">
          {/* Live Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#141820] border border-[#222836]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Live</span>
          </div>

          {/* Compare Button */}
          <button
            onClick={() => setIsComparing((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition cursor-pointer ${
              isComparing
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-[#181a20] text-gray-300 hover:text-white border-[#262a34]'
            }`}
            title="Hold or toggle your look against neutral, so you can see what it is actually doing"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isComparing ? 'Showing off' : 'Compare'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetAll}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#181a20] text-gray-300 hover:text-white border border-[#262a34] flex items-center space-x-1.5 transition cursor-pointer"
            title="Reset sliders to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Phone Button */}
          <button
            onClick={() => setShowPhoneModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#181a20] text-gray-300 hover:text-white border border-[#262a34] flex items-center space-x-1.5 transition cursor-pointer"
            title="Control colours from your phone"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>
        </div>
      </div>

      {/* 2. Apply to (Screens Card matching PlexusX screenshot) */}
      <MonitorApplyCard
        onTickedMonitorsChange={handleTickedMonitorsChange}
        onNotify={onNotify}
      />

      {/* 3. Primary Sliders (Side-by-side Big Cards) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Saturation */}
        <div className="bg-[#12151b] border border-[#1e232e] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between mb-0.5">
              <h3 className="text-sm font-bold text-white">Saturation</h3>
              <span className="text-sm font-bold text-white font-mono">{saturation}%</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">100 is the game as it ships</p>

            <input
              type="range"
              min={0}
              max={300}
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full h-2 bg-[#202533] rounded-lg cursor-pointer accent-white"
            />
          </div>

          {/* Scale Ticks */}
          <div className="relative text-[10px] text-gray-500 font-medium mt-2 flex justify-between">
            <span>0</span>
            <span className="absolute left-[33.3%] -translate-x-1/2">100 · ships</span>
            <span>300</span>
          </div>
        </div>

        {/* Vibrance */}
        <div className="bg-[#12151b] border border-[#1e232e] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between mb-0.5">
              <h3 className="text-sm font-bold text-white">Vibrance</h3>
              <span className="text-sm font-bold text-white font-mono">{vibrance}%</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">Past 100 it continues in software</p>

            <input
              type="range"
              min={0}
              max={350}
              value={vibrance}
              onChange={(e) => setVibrance(Number(e.target.value))}
              className="w-full h-2 bg-[#202533] rounded-lg cursor-pointer accent-white"
            />
          </div>

          {/* Scale Ticks */}
          <div className="relative text-[10px] text-gray-500 font-medium mt-2 flex justify-between">
            <span>0</span>
            <span className="absolute left-[28.5%] -translate-x-1/2">100 · driver</span>
            <span>350</span>
          </div>
        </div>
      </div>

      {/* 4. Fine Tune Card (10 Sliders in 2 Columns) */}
      <div className="bg-[#12151b] border border-[#1e232e] rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Fine tune</h2>

        {/* Warning Banner matching Screenshot 1 */}
        {showWarning && (
          <div className="relative bg-[#191d26] border border-[#2b3342] rounded-lg p-3 text-[11px] text-gray-300 leading-relaxed pr-8">
            <span className="font-semibold text-gray-200">
              Your NVIDIA driver is refusing screen-colour changes.
            </span>{' '}
            Something else is usually holding them - Windows Night light, f.lux, or NVIDIA Freestyle.
            Close those and reopen PlexusX. Saturation above works either way.
            <button
              onClick={() => setShowWarning(false)}
              className="absolute top-2.5 right-2.5 text-gray-500 hover:text-gray-300 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-1">
          {/* Column 1 */}
          <div className="space-y-4">
            {/* Brightness */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-300">Brightness</span>
                <span className="font-mono text-gray-200 font-semibold">{brightness}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={170}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
              />
              <div className="relative text-[9px] text-gray-500 flex justify-between mt-1">
                <span>50</span>
                <span className="absolute left-[41.6%] -translate-x-1/2">100 · normal</span>
                <span>170</span>
              </div>
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-300">Contrast</span>
                <span className="font-mono text-gray-200 font-semibold">{contrast}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
              />
              <div className="relative text-[9px] text-gray-500 flex justify-between mt-1">
                <span>50</span>
                <span className="absolute left-[50%] -translate-x-1/2">100 · normal</span>
                <span>150</span>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-300">Highlights</span>
                <span className="font-mono text-gray-200 font-semibold">{highlights}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={highlights}
                onChange={(e) => setHighlights(Number(e.target.value))}
                className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
              />
              <div className="relative text-[9px] text-gray-500 flex justify-between mt-1">
                <span>-100</span>
                <span className="absolute left-[50%] -translate-x-1/2">0 · untouched</span>
                <span>100</span>
              </div>
            </div>

            {/* Blacks */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-300">Blacks</span>
                <span className="font-mono text-gray-200 font-semibold">{blacks}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={blacks}
                onChange={(e) => setBlacks(Number(e.target.value))}
                className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
              />
              <div className="relative text-[9px] text-gray-500 flex justify-between mt-1">
                <span>-100</span>
                <span className="absolute left-[50%] -translate-x-1/2">0 · untouched</span>
                <span>100</span>
              </div>
            </div>

            {/* Shadow Tint */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-300">Shadow tint</span>
                <span className="font-mono text-gray-200 font-semibold">{shadowTint}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={shadowTint}
                onChange={(e) => setShadowTint(Number(e.target.value))}
                className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
              />
              <div className="relative text-[9px] text-gray-500 flex justify-between mt-1">
                <span>-100 · cold</span>
                <span className="absolute left-[50%] -translate-x-1/2">0 · untouched</span>
                <span>100 · warm</span>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            {/* Gamma */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-300">Gamma</span>
                <span className="font-mono text-gray-200 font-semibold">{gamma.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={50}
                max={150}
                value={Math.round(gamma * 100)}
                onChange={(e) => setGamma(Number(e.target.value) / 100)}
                className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
              />
              <div className="relative text-[9px] text-gray-500 flex justify-between mt-1">
                <span>0.50</span>
                <span className="absolute left-[50%] -translate-x-1/2">1.00 · normal</span>
                <span>1.50</span>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-300">Temperature</span>
                <span className="font-mono text-gray-200 font-semibold">{temperature}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
              />
              <div className="relative text-[9px] text-gray-500 flex justify-between mt-1">
                <span>-100 · cool</span>
                <span className="absolute left-[50%] -translate-x-1/2">0 · neutral</span>
                <span>100 · warm</span>
              </div>
            </div>

            {/* Shadows */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-300">Shadows</span>
                <span className="font-mono text-gray-200 font-semibold">{shadows}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={shadows}
                onChange={(e) => setShadows(Number(e.target.value))}
                className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
              />
              <div className="relative text-[9px] text-gray-500 flex justify-between mt-1">
                <span>-100</span>
                <span className="absolute left-[50%] -translate-x-1/2">0 · untouched</span>
                <span>100</span>
              </div>
            </div>

            {/* Whites */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-300">Whites</span>
                <span className="font-mono text-gray-200 font-semibold">{whites}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={whites}
                onChange={(e) => setWhites(Number(e.target.value))}
                className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
              />
              <div className="relative text-[9px] text-gray-500 flex justify-between mt-1">
                <span>-100</span>
                <span className="absolute left-[50%] -translate-x-1/2">0 · untouched</span>
                <span>100</span>
              </div>
            </div>

            {/* Highlight Tint */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-300">Highlight tint</span>
                <span className="font-mono text-gray-200 font-semibold">{highlightTint}</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                value={highlightTint}
                onChange={(e) => setHighlightTint(Number(e.target.value))}
                className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
              />
              <div className="relative text-[9px] text-gray-500 flex justify-between mt-1">
                <span>-100 · cold</span>
                <span className="absolute left-[50%] -translate-x-1/2">0 · untouched</span>
                <span>100 · warm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Scene Presets Card */}
      <div className="bg-[#12151b] border border-[#1e232e] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Scene presets</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNotify?.('Cleared saved looks.')}
              className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#1a202c] border border-transparent hover:border-[#273042] transition cursor-pointer"
              title="Delete look"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNotify?.('Look saved!')}
              className="px-3 py-1 rounded-md text-[11px] font-semibold bg-[#181d26] text-gray-200 hover:text-white border border-[#273042] flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Bookmark className="w-3 h-3 text-emerald-400" />
              <span>Save look</span>
            </button>
          </div>
        </div>

        {/* Game Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setGameDropdownOpen(!gameDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-[#181c24] border border-[#252c3b] rounded-lg text-xs font-semibold text-white hover:bg-[#202633] transition cursor-pointer"
          >
            <span>{selectedGame}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {gameDropdownOpen && (
            <div className="absolute top-10 left-0 z-40 bg-[#161922] border border-[#273042] rounded-lg shadow-xl py-1 w-44">
              {Object.keys(GAME_PRESETS).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setSelectedGame(g);
                    setGameDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition flex items-center justify-between cursor-pointer ${
                    selectedGame === g
                      ? 'bg-[#222a3a] text-white font-semibold'
                      : 'text-gray-300 hover:bg-[#1c222e] hover:text-white'
                  }`}
                >
                  <span>{g}</span>
                  {selectedGame === g && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 8 Presets Grid matching Screenshot 2 */}
        <div className="grid grid-cols-4 gap-2.5">
          {currentPresets.map((preset) => {
            const isActive = activePreset === preset.name;
            return (
              <button
                key={preset.name}
                onClick={() => handleApplyPreset(preset)}
                className={`p-3 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? 'bg-[#181e29] border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'bg-[#141820] border-[#222836] hover:bg-[#1a202c] hover:border-[#2f384d]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-emerald-400 shadow-[0_0_8px_#00f076]' : 'bg-gray-600'
                    }`}
                  />
                </div>
                <span className="text-[11px] font-mono text-gray-400">{preset.sat}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Colour Depth Section */}
      <div className="bg-[#12151b] border border-[#1e232e] rounded-xl p-5 space-y-5">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Colour depth</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Which saturation PlexusX uses, and how far the colours are pushed. The formula travels with
            the look, so a preset can bring its own.
          </p>
        </div>

        {/* 9 Formula Pills matching Screenshot 2 */}
        <div className="flex flex-wrap gap-1.5">
          {FORMULA_LIST.map((formula, idx) => {
            const active = formulaIndex === idx;
            return (
              <button
                key={formula}
                onClick={() => setFormulaIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  active
                    ? 'bg-white text-black border-white shadow-sm font-bold'
                    : 'bg-[#161a22] text-gray-300 border-[#242b3a] hover:bg-[#1c222e] hover:text-white'
                }`}
              >
                {formula}
              </button>
            );
          })}
        </div>

        {/* Two Interactive Color Wheels matching Screenshot 3 */}
        <div className="grid grid-cols-2 gap-8 pt-3 border-t border-[#1c212c]">
          {/* Wheel 1: Hue Turn */}
          <div className="flex flex-col items-center">
            <ColorWheel
              title="Hue turn"
              mode="hue"
              value={hueTurn}
              selectedHueAngle={hueTurn < 0 ? 360 + hueTurn : hueTurn}
              onChangeAngle={(val) => setHueTurn(val)}
              onReset={() => setHueTurn(0)}
              centerPrimaryText={`${hueTurn}°`}
              centerSecondaryText={hueTurn === 0 ? 'No turn' : 'Colours turned'}
              caption="Drag or scroll. Double-click resets."
            />

            {/* Sliders below Wheel 1 */}
            <div className="w-full space-y-3 mt-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Hue turn</span>
                  <span className="font-mono text-gray-200">{hueTurn}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={hueTurn}
                  onChange={(e) => setHueTurn(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
                />
                <div className="relative text-[9px] text-gray-500 flex justify-between mt-1">
                  <span>-180°</span>
                  <span className="absolute left-[50%] -translate-x-1/2">0°</span>
                  <span>180°</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Turn amount</span>
                  <span className="font-mono text-gray-200">{hueTurnAmount}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={hueTurnAmount}
                  onChange={(e) => setHueTurnAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
                />
                <div className="text-[9px] text-gray-500 flex justify-between mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Wheel 2: Darken a Colour */}
          <div className="flex flex-col items-center">
            <ColorWheel
              title="Darken a colour"
              mode="darken"
              value={darken}
              selectedHueAngle={darkenHue}
              onChangeAngle={(val) => setDarkenHue(val)}
              onReset={() => {
                setDarken(0);
                setHueComplement(0);
              }}
              centerPrimaryText={`${Math.round(darken / 4)}%`}
              centerSecondaryText={darken === 0 ? 'Not darkened' : `${getHueName(darkenHue)} darker`}
              caption="Pick the colour, then set how much."
            />

            {/* Sliders below Wheel 2 */}
            <div className="w-full space-y-3 mt-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{getHueName(darkenHue)} darken</span>
                  <span className="font-mono text-gray-200">{Math.round(darken / 4)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={400}
                  value={darken}
                  onChange={(e) => setDarken(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
                />
                <div className="text-[9px] text-gray-500 flex justify-between mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Complement</span>
                  <span className="font-mono text-gray-200">{hueComplement}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={hueComplement}
                  onChange={(e) => setHueComplement(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
                />
                <div className="text-[9px] text-gray-500 flex justify-between mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Colour Vision Section */}
      <div className="bg-[#12151b] border border-[#1e232e] rounded-xl p-5 space-y-3">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Colour vision</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Around one man in twelve can't separate some colours. This rotates the ones you can't tell
            apart into ones you can.
          </p>
        </div>

        <div className="flex space-x-2">
          {COLOUR_VISION_OPTIONS.map((opt) => {
            const active = colourVisionMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setColourVisionMode(opt.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  active
                    ? 'bg-white text-black border-white shadow-sm font-bold'
                    : 'bg-[#161a22] text-gray-300 border-[#242b3a] hover:bg-[#1c222e] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. Shortcuts Section */}
      <div className="bg-[#12151b] border border-[#1e232e] rounded-xl p-5 space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Shortcuts</h2>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161922] border border-[#222734]">
            <span className="text-xs text-gray-300">Quick colour popup</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono bg-[#202533] px-2 py-0.5 rounded text-gray-200">
                Ctrl + Alt + V
              </span>
              <button
                onClick={() => setShowQuickModal(true)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#222838] hover:bg-[#2b3346] text-white rounded transition cursor-pointer"
              >
                Set
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161922] border border-[#222734]">
            <span className="text-xs text-gray-300">Open main window</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono bg-[#202533] px-2 py-0.5 rounded text-gray-400">
                Not set
              </span>
              <button
                onClick={() => onNotify?.('Hotkey setup: select combination in Settings.')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#222838] hover:bg-[#2b3346] text-white rounded transition cursor-pointer"
              >
                Set
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161922] border border-[#222734]">
            <span className="text-xs text-gray-300">Screenshot with colours</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono bg-[#202533] px-2 py-0.5 rounded text-gray-200">
                Ctrl + Alt + S
              </span>
              <button
                onClick={() => onNotify?.('Screenshot shortcut active (Ctrl + Alt + S).')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#222838] hover:bg-[#2b3346] text-white rounded transition cursor-pointer"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 9. Share Section */}
      <div className="bg-[#12151b] border border-[#1e232e] rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Share</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Paste a friend's code to get their exact look, or copy yours to send.
          </p>
        </div>

        {/* Share code input row */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={pastedCode || shareCode}
            onChange={(e) => setPastedCode(e.target.value)}
            className="flex-1 bg-[#171a23] border border-[#262c3b] rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-emerald-500/60 select-all"
          />
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1a202c] hover:bg-[#222938] text-white border border-[#273042] transition flex items-center space-x-1.5 cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy my code</span>
          </button>
          <button
            onClick={() => onNotify?.('Applied shared code!')}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-gray-100 transition cursor-pointer font-bold"
          >
            Apply
          </button>
          <button
            onClick={() => onNotify?.('Look kept as preset.')}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1a202c] hover:bg-[#222938] text-gray-300 hover:text-white border border-[#273042] transition cursor-pointer"
          >
            Keep it
          </button>
        </div>

        {/* Copy Whole Setup Button matching Screenshot 4 */}
        <div className="pt-2 border-t border-[#1c212c]">
          <button
            onClick={handleCopySetup}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#181d26] hover:bg-[#212734] text-gray-200 hover:text-white border border-[#262e3d] flex items-center space-x-1.5 transition cursor-pointer"
          >
            {copiedSetup ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy whole setup</span>
          </button>
          <p className="text-[10px] text-gray-500 mt-1.5">
            Or copy everything at once - these colours, your crosshair and your screen mode.
          </p>
        </div>
      </div>

      {/* 10. Eye Care Section */}
      <div className="bg-[#12151b] border border-[#1e232e] rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Eye care</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Warmer and dimmer for long sessions. Free on every account, and it sits on top of whatever
            look you are using.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-300">Warmth</span>
              <span className="font-mono text-gray-200">
                {eyeCareWarmth === 0 ? 'Off' : `${eyeCareWarmth}%`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={eyeCareWarmth}
              onChange={(e) => setEyeCareWarmth(Number(e.target.value))}
              className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
            />
            <div className="text-[9px] text-gray-500 flex justify-between mt-1">
              <span>Off</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-300">Screen dim</span>
              <span className="font-mono text-gray-200">
                {eyeCareDim === 0 ? 'Off' : `${eyeCareDim}%`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              value={eyeCareDim}
              onChange={(e) => setEyeCareDim(Number(e.target.value))}
              className="w-full h-1.5 bg-[#202533] rounded cursor-pointer accent-white"
            />
            <div className="text-[9px] text-gray-500 flex justify-between mt-1">
              <span>Off</span>
              <span>80%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Vibrance Modal (Popup on Ctrl+Alt+V) */}
      <QuickVibranceModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        saturation={saturation}
        setSaturation={setSaturation}
        vibrance={vibrance}
        setVibrance={setVibrance}
        brightness={brightness}
        setBrightness={setBrightness}
        contrast={contrast}
        setContrast={setContrast}
        gamma={gamma}
        setGamma={setGamma}
        temperature={temperature}
        setTemperature={setTemperature}
        highlights={highlights}
        setHighlights={setHighlights}
        shadows={shadows}
        setShadows={setShadows}
        activePreset={activePreset}
        onSelectPreset={(pName) => {
          const p = currentPresets.find((x) => x.name === pName);
          if (p) handleApplyPreset(p);
        }}
      />

      {/* Phone Remote Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[360px] bg-[#12151b] border border-[#232936] rounded-2xl p-6 text-center select-none shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">PlexusX Phone Remote</h3>
            <p className="text-xs text-gray-400 mb-4">
              Scan this code or open the link on your mobile phone connected to the same Wi-Fi.
            </p>

            <div className="w-44 h-44 bg-white p-3 rounded-xl mx-auto flex items-center justify-center mb-4">
              <div className="w-full h-full border-4 border-black border-dashed flex items-center justify-center text-black font-mono text-[10px] text-center p-2">
                QR CODE
                <br />
                http://192.168.1.100:54321
              </div>
            </div>

            <span className="font-mono text-xs text-emerald-400 bg-[#161a22] px-3 py-1.5 rounded-lg block mb-4 border border-[#242b3a]">
              http://192.168.1.100:54321
            </span>

            <button
              onClick={() => setShowPhoneModal(false)}
              className="w-full py-2 bg-white text-black font-bold text-xs rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
