import React from 'react';
import {
  Contrast,
  Library,
  Tv,
  Monitor,
  Sliders,
  Crosshair,
  Gamepad2,
  Moon,
  Lock,
  Settings,
} from 'lucide-react';
import { useCustomization } from '../context/CustomizationContext';

export type TabType =
  | 'display'
  | 'library'
  | 'resolution'
  | 'monitor'
  | 'customize'
  | 'crosshair'
  | 'profiles'
  | 'darkboost'
  | 'more';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { theme } = useCustomization();

  const getSidebarBg = () => {
    switch (theme) {
      case 'glass':
        return 'bg-black/35 backdrop-blur-2xl border-r border-white/10 shadow-[inset_-1px_0_1px_rgba(255,255,255,0.06)]';
      case 'dark':
        return 'bg-black border-r border-[#1a1a20]';
      case 'ash':
        return 'bg-[#141518] border-r border-[#22242b]';
      case 'paper':
        return 'bg-[#101114] border-r border-[#20222a]';
      case 'slate':
      default:
        return 'bg-[#0c0d0f]/90 backdrop-blur-md border-r border-[#1c1f26]';
    }
  };

  const navItems = [
    { id: 'display' as TabType, label: 'Display', icon: Contrast },
    { id: 'library' as TabType, label: 'Library', icon: Library },
    { id: 'resolution' as TabType, label: 'Resolution', icon: Tv },
    { id: 'monitor' as TabType, label: 'Monitor', icon: Monitor },
    { id: 'customize' as TabType, label: 'Customize', icon: Sliders },
    { id: 'crosshair' as TabType, label: 'Crosshair', icon: Crosshair },
    { id: 'profiles' as TabType, label: 'Profiles', icon: Gamepad2 },
    {
      id: 'darkboost' as TabType,
      label: 'Dark Boost & Zoom',
      icon: Moon,
      hasLock: true,
    },
  ];

  return (
    <div
      className={`w-[92px] ${getSidebarBg()} flex flex-col justify-between items-center py-2 shrink-0 select-none transition-colors duration-200`}
    >
      {/* Top Nav Items */}
      <div className="flex flex-col items-center w-full space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative w-[82px] py-2 px-1 flex flex-col items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? theme === 'glass'
                    ? 'bg-gradient-to-r from-emerald-500/25 via-white/10 to-transparent border border-emerald-400/50 text-white shadow-[0_0_15px_rgba(0,240,118,0.25)]'
                    : 'bg-[#181a20] text-white shadow-sm ring-1 ring-white/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              }`}
            >
              {/* Active Indicator Bar on Left */}
              {isActive && (
                <div className="absolute left-1 top-2.5 bottom-2.5 w-1 bg-white rounded-full shadow-sm" />
              )}

              {/* Icon Container with Lock badge */}
              <div className="relative mb-1">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.hasLock && (
                  <div className="absolute -top-1 -right-2 bg-[#121418] p-0.5 rounded-full border border-gray-600/60">
                    <Lock className="w-2.5 h-2.5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] text-center leading-tight tracking-tight font-medium ${
                  isActive ? 'text-white font-semibold' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Nav Items matching PlexusX */}
      <div className="flex flex-col items-center w-full space-y-1 border-t border-[#1c1f26]/60 pt-2">
        <button
          onClick={() => onSelectTab('more')}
          className={`w-[82px] py-1.5 px-1 flex flex-col items-center justify-center rounded-lg transition cursor-pointer ${
            currentTab === 'more'
              ? 'bg-[#181a20] text-white'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#13151a]'
          }`}
        >
          <Settings className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-medium">More</span>
        </button>

        <span className="text-[10px] font-mono text-gray-500 pt-0.5">
          v2.1.17
        </span>
      </div>
    </div>
  );
};
