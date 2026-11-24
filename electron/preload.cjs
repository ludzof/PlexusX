const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),

  // Crosshair
  updateCrosshair: (settings) => ipcRenderer.invoke('update-crosshair', settings),
  getCrosshair: () => ipcRenderer.invoke('get-crosshair'),
  onCrosshairChanged: (callback) => {
    const handler = (event, val) => callback(val);
    ipcRenderer.on('crosshair-settings-changed', handler);
    return () => ipcRenderer.removeListener('crosshair-settings-changed', handler);
  },

  // Display / Dark Boost
  applyDisplaySettings: (params) => ipcRenderer.invoke('apply-display-settings', params),
  resetDisplaySettings: () => ipcRenderer.invoke('reset-display-settings'),
  identifyScreens: () => ipcRenderer.invoke('identify-screens'),
  getMonitorsList: () => ipcRenderer.invoke('get-monitors-list'),

  // System
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // Windows Magnifier Zoom
  setZoomConfig: (cfg) => ipcRenderer.invoke('set-zoom-config', cfg),
  triggerZoom: (level, smoothEdges) => ipcRenderer.invoke('trigger-zoom', level, smoothEdges),
  releaseZoom: () => ipcRenderer.invoke('release-zoom'),

  // Hotkey events
  onZoomToggle: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('hotkey-zoom-toggle', handler);
    return () => ipcRenderer.removeListener('hotkey-zoom-toggle', handler);
  },
  onDarkBoostToggle: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('hotkey-darkboost-toggle', handler);
    return () => ipcRenderer.removeListener('hotkey-darkboost-toggle', handler);
  },
  onQuickVibranceToggle: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('hotkey-quick-vibrance', handler);
    return () => ipcRenderer.removeListener('hotkey-quick-vibrance', handler);
  },
  onScreenshot: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('hotkey-screenshot', handler);
    return () => ipcRenderer.removeListener('hotkey-screenshot', handler);
  },

  // Stretch Resolution (Aspect Ratio Tool)
  stretchListWindows: () => ipcRenderer.invoke('stretch-list-windows'),
  stretchFindTarget: () => ipcRenderer.invoke('stretch-find-target'),
  stretchApply: (params) => ipcRenderer.invoke('stretch-apply', params),
  stretchReset: (params) => ipcRenderer.invoke('stretch-reset', params),
  stretchTestNotepad: (params) => ipcRenderer.invoke('stretch-test-notepad', params),
  stretchBeep: (freq, dur) => ipcRenderer.invoke('stretch-beep', { freq, dur }),
  setStretchHotkey: (keyName) => ipcRenderer.invoke('set-stretch-hotkey', keyName),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('set-always-on-top', flag),
  onStretchToggle: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('hotkey-stretch-toggle', handler);
    return () => ipcRenderer.removeListener('hotkey-stretch-toggle', handler);
  },

  // Display Resolution & GPU Scaling
  applyResolution: (params) => ipcRenderer.invoke('apply-resolution', params),
  resetResolution: () => ipcRenderer.invoke('reset-resolution'),
  getDisplayModes: () => ipcRenderer.invoke('get-display-modes'),
  setGpuScaling: (mode) => ipcRenderer.invoke('set-gpu-scaling', mode),
  playTone: (freq, dur) => ipcRenderer.invoke('play-tone', freq, dur),
});
