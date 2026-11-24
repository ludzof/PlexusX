import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, TabType } from './components/Sidebar';
import { DarkBoostPage } from './pages/DarkBoostPage';
import { DisplayPage } from './pages/DisplayPage';
import { ResolutionPage } from './pages/ResolutionPage';
import { CrosshairPage } from './pages/CrosshairPage';
import { MonitorPage } from './pages/MonitorPage';
import { LibraryPage } from './pages/LibraryPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { CustomizePage } from './pages/CustomizePage';
import { MorePage } from './pages/MorePage';
import { CrosshairOverlay } from './components/CrosshairOverlay';
import {
  CustomizationProvider,
  useCustomization,
} from './context/CustomizationContext';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('display');
  const [notification, setNotification] = useState<string | null>(null);

  const {
    theme,
    guiOpacity,
    matteBlur,
    glassSheen,
    backdropUrl,
    backdropDim,
    backdropBlur,
  } = useCustomization();

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Theme root classes
  const getThemeBgClass = () => {
    switch (theme) {
      case 'glass':
        return 'bg-[#080a0f] text-gray-100';
      case 'dark':
        return 'bg-[#000000] text-gray-200';
      case 'ash':
        return 'bg-[#141518] text-gray-200';
      case 'paper':
        return 'bg-[#111215] text-gray-100';
      case 'slate':
      default:
        return 'bg-[#0c0d0f] text-gray-200';
    }
  };

  return (
    <div
      data-has-backdrop={Boolean(backdropUrl)}
      data-theme={theme}
      className={`flex flex-col h-screen w-screen overflow-hidden font-sans select-none relative ${
        backdropUrl ? 'bg-transparent text-gray-100' : getThemeBgClass()
      }`}
    >
      {/* 1. Background Wallpaper / Animated GIF Layer */}
      {backdropUrl && (
        <div
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          style={{
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: backdropBlur > 0 ? `blur(${backdropBlur}px)` : 'none',
            transform: backdropBlur > 0 ? 'scale(1.08)' : 'none',
            transition: 'filter 0.2s ease, transform 0.2s ease',
          }}
        />
      )}

      {/* 2. Backdrop Darkness Dimming Overlay */}
      {backdropUrl && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-200"
          style={{
            backgroundColor: '#000000',
            opacity: backdropDim / 100,
          }}
        />
      )}

      {/* 3. iPhoneOS Liquid Glass Specular Glare & Refraction Layer */}
      {theme === 'glass' && glassSheen && (
        <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-tr from-emerald-500/[0.03] via-transparent to-white/[0.08]" />
      )}

      {/* Frameless Title Bar */}
      <div className="relative z-10">
        <TitleBar />
      </div>

      {/* Main Body */}
      <div
        className="flex flex-1 overflow-hidden relative z-10"
        style={{
          opacity: guiOpacity < 100 ? guiOpacity / 100 : 1,
          backdropFilter: matteBlur ? 'blur(16px)' : 'none',
          transition: 'opacity 0.15s ease',
        }}
      >
        {/* Left Vertical Navigation */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Center Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {currentTab === 'darkboost' && (
            <DarkBoostPage onNotify={showNotification} />
          )}
          {currentTab === 'display' && (
            <DisplayPage onNotify={showNotification} />
          )}
          {currentTab === 'resolution' && (
            <ResolutionPage onNotify={showNotification} />
          )}
          {currentTab === 'crosshair' && (
            <CrosshairPage onNotify={showNotification} />
          )}
          {currentTab === 'monitor' && (
            <MonitorPage onNotify={showNotification} />
          )}
          {currentTab === 'library' && (
            <LibraryPage
              onNotify={showNotification}
              onNavigateToTab={setCurrentTab}
            />
          )}
          {currentTab === 'profiles' && (
            <ProfilesPage onNotify={showNotification} />
          )}
          {currentTab === 'customize' && (
            <CustomizePage onNotify={showNotification} />
          )}
          {currentTab === 'more' && <MorePage onNotify={showNotification} />}

          {/* Toast Notification */}
          {notification && (
            <div className="absolute bottom-5 right-6 z-50 bg-[#161a22]/90 border border-emerald-500/50 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-[0_4px_24px_rgba(0,240,118,0.25)] flex items-center space-x-2 animate-bounce backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{notification}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [isOverlayRoute, setIsOverlayRoute] = useState(
    window.location.hash.includes('crosshair-overlay')
  );

  useEffect(() => {
    const handleHashChange = () => {
      setIsOverlayRoute(window.location.hash.includes('crosshair-overlay'));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // If this window is the transparent crosshair overlay
  if (isOverlayRoute) {
    return <CrosshairOverlay />;
  }

  return (
    <CustomizationProvider>
      <AppContent />
    </CustomizationProvider>
  );
};

export default App;
