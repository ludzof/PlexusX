"""
Rust Stretch Res - Win32 Engine
Author: Pair programming assistant
License: MIT

A 100% legitimate, non-invasive window management engine for stretching
RustClient.exe (or any borderless window) to 4:3, 16:10, 5:4 without changing
native monitor resolution, without screen blinking, and without EAC risk.
"""

import ctypes
from ctypes import wintypes
import psutil
from typing import Optional, Tuple, Dict, Any, List

# Win32 Constants
SWP_NOSIZE = 0x0001
SWP_NOMOVE = 0x0002
SWP_NOZORDER = 0x0004
SWP_NOREDRAW = 0x0008
SWP_NOACTIVATE = 0x0010
SWP_FRAMECHANGED = 0x0020
SWP_SHOWWINDOW = 0x0040
SWP_ASYNCWINDOWPOS = 0x4000
HWND_TOP = 0
HWND_TOPMOST = -1
HWND_NOTOPMOST = -2

GWL_STYLE = -16
GWL_EXSTYLE = -20

WS_BORDER = 0x00800000
WS_CAPTION = 0x00C00000
WS_THICKFRAME = 0x00040000
WS_MINIMIZEBOX = 0x00020000
WS_MAXIMIZEBOX = 0x00010000
WS_SYSMENU = 0x00080000
WS_POPUP = 0x80000000

MONITOR_DEFAULTTONEAREST = 2

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

# Structures
class RECT(ctypes.Structure):
    _fields_ = [
        ('left', wintypes.LONG),
        ('top', wintypes.LONG),
        ('right', wintypes.LONG),
        ('bottom', wintypes.LONG)
    ]

    @property
    def width(self) -> int:
        return self.right - self.left

    @property
    def height(self) -> int:
        return self.bottom - self.top

class MONITORINFO(ctypes.Structure):
    _fields_ = [
        ('cbSize', wintypes.DWORD),
        ('rcMonitor', RECT),
        ('rcWork', RECT),
        ('dwFlags', wintypes.DWORD)
    ]

# 64-bit safe Get/SetWindowLong
GetWindowLongPtr = getattr(user32, 'GetWindowLongPtrW', user32.GetWindowLongW)
GetWindowLongPtr.argtypes = [wintypes.HWND, ctypes.c_int]
GetWindowLongPtr.restype = ctypes.c_ssize_t

SetWindowLongPtr = getattr(user32, 'SetWindowLongPtrW', user32.SetWindowLongW)
SetWindowLongPtr.argtypes = [wintypes.HWND, ctypes.c_int, ctypes.c_ssize_t]
SetWindowLongPtr.restype = ctypes.c_ssize_t

user32.FindWindowW.argtypes = [wintypes.LPCWSTR, wintypes.LPCWSTR]
user32.FindWindowW.restype = wintypes.HWND

user32.IsWindow.argtypes = [wintypes.HWND]
user32.IsWindow.restype = wintypes.BOOL

user32.IsWindowVisible.argtypes = [wintypes.HWND]
user32.IsWindowVisible.restype = wintypes.BOOL

user32.GetWindowRect.argtypes = [wintypes.HWND, ctypes.POINTER(RECT)]
user32.GetWindowRect.restype = wintypes.BOOL

user32.SetWindowPos.argtypes = [wintypes.HWND, wintypes.HWND, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_uint]
user32.SetWindowPos.restype = wintypes.BOOL

user32.MonitorFromWindow.argtypes = [wintypes.HWND, wintypes.DWORD]
user32.MonitorFromWindow.restype = wintypes.HMONITOR

user32.GetMonitorInfoW.argtypes = [wintypes.HMONITOR, ctypes.POINTER(MONITORINFO)]
user32.GetMonitorInfoW.restype = wintypes.BOOL

user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
user32.GetClassNameW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]


