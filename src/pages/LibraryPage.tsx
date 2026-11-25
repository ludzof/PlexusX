import React, { useState } from 'react';
import {
  Search,
  Upload,
  Check,
  CheckCircle2,
  ChevronDown,
  Flag,
  Crosshair,
  Sliders,
  Tv,
  Layers,
} from 'lucide-react';
import {
  COMMUNITY_PRESETS,
  COMMUNITY_GAMES,
  OFFICIAL_LOOKS,
  OFFICIAL_CROSSHAIRS,
  CommunityPreset,
} from '../data/presets';

interface LibraryPageProps {
  onNotify?: (msg: string) => void;
  onNavigateToTab?: (tab: any) => void;
}

type TabCategory = 'Colour looks' | 'Crosshairs' | 'Resolutions' | 'Setups';

export const LibraryPage: React.FC<LibraryPageProps> = ({ onNotify, onNavigateToTab }) => {
  const [activeTab, setActiveTab] = useState<TabCategory>('Colour looks');
  const [selectedGame, setSelectedGame] = useState<string>('All games');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gameDropdownOpen, setGameDropdownOpen] = useState<boolean>(false);
  const [appliedPresetId, setAppliedPresetId] = useState<string>('8502062c97c8d9dea400047e'); // 'cool rust coloring' as seen in user's screenshot
  const [reportedIds, setReportedIds] = useState<Record<string, boolean>>({});

  // Filter items based on category, game, and search
  const filteredPresets = COMMUNITY_PRESETS.filter((item) => {
    // Category match
    let matchCategory = false;
    if (activeTab === 'Colour looks' && item.kind === 'look') matchCategory = true;
    else if (activeTab === 'Crosshairs' && item.kind === 'crosshair') matchCategory = true;
    else if (activeTab === 'Resolutions' && item.kind === 'display') matchCategory = true;
    else if (activeTab === 'Setups' && item.kind === 'config') matchCategory = true;

    // Game match
    const matchGame = selectedGame === 'All games' || item.game === selectedGame;

    // Search query match
    const matchSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.blurb.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchGame && matchSearch;
  });

  const handleApply = async (item: CommunityPreset) => {
    setAppliedPresetId(item.id);

    if (item.kind === 'look' && item.values) {
      const v = item.values;
      if (window.electronAPI) {
        await window.electronAPI.applyDisplaySettings({
          saturation: (v.saturation ?? 100) / 100.0,
          vibrance: (v.vibrance ?? 100) / 100.0,
          brightness: (v.brightness ?? 100) / 100.0,
          contrast: (v.contrast ?? 100) / 100.0,
          gamma: (v.gamma ?? 100) / 100.0,
          temperature: v.temperature ?? 0,
          highlights: v.highlights ?? 0,
          shadows: v.shadows ?? 0,
          blacks: v.blacks ?? 0,
          whites: v.whites ?? 0,
          shadowTint: v.shadow_tint ?? 0,
          highlightTint: v.highlight_tint ?? 0,
          formula: v.formula ?? 0,
          darken: v.darken ?? 0,
          darkenHue: v.darken_hue ?? 120,
          hueTurn: v.hue_turn ?? 0,
          hueTurnAmount: v.hue_turn_amount ?? 100,
          hueComplement: v.hue_complement ?? 0,
          colourVision: v.colour_vision ?? 0,
          eyeCareWarmth: 0,
          eyeCareDim: 0,
          previewNeutral: false,
        });
      }
      onNotify?.(`Applied colour look "${item.name}"`);
    } else if (item.kind === 'crosshair' && item.values) {
      const cv = item.values;
      if (window.electronAPI) {
        await window.electronAPI.updateCrosshair({
          enabled: true,
          type: cv.circle ? 'circle' : cv.centre_dot && !cv.arm_top ? 'dot' : 'cross',
          size: Math.round((cv.size_tenths ?? 15) / 2),
          thickness: Math.max(1, Math.round((cv.thickness_tenths ?? 10) / 10)),
          gap: Math.round((cv.gap_tenths ?? 10) / 10),
          dot: cv.centre_dot ?? false,
          opacity: (cv.opacity ?? 100) / 100.0,
          color: `rgb(${cv.red ?? 0}, ${cv.green ?? 240}, ${cv.blue ?? 118})`,
        });
      }
      onNotify?.(`Applied crosshair "${item.name}"`);
    } else if (item.kind === 'config' && item.values) {
      const cfg = item.values;
      if (cfg.look && window.electronAPI) {
        const v = cfg.look;
        await window.electronAPI.applyDisplaySettings({
          saturation: (v.saturation ?? 100) / 100.0,
          vibrance: (v.vibrance ?? 100) / 100.0,
          brightness: (v.brightness ?? 100) / 100.0,
          contrast: (v.contrast ?? 100) / 100.0,
          gamma: (v.gamma ?? 100) / 100.0,
          temperature: v.temperature ?? 0,
          highlights: v.highlights ?? 0,
          shadows: v.shadows ?? 0,
          formula: v.formula ?? 0,
          darken: v.darken ?? 0,
          darkenHue: v.darken_hue ?? 120,
          hueTurn: v.hue_turn ?? 0,
          hueTurnAmount: v.hue_turn_amount ?? 100,
          previewNeutral: false,
        });
      }
      if (cfg.crosshair && window.electronAPI) {
        const cv = cfg.crosshair;
        await window.electronAPI.updateCrosshair({
          enabled: true,
          type: cv.circle ? 'circle' : cv.centre_dot && !cv.arm_top ? 'dot' : 'cross',
          size: Math.round((cv.size_tenths ?? 15) / 2),
          thickness: Math.max(1, Math.round((cv.thickness_tenths ?? 10) / 10)),
          gap: Math.round((cv.gap_tenths ?? 10) / 10),
          dot: cv.centre_dot ?? false,
          opacity: (cv.opacity ?? 100) / 100.0,
          color: `rgb(${cv.red ?? 255}, ${cv.green ?? 0}, ${cv.blue ?? 170})`,
        });
      }
      onNotify?.(`Applied full setup "${item.name}"`);
    } else if (item.kind === 'display' && item.values) {
      if (window.electronAPI?.applyResolution) {
        await window.electronAPI.applyResolution({
          width: item.values.width ?? 1440,
          height: item.values.height ?? 1080,
          hz: item.values.hz ?? 144,
        });
      }
      onNotify?.(`Applied display resolution ${item.values?.width} × ${item.values?.height}`);
    }
  };

  const handleReport = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setReportedIds((prev) => ({ ...prev, [id]: true }));
    onNotify?.('Report submitted for review.');
  };

  const categories: TabCategory[] = ['Colour looks', 'Crosshairs', 'Resolutions', 'Setups'];
  const allGames = ['All games', ...COMMUNITY_GAMES];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 select-none bg-[#0c0d0f] text-gray-200">
      {/* 1. Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Library</h1>
          <p className="text-xs text-gray-400 mt-1">
            Looks, crosshairs, resolutions and whole setups people share.
          </p>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => onNotify?.('Upload dialogue: choose look, crosshair or setup to publish.')}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#161920] hover:bg-[#202533] text-white border border-[#272e3d] flex items-center space-x-2 transition cursor-pointer shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-gray-300" />
          <span>Upload yours</span>
        </button>
      </div>

      {/* 2. Toolbar matching Screenshot */}
      <div className="flex items-center space-x-3">
        {/* Category Pills Strip */}
        <div className="flex items-center bg-[#141820] border border-[#222733] rounded-lg p-1 space-x-1">
          {categories.map((cat) => {
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-3 py-1.5 rounded-md text-xs transition cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-[#1a202c]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab.toLowerCase()}`}
            className="w-full bg-[#13161c] border border-[#1f2530] focus:border-[#2f384d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none transition"
          />
        </div>

        {/* Game Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setGameDropdownOpen(!gameDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-[#141820] border border-[#222733] rounded-lg text-xs font-semibold text-white hover:bg-[#1c222e] transition cursor-pointer"
          >
            <span>{selectedGame}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {gameDropdownOpen && (
            <div className="absolute right-0 top-10 z-40 bg-[#161922] border border-[#273042] rounded-lg shadow-xl py-1 w-44 max-h-64 overflow-y-auto">
              {allGames.map((g) => (
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
      </div>

      {/* 3. Preset Cards Grid (Exact 3-Column Layout from Screenshot) */}
      <div className="grid grid-cols-3 gap-4 pt-1">
        {filteredPresets.map((item) => {
          const isApplied = appliedPresetId === item.id;
          const isReported = reportedIds[item.id];

          // Compute saturation and details text
          let satPercent = 100;
          let detailsText = '';

          if (item.kind === 'look' && item.values) {
            satPercent = item.values.saturation ?? 100;
            const vib = item.values.vibrance ?? 100;
            const temp = item.values.temperature ?? 0;
            const tempStr = temp > 0 ? `+${temp}` : `${temp}`;
            detailsText = `Vibrance ${vib} · Temp ${tempStr}`;
          } else if (item.kind === 'crosshair' && item.values) {
            satPercent = 100;
            detailsText = `Opacity ${item.values.opacity ?? 100}% · Size ${item.values.size_tenths ?? 15}`;
          } else if (item.kind === 'display' && item.values) {
            satPercent = 100;
            detailsText = `${item.values.width} × ${item.values.height} · ${item.values.refresh_hz}Hz`;
          } else if (item.kind === 'config' && item.values) {
            satPercent = item.values.look?.saturation ?? 100;
            detailsText = `Full Setup · ${item.game}`;
          }

          // Progress bar percentage (max scale 300%)
          const barWidthPercent = Math.min(100, Math.max(5, (satPercent / 300) * 100));

          return (
            <div
              key={item.id}
              className={`bg-[#12151b] border rounded-xl p-4 flex flex-col justify-between transition duration-150 ${
                isApplied
                  ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(0,240,118,0.06)]'
                  : 'border-[#1e232e] hover:border-[#2b3342]'
              }`}
            >
              <div>
                {/* Header: Title, Author, Applied Status, Report */}
                <div className="flex items-start justify-between">
                  <div className="pr-2 min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate">{item.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">by {item.author}</p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    {isApplied && (
                      <span className="text-[11px] text-gray-300 font-medium flex items-center space-x-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Applied</span>
                      </span>
                    )}
                    <button
                      onClick={(e) => handleReport(e, item.id)}
                      className={`text-[11px] transition ${
                        isReported
                          ? 'text-amber-400'
                          : 'text-gray-400 hover:text-gray-200 cursor-pointer'
                      }`}
                    >
                      {isReported ? 'Reported' : 'Report'}
                    </button>
                  </div>
                </div>

                {/* Blurb / Description */}
                <p className="text-xs text-gray-400 mt-2 mb-3 line-clamp-1 h-4">
                  {item.blurb || '—'}
                </p>

                {/* Saturation Row & Progress Bar */}
                <div className="space-y-1.5 my-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Saturation</span>
                    <span className="font-bold text-white font-mono">{satPercent}%</span>
                  </div>
                  <div className="w-full h-1 bg-[#1f2430] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Specs & Action Button */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1a1f2b] mt-1">
                <span className="text-xs text-gray-400 font-medium truncate max-w-[170px]">
                  {detailsText}
                </span>

                {isApplied ? (
                  <div className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold px-2 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>In use</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleApply(item)}
                    className="px-3.5 py-1 rounded-md text-xs font-semibold bg-[#1a202c] hover:bg-[#232b3b] text-white border border-[#2b3445] transition cursor-pointer"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPresets.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-sm">No items found matching your filter.</p>
        </div>
      )}
    </div>
  );
};
