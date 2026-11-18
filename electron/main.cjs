const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

let mainWindow = null;
let crosshairOverlayWindow = null;
let engineProcess = null;
let currentCrosshairSettings = {
  enabled: false,
  name: 'Open X',
  shape: 'cross',
  armTop: true,
  armBottom: false,
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
  outline: true,
  outlineThickness: 1,
  outlineColour: '#000000',
  offsetX: 0,
  offsetY: 0,
  imagePath: null,
  imageScalePercent: 100,
};

// Locate C# engine.exe or fall back to dotnet run
function getEnginePath() {
  const resourceExe = path.join(process.resourcesPath, 'engine.exe');
  if (fs.existsSync(resourceExe)) {
    return { cmd: resourceExe, args: [] };
  }
  const localExe = path.join(__dirname, 'engine.exe');
  if (fs.existsSync(localExe)) {
    return { cmd: localExe, args: [] };
  }
  const publishExe = path.join(__dirname, '..', 'engine', 'bin', 'Publish', 'win-x64', 'engine.exe');
  if (fs.existsSync(publishExe)) {
    return { cmd: publishExe, args: [] };
  }
  const releaseExe = path.join(__dirname, '..', 'engine', 'bin', 'Release', 'net9.0', 'engine.exe');
  if (fs.existsSync(releaseExe)) {
    return { cmd: releaseExe, args: [] };
  }
  const debugExe = path.join(__dirname, '..', 'engine', 'bin', 'Debug', 'net9.0', 'engine.exe');
  if (fs.existsSync(debugExe)) {
    return { cmd: debugExe, args: [] };
  }
  return { cmd: 'dotnet', args: ['run', '--project', path.join(__dirname, '..', 'engine')] };
}

function initEngine() {
  try {
    const { cmd, args } = getEnginePath();
    console.log('[Engine] Launching engine:', cmd, args.join(' '));
    engineProcess = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    engineProcess.stdout.on('data', (data) => {
      console.log('[Engine stdout]', data.toString().trim());
    });

    engineProcess.stderr.on('data', (data) => {
      console.warn('[Engine stderr]', data.toString().trim());
    });

    engineProcess.on('close', (code) => {
      console.log('[Engine exited with code]', code);
      engineProcess = null;
    });
  } catch (err) {
    console.error('[Engine error]', err);
  }
}

function sendEngineCommand(cmdObj) {
  if (engineProcess && engineProcess.stdin.writable) {
    try {
      engineProcess.stdin.write(JSON.stringify(cmdObj) + '\n');
    } catch (err) {
      console.error('[Engine send failed]', err);
    }
  } else {
    // If not running, spawn once
    const { cmd, args } = getEnginePath();
    if (cmdObj.action === 'apply') {
      const runArgs = [
        ...args,
        'apply',
        String(cmdObj.gamma ?? 1.0),
        String(cmdObj.brightness ?? 1.0),
        String(cmdObj.contrast ?? 1.0),
        String(cmdObj.darkBoost ?? 0.0),
        cmdObj.colorMode || 'green',
      ];
      spawn(cmd, runArgs);
    } else if (cmdObj.action === 'reset') {
      const runArgs = [...args, 'reset'];
      spawn(cmd, runArgs);
    }
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 950,
    minHeight: 620,
    frame: false,
    backgroundColor: '#0c0d0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message}`);
  });

  const isDev = process.argv.includes('--dev');
  const distPath = path.join(__dirname, '..', 'dist', 'index.html');

  if (isDev || !fs.existsSync(distPath)) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadFile(distPath);
    });
  } else {
    mainWindow.loadFile(distPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (crosshairOverlayWindow) crosshairOverlayWindow.close();
    sendEngineCommand({ action: 'reset' });
  });
}

