import sys
import os
import json
import time
import subprocess
import ctypes
from ctypes import wintypes

# Include local script directory in sys.path for stretch_engine
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from stretch_engine import StretchEngine, WindowTarget, RECT, GetWindowLongPtr, SetWindowLongPtr, user32, GWL_STYLE, GWL_EXSTYLE

STATE_FILE = os.path.join(SCRIPT_DIR, 'stretch_state.json')

def load_saved_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_state(state):
    try:
        with open(STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        sys.stderr.write(f"Error saving state: {e}\n")

def list_windows():
    engine = StretchEngine()
    candidates = engine.list_candidate_windows()
    result = []
    for hwnd, title, pname in candidates:
        result.append({
            "hwnd": hwnd,
            "title": title,
            "process": pname
        })
    print(json.dumps({"status": "ok", "action": "list", "windows": result}))

def find_target():
    engine = StretchEngine()
    target = engine.find_rust_window()
    if target:
        print(json.dumps({
            "status": "ok",
            "action": "find",
            "found": True,
            "hwnd": target.hwnd,
            "title": target.title,
            "process": target.process_name
        }))
    else:
        print(json.dumps({
            "status": "ok",
            "action": "find",
            "found": False
        }))

def apply_stretch(hwnd=0, multiplier=1.3333, alignment=1.0, offset_y=0, remove_borders=True):
    engine = StretchEngine()
    target = None

    if hwnd and user32.IsWindow(hwnd):
        title = engine.get_window_title(hwnd)
        pname = engine.get_window_process_name(hwnd)
        cls = engine.get_window_class(hwnd)
        target = WindowTarget(hwnd, title, pname, cls)
    else:
        target = engine.find_rust_window()

    if not target or not target.is_valid():
        print(json.dumps({"status": "error", "message": "Target window not found or invalid"}))
        return

    # Check if we have original state saved, if not save it
    state = load_saved_state()
    hwnd_key = str(target.hwnd)
    if hwnd_key not in state:
        r = RECT()
        user32.GetWindowRect(target.hwnd, ctypes.byref(r))
        style = GetWindowLongPtr(target.hwnd, GWL_STYLE)
        ex_style = GetWindowLongPtr(target.hwnd, GWL_EXSTYLE)
        state[hwnd_key] = {
            "left": r.left,
            "top": r.top,
            "right": r.right,
            "bottom": r.bottom,
            "width": r.width,
            "height": r.height,
            "style": style,
            "ex_style": ex_style,
            "title": target.title,
            "process": target.process_name,
            "stretched": True,
            "multiplier": multiplier,
            "alignment": alignment,
            "offset_y": offset_y
        }
        save_state(state)
    else:
        state[hwnd_key]["stretched"] = True
        state[hwnd_key]["multiplier"] = multiplier
        state[hwnd_key]["alignment"] = alignment
        state[hwnd_key]["offset_y"] = offset_y
        save_state(state)

    engine.set_target(target)
    
    # Custom alignment with offset_y
    if remove_borders:
        engine.strip_borders(target.hwnd)

    mon_x, mon_y, mon_w, mon_h = engine.get_monitor_info_for_window(target.hwnd)
    target_w = mon_w
    target_h = int(round(mon_h * multiplier))
    delta_h = target_h - mon_h
    target_x = mon_x
    target_y = mon_y - int(round(delta_h * alignment)) + int(offset_y)

    # SWP_NOZORDER (0x0004) | SWP_NOACTIVATE (0x0010) | SWP_FRAMECHANGED (0x0020) | SWP_SHOWWINDOW (0x0040)
    flags = 0x0004 | 0x0010 | 0x0020 | 0x0040
    res = user32.SetWindowPos(target.hwnd, 0, target_x, target_y, target_w, target_h, flags)

    print(json.dumps({
        "status": "ok",
        "action": "apply",
        "hwnd": target.hwnd,
        "title": target.title,
        "stretched": bool(res),
        "multiplier": multiplier,
        "width": target_w,
        "height": target_h,
        "x": target_x,
        "y": target_y,
        "mon_w": mon_w,
        "mon_h": mon_h
    }))

def reset_stretch(hwnd=0):
    state = load_saved_state()
    target_hwnd = hwnd
    if not target_hwnd and state:
        # Get first stretched hwnd in state
        for k, v in state.items():
            if v.get("stretched"):
                target_hwnd = int(k)
                break

    if not target_hwnd or not user32.IsWindow(target_hwnd):
        print(json.dumps({"status": "ok", "action": "reset", "reset": False, "message": "No active stretched target found"}))
        return

    hwnd_key = str(target_hwnd)
    if hwnd_key in state:
        saved = state[hwnd_key]
        orig_style = saved.get("style")
        if orig_style is not None:
            SetWindowLongPtr(target_hwnd, GWL_STYLE, orig_style)
        
        orig_x = saved.get("left", 0)
        orig_y = saved.get("top", 0)
        orig_w = saved.get("width", 1920)
        orig_h = saved.get("height", 1080)

        flags = 0x0004 | 0x0010 | 0x0020 | 0x0040
        user32.SetWindowPos(target_hwnd, 0, orig_x, orig_y, orig_w, orig_h, flags)
        del state[hwnd_key]
        save_state(state)

        print(json.dumps({
            "status": "ok",
            "action": "reset",
            "hwnd": target_hwnd,
            "reset": True,
            "width": orig_w,
            "height": orig_h
        }))
    else:
        print(json.dumps({"status": "ok", "action": "reset", "reset": False, "message": "Target not in saved state"}))

def test_notepad(multiplier=1.3333, alignment=1.0, offset_y=0):
    # Launch notepad if not running
    proc = subprocess.Popen(["notepad.exe"])
    engine = StretchEngine()
    notepad_hwnd = 0
    for _ in range(15):
        time.sleep(0.15)
        candidates = engine.list_candidate_windows()
        for h, title, pname in candidates:
            if "notepad" in pname.lower():
                notepad_hwnd = h
                break
        if notepad_hwnd:
            break

    if notepad_hwnd:
        apply_stretch(hwnd=notepad_hwnd, multiplier=multiplier, alignment=alignment, offset_y=offset_y)
    else:
        print(json.dumps({"status": "error", "message": "Failed to find launched Notepad window"}))

class DEVMODEW(ctypes.Structure):
    _fields_ = [
        ('dmDeviceName', wintypes.WCHAR * 32),
        ('dmSpecVersion', wintypes.WORD),
        ('dmDriverVersion', wintypes.WORD),
        ('dmSize', wintypes.WORD),
        ('dmDriverExtra', wintypes.WORD),
        ('dmFields', wintypes.DWORD),
        ('dmPositionX', wintypes.LONG),
        ('dmPositionY', wintypes.LONG),
        ('dmDisplayOrientation', wintypes.DWORD),
        ('dmDisplayFixedOutput', wintypes.DWORD),
        ('dmColor', wintypes.SHORT),
        ('dmDuplex', wintypes.SHORT),
        ('dmYResolution', wintypes.SHORT),
        ('dmTTOption', wintypes.SHORT),
        ('dmCollate', wintypes.SHORT),
        ('dmFormName', wintypes.WCHAR * 32),
        ('dmLogPixels', wintypes.WORD),
        ('dmBitsPerPel', wintypes.WORD),
        ('dmPelsWidth', wintypes.DWORD),
        ('dmPelsHeight', wintypes.DWORD),
        ('dmDisplayFlags', wintypes.DWORD),
        ('dmDisplayFrequency', wintypes.DWORD),
        ('dmICMMethod', wintypes.DWORD),
        ('dmICMIntent', wintypes.DWORD),
        ('dmMediaType', wintypes.DWORD),
        ('dmDitherType', wintypes.DWORD),
        ('dmReserved1', wintypes.DWORD),
        ('dmReserved2', wintypes.DWORD),
        ('dmPanningWidth', wintypes.DWORD),
        ('dmPanningHeight', wintypes.DWORD),
    ]

class DISPLAY_DEVICEW(ctypes.Structure):
    _fields_ = [
        ('cb', wintypes.DWORD),
        ('DeviceName', wintypes.WCHAR * 32),
        ('DeviceString', wintypes.WCHAR * 128),
        ('StateFlags', wintypes.DWORD),
        ('DeviceID', wintypes.WCHAR * 128),
        ('DeviceKey', wintypes.WCHAR * 128)
    ]

def get_primary_display_device():
    dev = DISPLAY_DEVICEW()
    dev.cb = ctypes.sizeof(DISPLAY_DEVICEW)
    i = 0
    while user32.EnumDisplayDevicesW(None, i, ctypes.byref(dev), 0):
        if (dev.StateFlags & 1) and (dev.StateFlags & 4):
            return dev.DeviceName
        i += 1
        dev.cb = ctypes.sizeof(DISPLAY_DEVICEW)
    return "\\\\.\\DISPLAY1"

def get_all_monitors():
    monitors = []
    dev = DISPLAY_DEVICEW()
    dev.cb = ctypes.sizeof(DISPLAY_DEVICEW)
    i = 0
    while user32.EnumDisplayDevicesW(None, i, ctypes.byref(dev), 0):
        if dev.StateFlags & 1:
            is_prim = bool(dev.StateFlags & 4)
            dname = dev.DeviceName
            dm = DEVMODEW()
            dm.dmSize = ctypes.sizeof(DEVMODEW)
            if user32.EnumDisplaySettingsW(dname, -1, ctypes.byref(dm)):
                is_vert = dm.dmPelsHeight > dm.dmPelsWidth or dm.dmDisplayOrientation in (1, 3)
                monitors.append({
                    "deviceName": dname,
                    "friendlyName": "Main Display (Horizontal)" if is_prim else "Secondary Display (Vertical)",
                    "isPrimary": is_prim,
                    "width": dm.dmPelsWidth,
                    "height": dm.dmPelsHeight,
                    "hz": dm.dmDisplayFrequency,
                    "x": dm.dmPositionX,
                    "y": dm.dmPositionY,
                    "orientation": dm.dmDisplayOrientation,
                    "isVertical": is_vert,
                    "status": "Target of Stretched Resolution" if is_prim else "Protected / Untouched"
                })
        i += 1
        dev.cb = ctypes.sizeof(DISPLAY_DEVICEW)
    monitors.sort(key=lambda m: 0 if m["isPrimary"] else 1)
    return monitors

def set_display_resolution(width, height, hz=144):
    try:
        primary_dev = get_primary_display_device()
        dm = DEVMODEW()
        dm.dmSize = ctypes.sizeof(DEVMODEW)
        user32.EnumDisplaySettingsW(primary_dev, -1, ctypes.byref(dm))
        dm.dmPelsWidth = int(width)
        dm.dmPelsHeight = int(height)
        if hz > 0:
            dm.dmDisplayFrequency = int(hz)
        dm.dmFields = 5767200 # DM_POSITION | DM_PELSWIDTH | DM_PELSHEIGHT | DM_DISPLAYFREQUENCY

        test = user32.ChangeDisplaySettingsExW(primary_dev, ctypes.byref(dm), None, 2, None) # CDS_TEST
        if test != 0:
            dm.dmFields = 0x580000

        res = user32.ChangeDisplaySettingsExW(primary_dev, ctypes.byref(dm), None, 0, None)
        if res != 0:
            res = user32.ChangeDisplaySettingsExW(primary_dev, ctypes.byref(dm), None, 4, None) # CDS_FULLSCREEN
        
        try:
            import winsound
            winsound.Beep(880, 100)
        except Exception:
            pass

        print(json.dumps({
            "status": "ok" if res == 0 else "error",
            "action": "set-res",
            "device": primary_dev,
            "width": int(width),
            "height": int(height),
            "hz": int(hz),
            "code": res
        }))
    except Exception as ex:
        print(json.dumps({"status": "error", "message": str(ex)}))

def reset_display_resolution():
    try:
        set_display_resolution(1920, 1080, 144)
    except Exception as ex:
        print(json.dumps({"status": "error", "message": str(ex)}))

def get_display_modes():
    try:
        primary_dev = get_primary_display_device()
        monitors = get_all_monitors()

        dm = DEVMODEW()
        dm.dmSize = ctypes.sizeof(DEVMODEW)
        user32.EnumDisplaySettingsW(primary_dev, -1, ctypes.byref(dm))
        cur_w, cur_h, cur_hz = dm.dmPelsWidth, dm.dmPelsHeight, dm.dmDisplayFrequency
        
        modes_144 = []
        seen = set()
        i = 0
        while True:
            m = DEVMODEW()
            m.dmSize = ctypes.sizeof(DEVMODEW)
            if not user32.EnumDisplaySettingsW(primary_dev, i, ctypes.byref(m)):
                break
            if m.dmDisplayFrequency == 144 and m.dmBitsPerPel == 32:
                key = (m.dmPelsWidth, m.dmPelsHeight)
                if key not in seen:
                    seen.add(key)
                    modes_144.append({"width": m.dmPelsWidth, "height": m.dmPelsHeight, "hz": 144})
            i += 1
            
        print(json.dumps({
            "status": "ok",
            "action": "get-res",
            "primaryDevice": primary_dev,
            "current": {
                "width": cur_w,
                "height": cur_h,
                "hz": cur_hz,
                "isNative": (cur_w == 1920 and cur_h == 1080)
            },
            "monitors": monitors,
            "gpu": "NVIDIA GeForce RTX 2060",
            "gpuScaling": "ToNative",
            "supported144Hz": modes_144
        }))
    except Exception as ex:
        print(json.dumps({"status": "error", "message": str(ex)}))

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        list_windows()
        sys.exit(0)

    cmd = args[0].lower()
    if cmd == 'list':
        list_windows()
    elif cmd == 'find':
        find_target()
    elif cmd == 'apply':
        # Optional args: hwnd, mult, align, offset
        hwnd = int(args[1]) if len(args) > 1 and args[1].isdigit() else 0
        mult = float(args[2]) if len(args) > 2 else 1.3333
        align = float(args[3]) if len(args) > 3 else 1.0
        offset = int(args[4]) if len(args) > 4 else 0
        apply_stretch(hwnd=hwnd, multiplier=mult, alignment=align, offset_y=offset)
    elif cmd == 'reset':
        hwnd = int(args[1]) if len(args) > 1 and args[1].isdigit() else 0
        reset_stretch(hwnd=hwnd)
    elif cmd == 'set-res':
        w = int(args[1]) if len(args) > 1 else 1440
        h = int(args[2]) if len(args) > 2 else 1080
        hz = int(args[3]) if len(args) > 3 else 144
        set_display_resolution(w, h, hz)
    elif cmd == 'reset-res':
        reset_display_resolution()
    elif cmd == 'get-res':
        get_display_modes()
    elif cmd == 'test-notepad':
        mult = float(args[1]) if len(args) > 1 else 1.3333
        align = float(args[2]) if len(args) > 2 else 1.0
        offset = int(args[3]) if len(args) > 3 else 0
        test_notepad(multiplier=mult, alignment=align, offset_y=offset)
    elif cmd == 'beep':
        freq = int(args[1]) if len(args) > 1 else 800
        dur = int(args[2]) if len(args) > 2 else 120
        try:
            import winsound
            winsound.Beep(freq, dur)
        except Exception:
            pass
        print(json.dumps({"status": "ok", "action": "beep"}))
    else:
        print(json.dumps({"status": "error", "message": f"Unknown command: {cmd}"}))
