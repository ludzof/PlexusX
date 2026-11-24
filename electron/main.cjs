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
      const str = data.toString().trim();
      if (!str.includes('"action":"apply"')) {
        console.log('[Engine stdout]', str);
      }
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
    // Keep user's chosen display colors active on desktop even when app window is closed
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
let identifyWindows = [];

ipcMain.handle('identify-screens', () => {
  identifyWindows.forEach((w) => {
    try {
      if (!w.isDestroyed()) w.close();
    } catch {}
  });
  identifyWindows = [];

  const displays = screen.getAllDisplays();
  const primaryId = screen.getPrimaryDisplay().id;

  // Primary screen is 1, secondary is 2
  displays.sort((a, b) => (b.id === primaryId ? 1 : 0) - (a.id === primaryId ? 1 : 0));

  displays.forEach((disp, idx) => {
    const isPrimary = disp.id === primaryId;
    const num = idx + 1;
    const friendlyName = isPrimary ? '24G2W1G4' : '22B1W';
    const winW = 180;
    const winH = 140;
    const posX = Math.round(disp.bounds.x + (disp.bounds.width - winW) / 2);
    const posY = Math.round(disp.bounds.y + (disp.bounds.height - winH) / 2);

    const win = new BrowserWindow({
      width: winW,
      height: winH,
      x: posX,
      y: posY,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      focusable: false,
      hasShadow: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    win.setAlwaysOnTop(true, 'screen-saver');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 100vw; height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: transparent; overflow: hidden; user-select: none;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .card {
      width: 150px; height: 120px;
      background: rgba(18, 21, 27, 0.95);
      border: 3px solid #00f076;
      border-radius: 20px;
      box-shadow: 0 0 40px rgba(0, 240, 118, 0.45), 0 10px 40px rgba(0, 0, 0, 0.85);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      backdrop-filter: blur(12px);
    }
    .num {
      font-size: 60px; font-weight: 900; color: #ffffff;
      line-height: 1; letter-spacing: -2px;
      text-shadow: 0 0 20px rgba(0, 240, 118, 0.5);
    }
    .title {
      font-size: 11px; font-weight: 700; color: #00f076;
      margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="card" onclick="window.close()">
    <div class="num">${num}</div>
    <div class="title">${friendlyName}${isPrimary ? ' • MAIN' : ''}</div>
  </div>
</body>
</html>`;

    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    win.once('ready-to-show', () => {
      win.showInactive();
    });
    identifyWindows.push(win);
  });

  setTimeout(() => {
    identifyWindows.forEach((w) => {
      try {
        if (!w.isDestroyed()) w.close();
      } catch {}
    });
    identifyWindows = [];
  }, 2500);

  return { success: true };
});

ipcMain.handle('get-monitors-list', () => {
  const displays = screen.getAllDisplays();
  const primaryId = screen.getPrimaryDisplay().id;
  displays.sort((a, b) => (b.id === primaryId ? 1 : 0) - (a.id === primaryId ? 1 : 0));

  return displays.map((d, index) => {
    const isPrimary = d.id === primaryId;
    return {
      id: index + 1,
      name: isPrimary ? '24G2W1G4' : '22B1W',
      friendlyName: isPrimary ? '24G2W1G4' : '22B1W',
      deviceName: isPrimary ? '\\\\.\\DISPLAY1' : '\\\\.\\DISPLAY2',
      res: `${d.bounds.width} × ${d.bounds.height}`,
      width: d.bounds.width,
      height: d.bounds.height,
      hz: isPrimary ? 144 : 60,
      main: isPrimary,
      isPrimary: isPrimary,
      bounds: d.bounds,
      ticked: isPrimary,
    };
  });
});

ipcMain.handle('apply-display-settings', (event, params) => {
  sendEngineCommand({
    action: 'apply',
    targetMonitors: params.targetMonitors || [],
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