function createCrosshairOverlay() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.bounds;

  crosshairOverlayWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    type: 'toolbar', // Toolwindow: NEVER appears in taskbar or Alt+Tab
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  crosshairOverlayWindow.setIgnoreMouseEvents(true, { forward: true });
  crosshairOverlayWindow.setAlwaysOnTop(true, 'screen-saver');

  crosshairOverlayWindow.webContents.on('did-finish-load', () => {
    crosshairOverlayWindow.setIgnoreMouseEvents(true, { forward: true });
    crosshairOverlayWindow.webContents.send('crosshair-settings-changed', currentCrosshairSettings);
  });

  const isDev = process.argv.includes('--dev');
  const distPath = path.join(__dirname, '..', 'dist', 'index.html');

  if (isDev || !fs.existsSync(distPath)) {
    crosshairOverlayWindow.loadURL('http://localhost:5173#/crosshair-overlay').catch(() => {
      crosshairOverlayWindow.loadFile(distPath, { hash: 'crosshair-overlay' });
    });
  } else {
    crosshairOverlayWindow.loadFile(distPath, { hash: 'crosshair-overlay' });
  }
}

app.whenReady().then(() => {
  initEngine();
  createMainWindow();
  createCrosshairOverlay();

  // Register default zoom toggle hotkey: Alt+Z
  try {
    globalShortcut.register('Alt+Z', () => {
      if (mainWindow) {
        mainWindow.webContents.send('hotkey-zoom-toggle');
      }
    });

    // Crosshair quick toggle: Alt+X
    globalShortcut.register('Alt+X', () => {
      currentCrosshairSettings.enabled = !currentCrosshairSettings.enabled;
      if (crosshairOverlayWindow) {
        if (currentCrosshairSettings.enabled) {
          crosshairOverlayWindow.showInactive();
          crosshairOverlayWindow.setIgnoreMouseEvents(true, { forward: true });
        } else {
          crosshairOverlayWindow.hide();
        }
        crosshairOverlayWindow.webContents.send('crosshair-settings-changed', currentCrosshairSettings);
      }
      if (mainWindow) {
        mainWindow.webContents.send('crosshair-settings-changed', currentCrosshairSettings);
      }
    });

    // Dark Boost quick toggle: Alt+D
    globalShortcut.register('Alt+D', () => {
      if (mainWindow) {
        mainWindow.webContents.send('hotkey-darkboost-toggle');
      }
    });

    // Quick vibrance popup toggle: Ctrl+Alt+V
    globalShortcut.register('CommandOrControl+Alt+V', () => {
      if (mainWindow) {
        mainWindow.webContents.send('hotkey-quick-vibrance');
      }
    });

    // Screenshot with colours: Ctrl+Alt+S
    globalShortcut.register('CommandOrControl+Alt+S', () => {
      if (mainWindow) {
        mainWindow.webContents.send('hotkey-screenshot');
      }
    });

    // Stretch Resolution Hotkey: F8
    registerStretchHotkey('F8');
  } catch (err) {
    console.error('Failed to register shortcuts:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  sendEngineCommand({ action: 'reset' });
  if (engineProcess) {
    try {
      engineProcess.kill();
    } catch { }
  }
});

// IPC Handlers
ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow?.close();
});

// Crosshair controls
ipcMain.handle('update-crosshair', (event, settings) => {
  currentCrosshairSettings = { ...currentCrosshairSettings, ...settings };
  if (!crosshairOverlayWindow) {
    createCrosshairOverlay();
  }
  if (currentCrosshairSettings.enabled) {
    crosshairOverlayWindow?.showInactive();
    crosshairOverlayWindow?.setIgnoreMouseEvents(true, { forward: true });
  } else {
    crosshairOverlayWindow?.hide();
  }
  crosshairOverlayWindow?.webContents.send('crosshair-settings-changed', currentCrosshairSettings);
  return { success: true, settings: currentCrosshairSettings };
});

ipcMain.handle('get-crosshair', () => {
  return currentCrosshairSettings;
});

