import React, { useRef, useState } from 'react';
import {
  Palette,
  Keyboard,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Trash2,
  Layers,
  Sliders,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  useCustomization,
  BACKDROP_PRESETS,
  ThemeType,
} from '../context/CustomizationContext';

interface CustomizePageProps {
  onNotify?: (msg: string) => void;
}

export const CustomizePage: React.FC<CustomizePageProps> = ({ onNotify }) => {
  const {
    theme,
    setTheme,
    guiOpacity,
    setGuiOpacity,
    matteBlur,
    setMatteBlur,
    glassSheen,
    setGlassSheen,
    backdropUrl,
    backdropName,
    setBackdrop,
    backdropDim,
    setBackdropDim,
    backdropBlur,
    setBackdropBlur,
    resetToDefaults,
  } = useCustomization();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hotkeys = [
    {
      action: 'Toggle Dark Boost',
      shortcut: 'Alt + D',
      desc: 'Instantly toggles night vision hardware matrix',
    },
    {
      action: 'Hold to Zoom Lens',
      shortcut: 'Mouse 5 (or Alt + Z)',
      desc: 'Centers magnification on reticle',
    },
    {
      action: 'Toggle Crosshair Overlay',
      shortcut: 'Alt + X',
      desc: 'Shows/hides hardware topmost reticle',
    },
    {
      action: 'Quick Vibrance Popup',
      shortcut: 'Ctrl + Alt + V',
      desc: 'Quick slider overlay for immediate saturation',
    },
    {
      action: 'Stretch Resolution Toggle',
      shortcut: 'F8',
      desc: 'Instantly forces 4:3 stretched resolution on main monitor',
    },
    {
      action: 'Hold to Compare Display',
      shortcut: 'Hold in app',
      desc: 'Instantly previews neutral 100% baseline',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.endsWith('.gif')) {
      onNotify?.('Please select an image or GIF file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBackdrop(dataUrl, file.name);
        onNotify?.(`Applied background: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 select-none text-gray-200">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.gif"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Customize
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Personalize PlexusX acrylic appearance, opacity, window themes, animated GIF backdrops, and system-wide hotkeys.
          </p>
        </div>

        <button
          onClick={() => {
            resetToDefaults();
            onNotify?.('Reset appearance to defaults.');
          }}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#181a20] text-gray-300 hover:text-white border border-[#262a34] transition cursor-pointer"
        >
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Theme & Glass Controls */}
        <div className="space-y-6">
          {/* Card 1: Appearance & Design System */}
          <div className="bg-[#12151b]/80 border border-[#1f242e] rounded-xl p-5 space-y-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[#1f242e] pb-3">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  Appearance & Design System
                </h2>
              </div>
              {theme === 'glass' && (
                <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <Sparkles className="w-3 h-3" />
                  <span>LIQUID GLASS ACTIVE</span>
                </span>
              )}
            </div>

            {/* Design System Tiles (Including iPhoneOS Liquid Glass) */}
            <div className="space-y-2.5">
              <span className="text-xs text-gray-300 font-medium">
                Design System Style
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'slate',
                    name: 'Slate',
                    desc: 'Aero Glass',
                    badge: 'Default',
                  },
                  {
                    id: 'glass',
                    name: 'Liquid Glass',
                    desc: 'iPhoneOS Glass',
                    badge: 'Ultra',
                  },
                  {
                    id: 'dark',
                    name: 'Dark',
                    desc: 'OLED Black',
                    badge: 'Pitch',
                  },
                  {
                    id: 'ash',
                    name: 'Ash',
                    desc: 'Matte Grey',
                    badge: 'Studio',
                  },
                  {
                    id: 'paper',
                    name: 'Paper',
                    desc: 'High Contrast',
                    badge: 'Clean',
                  },
                ].map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id as ThemeType);
                        onNotify?.(`Applied ${t.name} theme.`);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? t.id === 'glass'
                            ? 'bg-gradient-to-br from-emerald-500/25 via-white/10 to-transparent border-emerald-400/80 text-white shadow-[0_0_20px_rgba(0,240,118,0.25)]'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow'
                          : 'bg-[#161922] text-gray-400 border-[#232836] hover:text-white hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white block">
                          {t.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            isSelected
                              ? 'bg-emerald-500 text-black'
                              : 'bg-[#202533] text-gray-400'
                          }`}
                        >
                          {t.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 block">
                        {t.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GUI Opacity Slider */}
            <div className="space-y-2 pt-3 border-t border-[#1f242e]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-medium">GUI Opacity</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {guiOpacity}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={guiOpacity}
                onChange={(e) => setGuiOpacity(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#20242e] rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <p className="text-[10px] text-gray-500">
                Lowers UI panel density to let animated GIFs and glass refraction shine through.
              </p>
            </div>

            {/* Matte Blur Toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1f242e]">
              <div>
                <span className="text-xs text-gray-300 font-medium block">
                  Matte Frosted Blur
                </span>
                <span className="text-[11px] text-gray-500 block">
                  DWM acrylic and WebKit backdrop blur
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !matteBlur;
                  setMatteBlur(next);
                  onNotify?.(`Matte blur: ${next ? 'ON' : 'OFF'}`);
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  matteBlur ? 'bg-emerald-500' : 'bg-[#252833]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    matteBlur ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Specular Liquid Glass Sheen Toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1f242e]">
              <div>
                <span className="text-xs text-gray-300 font-medium block">
                  Liquid Glass Rim & Glare
                </span>
                <span className="text-[11px] text-gray-500 block">
                  iPhoneOS specular highlight refraction along panel edges
                </span>
              </div>
              <button
                onClick={() => {
                  const next = !glassSheen;
                  setGlassSheen(next);
                  onNotify?.(`Liquid glass rim: ${next ? 'ON' : 'OFF'}`);
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  glassSheen ? 'bg-emerald-500' : 'bg-[#252833]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    glassSheen ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card 2: Custom Backdrop & Animated GIFs */}
          <div className="bg-[#12151b]/80 border border-[#1f242e] rounded-xl p-5 space-y-5 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[#1f242e] pb-3">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  Backdrop & Animated GIF
                </h2>
              </div>
              {backdropUrl && (
                <button
                  onClick={() => {
                    setBackdrop(null, 'None');
                    onNotify?.('Removed custom backdrop.');
                  }}
                  className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {/* File Upload & Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : 'border-[#262c3b] hover:border-emerald-500/60 bg-[#151821]/60'
              }`}
            >
              <Upload className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">
                Choose GIF or Image...
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Drop any .gif, .png, .jpg, or .webp here to set as animated wallpaper
              </p>
              {backdropName && backdropName !== 'None' && (
                <div className="mt-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 py-1 px-2 rounded inline-block">
                  Active: {backdropName}
                </div>
              )}
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-xs text-gray-300 font-medium">
                Preset Dynamic Backdrops
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BACKDROP_PRESETS.map((p) => {
                  const isSelected = backdropName === p.name;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setBackdrop(p.url, p.name);
                        onNotify?.(`Applied ${p.name} backdrop.`);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-emerald-400 ring-1 ring-emerald-400 text-white'
                          : 'border-[#232836] text-gray-400 hover:border-gray-500 hover:text-white'
                      }`}
                      style={{
                        background: p.thumbnail,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white block drop-shadow">
                          {p.name}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <span className="text-[9px] text-gray-300 block drop-shadow mt-0.5">
                        {p.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Backdrop Dimming */}
            <div className="space-y-2 pt-3 border-t border-[#1f242e]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-medium">
                  Backdrop Darkness Dimming
                </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {backdropDim}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                value={backdropDim}
                onChange={(e) => setBackdropDim(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#20242e] rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <p className="text-[10px] text-gray-500">
                Adjusts background darkness overlay to ensure maximum UI readability.
              </p>
            </div>

            {/* Backdrop Blur */}
            <div className="space-y-2 pt-2 border-t border-[#1f242e]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-medium">
                  Backdrop Blur Diffusion
                </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {backdropBlur}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={backdropBlur}
                onChange={(e) => setBackdropBlur(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#20242e] rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <p className="text-[10px] text-gray-500">
                Diffuses GIF pixels for an ambient glowing background light.
              </p>
            </div>

            {/* Plexus Hardware Composition Note */}
            <div className="p-3 rounded-lg bg-[#161a22] border border-[#252b3a] text-[11px] text-gray-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Desktop Hardware Composition</span>
              </div>
              <p>
                A GIF or backdrop image plays only while PlexusX is open in front. It suspends while a game runs to guarantee zero FPS impact.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Global In-Game Hotkeys */}
        <div className="bg-[#12151b]/80 border border-[#1f242e] rounded-xl p-5 space-y-5 shadow-sm backdrop-blur-md h-fit">
          <div className="flex items-center space-x-2 border-b border-[#1f242e] pb-3">
            <Keyboard className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              Global In-Game Hotkeys
            </h2>
          </div>

          <div className="space-y-3">
            {hotkeys.map((h) => (
              <div
                key={h.action}
                className="p-3.5 rounded-xl bg-[#161a22] border border-[#242938] flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block">
                    {h.action}
                  </span>
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    {h.desc}
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-400 font-bold bg-[#0d0f14] px-3 py-1.5 rounded-lg border border-gray-700/60 shadow-inner flex-shrink-0 ml-3">
                  {h.shortcut}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-[#151821] border border-[#222736] text-[11px] text-gray-400">
            Hotkeys operate system-wide with zero input delay, even while playing exclusive fullscreen or borderless games.
          </div>
        </div>
      </div>
    </div>
  );
};
