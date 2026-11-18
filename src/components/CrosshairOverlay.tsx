import React, { useEffect, useState } from 'react';
import { CrosshairSettings } from '../types/electron';
import { CrosshairRenderer } from './CrosshairRenderer';

export const CrosshairOverlay: React.FC = () => {
  const [settings, setSettings] = useState<CrosshairSettings>({
    enabled: true,
    shape: 'cross',
    armTop: true,
    armBottom: true,
    armLeft: true,
    armRight: true,
    centreDot: false,
    showCircle: false,
    diagonal: false,
    chevron: false,
    size: 8,
    thickness: 2,
    gap: 4,
    dotSize: 2,
    dotOpacity: 100,
    circleRadius: 12,
    rotation: 0,
    opacity: 100,
    colour: '#00ff66',
    color: '#00ff66',
    outline: true,
    outlineThickness: 1,
    outlineColour: '#000000',
    offsetX: 0,
    offsetY: 0,
  });

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth || 1920,
    height: window.innerHeight || 1080,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Listen for crosshair updates from Electron main process
    if (window.electronAPI) {
      const unsub = window.electronAPI.onCrosshairChanged((newSettings) => {
        if (newSettings) setSettings(newSettings);
      });
      window.electronAPI.getCrosshair().then((s) => {
        if (s) setSettings(s);
      });
      return unsub;
    }
  }, []);

  if (!settings.enabled) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none bg-transparent overflow-hidden flex items-center justify-center"
      style={{
        backgroundColor: 'transparent',
        margin: 0,
        padding: 0,
      }}
    >
      <CrosshairRenderer
        settings={settings}
        previewWidth={dimensions.width}
        previewHeight={dimensions.height}
        showCenterGrid={false}
      />
    </div>
  );
};
