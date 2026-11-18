import React, { useState, useEffect, useRef } from 'react';
import { Copy, Plus, ChevronDown, ChevronUp, Image as ImageIcon, Info } from 'lucide-react';
import { CrosshairSettings } from '../types/electron';
import { OFFICIAL_CROSSHAIRS, CrosshairDesign } from '../data/presets';
import { CrosshairRenderer } from '../components/CrosshairRenderer';
import { CrosshairColorPicker } from '../components/CrosshairColorPicker';
import { encodeCrosshairCode, tryDecodeCrosshairCode } from '../utils/crosshairCode';

interface CrosshairPageProps {
  onNotify?: (msg: string) => void;
}

const PRIMARY_COLOUR_SWATCHES = [
  '#ffffff',
  '#00ff66',
  '#00e5ff',
  '#ffd600',
  '#ff3333',
  '#ff007f',
];

const OUTLINE_COLOUR_SWATCHES = [
  '#000000',
  '#ffffff',
  '#00ff66',
  '#00e5ff',
  '#ffd600',
  '#ff3333',
  '#ff007f',
];

type FamilyType = 'dot' | 'cross' | 'x' | 'circle' | 'funny';

export const CrosshairPage: React.FC<CrosshairPageProps> = ({ onNotify }) => {
  const [settings, setSettings] = useState<CrosshairSettings>({
    enabled: false,
    name: 'Open X',
    shape: 'cross',
    armTop: true,
    armBottom: true,
    armLeft: true,
    armRight: true,
    centreDot: false,
    showCircle: false,
    diagonal: true,
    chevron: false,
    size: 3,
    thickness: 1,
    gap: 4,
    dotSize: 2,
    dotOpacity: 100,
    circleRadius: 12,
    rotation: 45,
    opacity: 100,
    colour: '#00ff66',
    color: '#00ff66',
    outline: true,
    outlineThickness: 1,
    outlineColour: '#000000',
    offsetX: 0,
    offsetY: 0,
    imagePath: null,
    imageScalePercent: 100,
  });

  const [activeFamily, setActiveFamily] = useState<FamilyType>('x');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('open-x');
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [savedCrosshairs, setSavedCrosshairs] = useState<Array<{ name: string; settings: CrosshairSettings }>>(() => {
    try {
      const stored = localStorage.getItem('plexusx_saved_crosshairs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync from main Electron process on mount
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getCrosshair().then((saved) => {
        if (saved) {
          setSettings((prev) => ({ ...prev, ...saved }));
        }
      });

      const unsub = window.electronAPI.onCrosshairChanged((updated) => {
        if (updated) {
          setSettings((prev) => ({ ...prev, ...updated }));
        }
      });
      return unsub;
    }
  }, []);

  const updateSettings = (partial: Partial<CrosshairSettings>) => {
    const next: CrosshairSettings = {
      ...settings,
      ...partial,
      color: partial.colour || partial.color || settings.colour || settings.color || '#00ff66',
      colour: partial.colour || partial.color || settings.colour || settings.color || '#00ff66',
    };
    setSettings(next);
    if (window.electronAPI) {
      window.electronAPI.updateCrosshair(next);
    }
  };

  const handleToggleOverlay = () => {
    const nextEnabled = !settings.enabled;
    updateSettings({ enabled: nextEnabled });
    onNotify?.(nextEnabled ? 'Crosshair overlay is ON (Alt+X to toggle)' : 'Crosshair overlay is OFF');
  };

  const handleApplyPreset = (d: CrosshairDesign) => {
    setSelectedPresetId(d.id);
    const size = d.size_tenths / 10;
    const thickness = d.thickness_tenths / 10;
    const gap = d.gap_tenths / 10;
    const dotSize = d.dot_tenths ? d.dot_tenths / 10 : 2;
    const circleRadius = d.circle_tenths ? d.circle_tenths / 10 : 12;
    const centreDot = !!d.dot_tenths;
    const showCircle = !!d.circle_tenths;
    const diagonal = d.diagonal;
    const rotation = diagonal ? 45 : 0;
    const chevron = d.id === 'triangle' || d.name.toLowerCase().includes('chevron');

    const shape = showCircle && !d.arm_left
      ? 'circle'
      : (!d.arm_top && d.arm_bottom && d.arm_left && d.arm_right)
      ? 't'
      : chevron
      ? 'chevron'
      : (!d.arm_top && !d.arm_bottom && !d.arm_left && !d.arm_right && centreDot)
      ? 'dot'
      : 'cross';

    updateSettings({
      name: d.name,
      shape,
      armTop: d.arm_top,
      armBottom: d.arm_bottom,
      armLeft: d.arm_left,
      armRight: d.arm_right,
      centreDot,
      showCircle,
      diagonal,
      chevron,
      size,
      thickness,
      gap,
      dotSize,
      circleRadius,
      rotation,
      outline: d.outline,
    });
    onNotify?.(`Loaded crosshair: ${d.name}`);
  };

  const handleApplyShape = (shape: 'cross' | 't' | 'circle' | 'dot' | 'chevron') => {
    if (shape === 'cross') {
      updateSettings({
        shape: 'cross',
        armTop: true,
        armBottom: true,
        armLeft: true,
        armRight: true,
        showCircle: false,
        chevron: false,
      });
    } else if (shape === 't') {
      updateSettings({
        shape: 't',
        armTop: false,
        armBottom: true,
        armLeft: true,
        armRight: true,
        showCircle: false,
        chevron: false,
      });
    } else if (shape === 'circle') {
      updateSettings({
        shape: 'circle',
        armTop: false,
        armBottom: false,
        armLeft: false,
        armRight: false,
        showCircle: true,
        chevron: false,
      });
    } else if (shape === 'dot') {
      updateSettings({
        shape: 'dot',
        armTop: false,
        armBottom: false,
        armLeft: false,
        armRight: false,
        showCircle: false,
        centreDot: true,
        chevron: false,
      });
    } else if (shape === 'chevron') {
      updateSettings({
        shape: 'chevron',
        armTop: false,
        armBottom: false,
        armLeft: true,
        armRight: true,
        showCircle: false,
        chevron: true,
      });
    }
  };

  const handleCopyCode = () => {
    const code = encodeCrosshairCode(settings);
    navigator.clipboard.writeText(code);
    onNotify?.(`Copied code: ${code}`);
  };

  const handleApplyCode = () => {
    if (!shareCodeInput.trim()) return;
    const decoded = tryDecodeCrosshairCode(shareCodeInput.trim());
    if (decoded) {
      updateSettings(decoded);
      onNotify?.(`Applied crosshair code: ${shareCodeInput.trim()}`);
      setShareCodeInput('');
    } else {
      onNotify?.('Invalid crosshair code. Make sure it starts with PXC-');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateSettings({ imagePath: event.target.result as string });
          onNotify?.(`Loaded custom image crosshair: ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCrosshair = () => {
    if (!saveName.trim()) return;
    const updated = [...savedCrosshairs, { name: saveName.trim(), settings }];
    setSavedCrosshairs(updated);
    try {
      localStorage.setItem('plexusx_saved_crosshairs', JSON.stringify(updated));
    } catch { }
    setShowSaveModal(false);
    setSaveName('');
    onNotify?.(`Saved crosshair "${saveName.trim()}"`);
  };

  const filteredPresets = OFFICIAL_CROSSHAIRS.filter(
    (p) => p.family.toLowerCase() === activeFamily.toLowerCase()
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0d0f] text-gray-200 overflow-hidden font-sans select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#1c202a] flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Crosshair</h1>
          <p className="text-xs text-gray-400 mt-1">
            An overlay drawn on your screen, not in the game.
          </p>
        </div>

        {/* Master Overlay Toggle Switch */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-300">
            {settings.enabled ? 'On' : 'Off'}
          </span>
          <button
            onClick={handleToggleOverlay}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
              settings.enabled ? 'bg-white' : 'bg-[#252a36]'
            }`}
          >
            <div
              className={`bg-[#0c0d0f] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                settings.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Preview & Settings */}
        <div className="w-[62%] border-r border-[#1c202a] flex flex-col overflow-y-auto px-8 py-6 space-y-6">
          {/* Preview Box with Checkerboard Pattern */}
          <div className="relative w-full h-[310px] rounded-xl overflow-hidden border border-[#232734] checkerboard-pattern flex items-center justify-center shadow-inner flex-shrink-0">
            <CrosshairRenderer
              settings={settings}
              previewWidth={560}
              previewHeight={310}
              showCenterGrid={false}
            />
          </div>

          {/* Primary Sliders Below Preview */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-1">
            {/* Size */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-medium">Size</span>
                <span className="text-gray-400 font-mono">{settings.size} px</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={settings.size}
                onChange={(e) => updateSettings({ size: Number(e.target.value) })}
                className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Thickness */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-medium">Thickness</span>
                <span className="text-gray-400 font-mono">{settings.thickness} px</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={settings.thickness}
                onChange={(e) => updateSettings({ thickness: Number(e.target.value) })}
                className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Gap */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-medium">Gap</span>
                <span className="text-gray-400 font-mono">{settings.gap} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={settings.gap}
                onChange={(e) => updateSettings({ gap: Number(e.target.value) })}
                className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Outline thickness */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-medium">Outline thickness</span>
                <span className="text-gray-400 font-mono">{settings.outlineThickness ?? 1} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={settings.outlineThickness ?? 1}
                onChange={(e) => updateSettings({ outlineThickness: Number(e.target.value) })}
                className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Colour Swatches Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-medium text-gray-300">Colour</span>
              <div className="flex items-center space-x-2">
                {PRIMARY_COLOUR_SWATCHES.map((swatch) => {
                  const isSelected = (settings.colour || settings.color)?.toLowerCase() === swatch.toLowerCase();
                  return (
                    <button
                      key={swatch}
                      onClick={() => updateSettings({ colour: swatch, color: swatch })}
                      className={`w-6 h-6 rounded-md transition-all ${
                        isSelected
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0c0d0f] scale-105'
                          : 'border border-black/40 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch }}
                    />
                  );
                })}

                {/* Plus button for custom color */}
                <button
                  onClick={() => setMoreOptionsOpen(true)}
                  className="w-6 h-6 rounded-md border border-dashed border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Opacity Readout */}
            <span className="text-xs font-medium text-gray-400 font-mono">
              Opacity {settings.opacity ?? 100}%
            </span>
          </div>

          {/* Collapsible More Options Section */}
          <div className="flex flex-col pt-2">
            <button
              onClick={() => setMoreOptionsOpen(!moreOptionsOpen)}
              className="flex items-center justify-center space-x-1.5 text-xs text-gray-400 hover:text-gray-200 py-1 transition-colors self-center"
            >
              <span>More options</span>
              {moreOptionsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {moreOptionsOpen && (
              <div className="flex flex-col space-y-6 pt-4 border-t border-[#1c202a] mt-3 animate-fadeIn">
                {/* Opacity Slider */}
                <div className="flex flex-col space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-300 font-medium">Opacity</span>
                    <span className="text-gray-400 font-mono">{settings.opacity ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={settings.opacity ?? 100}
                    onChange={(e) => updateSettings({ opacity: Number(e.target.value) })}
                    className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Shape Pills */}
                <div className="flex flex-col space-y-2">
                  <span className="text-xs font-medium text-gray-400">Shape</span>
                  <div className="flex items-center space-x-2">
                    {[
                      { id: 'cross', label: 'Cross' },
                      { id: 't', label: 'T' },
                      { id: 'circle', label: 'Circle' },
                      { id: 'dot', label: 'Dot only' },
                      { id: 'chevron', label: 'Chevron' },
                    ].map((shapeItem) => {
                      const isActive =
                        shapeItem.id === 'cross'
                          ? settings.armTop && settings.armBottom && settings.armLeft && settings.armRight && !settings.chevron
                          : shapeItem.id === 't'
                          ? !settings.armTop && settings.armBottom && settings.armLeft && settings.armRight && !settings.chevron
                          : shapeItem.id === 'circle'
                          ? settings.showCircle && !settings.armLeft
                          : shapeItem.id === 'dot'
                          ? !settings.armTop && !settings.armBottom && !settings.armLeft && !settings.armRight && settings.centreDot
                          : shapeItem.id === 'chevron'
                          ? settings.chevron
                          : false;

                      return (
                        <button
                          key={shapeItem.id}
                          onClick={() => handleApplyShape(shapeItem.id as any)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            isActive
                              ? 'bg-white text-black border-white'
                              : 'bg-[#12151c] text-gray-300 border-[#232733] hover:border-gray-500'
                          }`}
                        >
                          {shapeItem.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Parts Toggle Pills */}
                <div className="flex flex-col space-y-2">
                  <span className="text-xs font-medium text-gray-400">Parts</span>
                  <div className="flex items-center space-x-2">
                    {[
                      { key: 'armTop', label: 'Up', active: settings.armTop },
                      { key: 'armBottom', label: 'Down', active: settings.armBottom },
                      { key: 'armLeft', label: 'Left', active: settings.armLeft },
                      { key: 'armRight', label: 'Right', active: settings.armRight },
                      { key: 'centreDot', label: 'Dot', active: settings.centreDot },
                      { key: 'showCircle', label: 'Ring', active: settings.showCircle },
                    ].map((part) => (
                      <button
                        key={part.key}
                        onClick={() => updateSettings({ [part.key]: !part.active })}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          part.active
                            ? 'bg-white text-black border-white'
                            : 'bg-[#12151c] text-gray-300 border-[#232733] hover:border-gray-500'
                        }`}
                      >
                        {part.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secondary Sliders: Rotation & Dot Size */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {/* Rotation */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-medium">Rotation</span>
                      <span className="text-gray-400 font-mono">{settings.rotation ?? 0}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      step={1}
                      value={settings.rotation ?? 0}
                      onChange={(e) => updateSettings({ rotation: Number(e.target.value) })}
                      className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Dot Size */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-medium">Dot size</span>
                      <span className="text-gray-400 font-mono">{settings.dotSize ?? 2} px</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={settings.dotSize ?? 2}
                      onChange={(e) => updateSettings({ dotSize: Number(e.target.value) })}
                      className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Dot Opacity */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-medium">Dot opacity</span>
                      <span className="text-gray-400 font-mono">{settings.dotOpacity ?? 100}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={1}
                      value={settings.dotOpacity ?? 100}
                      onChange={(e) => updateSettings({ dotOpacity: Number(e.target.value) })}
                      className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Ring Size */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-medium">Ring size</span>
                      <span className="text-gray-400 font-mono">{settings.circleRadius ?? 12} px</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={40}
                      step={1}
                      value={settings.circleRadius ?? 12}
                      onChange={(e) => updateSettings({ circleRadius: Number(e.target.value) })}
                      className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* HSV Color Picker Disc + Hex Input */}
                <CrosshairColorPicker
                  color={settings.colour || settings.color || '#00ff66'}
                  onChangeColor={(hex) => updateSettings({ colour: hex, color: hex })}
                />

                {/* Outline Toggle & Swatches */}
                <div className="flex flex-col space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-300">Outline</span>
                    <button
                      onClick={() => updateSettings({ outline: !settings.outline })}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                        settings.outline ? 'bg-white' : 'bg-[#252a36]'
                      }`}
                    >
                      <div
                        className={`bg-[#0c0d0f] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                          settings.outline ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Outline Colour Swatches */}
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-medium text-gray-400">Outline colour</span>
                    <div className="flex items-center space-x-2">
                      {OUTLINE_COLOUR_SWATCHES.map((swatch) => {
                        const isSelected = (settings.outlineColour || '#000000').toLowerCase() === swatch.toLowerCase();
                        return (
                          <button
                            key={swatch}
                            onClick={() => updateSettings({ outlineColour: swatch })}
                            className={`w-6 h-6 rounded-md transition-all ${
                              isSelected
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0c0d0f] scale-105'
                                : 'border border-[#2a303e] hover:scale-105'
                            }`}
                            style={{ backgroundColor: swatch }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Position Offsets */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-1">
                  {/* Offset X */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-medium">Offset X</span>
                      <span className="text-gray-400 font-mono">{settings.offsetX ?? 0} px</span>
                    </div>
                    <input
                      type="range"
                      min={-200}
                      max={200}
                      step={1}
                      value={settings.offsetX ?? 0}
                      onChange={(e) => updateSettings({ offsetX: Number(e.target.value) })}
                      className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Offset Y */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-medium">Offset Y</span>
                      <span className="text-gray-400 font-mono">{settings.offsetY ?? 0} px</span>
                    </div>
                    <input
                      type="range"
                      min={-200}
                      max={200}
                      step={1}
                      value={settings.offsetY ?? 0}
                      onChange={(e) => updateSettings({ offsetY: Number(e.target.value) })}
                      className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Image Crosshair Section */}
                <div className="flex flex-col space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-300 font-medium">Image size</span>
                    <span className="text-gray-400 font-mono">{settings.imageScalePercent ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={400}
                    step={5}
                    value={settings.imageScalePercent ?? 100}
                    onChange={(e) => updateSettings({ imageScalePercent: Number(e.target.value) })}
                    className="w-full accent-white h-1.5 bg-[#202531] rounded-lg appearance-none cursor-pointer"
                  />

                  <div className="flex items-center space-x-3 pt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-[#161a22] hover:bg-[#1f2430] border border-[#2a3040] rounded-lg text-xs font-medium text-gray-200 flex items-center space-x-2 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>{settings.imagePath ? 'Change image...' : 'Use an image...'}</span>
                    </button>
                    {settings.imagePath && (
                      <button
                        onClick={() => updateSettings({ imagePath: null })}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>

                {/* Status readout */}
                <div className="pt-2">
                  <span className="text-xs text-gray-400">
                    {settings.enabled ? 'Crosshair is on.' : 'Crosshair is off.'}
                  </span>
                </div>

                {/* Saved Crosshairs */}
                <div className="flex flex-col space-y-2 pt-1 border-t border-[#1c202a]">
                  <span className="text-xs font-semibold text-gray-300">Saved</span>
                  {savedCrosshairs.length === 0 ? (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>No saved crosshairs yet — tweak, then Save as...</span>
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="px-4 py-1.5 bg-[#161a22] hover:bg-[#1f2430] border border-[#2a3040] rounded-lg text-xs font-medium text-gray-200 transition-colors"
                      >
                        Save as...
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {savedCrosshairs.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-2 bg-[#141720] border border-[#232733] px-3 py-1.5 rounded-lg text-xs text-gray-300"
                          >
                            <button
                              onClick={() => {
                                updateSettings(item.settings);
                                onNotify?.(`Loaded saved crosshair: ${item.name}`);
                              }}
                              className="hover:text-white font-medium"
                            >
                              {item.name}
                            </button>
                            <button
                              onClick={() => {
                                const next = savedCrosshairs.filter((_, i) => i !== idx);
                                setSavedCrosshairs(next);
                                localStorage.setItem('plexusx_saved_crosshairs', JSON.stringify(next));
                              }}
                              className="text-gray-500 hover:text-red-400 ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="self-start px-4 py-1.5 bg-[#161a22] hover:bg-[#1f2430] border border-[#2a3040] rounded-lg text-xs font-medium text-gray-200 transition-colors"
                      >
                        Save as...
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Preset Families & Share Code */}
        <div className="w-[38%] flex flex-col justify-between px-6 py-6 overflow-y-auto space-y-6">
          <div className="flex flex-col space-y-5">
            {/* Category Tabs: Dot | Cross | X | Circle | Funny */}
            <div className="flex items-center bg-[#101217] p-1 rounded-lg border border-[#1e222d] space-x-1">
              {[
                { id: 'dot', label: 'Dot' },
                { id: 'cross', label: 'Cross' },
                { id: 'x', label: 'X' },
                { id: 'circle', label: 'Circle' },
                { id: 'funny', label: 'Funny' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFamily(tab.id as FamilyType)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeFamily === tab.id
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Presets Grid: 6 tiles (4 in first row, 2 in second row) */}
            <div className="grid grid-cols-4 gap-2.5">
              {filteredPresets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                const miniSettings: CrosshairSettings = {
                  enabled: true,
                  size: preset.size_tenths / 10,
                  thickness: preset.thickness_tenths / 10,
                  gap: preset.gap_tenths / 10,
                  dotSize: preset.dot_tenths ? preset.dot_tenths / 10 : 2,
                  circleRadius: preset.circle_tenths ? preset.circle_tenths / 10 : 12,
                  armTop: preset.arm_top,
                  armBottom: preset.arm_bottom,
                  armLeft: preset.arm_left,
                  armRight: preset.arm_right,
                  centreDot: !!preset.dot_tenths,
                  showCircle: !!preset.circle_tenths,
                  diagonal: preset.diagonal,
                  rotation: preset.diagonal ? 45 : 0,
                  chevron: preset.id === 'triangle' || preset.name.toLowerCase().includes('chevron'),
                  opacity: 100,
                  colour: '#00ff66',
                  color: '#00ff66',
                  outline: preset.outline,
                  outlineThickness: 1,
                  outlineColour: '#000000',
                  offsetX: 0,
                  offsetY: 0,
                };

                return (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all aspect-square ${
                      isSelected
                        ? 'bg-[#151922] border-2 border-white shadow-md'
                        : 'bg-[#12141a] border border-[#20242e] hover:border-gray-500'
                    }`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
                      <CrosshairRenderer
                        settings={miniSettings}
                        previewWidth={48}
                        previewHeight={48}
                        showCenterGrid={false}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-gray-300 mt-1 truncate max-w-full">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Share Code Section */}
            <div className="flex flex-col space-y-2 pt-4 border-t border-[#1c202a]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Share code</span>
                <span className="text-[11px] text-gray-500">Paste one from a friend</span>
              </div>

              {/* Code input */}
              <input
                type="text"
                value={shareCodeInput}
                onChange={(e) => setShareCodeInput(e.target.value)}
                placeholder="Paste a code, e.g. PXC-..."
                className="w-full bg-[#101217] border border-[#232733] rounded-lg px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-400"
              />

              {/* Action buttons */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-[#161a22] hover:bg-[#1f2430] border border-[#252a36] rounded-lg text-xs font-medium text-gray-200 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleApplyCode}
                  className="flex-1 py-2 bg-white hover:bg-gray-200 text-black rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="flex items-start space-x-2 text-[11px] text-gray-500 leading-normal pt-4 border-t border-[#1c202a]">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
            <span>
              CS2 hides overlays unless you add <code className="text-gray-300 font-mono">-allow_third_party_software</code> to its launch options.
            </span>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#12151d] border border-[#232733] rounded-xl p-5 w-80 shadow-2xl flex flex-col space-y-4">
            <h3 className="text-sm font-semibold text-white">Save crosshair preset</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. My Competitive Crosshair"
              autoFocus
              className="w-full bg-[#0c0d12] border border-[#232733] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveName('');
                }}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCrosshair}
                className="px-4 py-1.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-gray-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
