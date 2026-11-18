export interface CrosshairSettings {
  enabled: boolean;
  name?: string;
  shape?: 'cross' | 't' | 'circle' | 'dot' | 'chevron' | 'box';
  armTop?: boolean;
  armBottom?: boolean;
  armLeft?: boolean;
  armRight?: boolean;
  centreDot?: boolean;
  showCircle?: boolean;
  diagonal?: boolean;
  chevron?: boolean;
  size: number;
  thickness: number;
  gap: number;
  dotSize?: number;
  dotOpacity?: number;
  circleRadius?: number;
  rotation?: number;
  opacity: number;
  colour?: string;
  color?: string; // fallback alias for colour
  outline?: boolean;
  outlineThickness?: number;
  outlineColour?: string;
  offsetX?: number;
  offsetY?: number;
  imagePath?: string | null;
  imageScalePercent?: number;
  dot?: boolean; // fallback alias for centreDot
  type?: string; // fallback alias for shape
}

export interface DisplayAdjustmentParams {
  gamma?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  vibrance?: number;
  temperature?: number;
  darkBoost?: number;
  blackLevel?: number;
  colorMode?: string;
  [key: string]: any;
}

export interface SystemInfo {
  displays: Array<{
    id: number;
    index: number;
    bounds: { x: number; y: number; width: number; height: number };
    scaleFactor: number;
    isPrimary: boolean;
  }>;
  version: string;
  app: string;
}

export interface MonitorItem {
  deviceName: string;
  friendlyName: string;
  isPrimary: boolean;
  width: number;
  height: number;
  hz: number;
  x: number;
  y: number;
  orientation: number;
  isVertical: boolean;
  status: string;
}

export interface ElectronAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  updateCrosshair: (settings: Partial<CrosshairSettings>) => Promise<{ success: boolean; settings: CrosshairSettings }>;
  getCrosshair: () => Promise<CrosshairSettings>;
  onCrosshairChanged: (callback: (settings: CrosshairSettings) => void) => () => void;
  applyDisplaySettings: (params: DisplayAdjustmentParams) => Promise<{ success: boolean }>;
  resetDisplaySettings: () => Promise<{ success: boolean }>;
  getSystemInfo: () => Promise<SystemInfo>;
  onZoomToggle: (callback: () => void) => () => void;
  onDarkBoostToggle?: (callback: () => void) => () => void;
  setZoomConfig: (cfg: { holdToZoom?: boolean; zoomKey?: string; zoomLevel?: number; smooth?: boolean; smoothEdges?: boolean }) => Promise<{ success: boolean }>;
  triggerZoom: (level?: number, smoothEdges?: boolean) => Promise<{ success: boolean }>;
  releaseZoom: () => Promise<{ success: boolean }>;
  onQuickVibranceToggle?: (callback: () => void) => () => void;
  onScreenshot?: (callback: () => void) => () => void;
  stretchListWindows: () => Promise<{ status: string; windows?: Array<{ hwnd: number; title: string; process: string }> }>;
  stretchFindTarget: () => Promise<{ status: string; found: boolean; hwnd?: number; title?: string; process?: string }>;
  stretchApply: (params: { hwnd?: number; multiplier?: number; alignment?: number; offsetY?: number; removeBorders?: boolean }) => Promise<any>;
  stretchReset: (params?: { hwnd?: number }) => Promise<any>;
  stretchTestNotepad: (params?: { multiplier?: number; alignment?: number; offsetY?: number }) => Promise<any>;
  stretchBeep: (freq?: number, dur?: number) => Promise<any>;
  setStretchHotkey: (keyName: string) => Promise<{ success: boolean }>;
  setAlwaysOnTop: (flag: boolean) => Promise<{ success: boolean }>;
  onStretchToggle: (callback: () => void) => () => void;
  applyResolution: (params: { width: number; height: number; hz?: number; persist?: boolean; deviceName?: string }) => Promise<{ success: boolean; width?: number; height?: number; hz?: number; message?: string }>;
  resetResolution: (params?: { deviceName?: string }) => Promise<{ success: boolean; message?: string }>;
  getDisplayModes: () => Promise<{
    current: { width: number; height: number; hz: number; isNative: boolean };
    primaryDevice?: string;
    monitors?: MonitorItem[];
    supported144Hz: Array<{ width: number; height: number; hz: number }>;
    gpu?: string;
    gpuScaling?: string;
  }>;
  setGpuScaling: (mode: string) => Promise<{ success: boolean; message?: string }>;
  playTone: (freq?: number, dur?: number) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
