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

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('display');
  const [notification, setNotification] = useState<string | null>(null);
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

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // If this window is the transparent crosshair overlay
  if (isOverlayRoute) {
    return <CrosshairOverlay />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0c0d0f] text-gray-200 overflow-hidden font-sans select-none">
      {/* Frameless Title Bar */}
      <TitleBar />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Vertical Navigation */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Center Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {currentTab === 'darkboost' && <DarkBoostPage onNotify={showNotification} />}
          {currentTab === 'display' && <DisplayPage onNotify={showNotification} />}
          {currentTab === 'resolution' && <ResolutionPage onNotify={showNotification} />}
          {currentTab === 'crosshair' && <CrosshairPage onNotify={showNotification} />}
          {currentTab === 'monitor' && <MonitorPage onNotify={showNotification} />}
          {currentTab === 'library' && (
            <LibraryPage onNotify={showNotification} onNavigateToTab={setCurrentTab} />
          )}
          {currentTab === 'profiles' && <ProfilesPage onNotify={showNotification} />}
          {currentTab === 'customize' && <CustomizePage onNotify={showNotification} />}
          {currentTab === 'more' && <MorePage onNotify={showNotification} />}

          {/* Toast Notification */}
          {notification && (
            <div className="absolute bottom-5 right-6 z-50 bg-[#161a22] border border-emerald-500/40 text-white text-xs font-medium py-2.5 px-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center space-x-2 animate-bounce">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{notification}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