class WindowTarget:
    def __init__(self, hwnd: int, title: str, process_name: str, class_name: str):
        self.hwnd = hwnd
        self.title = title
        self.process_name = process_name
        self.class_name = class_name
        self.original_rect: Optional[RECT] = None
        self.original_style: Optional[int] = None
        self.original_ex_style: Optional[int] = None
        self.capture_original_state()

    def capture_original_state(self):
        r = RECT()
        if user32.GetWindowRect(self.hwnd, ctypes.byref(r)):
            self.original_rect = r
        self.original_style = GetWindowLongPtr(self.hwnd, GWL_STYLE)
        self.original_ex_style = GetWindowLongPtr(self.hwnd, GWL_EXSTYLE)

    def is_valid(self) -> bool:
        return bool(user32.IsWindow(self.hwnd))


class StretchEngine:
    """Manages window targeting, stretching, border stripping, and restoration."""
    def __init__(self):
        self.target: Optional[WindowTarget] = None
        self.is_stretched: bool = False
        self.last_applied_settings: Dict[str, Any] = {}

    @staticmethod
    def get_window_title(hwnd: int) -> str:
        length = user32.GetWindowTextLengthW(hwnd)
        if length > 0:
            buff = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buff, length + 1)
            return buff.value
        return ""

    @staticmethod
    def get_window_class(hwnd: int) -> str:
        buff = ctypes.create_unicode_buffer(256)
        user32.GetClassNameW(hwnd, buff, 256)
        return buff.value

    @staticmethod
    def get_window_process_name(hwnd: int) -> str:
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        if pid.value > 0:
            try:
                p = psutil.Process(pid.value)
                return p.name()
            except Exception:
                pass
        return ""

    def find_rust_window(self) -> Optional[WindowTarget]:
        """Finds RustClient.exe window by class 'UnityWndClass' and title 'Rust', or by process name."""
        # 1. Direct FindWindow for UnityWndClass + Rust
        hwnd = user32.FindWindowW("UnityWndClass", "Rust")
        if hwnd and user32.IsWindow(hwnd):
            pname = self.get_window_process_name(hwnd)
            return WindowTarget(hwnd, "Rust", pname or "RustClient.exe", "UnityWndClass")

        # 2. Direct FindWindow by title 'Rust'
        hwnd = user32.FindWindowW(None, "Rust")
        if hwnd and user32.IsWindow(hwnd):
            pname = self.get_window_process_name(hwnd)
            cls = self.get_window_class(hwnd)
            if "rust" in pname.lower() or "unity" in cls.lower():
                return WindowTarget(hwnd, "Rust", pname, cls)

        # 3. Desktop window enumeration to match RustClient.exe
        h_desk = user32.OpenDesktopW("default", 0, False, 0x01FF)
        found_target = [None]

        def callback(h, lparam):
            if user32.IsWindowVisible(h):
                pname = self.get_window_process_name(h).lower()
                title = self.get_window_title(h)
                if "rustclient" in pname or ("rust" in pname and title.lower() == "rust"):
                    cls = self.get_window_class(h)
                    found_target[0] = WindowTarget(h, title, pname, cls)
                    return False
            return True

        WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
        cb = WNDENUMPROC(callback)
        if h_desk:
            user32.EnumDesktopWindows(h_desk, cb, 0)
        else:
            user32.EnumWindows(cb, 0)

        return found_target[0]

    def list_candidate_windows(self) -> List[Tuple[int, str, str]]:
        """Lists active top-level windows for testing/selection (HWND, Title, Process)."""
        candidates = []
        h_desk = user32.OpenDesktopW("default", 0, False, 0x01FF)

        def callback(h, lparam):
            if user32.IsWindowVisible(h):
                title = self.get_window_title(h).strip()
                pname = self.get_window_process_name(h)
                if title and pname and pname.lower() not in ["explorer.exe", "searchhost.exe", "shellexperiencehost.exe"]:
                    candidates.append((h, title, pname))
            return True

        WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
        cb = WNDENUMPROC(callback)
        if h_desk:
            user32.EnumDesktopWindows(h_desk, cb, 0)
        else:
            user32.EnumWindows(cb, 0)

        return candidates

    def set_target(self, target: Optional[WindowTarget]):
        if self.target and self.is_stretched:
            self.reset_target()
        self.target = target
        self.is_stretched = False

    def get_monitor_info_for_window(self, hwnd: int) -> Optional[Tuple[int, int, int, int]]:
        """Returns (left, top, width, height) of the monitor displaying the window."""
        h_mon = user32.MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST)
        if not h_mon:
            # Fallback to primary screen
            return (0, 0, user32.GetSystemMetrics(0), user32.GetSystemMetrics(1))

        mi = MONITORINFO()
        mi.cbSize = ctypes.sizeof(MONITORINFO)
        if user32.GetMonitorInfoW(h_mon, ctypes.byref(mi)):
            r = mi.rcMonitor
            return (r.left, r.top, r.width, r.height)
        return (0, 0, user32.GetSystemMetrics(0), user32.GetSystemMetrics(1))

    def strip_borders(self, hwnd: int):
        """Removes titlebar and sizing frame to achieve a clean borderless window."""
        style = GetWindowLongPtr(hwnd, GWL_STYLE)
        new_style = style & ~(WS_CAPTION | WS_THICKFRAME | WS_BORDER | WS_SYSMENU)
        new_style |= WS_POPUP
        if new_style != style:
            SetWindowLongPtr(hwnd, GWL_STYLE, new_style)
            user32.SetWindowPos(hwnd, 0, 0, 0, 0, 0,
                                SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED | SWP_NOACTIVATE)

    def apply_stretch(self,
                      stretch_multiplier: float = 1.3333,
                      alignment: float = 1.0,
                      remove_borders: bool = True) -> bool:
        """
        Applies stretch to target window.
        stretch_multiplier: e.g. 1.0 (Native 16:9), 1.11 (16:10), 1.3333 (4:3), 1.422 (5:4).
        alignment: 0.0 (Anchor Top / Compass visible), 0.5 (Center), 1.0 (Anchor Bottom / HUD visible).
        """
        if not self.target or not self.target.is_valid():
            return False

        hwnd = self.target.hwnd

        if remove_borders:
            self.strip_borders(hwnd)

        mon_x, mon_y, mon_w, mon_h = self.get_monitor_info_for_window(hwnd)

        # Calculate target dimensions
        target_w = mon_w
        target_h = int(round(mon_h * stretch_multiplier))
        delta_h = target_h - mon_h

        # Alignment offset:
        # alignment = 1.0 -> target_y = mon_y - delta_h (bottom aligns with screen bottom)
        # alignment = 0.5 -> target_y = mon_y - delta_h / 2 (centered)
        # alignment = 0.0 -> target_y = mon_y (top aligns with screen top)
        target_x = mon_x
        target_y = mon_y - int(round(delta_h * alignment))

        # Apply position and size instantly
        flags = SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED | SWP_SHOWWINDOW
        res = user32.SetWindowPos(hwnd, 0, target_x, target_y, target_w, target_h, flags)

        if res:
            self.is_stretched = True
            self.last_applied_settings = {
                'multiplier': stretch_multiplier,
                'alignment': alignment,
                'width': target_w,
                'height': target_h,
                'x': target_x,
                'y': target_y
            }
        return bool(res)

    def reset_target(self) -> bool:
        """Restores the target window to its original style and geometry."""
        if not self.target or not self.target.is_valid():
            self.is_stretched = False
            return False

        hwnd = self.target.hwnd

        # Restore original styles if captured
        if self.target.original_style is not None:
            SetWindowLongPtr(hwnd, GWL_STYLE, self.target.original_style)
        if self.target.original_ex_style is not None:
            SetWindowLongPtr(hwnd, GWL_EXSTYLE, self.target.original_ex_style)

        # Restore original rect or fit monitor
        if self.target.original_rect:
            r = self.target.original_rect
            user32.SetWindowPos(hwnd, 0, r.left, r.top, r.width, r.height,
                                SWP_NOZORDER | SWP_FRAMECHANGED | SWP_SHOWWINDOW)
        else:
            mon_x, mon_y, mon_w, mon_h = self.get_monitor_info_for_window(hwnd)
            user32.SetWindowPos(hwnd, 0, mon_x, mon_y, mon_w, mon_h,
                                SWP_NOZORDER | SWP_FRAMECHANGED | SWP_SHOWWINDOW)

        self.is_stretched = False
        return True
