import React, { useState } from 'react';
import { Sliders, Keyboard, Palette, Power, Image, Eye, Sparkles } from 'lucide-react';

interface CustomizePageProps {
  onNotify?: (msg: string) => void;
}

export const CustomizePage: React.FC<CustomizePageProps> = ({ onNotify }) => {
  const [selectedTheme, setSelectedTheme] = useState<'slate' | 'dark' | 'ash' | 'paper'>('slate');
  const [guiOpacity, setGuiOpacity] = useState(90);
  const [matteBlur, setMatteBlur] = useState(true);
  const [backdropEnabled, setBackdropEnabled] = useState(false);
  const [backdropDim, setBackdropDim] = useState(30);
  const [backdropBlur, setBackdropBlur] = useState(20);

  const hotkeys = [
    { action: 'Toggle Dark Boost', shortcut: 'Alt + D', desc: 'Instantly toggles night vision hardware matrix' },
    { action: 'Hold to Zoom Lens', shortcut: 'Mouse 5 (or Alt + Z)', desc: 'Centers magnification on reticle' },
    { action: 'Toggle Crosshair Overlay', shortcut: 'Alt + X', desc: 'Shows/hides hardware topmost reticle' },
    { action: 'Hold to Compare Display', shortcut: 'Hold in app', desc: 'Instantly previews neutral 100% baseline' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 select-none bg-[#0c0d0f] text-gray-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Customize</h1>
        <p className="text-sm text-gray-400 mt-1">
          Personalize PlexusX acrylic appearance, opacity, window themes, and system-wide hotkeys.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* GUI Appearance Card matching PlexusX CustomizePage.cs */}
        <div className="bg-[#13151a] border border-[#1f232c] rounded-xl p-5 space-y-5">
          <div className="flex items-center space-x-2 border-b border-[#1f232c] pb-3">
            <Palette className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Appearance & Theme</h2>
          </div>

          {/* Theme Look Tiles */}
          <div className="space-y-2">
            <span className="text-xs text-gray-300 font-medium">Design System</span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'slate', name: 'Slate', desc: 'Aero Glass' },
                { id: 'dark', name: 'Dark', desc: 'OLED Black' },
                { id: 'ash', name: 'Ash', desc: 'Matte Grey' },
                { id: 'paper', name: 'Paper', desc: 'High Contrast' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedTheme(theme.id as any);
                    onNotify?.(`Applied ${theme.name} theme.`);
                  }}
                  className={`p-3 rounded-lg border text-center transition cursor-pointer ${
                    selectedTheme === theme.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow'
                      : 'bg-[#181a20] text-gray-400 border-[#252833] hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold block">{theme.name}</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">{theme.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GUI Opacity Slider */}
          <div className="space-y-2 pt-2 border-t border-[#1f232c]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300 font-medium">GUI Opacity</span>
              <span className="font-mono text-emerald-400 font-semibold">{guiOpacity}%</span>
            </div>
            <input
              type="range"
              min="45"
              max="100"
              value={guiOpacity}
              onChange={(e) => setGuiOpacity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#20242e] rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Matte Blur Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1f232c]">
            <div>
              <span className="text-xs text-gray-300 font-medium block">Matte Blur</span>
              <span className="text-[11px] text-gray-500 block">DWM acrylic backdrop blur behind window</span>
            </div>
            <button
              onClick={() => {
                const next = !matteBlur;
                setMatteBlur(next);
                onNotify?.(`Matte blur: ${next ? 'ON' : 'OFF'}`);
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                matteBlur ? 'bg-emerald-500' : 'bg-[#252833]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  matteBlur ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Custom Backdrop GIF Note matching PlexusX */}
          <div className="p-3 rounded-lg bg-[#181a20] border border-[#252833] text-[11px] text-gray-400 space-y-1">
            <span className="font-semibold text-gray-300 block">Desktop Hardware Composition</span>
            <p>
              A GIF or backdrop image plays only while PlexusX is open in front. It suspends while a game runs to guarantee zero FPS impact.
            </p>
          </div>
        </div>

        {/* Global Hotkeys Card */}
        <div className="bg-[#13151a] border border-[#1f232c] rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#1f232c] pb-3">
            <Keyboard className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Global In-Game Hotkeys</h2>
          </div>

          <div className="space-y-3">
            {hotkeys.map((h) => (
              <div
                key={h.action}
                className="p-3 rounded-lg bg-[#181a20] border border-[#252833] flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-white block">{h.action}</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">{h.desc}</span>
                </div>
                <span className="font-mono text-xs text-emerald-400 font-bold bg-[#111317] px-2.5 py-1 rounded border border-gray-700/60 shadow-sm">
                  {h.shortcut}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-gray-500">
            Hotkeys operate system-wide with zero input delay, even while playing exclusive fullscreen or borderless games.
          </p>
        </div>
      </div>
    </div>
  );
};
