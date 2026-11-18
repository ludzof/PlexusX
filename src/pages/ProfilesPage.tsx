import React, { useState } from 'react';
import { Gamepad2, Plus, Trash2, Check, Star, Settings } from 'lucide-react';

interface ProfilesPageProps {
  onNotify?: (msg: string) => void;
}

export const ProfilesPage: React.FC<ProfilesPageProps> = ({ onNotify }) => {
  const [profiles, setProfiles] = useState([
    {
      id: 'p1',
      name: 'Rust Night Raid',
      desc: 'Max shadow lift (Green NVG 85%), 4:3 stretched, Custom Crosshair Dot',
      isDefault: true,
      active: true,
    },
    {
      id: 'p2',
      name: 'CS2 Competitive Pro',
      desc: 'Digital Vibrance 220%, Gamma 1.15, Cyan Crosshair, 1280x960 240Hz',
      isDefault: false,
      active: false,
    },
    {
      id: 'p3',
      name: 'Late Night Eye Care',
      desc: 'Warmth 60%, Dimness 20%, Low Blue Light, Standard Gamma',
      isDefault: false,
      active: false,
    },
  ]);

  const handleActivate = (id: string, name: string) => {
    setProfiles((prev) =>
      prev.map((p) => ({ ...p, active: p.id === id }))
    );
    onNotify?.(`Activated profile: ${name}`);
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 select-none bg-[#0c0d0f] text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Profiles & Presets</h1>
          <p className="text-sm text-gray-400 mt-1">
            Save and quickly switch between customized display, dark boost, and crosshair setups.
          </p>
        </div>

        <button
          onClick={() => onNotify?.('Created new preset from current settings.')}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 flex items-center space-x-1.5 transition font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>Save Current Settings as Profile</span>
        </button>
      </div>

      {/* Profiles List */}
      <div className="space-y-3">
        {profiles.map((p) => (
          <div
            key={p.id}
            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
              p.active
                ? 'bg-[#151c17] border-emerald-500/50 shadow-[0_0_15px_rgba(0,240,118,0.1)]'
                : 'bg-[#13151a] border-[#1f232c] hover:border-gray-600'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">{p.name}</h3>
                {p.active && (
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded">
                    ACTIVE
                  </span>
                )}
                {p.isDefault && (
                  <span className="text-[10px] text-gray-400 flex items-center space-x-1">
                    <Star className="w-3 h-3 text-amber-400 fill-current" />
                    <span>Default</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">{p.desc}</p>
            </div>

            <div className="flex items-center space-x-2">
              {!p.active && (
                <button
                  onClick={() => handleActivate(p.id, p.name)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1e28] text-gray-300 hover:text-white border border-[#2b303d] hover:border-gray-500 transition"
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
