/// <reference types="vite/client" />
import type { ElectronAPI } from './types/electron';

interface Window {
  electronAPI?: ElectronAPI;
}