// Display / Gamma / Dark Boost controls
ipcMain.handle('apply-display-settings', (event, params) => {
  sendEngineCommand({
    action: 'apply',
    saturation: params.saturation ?? 1.0,
    vibrance: params.vibrance ?? 1.0,
    brightness: params.brightness ?? 1.0,
    contrast: params.contrast ?? 1.0,
    gamma: params.gamma ?? 1.0,
    temperature: params.temperature ?? 0.0,
    highlights: params.highlights ?? 0,
    shadows: params.shadows ?? 0,
    blacks: params.blacks ?? 0,
    whites: params.whites ?? 0,
    shadowTint: params.shadowTint ?? 0,
    highlightTint: params.highlightTint ?? 0,
    formula: params.formula ?? 0,
    darken: params.darken ?? 0,
    darkenHue: params.darkenHue ?? 120,
    hueTurn: params.hueTurn ?? 0,
    hueTurnAmount: params.hueTurnAmount ?? 100,
    hueComplement: params.hueComplement ?? 0,
    colourVision: params.colourVision ?? 0,
    eyeCareWarmth: params.eyeCareWarmth ?? 0,
    eyeCareDim: params.eyeCareDim ?? 0,
    previewNeutral: params.previewNeutral ?? false,
    darkBoost: params.darkBoost ?? 0.0,
    blackLevel: params.blackLevel ?? 0,
    colorMode: params.colorMode ?? 'green',
  });
  return { success: true };
});

ipcMain.handle('reset-display-settings', () => {
  sendEngineCommand({ action: 'reset' });
  return { success: true };
});

// Display info
ipcMain.handle('get-system-info', () => {
  const displays = screen.getAllDisplays().map((d, index) => ({
    id: d.id,
    index: index + 1,
    bounds: d.bounds,
    workArea: d.workArea,
    scaleFactor: d.scaleFactor,
    isPrimary: d.id === screen.getPrimaryDisplay().id,
  }));

  return {
    displays,
    version: '2.1.17',
    app: 'PlexusX',
  };
});

// Windows Magnification Zoom controls
ipcMain.handle('set-zoom-config', (event, cfg) => {
  sendEngineCommand({
    action: 'set-zoom-config',
    holdToZoom: cfg.holdToZoom ?? false,
    zoomKey: cfg.zoomKey ?? 'Mouse 5',
    zoomLevel: cfg.zoomLevel ?? 2.0,
    smooth: cfg.smooth ?? false,
    smoothEdges: cfg.smoothEdges ?? false,
  });
  return { success: true };
});

ipcMain.handle('trigger-zoom', (event, level, smoothEdges) => {
  sendEngineCommand({
    action: 'trigger-zoom',
    zoomLevel: level ?? 2.0,
    smoothEdges: smoothEdges ?? false,
  });
  return { success: true };
});

ipcMain.handle('release-zoom', () => {
  sendEngineCommand({
    action: 'release-zoom',
  });
  return { success: true };
});

// --- Stretch Resolution / Aspect Ratio Tool IPC ---
let currentStretchHotkey = 'F8';

function runStretchBridge(args) {
  return new Promise((resolve) => {
    const resourceBridge = path.join(process.resourcesPath, 'stretch_bridge.exe');
    const localBridge = path.join(__dirname, 'stretch_bridge.exe');
    const bridgeExe = fs.existsSync(resourceBridge) ? resourceBridge : localBridge;
    let child;
    if (fs.existsSync(bridgeExe)) {
      child = spawn(bridgeExe, args);
    } else {
      const bridgePath = path.join(__dirname, 'stretch_bridge.py');
      child = spawn('python', [bridgePath, ...args]);
    }
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('close', (code) => {
      try {
        const json = JSON.parse(out.trim());
        resolve(json);
      } catch {
        resolve({ status: code === 0 ? 'ok' : 'error', raw: out, error: err });
      }
    });
  });
}

