import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface QuickVibranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  saturation: number;
  setSaturation: (val: number) => void;
  vibrance: number;
  setVibrance: (val: number) => void;
  brightness: number;
  setBrightness: (val: number) => void;
  contrast: number;
  setContrast: (val: number) => void;
  gamma: number;
  setGamma: (val: number) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  highlights: number;
  setHighlights: (val: number) => void;
  shadows: number;
  setShadows: (val: number) => void;
  activePreset: string;
  onSelectPreset: (presetName: string) => void;
}

export const QuickVibranceModal: React.FC<QuickVibranceModalProps> = ({
  isOpen,
  onClose,
  saturation,
  setSaturation,
  vibrance,
  setVibrance,
  brightness,
  setBrightness,
  contrast,
  setContrast,
  gamma,
  setGamma,
  temperature,
  setTemperature,
  highlights,
  setHighlights,
  shadows,
  setShadows,
  activePreset,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  const quickPresets = ['Balanced', 'BlueGrey', 'Blue-grey', 'Vivid', 'Forest', 'Desert'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] bg-[#12151b] border border-[#232936] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-5 text-gray-200 select-none animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1f2430]">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-black" />
            </div>
            <span className="font-bold text-sm text-white tracking-wide">PlexusX</span>
            <span className="text-[10px] text-gray-400 bg-[#1b202a] px-1.5 py-0.5 rounded font-mono">
              Ctrl+Alt+V
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#202533] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Sliders */}
        <div className="space-y-4 my-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-white">Saturation</span>
              <span className="font-bold text-emerald-400">{saturation}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={300}
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full accent-white h-1.5 bg-[#202533] rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-white">Vibrance</span>
              <span className="font-bold text-emerald-400">{vibrance}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={350}
              value={vibrance}
              onChange={(e) => setVibrance(Number(e.target.value))}
              className="w-full accent-white h-1.5 bg-[#202533] rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Presets Row */}
        <div className="my-3">
          <span className="text-[11px] font-semibold text-gray-400 block mb-1.5">Quick Presets</span>
          <div className="grid grid-cols-3 gap-1.5">
            {quickPresets.map((name) => {
              const active = activePreset === name;
              return (
                <button
                  key={name}
                  onClick={() => onSelectPreset(name)}
                  className={`text-[11px] font-medium py-1.5 px-2 rounded-md transition cursor-pointer text-center truncate ${
                    active
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-[#181d26] text-gray-300 hover:bg-[#222936] hover:text-white'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6 Quick Sliders */}
        <div className="grid grid-cols-2 gap-3 my-3 pt-2 border-t border-[#1f2430]">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-300">Brightness</span>
              <span className="text-gray-400">{brightness}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={170}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-white h-1 bg-[#202533] rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-300">Contrast</span>
              <span className="text-gray-400">{contrast}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={150}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full accent-white h-1 bg-[#202533] rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-300">Gamma</span>
              <span className="text-gray-400">{gamma.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={50}
              max={150}
              value={Math.round(gamma * 100)}
              onChange={(e) => setGamma(Number(e.target.value) / 100)}
              className="w-full accent-white h-1 bg-[#202533] rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-300">Temperature</span>
              <span className="text-gray-400">{temperature}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full accent-white h-1 bg-[#202533] rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-300">Highlights</span>
              <span className="text-gray-400">{highlights}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={highlights}
              onChange={(e) => setHighlights(Number(e.target.value))}
              className="w-full accent-white h-1 bg-[#202533] rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-300">Shadows</span>
              <span className="text-gray-400">{shadows}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={shadows}
              onChange={(e) => setShadows(Number(e.target.value))}
              className="w-full accent-white h-1 bg-[#202533] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs text-gray-300 hover:text-white flex items-center space-x-1 font-medium transition cursor-pointer"
          >
            <span>Open PlexusX</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
