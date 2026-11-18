# PlexusX Clone (Gaming Display & Overlay Utility)

A complete, high-performance desktop application inspired by **PlexusX**, engineered for competitive gaming visibility enhancements (Dark Boost, Screen Zoom, Custom Crosshairs, Stretched Resolutions, and Digital Vibrance) without injecting or modifying game files.

---

## 🌟 Key Features

### 1. 🌙 Dark Boost & Zoom (1:1 Replica)
* **Shadow Equalizer / Dark Boost**:
  - Aggressively boosts pixel luminance in shadow/dark regions (0–40% luminance range) while preserving highlights to prevent sky washout.
  - **5 Spectrum Modes**:
    1. **Night Green** (*Classic PlexusX*): Pulls out maximum detail by summing color spectrums into high-gain green.
    2. **Ice Blue**: High-frequency edge clarity.
    3. **Amber Gold**: Low eye-strain silhouette separation.
    4. **Neutral White**: Linear gamma shadow lift.
    5. **Thermal**: High saturation heat-map spectrum.
  - **Strength Slider**: Soft (20%) to Full (100%).
* **Hold to Zoom (Windows Magnifier API)**:
  - Exactly replicates the PlexusX Zoom module:
    - **Toggle switch**: Enable/disable Hold to Zoom.
    - **Zoom Key**: Configurable to `Mouse 5`, `Mouse 4`, `Hold V`, or custom keybind.
    - **Zoom Level Slider**: `1.2x` to `4.0x` (default `2.0x`).
    - **Smooth** and **Smooth Edges** toggles (*Off: sharp pixels. On: softer, a little blurry*).
    - Native zero-latency magnification using Windows' own `Magnification.dll` (`MagSetFullscreenTransform`).

### 2. 🎯 Custom Crosshair Overlay
* Borderless, transparent, topmost, click-through overlay window (`WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST`).
* Styles: Classic Cross, Dot, Circle, Chevron, Box, Dynamic T-Style.
* Controls: Size, Thickness, Center Gap, Opacity, Center Dot toggle.
* Global Hotkey: `Alt + X` to toggle instantly while gaming.

### 3. 🎨 Display Adjustments (Digital Vibrance)
* Saturation up to 350% (Digital Vibrance boost).
* Direct Gamma curve modifier (`0.60` to `2.20`).
* Brightness and Contrast controls.
* Eye Care / Blue light warmth filter for late-night sessions.

### 4. 🖥️ Instant 0ms Resolution & Stretched Aspect Ratio
* **PVP Stretched Presets**:
  - `Native 16:9` (1920x1080 @ 144Hz)
  - `Stretched 4:3 Pro` (1440x1080 @ 144Hz - +33.3% wider player hitboxes)
  - `Low 4:3 Max FPS` (1280x960 @ 144Hz)
  - `Hybrid 16:10` (1680x1050 @ 144Hz - +11.1% wider)
  - `Ultra 5:4 Max Width` (1280x1024 @ 144Hz - +42.2% wider)
* **100% Screen Visibility**: True hardware display mode switching without digital window cropping or off-screen zoom. Compass, HUD, health bars, chat, and inventory are 100% fully visible.
* **0ms NVIDIA GPU Scaler**: Pixel clock remains locked at 144Hz with zero monitor black screen flicker.
* **Multi-Monitor Safe & Isolated**:
  - Strictly targets only the primary gaming monitor (`\\.\DISPLAY1`).
  - Secondary portrait, rotated (90°/270°), or vertical displays are permanently locked and protected against coordinate shifting or orientation resets.
* **Global Hotkey & Safety Countdown**: One-key toggle (`F8`), audio feedback tones, and 12-second auto-revert protection.

### 5. 🎮 Game Library & Profiles
* Pre-configured profiles for **Rust**, **Counter-Strike 2**, **Valorant**, **Escape from Tarkov**, **Apex Legends**, and **DayZ**.

---

## 🛠️ Architecture & Tech Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
* **Desktop Runtime**: Electron 45.
* **Native Windows Engine (`PlexusEngine`)**: C# / .NET 9 console daemon using Win32 GDI:
  - `SetDeviceGammaRamp` / `GetDeviceGammaRamp` for instant hardware gamma modifications.
  - `Magnification.dll` (`MagInitialize`, `MagSetFullscreenTransform`) for hardware zoom.
  - Communicates with Electron via bi-directional JSON lines over stdio.

---

## 🚀 How to Run

### Prerequisites
- Node.js (v18+)
- .NET 9.0 SDK

### 1. Launch App
```bash
# In the project directory:
npm start
```

### 2. Run in Development Mode (Live HMR)
```bash
npm run electron:dev
```

### 3. Rebuild Native C# Engine
```bash
npm run engine:build
```