function registerStretchHotkey(keyName) {
  try {
    if (currentStretchHotkey) {
      try { globalShortcut.unregister(currentStretchHotkey); } catch { }
    }
    currentStretchHotkey = keyName || 'F8';
    globalShortcut.register(currentStretchHotkey, () => {
      if (mainWindow) {
        mainWindow.webContents.send('hotkey-stretch-toggle');
      }
    });
  } catch (err) {
    console.error('Failed to register stretch hotkey:', err);
  }
}

ipcMain.handle('stretch-list-windows', async () => {
  return await runStretchBridge(['list']);
});

ipcMain.handle('stretch-find-target', async () => {
  return await runStretchBridge(['find']);
});

ipcMain.handle('stretch-apply', async (event, params) => {
  const hwnd = String(params?.hwnd || 0);
  const mult = String(params?.multiplier || 1.3333);
  const align = String(params?.alignment ?? 1.0);
  const offset = String(params?.offsetY || 0);
  return await runStretchBridge(['apply', hwnd, mult, align, offset]);
});

ipcMain.handle('stretch-reset', async (event, params) => {
  const hwnd = String(params?.hwnd || 0);
  return await runStretchBridge(['reset', hwnd]);
});

ipcMain.handle('stretch-test-notepad', async (event, params) => {
  const mult = String(params?.multiplier || 1.3333);
  const align = String(params?.alignment ?? 1.0);
  const offset = String(params?.offsetY || 0);
  return await runStretchBridge(['test-notepad', mult, align, offset]);
});

ipcMain.handle('stretch-beep', async (event, params) => {
  const freq = String(params?.freq || 800);
  const dur = String(params?.dur || 120);
  return await runStretchBridge(['beep', freq, dur]);
});

ipcMain.handle('set-stretch-hotkey', (event, keyName) => {
  registerStretchHotkey(keyName);
  return { success: true };
});

ipcMain.handle('set-always-on-top', (event, flag) => {
  mainWindow?.setAlwaysOnTop(!!flag);
  return { success: true };
});

// Display Resolution & GPU Scaling IPC
ipcMain.handle('apply-resolution', async (event, params) => {
  const width = params?.width || 1440;
  const height = params?.height || 1080;
  const hz = params?.hz || 144;
  const persist = !!params?.persist;
  const deviceName = params?.deviceName || '';
  
  sendEngineCommand({
    action: 'set-resolution',
    width,
    height,
    hz,
    persist,
    deviceName,
  });

  return { success: true, width, height, hz };
});

ipcMain.handle('reset-resolution', async (event, params) => {
  const deviceName = params?.deviceName || '';
  sendEngineCommand({ action: 'reset-resolution', deviceName });
  return { success: true };
});

ipcMain.handle('get-display-modes', async () => {
  const bridgeRes = await runStretchBridge(['get-res']);
  if (bridgeRes && bridgeRes.status === 'ok') {
    return bridgeRes;
  }
  return {
    current: { width: 1920, height: 1080, hz: 144, isNative: true },
    supported144Hz: [
      { width: 1920, height: 1080, hz: 144 },
      { width: 1680, height: 1050, hz: 144 },
      { width: 1440, height: 1080, hz: 144 },
      { width: 1280, height: 1024, hz: 144 },
      { width: 1280, height: 960, hz: 144 },
      { width: 1024, height: 768, hz: 144 }
    ],
    gpu: 'NVIDIA GeForce RTX 2060',
    gpuScaling: 'ToNative'
  };
});

ipcMain.handle('set-gpu-scaling', async (event, mode) => {
  sendEngineCommand({ action: 'set-gpu-scaling', scalingMode: mode || 'fullscreen' });
  return { success: true };
});

ipcMain.handle('play-tone', async (event, freq, dur) => {
  sendEngineCommand({ action: 'play-beep', beepFreq: freq || 880, beepDur: dur || 100 });
  await runStretchBridge(['beep', String(freq || 880), String(dur || 100)]);
  return { success: true };
});

