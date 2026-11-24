using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading;

namespace PlexusEngine
{
    [StructLayout(LayoutKind.Sequential)]
    public struct MAGCOLOREFFECT
    {
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 25)]
        public float[] transform;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public struct RAMP
    {
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
        public ushort[] Red;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
        public ushort[] Green;
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
        public ushort[] Blue;
    }

    public class EngineCommand
    {
        public string action { get; set; } = "";
        
        // Primary
        public double saturation { get; set; } = 1.0; // 0.0 to 3.0
        public double vibrance { get; set; } = 1.0;   // 0.0 to 3.5
        
        // Fine tune (10 Sliders)
        public double brightness { get; set; } = 1.0; // 0.5 to 1.7
        public double contrast { get; set; } = 1.0;   // 0.5 to 1.5
        public double gamma { get; set; } = 1.0;      // 0.5 to 1.5
        public double temperature { get; set; } = 0.0;// -100 to 100
        public int highlights { get; set; } = 0;      // -100 to 100
        public int shadows { get; set; } = 0;         // -100 to 100
        public int blacks { get; set; } = 0;          // -100 to 100
        public int whites { get; set; } = 0;          // -100 to 100
        public int shadowTint { get; set; } = 0;      // -100 to 100
        public int highlightTint { get; set; } = 0;   // -100 to 100

        // Colour depth & wheels
        public int formula { get; set; } = 0;         // 0..8
        public int darken { get; set; } = 0;          // 0..400
        public int darkenHue { get; set; } = 120;     // 0..360
        public int hueTurn { get; set; } = 0;         // -180..180
        public int hueTurnAmount { get; set; } = 100; // 0..100
        public int hueComplement { get; set; } = 0;   // 0..100

        // Colour vision
        public int colourVision { get; set; } = 0;    // 0: Off, 1: GreenWeak, 2: RedWeak, 3: BlueWeak, 4: HoloBlack

        // Eye care
        public int eyeCareWarmth { get; set; } = 0;   // 0..100
        public int eyeCareDim { get; set; } = 0;      // 0..80

        // Compare state
        public bool previewNeutral { get; set; } = false;

        // Dark Boost & Zoom parameters
        public double darkBoost { get; set; } = 0.0;
        public int blackLevel { get; set; } = 0;
        public string colorMode { get; set; } = "green";
        public bool holdToZoom { get; set; } = false;
        public string zoomKey { get; set; } = "Mouse 5";
        public float zoomLevel { get; set; } = 2.0f;
        public bool smooth { get; set; } = false;
        public bool smoothEdges { get; set; } = false;

        // Resolution & Display Switching
        public int width { get; set; } = 1920;
        public int height { get; set; } = 1080;
        public int hz { get; set; } = 144;
        public bool persist { get; set; } = false;
        public string deviceName { get; set; } = "";
        public string scalingMode { get; set; } = "fullscreen";
        public int beepFreq { get; set; } = 880;
        public int beepDur { get; set; } = 100;
        public List<string> targetMonitors { get; set; } = new List<string>();
    }

    class Program
    {
        // Magnification.dll APIs used by PlexusX (VibranceHud.MagOverlay & FullscreenZoom)
        [DllImport("Magnification.dll", ExactSpelling = true, SetLastError = true)]
        public static extern bool MagInitialize();

        [DllImport("Magnification.dll", ExactSpelling = true, SetLastError = true)]
        public static extern bool MagUninitialize();

        [DllImport("Magnification.dll", ExactSpelling = true, SetLastError = true)]
        public static extern bool MagSetFullscreenColorEffect(ref MAGCOLOREFFECT pEffect);

        [DllImport("Magnification.dll", ExactSpelling = true, SetLastError = true)]
        public static extern bool MagSetFullscreenTransform(float magLevel, int xOffset, int yOffset);

        [DllImport("Magnification.dll", ExactSpelling = true, SetLastError = true)]
        public static extern bool MagSetFullscreenUseBitmapSmoothing(bool useSmoothing);

        // GDI APIs for gamma ramps
        [DllImport("gdi32.dll", CharSet = CharSet.Unicode)]
        public static extern IntPtr CreateDC(string? lpszDriver, string lpszDevice, string? lpszOutput, IntPtr lpInitData);

        [DllImport("gdi32.dll")]
        public static extern bool DeleteDC(IntPtr hdc);

        [DllImport("gdi32.dll")]
        public static extern bool SetDeviceGammaRamp(IntPtr hdc, ref RAMP lpRamp);

        [DllImport("gdi32.dll")]
        public static extern bool GetDeviceGammaRamp(IntPtr hdc, ref RAMP lpRamp);

        [DllImport("user32.dll")]
        public static extern IntPtr GetDC(IntPtr hWnd);

        [DllImport("user32.dll")]
        public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

        [DllImport("user32.dll")]
        public static extern int GetSystemMetrics(int nIndex);

        // Display Resolution & Multi-Monitor APIs
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct DEVMODE
        {
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
            public string dmDeviceName;
            public short dmSpecVersion;
            public short dmDriverVersion;
            public short dmSize;
            public short dmDriverExtra;
            public int dmFields;
            public int dmPositionX;
            public int dmPositionY;
            public int dmDisplayOrientation;
            public int dmDisplayFixedOutput;
            public short dmColor;
            public short dmDuplex;
            public short dmYResolution;
            public short dmTTOption;
            public short dmCollate;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
            public string dmFormName;
            public short dmLogPixels;
            public int dmBitsPerPel;
            public int dmPelsWidth;
            public int dmPelsHeight;
            public int dmDisplayFlags;
            public int dmDisplayFrequency;
            public int dmICMMethod;
            public int dmICMIntent;
            public int dmMediaType;
            public int dmDitherType;
            public int dmReserved1;
            public int dmReserved2;
            public int dmPanningWidth;
            public int dmPanningHeight;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct DISPLAY_DEVICE
        {
            public int cb;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
            public string DeviceName;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)]
            public string DeviceString;
            public int StateFlags;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)]
            public string DeviceID;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)]
            public string DeviceKey;
        }

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern bool EnumDisplaySettings(string? deviceName, int modeNum, ref DEVMODE dm);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern int ChangeDisplaySettingsEx(string? lpszDeviceName, ref DEVMODE lpDevMode, IntPtr hwnd, int dwflags, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern int ChangeDisplaySettingsEx(string? lpszDeviceName, IntPtr lpDevMode, IntPtr hwnd, int dwflags, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        public static extern bool EnumDisplayDevices(string? lpDevice, int iDevNum, ref DISPLAY_DEVICE lpDisplayDevice, int dwFlags);

        // QueryDisplayConfig structs for EDID Monitor Friendly Names
        [StructLayout(LayoutKind.Sequential)]
        public struct LUID { public uint LowPart; public int HighPart; }

        [StructLayout(LayoutKind.Sequential)]
        public struct DISPLAYCONFIG_RATIONAL { public uint Numerator; public uint Denominator; }

        [StructLayout(LayoutKind.Sequential)]
        public struct DISPLAYCONFIG_PATH_SOURCE_INFO
        {
            public LUID adapterId;
            public uint id;
            public uint modeInfoIdx;
            public uint statusFlags;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct DISPLAYCONFIG_PATH_TARGET_INFO
        {
            public LUID adapterId;
            public uint id;
            public uint modeInfoIdx;
            public uint outputTechnology;
            public uint rotation;
            public uint scaling;
            public DISPLAYCONFIG_RATIONAL refreshRate;
            public uint scanLineOrdering;
            public bool targetAvailable;
            public uint statusFlags;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct DISPLAYCONFIG_PATH_INFO
        {
            public DISPLAYCONFIG_PATH_SOURCE_INFO sourceInfo;
            public DISPLAYCONFIG_PATH_TARGET_INFO targetInfo;
            public uint flags;
        }

        [StructLayout(LayoutKind.Explicit, Size = 64)]
        public struct DISPLAYCONFIG_MODE_INFO
        {
            [FieldOffset(0)] public uint infoType;
        }

        public struct DISPLAYCONFIG_DEVICE_INFO_HEADER
        {
            public uint type;
            public uint size;
            public LUID adapterId;
            public uint id;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct DISPLAYCONFIG_TARGET_DEVICE_NAME
        {
            public DISPLAYCONFIG_DEVICE_INFO_HEADER header;
            public uint flags;
            public uint outputTechnology;
            public ushort edidManufactureId;
            public ushort edidProductCodeId;
            public uint connectorInstance;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)]
            public string monitorFriendlyDeviceName;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)]
            public string monitorDevicePath;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct DISPLAYCONFIG_SOURCE_DEVICE_NAME
        {
            public DISPLAYCONFIG_DEVICE_INFO_HEADER header;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
            public string viewGdiDeviceName;
        }

        [DllImport("user32.dll")]
        public static extern int GetDisplayConfigBufferSizes(uint flags, out uint numPathArrayElements, out uint numModeInfoArrayElements);

        [DllImport("user32.dll")]
        public static extern int QueryDisplayConfig(uint flags, ref uint numPathArrayElements, [Out] DISPLAYCONFIG_PATH_INFO[] pathInfoArray, ref uint numModeInfoArrayElements, [Out] DISPLAYCONFIG_MODE_INFO[] modeInfoArray, IntPtr currentTopologyId);

        [DllImport("user32.dll", EntryPoint = "DisplayConfigGetDeviceInfo")]
        public static extern int GetTargetName(ref DISPLAYCONFIG_TARGET_DEVICE_NAME deviceName);

        [DllImport("user32.dll", EntryPoint = "DisplayConfigGetDeviceInfo")]
        public static extern int GetSourceName(ref DISPLAYCONFIG_SOURCE_DEVICE_NAME deviceName);

        // Low-level mouse and keyboard hooks
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string? lpModuleName);

        [DllImport("user32.dll")]
        private static extern int GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

        [DllImport("user32.dll")]
        private static extern bool TranslateMessage(ref MSG lpMsg);

        [DllImport("user32.dll")]
        private static extern IntPtr DispatchMessage(ref MSG lpMsg);

        [StructLayout(LayoutKind.Sequential)]
        private struct POINT { public int x; public int y; }

        [StructLayout(LayoutKind.Sequential)]
        private struct MSG { public IntPtr hwnd; public uint message; public IntPtr wParam; public IntPtr lParam; public uint time; public POINT pt; }

        [StructLayout(LayoutKind.Sequential)]
        private struct MSLLHOOKSTRUCT { public POINT pt; public uint mouseData; public uint flags; public uint time; public IntPtr dwExtraInfo; }

        [StructLayout(LayoutKind.Sequential)]
        private struct KBDLLHOOKSTRUCT { public uint vkCode; public uint scanCode; public uint flags; public uint time; public IntPtr dwExtraInfo; }

        private delegate IntPtr LowLevelProc(int nCode, IntPtr wParam, IntPtr lParam);

        private const int WH_KEYBOARD_LL = 13;
        private const int WH_MOUSE_LL = 14;

        private const int WM_KEYDOWN = 0x0100;
        private const int WM_KEYUP = 0x0101;
        private const int WM_SYSKEYDOWN = 0x0104;
        private const int WM_SYSKEYUP = 0x0105;

        private const int WM_XBUTTONDOWN = 0x020B;
        private const int WM_XBUTTONUP = 0x020C;
        private const int WM_RBUTTONDOWN = 0x0204;
        private const int WM_RBUTTONUP = 0x0205;
        private const int WM_MBUTTONDOWN = 0x0207;
        private const int WM_MBUTTONUP = 0x0208;

        private const int XBUTTON1 = 1; // Mouse 4
        private const int XBUTTON2 = 2; // Mouse 5

        private static bool _magInitialized = false;
        private static bool _holdToZoom = false;
        private static string _zoomKey = "Mouse 5";
        private static float _zoomLevel = 2.0f;
        private static bool _smoothEdges = false;
        private static bool _smooth = false;
        private static bool _isZooming = false;

        private static IntPtr _mouseHook = IntPtr.Zero;
        private static IntPtr _kbdHook = IntPtr.Zero;
        private static LowLevelProc? _mouseProc;
        private static LowLevelProc? _kbdProc;

        private static readonly float[] IdentityMatrix = new float[25]
        {
            1f, 0f, 0f, 0f, 0f,
            0f, 1f, 0f, 0f, 0f,
            0f, 0f, 1f, 0f, 0f,
            0f, 0f, 0f, 1f, 0f,
            0f, 0f, 0f, 0f, 1f
        };

        static void Main(string[] args)
        {
            try
            {
                _magInitialized = MagInitialize();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"{{\"status\":\"mag_init_failed\",\"error\":\"{ex.Message}\"}}");
            }

            // Start background thread for mouse and keyboard hook
            Thread hookThread = new Thread(HookMessageLoop)
            {
                IsBackground = true
            };
            hookThread.Start();

            // Interactive JSON Loop
            Console.WriteLine("{\"status\":\"ready\",\"engine\":\"PlexusEngine\",\"mag\":" + _magInitialized.ToString().ToLower() + "}");
            string? line;
            while ((line = Console.ReadLine()) != null)
            {
                line = line.Trim().Trim('\uFEFF');
                if (string.IsNullOrWhiteSpace(line)) continue;
                try
                {
                    var cmd = JsonSerializer.Deserialize<EngineCommand>(line);
                    if (cmd == null) continue;

                    if (cmd.action == "apply")
                    {
                        if (cmd.previewNeutral)
                        {
                            ApplyMatrix(IdentityMatrix);
                            ResetSafeGamma();
                            ResetNvApiVibrance();
                            Console.WriteLine("{\"status\":\"ok\",\"action\":\"apply\",\"neutral\":true}");
                        }
                        else
                        {
                            List<string> allDevs = GetAttachedDisplayDeviceNames();
                            bool noneTicked = cmd.targetMonitors != null && cmd.targetMonitors.Count == 0;
                            bool someUnticked = cmd.targetMonitors != null && cmd.targetMonitors.Count > 0 && allDevs.Count > 0 && cmd.targetMonitors.Count < allDevs.Count;

                            if (noneTicked)
                            {
                                ApplyMatrix(IdentityMatrix);
                                ResetSafeGamma();
                                ResetNvApiVibrance();
                                Console.WriteLine("{\"status\":\"ok\",\"action\":\"apply\",\"paused\":true}");
                            }
                            else if (someUnticked)
                            {
                                // Multi-monitor isolation: keep whole-desktop matrix paused at identity so unticked monitors stay normal!
                                ApplyMatrix(IdentityMatrix);
                                bool gammaOk = ApplyExactToneCurve(cmd);
                                bool nvapiOk = ApplyNvApiVibrance(cmd);
                                Console.WriteLine($"{{\"status\":\"ok\",\"action\":\"apply\",\"matrix\":false,\"gamma\":{gammaOk.ToString().ToLower()},\"nvapi\":{nvapiOk.ToString().ToLower()},\"unticked\":true}}");
                            }
                            else
                            {
                                // All monitors ticked -> Full matrix + gamma + hardware vibrance
                                var matrix = BuildExactPlexusMatrix(cmd);
                                bool matrixOk = ApplyMatrix(matrix);
                                bool gammaOk = ApplyExactToneCurve(cmd);
                                bool nvapiOk = ApplyNvApiVibrance(cmd);
                                Console.WriteLine($"{{\"status\":\"ok\",\"action\":\"apply\",\"matrix\":{matrixOk.ToString().ToLower()},\"gamma\":{gammaOk.ToString().ToLower()},\"nvapi\":{nvapiOk.ToString().ToLower()}}}");
                            }
                        }
                    }
                    else if (cmd.action == "get-monitors")
                    {
                        var monitors = GetDesktopMonitors();
                        var list = monitors.Select((m, i) => new
                        {
                            id = i + 1,
                            deviceName = m.DeviceName,
                            name = m.FriendlyName,
                            friendlyName = m.FriendlyName,
                            res = $"{m.Width} × {m.Height}",
                            width = m.Width,
                            height = m.Height,
                            hz = m.Hz,
                            main = m.IsPrimary,
                            isPrimary = m.IsPrimary,
                            bounds = new { x = m.X, y = m.Y, width = m.Width, height = m.Height }
                        }).ToList();
                        Console.WriteLine(JsonSerializer.Serialize(new { status = "ok", action = "get-monitors", monitors = list }));
                    }
                    else if (cmd.action == "reset")
                    {
                        ResetAll();
                        Console.WriteLine("{\"status\":\"ok\",\"action\":\"reset\"}");
                    }
                    else if (cmd.action == "set-zoom-config")
                    {
                        _holdToZoom = cmd.holdToZoom;
                        _zoomKey = cmd.zoomKey;
                        _zoomLevel = Math.Clamp(cmd.zoomLevel, 1.25f, 4.0f);
                        _smooth = cmd.smooth;
                        _smoothEdges = cmd.smoothEdges;
                        try { MagSetFullscreenUseBitmapSmoothing(_smoothEdges); } catch { }
                        Console.WriteLine("{\"status\":\"ok\",\"action\":\"zoom_config_set\"}");
                    }
                    else if (cmd.action == "trigger-zoom")
                    {
                        ApplyZoom(cmd.zoomLevel, cmd.smoothEdges);
                        Console.WriteLine("{\"status\":\"ok\",\"action\":\"trigger-zoom\"}");
                    }
                    else if (cmd.action == "release-zoom")
                    {
                        ResetZoom();
                        Console.WriteLine("{\"status\":\"ok\",\"action\":\"release-zoom\"}");
                    }
                    else if (cmd.action == "get-display-info")
                    {
                        var info = QueryFullDisplayInfo();
                        Console.WriteLine(JsonSerializer.Serialize(new { status = "ok", action = "get-display-info", data = info }));
                    }
                    else if (cmd.action == "set-resolution")
                    {
                        bool ok = SetDisplayResolution(cmd.width, cmd.height, cmd.hz, cmd.persist, cmd.deviceName);
                        if (ok)
                        {
                            try { Console.Beep(cmd.beepFreq > 0 ? cmd.beepFreq : 880, cmd.beepDur > 0 ? cmd.beepDur : 100); } catch { }
                        }
                        Console.WriteLine(JsonSerializer.Serialize(new { status = ok ? "ok" : "error", action = "set-resolution", width = cmd.width, height = cmd.height, hz = cmd.hz }));
                    }
                    else if (cmd.action == "reset-resolution")
                    {
                        bool ok = RestoreNativeResolution(cmd.deviceName);
                        try { Console.Beep(440, 100); } catch { }
                        Console.WriteLine(JsonSerializer.Serialize(new { status = ok ? "ok" : "error", action = "reset-resolution" }));
                    }
                    else if (cmd.action == "set-gpu-scaling")
                    {
                        bool ok = SetGpuScalingFullScreen(cmd.deviceName);
                        Console.WriteLine(JsonSerializer.Serialize(new { status = ok ? "ok" : "error", action = "set-gpu-scaling" }));
                    }
                    else if (cmd.action == "play-beep")
                    {
                        try { Console.Beep(cmd.beepFreq > 0 ? cmd.beepFreq : 880, cmd.beepDur > 0 ? cmd.beepDur : 100); } catch { }
                        Console.WriteLine(JsonSerializer.Serialize(new { status = "ok", action = "play-beep" }));
                    }
                    else if (cmd.action == "exit")
                    {
                        ResetAll();
                        break;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"{{\"status\":\"error\",\"message\":\"{ex.Message}\"}}");
                }
            }

            ResetAll();
            if (_magInitialized)
            {
                try { MagUninitialize(); } catch { }
            }
        }

        private static void HookMessageLoop()
        {
            _mouseProc = MouseHookCallback;
            _kbdProc = KbdHookCallback;

            using var curProcess = Process.GetCurrentProcess();
            using var curModule = curProcess.MainModule;
            IntPtr hMod = GetModuleHandle(curModule?.ModuleName);

            _mouseHook = SetWindowsHookEx(WH_MOUSE_LL, _mouseProc, hMod, 0);
            _kbdHook = SetWindowsHookEx(WH_KEYBOARD_LL, _kbdProc, hMod, 0);

            while (GetMessage(out MSG msg, IntPtr.Zero, 0, 0) != 0)
            {
                TranslateMessage(ref msg);
                DispatchMessage(ref msg);
            }

            if (_mouseHook != IntPtr.Zero) UnhookWindowsHookEx(_mouseHook);
            if (_kbdHook != IntPtr.Zero) UnhookWindowsHookEx(_kbdHook);
        }

        private static IntPtr MouseHookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0 && _holdToZoom)
            {
                int msg = (int)wParam;
                if (msg == WM_XBUTTONDOWN || msg == WM_XBUTTONUP)
                {
                    var hookStruct = Marshal.PtrToStructure<MSLLHOOKSTRUCT>(lParam);
                    int xButton = (int)(hookStruct.mouseData >> 16);

                    bool isTarget = false;
                    if (_zoomKey.Equals("Mouse 5", StringComparison.OrdinalIgnoreCase) && xButton == XBUTTON2)
                        isTarget = true;
                    else if (_zoomKey.Equals("Mouse 4", StringComparison.OrdinalIgnoreCase) && xButton == XBUTTON1)
                        isTarget = true;

                    if (isTarget)
                    {
                        if (msg == WM_XBUTTONDOWN)
                            ApplyZoom(_zoomLevel, _smoothEdges);
                        else if (msg == WM_XBUTTONUP)
                            ResetZoom();
                    }
                }
                else if (msg == WM_RBUTTONDOWN && _zoomKey.Equals("Right Click", StringComparison.OrdinalIgnoreCase))
                {
                    ApplyZoom(_zoomLevel, _smoothEdges);
                }
                else if (msg == WM_RBUTTONUP && _zoomKey.Equals("Right Click", StringComparison.OrdinalIgnoreCase))
                {
                    ResetZoom();
                }
                else if (msg == WM_MBUTTONDOWN && _zoomKey.Equals("Middle Click", StringComparison.OrdinalIgnoreCase))
                {
                    ApplyZoom(_zoomLevel, _smoothEdges);
                }
                else if (msg == WM_MBUTTONUP && _zoomKey.Equals("Middle Click", StringComparison.OrdinalIgnoreCase))
                {
                    ResetZoom();
                }
            }
            return CallNextHookEx(_mouseHook, nCode, wParam, lParam);
        }

        private static IntPtr KbdHookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0 && _holdToZoom)
            {
                int msg = (int)wParam;
                var kbd = Marshal.PtrToStructure<KBDLLHOOKSTRUCT>(lParam);
                uint vk = kbd.vkCode;

                bool isTargetKey = false;
                string zk = _zoomKey.ToUpperInvariant();

                if ((zk == "ALT" || zk == "LEFT ALT") && (vk == 0x12 || vk == 0xA4)) isTargetKey = true;
                else if ((zk == "CTRL" || zk == "LEFT CTRL") && (vk == 0x11 || vk == 0xA2)) isTargetKey = true;
                else if ((zk == "SHIFT" || zk == "LEFT SHIFT") && (vk == 0x10 || vk == 0xA0)) isTargetKey = true;
                else if (zk == "SPACE" && vk == 0x20) isTargetKey = true;
                else if (zk == "C" && vk == 0x43) isTargetKey = true;
                else if (zk == "V" && vk == 0x56) isTargetKey = true;
                else if (zk == "Z" && vk == 0x5A) isTargetKey = true;
                else if (zk == "X" && vk == 0x58) isTargetKey = true;

                if (isTargetKey)
                {
                    if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN)
                    {
                        if (!_isZooming) ApplyZoom(_zoomLevel, _smoothEdges);
                    }
                    else if (msg == WM_KEYUP || msg == WM_SYSKEYUP)
                    {
                        ResetZoom();
                    }
                }
            }
            return CallNextHookEx(_kbdHook, nCode, wParam, lParam);
        }

        public static void ApplyZoom(float level, bool smoothEdges)
        {
            if (!_magInitialized)
            {
                try { _magInitialized = MagInitialize(); } catch { return; }
            }
            if (level <= 1.0f)
            {
                ResetZoom();
                return;
            }

            int screenW = GetSystemMetrics(0);
            int screenH = GetSystemMetrics(1);
            if (screenW <= 0) screenW = 1920;
            if (screenH <= 0) screenH = 1080;

            int xOffset = (int)(screenW * ((1.0 - 1.0 / (double)level) / 2.0));
            int yOffset = (int)(screenH * ((1.0 - 1.0 / (double)level) / 2.0));

            try
            {
                MagSetFullscreenUseBitmapSmoothing(smoothEdges);
                MagSetFullscreenTransform(level, xOffset, yOffset);
                _isZooming = true;
            }
            catch { }
        }

        public static void ResetZoom()
        {
            try
            {
                MagSetFullscreenTransform(1.0f, 0, 0);
                _isZooming = false;
            }
            catch { }
        }

        public static void ResetAll()
        {
            ResetZoom();
            ApplyMatrix(IdentityMatrix);
            ResetSafeGamma();
            ResetNvApiVibrance();
        }

        public static bool ApplyMatrix(float[] matrix)
        {
            if (!_magInitialized)
            {
                try { _magInitialized = MagInitialize(); } catch { return false; }
            }

            MAGCOLOREFFECT effect = new MAGCOLOREFFECT
            {
                transform = matrix
            };

            try
            {
                return MagSetFullscreenColorEffect(ref effect);
            }
            catch
            {
                return false;
            }
        }

        // ==========================================
        // Exact ToneCurve Ramp Calculation
        // ==========================================
        private static string _lastAppliedToneParams = "";
        public static bool ApplyExactToneCurve(EngineCommand cmd)
        {
            string toneKey = $"{cmd.gamma:F3}_{cmd.brightness:F3}_{cmd.contrast:F3}_{cmd.temperature:F1}_{cmd.highlights}_{cmd.shadows}_{cmd.blacks}_{cmd.whites}_{cmd.shadowTint}_{cmd.highlightTint}_{string.Join(",", cmd.targetMonitors ?? new List<string>())}";
            if (toneKey == _lastAppliedToneParams)
            {
                return true; // Unchanged: avoid costly GDI ramp recomputations
            }
            _lastAppliedToneParams = toneKey;

            double resolvedGamma = cmd.gamma <= 0.0 ? 1.0 : cmd.gamma;
            double invGamma = 1.0 / resolvedGamma;
            double sShadows = Math.Clamp(cmd.shadows, -100, 100) / 100.0;
            double sHighlights = Math.Clamp(cmd.highlights, -100, 100) / 100.0;
            double sBlacks = Math.Clamp(cmd.blacks, -100, 100) / 100.0;
            double sWhites = Math.Clamp(cmd.whites, -100, 100) / 100.0;
            double sShadowTint = Math.Clamp(cmd.shadowTint, -100, 100) / 100.0;
            double sHighlightTint = Math.Clamp(cmd.highlightTint, -100, 100) / 100.0;

            // PlexusX GradeCurve defaults
            const double regionRange = 0.35;
            const int regionSharpness = 2;
            const double pointRange = 0.45;
            const int pointSharpness = 3;
            const double tintRange = 0.45;

            RAMP ramp = new RAMP
            {
                Red = new ushort[256],
                Green = new ushort[256],
                Blue = new ushort[256]
            };

            for (int i = 0; i < 256; i++)
            {
                double x = (double)i / 255.0;

                // Red (lean = 1)
                ramp.Red[i] = Quantize(ChannelVal(x, invGamma, sShadows, sHighlights, sBlacks, sWhites, sShadowTint, sHighlightTint, regionRange, regionSharpness, pointRange, pointSharpness, tintRange, 1), i);
                // Green (lean = 0)
                ramp.Green[i] = Quantize(ChannelVal(x, invGamma, sShadows, sHighlights, sBlacks, sWhites, sShadowTint, sHighlightTint, regionRange, regionSharpness, pointRange, pointSharpness, tintRange, 0), i);
                // Blue (lean = -1)
                ramp.Blue[i] = Quantize(ChannelVal(x, invGamma, sShadows, sHighlights, sBlacks, sWhites, sShadowTint, sHighlightTint, regionRange, regionSharpness, pointRange, pointSharpness, tintRange, -1), i);
            }

            // Enforce monotonic
            EnforceMonotonic(ramp.Red);
            EnforceMonotonic(ramp.Green);
            EnforceMonotonic(ramp.Blue);

            RAMP identityRamp = CreateIdentityRamp();
            List<string> allDevs = GetAttachedDisplayDeviceNames();
            if (allDevs.Count == 0)
            {
                allDevs.Add(GetPrimaryDeviceName());
            }

            bool anyOk = false;
            foreach (var dev in allDevs)
            {
                bool shouldApply = cmd.targetMonitors == null || cmd.targetMonitors.Count == 0 || cmd.targetMonitors.Contains(dev);
                IntPtr hdc = CreateDC(null, dev, null, IntPtr.Zero);
                if (hdc != IntPtr.Zero)
                {
                    try
                    {
                        EnsureOriginalGammaSaved(dev, hdc);

                        if (shouldApply)
                        {
                            if (SetDeviceGammaRamp(hdc, ref ramp)) anyOk = true;
                        }
                        else
                        {
                            // Unticked monitor keeps its own original calibrated colours!
                            if (_originalRamps.TryGetValue(dev, out var origRamp))
                            {
                                SetDeviceGammaRamp(hdc, ref origRamp);
                            }
                            else
                            {
                                SetDeviceGammaRamp(hdc, ref identityRamp);
                            }
                        }
                    }
                    finally
                    {
                        DeleteDC(hdc);
                    }
                }
            }

            bool isPartial = cmd.targetMonitors != null && cmd.targetMonitors.Count > 0 && allDevs.Count > 0 && cmd.targetMonitors.Count < allDevs.Count;
            if (!anyOk && !isPartial)
            {
                IntPtr hdcFallback = GetDC(IntPtr.Zero);
                if (hdcFallback != IntPtr.Zero)
                {
                    anyOk = SetDeviceGammaRamp(hdcFallback, ref ramp);
                    ReleaseDC(IntPtr.Zero, hdcFallback);
                }
            }

            return anyOk;
        }

        private static double WeightVal(double v, int sharpness)
        {
            return sharpness == 2 ? v * v : Math.Pow(v, sharpness);
        }

        private static double BaseCurve(double x, double invGamma, double shadows, double highlights, double blacks, double whites, double regionRange, int regionSharpness, double pointRange, int pointSharpness)
        {
            double num = Math.Pow(x, invGamma);
            double w1 = WeightVal(1.0 - num, regionSharpness);
            double w2 = WeightVal(num, regionSharpness);
            num += shadows * w1 * regionRange;
            num += highlights * w2 * regionRange;

            double w3 = WeightVal(1.0 - num, pointSharpness);
            double w4 = WeightVal(num, pointSharpness);
            num += blacks * w3 * pointRange;
            num += whites * w4 * pointRange;
            return Math.Clamp(num, 0.0, 1.0);
        }

        private static double ChannelVal(double x, double invGamma, double shadows, double highlights, double blacks, double whites, double shadowTint, double highlightTint, double regionRange, int regionSharpness, double pointRange, int pointSharpness, double tintRange, int lean)
        {
            double num = BaseCurve(x, invGamma, shadows, highlights, blacks, whites, regionRange, regionSharpness, pointRange, pointSharpness);
            if (lean == 0 || (shadowTint == 0.0 && highlightTint == 0.0))
            {
                return num;
            }
            double w1 = WeightVal(1.0 - num, regionSharpness);
            double w2 = WeightVal(num, regionSharpness);
            num += (double)lean * (shadowTint * w1 + highlightTint * w2) * tintRange;
            return Math.Clamp(num, 0.0, 1.0);
        }

        private static ushort Quantize(double v, int index)
        {
            int val = (int)Math.Clamp(Math.Round(Math.Clamp(v, 0.0, 1.0) * 65535.0), 0.0, 65535.0);
            // Conform to Windows Ramp Rule to avoid driver rejection
            int byteVal = val >> 8;
            if (byteVal - index > 120) val = (index + 120) << 8;
            if (index - byteVal > 120) val = (index - 120) << 8;
            return (ushort)val;
        }

        private static void EnforceMonotonic(ushort[] r)
        {
            for (int i = 1; i < 256; i++)
            {
                if (r[i] < r[i - 1]) r[i] = r[i - 1];
            }
        }

        private static Dictionary<string, RAMP> _originalRamps = new Dictionary<string, RAMP>(StringComparer.OrdinalIgnoreCase);

        private static void EnsureOriginalGammaSaved(string dev, IntPtr hdc)
        {
            if (!_originalRamps.ContainsKey(dev))
            {
                RAMP r = new RAMP { Red = new ushort[256], Green = new ushort[256], Blue = new ushort[256] };
                if (GetDeviceGammaRamp(hdc, ref r))
                {
                    _originalRamps[dev] = r;
                }
            }
        }

        public static bool ResetSafeGamma()
        {
            RAMP identityRamp = CreateIdentityRamp();
            List<string> allDevs = GetAttachedDisplayDeviceNames();
            if (allDevs.Count == 0) allDevs.Add(GetPrimaryDeviceName());

            bool anyOk = false;
            foreach (var dev in allDevs)
            {
                IntPtr hdc = CreateDC(null, dev, null, IntPtr.Zero);
                if (hdc != IntPtr.Zero)
                {
                    try
                    {
                        if (_originalRamps.TryGetValue(dev, out var origRamp))
                        {
                            if (SetDeviceGammaRamp(hdc, ref origRamp)) anyOk = true;
                        }
                        else
                        {
                            if (SetDeviceGammaRamp(hdc, ref identityRamp)) anyOk = true;
                        }
                    }
                    finally
                    {
                        DeleteDC(hdc);
                    }
                }
            }
            return anyOk;
        }

        private static bool _nvapiInitialized = false;
        private static List<(uint DisplayId, string GdiName)>? _cachedNvDisplays = null;
        private static readonly Dictionary<uint, int> _originalDvcMap = new Dictionary<uint, int>
        {
            { 2147881089, 87 },
            { 2147881090, 74 }
        };

        public static void EnsureNvApiInitialized()
        {
            if (_nvapiInitialized && _cachedNvDisplays != null) return;
            try
            {
                NvAPIWrapper.NVIDIA.Initialize();
                _nvapiInitialized = true;

                uint primaryId = 0;
                try
                {
                    primaryId = NvAPIWrapper.Display.DisplayDevice.GetGDIPrimaryDisplayDevice().DisplayId;
                }
                catch { }

                var configs = NvAPIWrapper.Display.PathInfo.GetDisplaysConfig();
                if (configs != null)
                {
                    var list = new List<(uint DisplayId, string GdiName)>();
                    int nonPrimaryIndex = 2;
                    foreach (var c in configs)
                    {
                        foreach (var t in c.TargetsInfo)
                        {
                            uint dId = t.DisplayDevice.DisplayId;
                            bool isPrimary = (primaryId != 0 && dId == primaryId);
                            string gdiName = isPrimary ? "\\\\.\\DISPLAY1" : $"\\\\.\\DISPLAY{nonPrimaryIndex}";
                            if (!isPrimary) nonPrimaryIndex++;
                            list.Add((dId, gdiName));

                            if (!_originalDvcMap.ContainsKey(dId))
                            {
                                try
                                {
                                    var outputId = (NvAPIWrapper.Native.GPU.OutputId)dId;
                                    var dvc = NvAPIWrapper.Native.DisplayApi.GetDVCInfoEx(outputId);
                                    _originalDvcMap[dId] = dvc.CurrentLevel > 0 ? dvc.CurrentLevel : (isPrimary ? 87 : 74);
                                }
                                catch
                                {
                                    _originalDvcMap[dId] = isPrimary ? 87 : 74;
                                }
                            }
                        }
                    }
                    _cachedNvDisplays = list;
                }
            }
            catch { }
        }

        public static void ResetNvApiVibrance()
        {
            try
            {
                EnsureNvApiInitialized();
                if (_cachedNvDisplays == null) return;
                foreach (var item in _cachedNvDisplays)
                {
                    try
                    {
                        var outputId = (NvAPIWrapper.Native.GPU.OutputId)item.DisplayId;
                        int orig = _originalDvcMap.TryGetValue(item.DisplayId, out int val) ? val : (item.GdiName.EndsWith("1") ? 87 : 74);
                        NvAPIWrapper.Native.DisplayApi.SetDVCLevelEx(outputId, orig);
                    }
                    catch { }
                }
            }
            catch { }
        }

        public static bool ApplyNvApiVibrance(EngineCommand cmd)
        {
            try
            {
                EnsureNvApiInitialized();
                if (_cachedNvDisplays == null || _cachedNvDisplays.Count == 0) return false;

                // Combine Saturation and Vibrance into hardware DVC:
                // 100% saturation (1.0) * 100% vibrance (1.0) = 1.0 -> DVC 50 (neutral normal)
                // 200% saturation (2.0) -> DVC 100 (max saturation)
                // 0% saturation (0.0) -> DVC 0 (monochrome)
                double totalSat = (cmd.saturation <= 0.0 ? 1.0 : cmd.saturation) * (cmd.vibrance <= 0.0 ? 1.0 : cmd.vibrance);
                int targetDvc = 50;
                if (totalSat >= 1.0)
                {
                    targetDvc = (int)Math.Round(50.0 + (totalSat - 1.0) * 50.0);
                }
                else
                {
                    targetDvc = (int)Math.Round(totalSat * 50.0);
                }
                targetDvc = Math.Clamp(targetDvc, 0, 100);

                bool anySet = false;
                foreach (var item in _cachedNvDisplays)
                {
                    bool shouldApply = cmd.targetMonitors == null || cmd.targetMonitors.Count == 0 || cmd.targetMonitors.Contains(item.GdiName);

                    int orig = _originalDvcMap.TryGetValue(item.DisplayId, out int val) ? val : (item.GdiName.EndsWith("1") ? 87 : 74);
                    int levelToSet = shouldApply ? targetDvc : orig;
                    try
                    {
                        var outputId = (NvAPIWrapper.Native.GPU.OutputId)item.DisplayId;
                        NvAPIWrapper.Native.DisplayApi.SetDVCLevelEx(outputId, levelToSet);
                        anySet = true;
                    }
                    catch { }
                }
                return anySet;
            }
            catch
            {
                return false;
            }
        }

        // ==========================================
        // Exact Matrix Calculation (ColorAdjust + SaturationMetrics + ColourVision)
        // ==========================================
        public static float[] BuildExactPlexusMatrix(EngineCommand cmd)
        {
            float saturation = (float)Math.Clamp(cmd.saturation, 0.0, 3.0);
            float vibrance = (float)Math.Clamp(cmd.vibrance, 0.0, 3.5);
            float brightness = (float)Math.Clamp(cmd.brightness, 0.5, 1.7);
            float contrast = (float)Math.Clamp(cmd.contrast, 0.5, 1.5);
            float warmth = (float)Math.Clamp(cmd.temperature, -100.0, 100.0) / 100.0f;

            // Eye care adjustments
            if (cmd.eyeCareWarmth > 0)
            {
                warmth = Math.Max(warmth, (float)cmd.eyeCareWarmth / 100f);
            }
            if (cmd.eyeCareDim > 0)
            {
                brightness *= (1f - (float)cmd.eyeCareDim / 100f);
            }

            // Luminance weights based on formula
            // 0: Rec709, 1: AverageGrey, 2: Rec601, 3: GreenLocked, 4: Perceptual, 5: RedGrey, 6: BlueGrey, 7: SkinSparing, 8: DeepBlue
            float gr = 0.2126f, gg = 0.7152f, gb = 0.0722f;
            switch (cmd.formula)
            {
                case 1: gr = 1f / 3f; gg = 1f / 3f; gb = 1f / 3f; break; // Average
                case 2: gr = 0.299f; gg = 0.587f; gb = 0.114f; break;    // Rec601
                case 3: gr = 0f; gg = 1f; gb = 0f; break;               // Green-locked
                case 4: gr = 0.4122f; gg = 0.5363f; gb = 0.0515f; break;// Perceptual
                case 5: gr = 0.55f; gg = 0.35f; gb = 0.1f; break;       // Red-grey
                case 6: gr = 0.1f; gg = 0.35f; gb = 0.55f; break;       // Blue-grey
                default: gr = 0.2126f; gg = 0.7152f; gb = 0.0722f; break;
            }

            // Travel and Hold bias for Skin-sparing
            float sR = saturation * vibrance;
            float sG = saturation * vibrance;
            float sB = saturation * vibrance;
            if (cmd.formula == 7) // Skin-sparing
            {
                float travR = 0.45f, travG = 1.1f, travB = 1.1f;
                float holdR = 0.45f, holdG = 1f, holdB = 1f;
                sR = (1f + (saturation - 1f) * travR) * (1f + (vibrance - 1f) * holdR);
                sG = (1f + (saturation - 1f) * travG) * (1f + (vibrance - 1f) * holdG);
                sB = (1f + (saturation - 1f) * travB) * (1f + (vibrance - 1f) * holdB);
            }

            // Base Saturation Matrix
            float numR = 1f - sR;
            float numG = 1f - sG;
            float numB = 1f - sB;
            float[] array = new float[25]
            {
                gr * numR + sR, gr * numG,      gr * numB,      0f, 0f,
                gg * numR,      gg * numG + sG, gg * numB,      0f, 0f,
                gb * numR,      gb * numG,      gb * numB + sB, 0f, 0f,
                0f,             0f,             0f,             1f, 0f,
                0f,             0f,             0f,             0f, 1f
            };

            // Hue Turn Matrix (if active)
            if (cmd.hueTurn != 0 && cmd.hueTurnAmount > 0)
            {
                float[] turned = HueMatrix(cmd.hueTurn);
                float amount = (float)cmd.hueTurnAmount / 100f;
                float[] blended = BlendWithIdentity(turned, amount);
                array = Multiply5x5(blended, array);
            }

            // Hue Complement (if active)
            if (cmd.hueComplement > 0)
            {
                float[] turned180 = HueMatrix(180f);
                float[] comp = BlendWithIdentity(turned180, (float)cmd.hueComplement / 100f);
                array = Multiply5x5(comp, array);
            }

            // Deep Blue Matrix (if Deep Blue formula selected)
            if (cmd.formula == 8)
            {
                array = Multiply5x5(array, DeepenBlueMatrix(165));
            }

            // Darken Matrix
            int darken = Math.Clamp(cmd.darken, 0, 400);
            if (darken != 0)
            {
                array = Multiply5x5(array, DarkenMatrix((float)darken / 100f, cmd.darkenHue));
            }

            // Brightness, Contrast and Warmth adjustment (ColorAdjust.BuildWithVibranceNumbers)
            float wPos = Math.Max(0f, warmth);
            float wNeg = Math.Max(0f, -warmth);
            float num3 = 1f - 0.38f * wNeg;
            float num4 = 1f - 0.12f * (wPos + wNeg);
            float num5 = 1f - 0.38f * wPos;
            float multR = brightness * num3 * contrast;
            float multG = brightness * num4 * contrast;
            float multB = brightness * num5 * contrast;
            float contrastOffset = 0.5f * (1f - contrast);

            for (int i = 0; i < 3; i++)
            {
                array[i * 5] *= multR;
                array[i * 5 + 1] *= multG;
                array[i * 5 + 2] *= multB;
            }
            array[20] = contrastOffset;
            array[21] = contrastOffset;
            array[22] = contrastOffset;

            // Colour Vision mode
            if (cmd.colourVision != 0)
            {
                array = Multiply5x5(array, ColourVisionMatrix(cmd.colourVision));
            }

            // Dark Boost integration
            if (cmd.darkBoost > 0.0)
            {
                float[] dbMatrix = DarkBoostLookBase(cmd.colorMode, cmd.blackLevel);
                array = LerpMatrix(array, dbMatrix, (float)Math.Clamp(cmd.darkBoost, 0.0, 1.0));
            }

            return array;
        }

        private static float[] HueMatrix(float degrees)
        {
            double rad = (double)degrees * Math.PI / 180.0;
            float cos = (float)Math.Cos(rad);
            float sin = (float)Math.Sin(rad);

            float[] m = new float[25];
            m[0] = 0.213f + cos * 0.787f - sin * 0.213f;
            m[5] = 0.715f - cos * 0.715f - sin * 0.715f;
            m[10] = 0.072f - cos * 0.072f + sin * 0.928f;

            m[1] = 0.213f - cos * 0.213f + sin * 0.143f;
            m[6] = 0.715f + cos * 0.285f + sin * 0.14f;
            m[11] = 0.072f - cos * 0.072f - sin * 0.283f;

            m[2] = 0.213f - cos * 0.213f - sin * 0.787f;
            m[7] = 0.715f - cos * 0.715f + sin * 0.715f;
            m[12] = 0.072f + cos * 0.928f + sin * 0.072f;

            m[18] = 1f;
            m[24] = 1f;
            return m;
        }

        private static float[] BlendWithIdentity(float[] turned, float amount)
        {
            float[] res = new float[25];
            for (int i = 0; i < 25; i++)
            {
                res[i] = IdentityMatrix[i] + (turned[i] - IdentityMatrix[i]) * amount;
            }
            return res;
        }

        private static (float R, float G, float B) DarkenTarget(int hueDegrees)
        {
            int num = (hueDegrees % 360 + 360) % 360;
            if (num < 120) return ((120f - num) / 120f, (float)num / 120f, 0f);
            if (num < 240) return (0f, (240f - num) / 120f, (float)(num - 120) / 120f);
            return ((float)(num - 240) / 120f, 0f, (360f - num) / 120f);
        }

        private static float[] DarkenMatrix(float k, int hueDegrees)
        {
            var target = DarkenTarget(hueDegrees);
            float rLum = target.R - 0.2126f;
            float gLum = target.G - 0.7152f;
            float bLum = target.B - 0.0722f;

            float[] array = new float[25];
            array[0] = 1f - k * rLum;
            array[5] = -k * gLum;
            array[10] = -k * bLum;

            array[1] = -k * rLum;
            array[6] = 1f - k * gLum;
            array[11] = -k * bLum;

            array[2] = -k * rLum;
            array[7] = -k * gLum;
            array[12] = 1f - k * bLum;

            array[18] = 1f;
            array[24] = 1f;
            return array;
        }

        private static float[] DeepenBlueMatrix(int blueSaturation)
        {
            float num = (float)(Math.Clamp(blueSaturation, 0, 200) - 100) / 100f;
            float num2 = -0.2126f;
            float num3 = -0.7152f;
            float num4 = 0.9278f;
            float num5 = -num;

            float[] array = new float[25];
            array[0] = 1f + num5 * num2;
            array[5] = num5 * num3;
            array[10] = num5 * num4;

            array[1] = num5 * num2;
            array[6] = 1f + num5 * num3;
            array[11] = num5 * num4;

            array[2] = num * num2;
            array[7] = num * num3;
            array[12] = 1f + num * num4;

            array[18] = 1f;
            array[24] = 1f;
            return array;
        }

        private static float[] ColourVisionMatrix(int mode)
        {
            // 4: Holo-black (PlexusX HoloBlack.GreenSubtracted)
            if (mode == 4)
            {
                float[] hb = (float[])IdentityMatrix.Clone();
                hb[0] = 1.5f; hb[1] = 1f; hb[2] = 0.5f;
                hb[5] = -1f;  hb[6] = -1f; hb[7] = -1f;
                hb[10] = 0.5f; hb[11] = 1f; hb[12] = 1.5f;
                return hb;
            }

            // Daltonization matrices for LMS color space
            // mode 1: Green-weak (Deuteranopia)
            // mode 2: Red-weak (Protanopia)
            // mode 3: Blue-weak (Tritanopia)
            float[] m = (float[])IdentityMatrix.Clone();
            if (mode == 1) // Green-weak
            {
                m[0] = 1.0f;    m[1] = 0.0f;    m[2] = 0.0f;
                m[5] = 0.494f;  m[6] = 0.0f;    m[7] = 1.248f;
                m[10] = 0.0f;   m[11] = 0.0f;   m[12] = 1.0f;
            }
            else if (mode == 2) // Red-weak
            {
                m[0] = 0.0f;    m[1] = 2.023f;  m[2] = -2.525f;
                m[5] = 0.0f;    m[6] = 1.0f;    m[7] = 0.0f;
                m[10] = 0.0f;   m[11] = 0.0f;   m[12] = 1.0f;
            }
            else if (mode == 3) // Blue-weak
            {
                m[0] = 1.0f;    m[1] = 0.0f;    m[2] = 0.0f;
                m[5] = 0.0f;    m[6] = 1.0f;    m[7] = 0.0f;
                m[10] = -0.395f; m[11] = 0.801f; m[12] = 0.0f;
            }
            return m;
        }

        private static float[] DarkBoostLookBase(string tint, int blackLevel)
        {
            float[] basis = new float[25]
            {
                0.32f, 4f, 1f, 0f, 0f,
                0.32f, 4f, 1f, 0f, 0f,
                0.32f, 4f, 1f, 0f, 0f,
                0f, 0f, 0f, 1f, 0f,
                -0.003764706f, -0.047058824f, -0.011764706f, 0f, 1f
            };

            float tR = 0.15f, tG = 1.0f, tB = 0.25f;
            string t = tint.ToLowerInvariant();
            if (t == "amber") { tR = 1.0f; tG = 0.7f; tB = 0.1f; }
            else if (t == "cyan") { tR = 0.1f; tG = 0.85f; tB = 1.0f; }
            else if (t == "clean" || t == "white") { tR = 1.0f; tG = 1.0f; tB = 1.0f; }

            for (int i = 0; i < 3; i++)
            {
                basis[i * 5 + 0] *= tR;
                basis[i * 5 + 1] *= tG;
                basis[i * 5 + 2] *= tB;
            }

            float bl = Math.Clamp(blackLevel, 0, 100) / 100.0f;
            basis[20] += bl * 0.08f;
            basis[21] += bl * 0.08f;
            basis[22] += bl * 0.08f;
            return basis;
        }

        private static float[] LerpMatrix(float[] a, float[] b, float t)
        {
            float[] res = new float[25];
            for (int i = 0; i < 25; i++)
            {
                res[i] = a[i] + (b[i] - a[i]) * t;
            }
            return res;
        }

        private static float[] Multiply5x5(float[] a, float[] b)
        {
            float[] res = new float[25];
            for (int i = 0; i < 5; i++)
            {
                for (int j = 0; j < 5; j++)
                {
                    double sum = 0.0;
                    for (int k = 0; k < 5; k++)
                    {
                        sum += (double)a[i * 5 + k] * (double)b[k * 5 + j];
                    }
                    res[i * 5 + j] = (float)sum;
                }
            }
            return res;
        }

        // ==========================================
        // Instant Display Resolution & Scaling Engine
        // Strict Multi-Monitor Isolation for Vertical/Rotated Displays
        // ==========================================

        private static DEVMODE NewDevMode()
        {
            DEVMODE dm = new DEVMODE
            {
                dmDeviceName = new string('\0', 32),
                dmFormName = new string('\0', 32)
            };
            dm.dmSize = (short)Marshal.SizeOf<DEVMODE>();
            return dm;
        }

        private static string GetPrimaryDeviceName()
        {
            DISPLAY_DEVICE d = new DISPLAY_DEVICE { cb = Marshal.SizeOf<DISPLAY_DEVICE>() };
            for (int i = 0; EnumDisplayDevices(null, i, ref d, 0); i++)
            {
                if ((d.StateFlags & 1) != 0 && (d.StateFlags & 4) != 0) // ATTACHED_TO_DESKTOP & PRIMARY_DEVICE
                {
                    return d.DeviceName.TrimEnd('\0');
                }
                d = new DISPLAY_DEVICE { cb = Marshal.SizeOf<DISPLAY_DEVICE>() };
            }
            return @"\\.\DISPLAY1";
        }

        public static RAMP CreateIdentityRamp()
        {
            RAMP ramp = new RAMP
            {
                Red = new ushort[256],
                Green = new ushort[256],
                Blue = new ushort[256]
            };
            for (int i = 0; i < 256; i++)
            {
                ushort val = (ushort)((i * 65535) / 255);
                ramp.Red[i] = val;
                ramp.Green[i] = val;
                ramp.Blue[i] = val;
            }
            return ramp;
        }

        private static List<string>? _cachedAttachedDisplays = null;
        public static List<string> GetAttachedDisplayDeviceNames()
        {
            if (_cachedAttachedDisplays != null) return _cachedAttachedDisplays;
            var list = new List<string>();
            DISPLAY_DEVICE d = new DISPLAY_DEVICE { cb = Marshal.SizeOf<DISPLAY_DEVICE>() };
            for (int i = 0; EnumDisplayDevices(null, i, ref d, 0); i++)
            {
                if ((d.StateFlags & 1) != 0 && (d.StateFlags & 8) == 0) // ATTACHED_TO_DESKTOP and NOT MIRRORING
                {
                    string name = d.DeviceName.TrimEnd('\0');
                    if (!list.Contains(name))
                    {
                        list.Add(name);
                    }
                }
                d = new DISPLAY_DEVICE { cb = Marshal.SizeOf<DISPLAY_DEVICE>() };
            }
            _cachedAttachedDisplays = list;
            return list;
        }

        public static Dictionary<string, (string FriendlyName, int Hz)> GetDisplayFriendlyNames()
        {
            var dict = new Dictionary<string, (string FriendlyName, int Hz)>(StringComparer.OrdinalIgnoreCase);
            try
            {
                uint pathCount = 0, modeCount = 0;
                int err = GetDisplayConfigBufferSizes(2, out pathCount, out modeCount); // QDC_ONLY_ACTIVE_PATHS = 2
                if (err == 0 && pathCount > 0 && modeCount > 0)
                {
                    var paths = new DISPLAYCONFIG_PATH_INFO[pathCount];
                    var modes = new DISPLAYCONFIG_MODE_INFO[modeCount];
                    err = QueryDisplayConfig(2, ref pathCount, paths, ref modeCount, modes, IntPtr.Zero);
                    if (err == 0)
                    {
                        for (int i = 0; i < pathCount; i++)
                        {
                            var src = new DISPLAYCONFIG_SOURCE_DEVICE_NAME
                            {
                                header = new DISPLAYCONFIG_DEVICE_INFO_HEADER
                                {
                                    type = 1,
                                    size = (uint)Marshal.SizeOf<DISPLAYCONFIG_SOURCE_DEVICE_NAME>(),
                                    adapterId = paths[i].sourceInfo.adapterId,
                                    id = paths[i].sourceInfo.id
                                }
                            };
                            GetSourceName(ref src);

                            var tgt = new DISPLAYCONFIG_TARGET_DEVICE_NAME
                            {
                                header = new DISPLAYCONFIG_DEVICE_INFO_HEADER
                                {
                                    type = 2,
                                    size = (uint)Marshal.SizeOf<DISPLAYCONFIG_TARGET_DEVICE_NAME>(),
                                    adapterId = paths[i].targetInfo.adapterId,
                                    id = paths[i].targetInfo.id
                                }
                            };
                            GetTargetName(ref tgt);

                            int hz = 0;
                            if (paths[i].targetInfo.refreshRate.Denominator != 0)
                            {
                                hz = (int)Math.Round((double)paths[i].targetInfo.refreshRate.Numerator / paths[i].targetInfo.refreshRate.Denominator);
                            }

                            string gdi = src.viewGdiDeviceName?.TrimEnd('\0') ?? "";
                            string friendly = tgt.monitorFriendlyDeviceName?.TrimEnd('\0') ?? "";
                            if (!string.IsNullOrEmpty(gdi))
                            {
                                dict[gdi] = (string.IsNullOrEmpty(friendly) ? gdi : friendly, hz);
                            }
                        }
                    }
                }
            }
            catch { }
            return dict;
        }

        public class MonitorPlacementInfo
        {
            public string DeviceName { get; set; } = "";
            public string FriendlyName { get; set; } = "";
            public int X { get; set; }
            public int Y { get; set; }
            public int Width { get; set; }
            public int Height { get; set; }
            public int Orientation { get; set; }
            public int Hz { get; set; }
            public bool IsPrimary { get; set; }
        }

        private static List<MonitorPlacementInfo> GetDesktopMonitors()
        {
            var list = new List<MonitorPlacementInfo>();
            var friendlyMap = GetDisplayFriendlyNames();
            DISPLAY_DEVICE d = new DISPLAY_DEVICE { cb = Marshal.SizeOf<DISPLAY_DEVICE>() };
            for (int i = 0; EnumDisplayDevices(null, i, ref d, 0); i++)
            {
                if ((d.StateFlags & 1) != 0 && (d.StateFlags & 8) == 0) // ATTACHED_TO_DESKTOP
                {
                    string devName = d.DeviceName.TrimEnd('\0');
                    bool isPrim = (d.StateFlags & 4) != 0;
                    DEVMODE dm = NewDevMode();
                    if (EnumDisplaySettings(devName, -1, ref dm))
                    {
                        string fname = devName;
                        int hz = dm.dmDisplayFrequency;
                        if (friendlyMap.TryGetValue(devName, out var finfo))
                        {
                            fname = finfo.FriendlyName;
                            if (finfo.Hz > 0) hz = finfo.Hz;
                        }

                        list.Add(new MonitorPlacementInfo
                        {
                            DeviceName = devName,
                            FriendlyName = fname,
                            X = dm.dmPositionX,
                            Y = dm.dmPositionY,
                            Width = dm.dmPelsWidth,
                            Height = dm.dmPelsHeight,
                            Orientation = dm.dmDisplayOrientation,
                            Hz = hz,
                            IsPrimary = isPrim
                        });
                    }
                }
                d = new DISPLAY_DEVICE { cb = Marshal.SizeOf<DISPLAY_DEVICE>() };
            }
            list.Sort((a, b) => b.IsPrimary.CompareTo(a.IsPrimary));
            return list;
        }

        private static bool SetGpuScalingFullScreen(string? targetDevice = null)
        {
            try
            {
                NvAPIWrapper.NVIDIA.Initialize();
                var configs = NvAPIWrapper.Display.PathInfo.GetDisplaysConfig();
                if (configs == null || configs.Length == 0) return false;

                // Identify primary display device ID to isolate scaling changes
                uint primaryId = NvAPIWrapper.Display.DisplayDevice.GetGDIPrimaryDisplayDevice().DisplayId;

                bool changed = false;
                foreach (var c in configs)
                {
                    foreach (var t in c.TargetsInfo)
                    {
                        // STRICT MULTI-MONITOR ISOLATION:
                        // Only change scaling for the primary display (Target ID == primaryId).
                        // Secondary displays (e.g. rotated vertical monitor) remain completely untouched!
                        if (t.DisplayDevice.DisplayId == primaryId)
                        {
                            if (t.Scaling != NvAPIWrapper.Native.Display.Scaling.ToNative)
                            {
                                t.Scaling = NvAPIWrapper.Native.Display.Scaling.ToNative;
                                changed = true;
                            }
                        }
                    }
                }

                if (changed)
                {
                    NvAPIWrapper.Display.PathInfo.SetDisplaysConfig(configs, (NvAPIWrapper.Native.Display.DisplayConfigFlags)2);
                }
                return true;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[GPU Scaling Warning] {ex.Message}");
                return false;
            }
        }

        private static bool SetDisplayResolution(int width, int height, int hz = 144, bool persist = false, string? deviceName = null)
        {
            try
            {
                string targetDev = string.IsNullOrWhiteSpace(deviceName) ? GetPrimaryDeviceName() : deviceName;

                // 1. Snapshot all monitor coordinates and orientations before change
                var monitorsBefore = GetDesktopMonitors();

                // 2. Ensure GPU scaling is active ONLY on the primary display
                SetGpuScalingFullScreen(targetDev);

                // 3. Query current settings of the target primary device
                DEVMODE dm = NewDevMode();
                if (!EnumDisplaySettings(targetDev, -1, ref dm))
                {
                    return false;
                }

                dm.dmPelsWidth = width;
                dm.dmPelsHeight = height;
                if (hz > 0) dm.dmDisplayFrequency = hz;
                // DM_POSITION (32) | DM_PELSWIDTH (524288) | DM_PELSHEIGHT (1048576) | DM_DISPLAYFREQUENCY (4194304) = 5767200
                dm.dmFields = 5767200;

                // Test first using CDS_TEST (2)
                int test = ChangeDisplaySettingsEx(targetDev, ref dm, IntPtr.Zero, 2, IntPtr.Zero);
                if (test != 0)
                {
                    // If DM_POSITION is rejected by driver in test, retry without it
                    dm.dmFields = 0x580000;
                }

                int dwFlags = persist ? 1 : 0; // 1 = CDS_UPDATEREGISTRY, 0 = dynamic
                int res = ChangeDisplaySettingsEx(targetDev, ref dm, IntPtr.Zero, dwFlags, IntPtr.Zero);
                if (res != 0)
                {
                    // Fallback to CDS_FULLSCREEN (4)
                    res = ChangeDisplaySettingsEx(targetDev, ref dm, IntPtr.Zero, 4, IntPtr.Zero);
                }

                // 4. Verify secondary monitors (e.g. vertical monitor 2 at X=-1080, Y=-523) did not move or rotate
                if (monitorsBefore.Count > 1)
                {
                    bool neededPlacementFix = false;
                    foreach (var m in monitorsBefore)
                    {
                        if (m.DeviceName != targetDev)
                        {
                            DEVMODE sec = NewDevMode();
                            if (EnumDisplaySettings(m.DeviceName, -1, ref sec))
                            {
                                if (sec.dmPositionX != m.X || sec.dmPositionY != m.Y || sec.dmDisplayOrientation != m.Orientation)
                                {
                                    sec.dmPositionX = m.X;
                                    sec.dmPositionY = m.Y;
                                    sec.dmDisplayOrientation = m.Orientation;
                                    sec.dmFields = 32 | 128; // DM_POSITION | DM_DISPLAYORIENTATION
                                    ChangeDisplaySettingsEx(m.DeviceName, ref sec, IntPtr.Zero, 268435457, IntPtr.Zero); // CDS_UPDATEREGISTRY | CDS_NORESET
                                    neededPlacementFix = true;
                                }
                            }
                        }
                    }
                    if (neededPlacementFix)
                    {
                        // Commit staged placement
                        ChangeDisplaySettingsEx((string?)null, IntPtr.Zero, IntPtr.Zero, 0, IntPtr.Zero);
                    }
                }

                return res == 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[SetDisplayResolution Error] {ex.Message}");
                return false;
            }
        }

        private static bool RestoreNativeResolution(string? deviceName = null)
        {
            try
            {
                string targetDev = string.IsNullOrWhiteSpace(deviceName) ? GetPrimaryDeviceName() : deviceName;
                // Set explicitly back to native 1920x1080 @ 144Hz without resetting secondary monitors
                return SetDisplayResolution(1920, 1080, 144, false, targetDev);
            }
            catch
            {
                return false;
            }
        }

        private static object QueryFullDisplayInfo()
        {
            string primaryDev = GetPrimaryDeviceName();
            var monitors = GetDesktopMonitors();

            int curW = 1920, curH = 1080, curHz = 144;
            DEVMODE dm = NewDevMode();
            if (EnumDisplaySettings(primaryDev, -1, ref dm))
            {
                curW = dm.dmPelsWidth;
                curH = dm.dmPelsHeight;
                curHz = dm.dmDisplayFrequency;
            }

            var supported144 = new List<object>();
            var seen = new HashSet<string>();
            int idx = 0;
            DEVMODE m = NewDevMode();
            while (EnumDisplaySettings(primaryDev, idx, ref m))
            {
                if (m.dmBitsPerPel == 32 && m.dmDisplayFrequency == 144)
                {
                    string key = $"{m.dmPelsWidth}x{m.dmPelsHeight}";
                    if (!seen.Contains(key))
                    {
                        seen.Add(key);
                        supported144.Add(new { width = m.dmPelsWidth, height = m.dmPelsHeight, hz = 144 });
                    }
                }
                idx++;
                m = NewDevMode();
            }

            string primaryGpuScaling = "ToNative";
            try
            {
                NvAPIWrapper.NVIDIA.Initialize();
                var configs = NvAPIWrapper.Display.PathInfo.GetDisplaysConfig();
                uint primId = NvAPIWrapper.Display.DisplayDevice.GetGDIPrimaryDisplayDevice().DisplayId;
                foreach (var c in configs)
                {
                    foreach (var t in c.TargetsInfo)
                    {
                        if (t.DisplayDevice.DisplayId == primId)
                        {
                            primaryGpuScaling = t.Scaling.ToString();
                        }
                    }
                }
            }
            catch { }

            var monitorList = monitors.Select((mon, i) => new
            {
                id = i + 1,
                deviceName = mon.DeviceName,
                name = mon.FriendlyName,
                friendlyName = mon.FriendlyName,
                res = $"{mon.Width} × {mon.Height}",
                isPrimary = mon.IsPrimary,
                main = mon.IsPrimary,
                width = mon.Width,
                height = mon.Height,
                hz = mon.Hz,
                x = mon.X,
                y = mon.Y,
                orientation = mon.Orientation,
                isVertical = mon.Height > mon.Width || mon.Orientation == 1 || mon.Orientation == 3,
                status = mon.IsPrimary ? "Target of Stretched Resolution" : "Secondary Display"
            }).ToList();

            return new
            {
                current = new { width = curW, height = curH, hz = curHz, isNative = (curW == 1920 && curH == 1080) },
                primaryDevice = primaryDev,
                gpu = "NVIDIA GeForce RTX 2060",
                gpuScaling = primaryGpuScaling,
                supported144Hz = supported144,
                monitors = monitorList
            };
        }
    }
}
