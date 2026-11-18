import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CrosshairColorPickerProps {
  color: string; // e.g. '#00ff66'
  onChangeColor: (hex: string) => void;
}

// Convert Hex to HSV
function hexToHsv(hex: string): [number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [144, 1, 1]; // default green
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), s, v];
}

// Convert HSV to Hex
function hsvToHex(h: number, s: number, v: number): string {
  let r = 0, g = 0, b = 0;
  const i = Math.floor((h / 60) % 6);
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  const toH = (n: number) => Math.max(0, Math.min(255, Math.round(n * 255))).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

export const CrosshairColorPicker: React.FC<CrosshairColorPickerProps> = ({
  color,
  onChangeColor,
}) => {
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(color));
  const [hexInput, setHexInput] = useState(() => color.replace('#', '').toUpperCase());
  const discCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingDisc = useRef(false);
  const isDraggingVal = useRef(false);

  // Sync internal HSV when incoming color prop changes externally
  useEffect(() => {
    const currentHex = hsvToHex(hsv[0], hsv[1], hsv[2]).toUpperCase();
    const targetHex = (color.startsWith('#') ? color : `#${color}`).toUpperCase();
    if (currentHex !== targetHex) {
      const nextHsv = hexToHsv(color);
      setHsv(nextHsv);
      setHexInput(color.replace('#', '').toUpperCase());
    }
  }, [color]);

  // Render the HSV Color Wheel Disc
  const renderDisc = useCallback(() => {
    const canvas = discCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = cx - 2;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * width + x) * 4;

        if (dist <= radius) {
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          if (angle < 0) angle += 360;

          const sat = dist / radius;
          // HSV with V=1 for the disc representation
          const [r, g, b] = hsvToRgbDirect(angle, sat, 1);

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        } else {
          data[idx + 3] = 0;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw Pip Handle at current (H, S)
    const [h, s] = hsv;
    const angleRad = (h * Math.PI) / 180;
    const pipDist = s * radius;
    const pipX = cx + Math.cos(angleRad) * pipDist;
    const pipY = cy + Math.sin(angleRad) * pipDist;

    ctx.save();
    ctx.beginPath();
    ctx.arc(pipX, pipY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, [hsv]);

  useEffect(() => {
    renderDisc();
  }, [renderDisc]);

  const updateDiscPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = discCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left - cx;
    const y = e.clientY - rect.top - cy;
    const dist = Math.sqrt(x * x + y * y);
    const radius = cx - 2;

    let angle = (Math.atan2(y, x) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    const sat = Math.max(0, Math.min(1, dist / radius));
    const nextHsv: [number, number, number] = [Math.round(angle), sat, hsv[2]];
    setHsv(nextHsv);
    const hex = hsvToHex(nextHsv[0], nextHsv[1], nextHsv[2]);
    setHexInput(hex.replace('#', '').toUpperCase());
    onChangeColor(hex);
  };

  const updateValPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const v = Math.max(0, Math.min(1, 1 - y / rect.height));

    const nextHsv: [number, number, number] = [hsv[0], hsv[1], v];
    setHsv(nextHsv);
    const hex = hsvToHex(nextHsv[0], nextHsv[1], nextHsv[2]);
    setHexInput(hex.replace('#', '').toUpperCase());
    onChangeColor(hex);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase();
    setHexInput(val);
    if (val.length === 6) {
      const fullHex = `#${val}`;
      const nextHsv = hexToHsv(fullHex);
      setHsv(nextHsv);
      onChangeColor(fullHex);
    }
  };

  const pureHueColor = hsvToHex(hsv[0], hsv[1], 1);

  return (
    <div className="flex items-center space-x-5 py-2">
      {/* HSV Wheel Disc */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <canvas
          ref={discCanvasRef}
          width={112}
          height={112}
          className="rounded-full cursor-crosshair shadow-md"
          onMouseDown={(e) => {
            isDraggingDisc.current = true;
            updateDiscPosition(e);
          }}
          onMouseMove={(e) => {
            if (isDraggingDisc.current) updateDiscPosition(e);
          }}
          onMouseUp={() => {
            isDraggingDisc.current = false;
          }}
          onMouseLeave={() => {
            isDraggingDisc.current = false;
          }}
        />
      </div>

      {/* Vertical Brightness / Value Gradient Bar */}
      <div
        className="relative w-4 h-28 rounded-md cursor-pointer border border-[#232733] overflow-hidden flex-shrink-0"
        style={{
          background: `linear-gradient(to bottom, ${pureHueColor}, #000000)`,
        }}
        onMouseDown={(e) => {
          isDraggingVal.current = true;
          updateValPosition(e);
        }}
        onMouseMove={(e) => {
          if (isDraggingVal.current) updateValPosition(e);
        }}
        onMouseUp={() => {
          isDraggingVal.current = false;
        }}
      >
        {/* Indicator handle */}
        <div
          className="absolute left-0 right-0 h-1.5 bg-white border border-black shadow pointer-events-none"
          style={{
            top: `${(1 - hsv[2]) * 100}%`,
            transform: 'translateY(-50%)',
          }}
        />
      </div>

      {/* Hex Input and Caption */}
      <div className="flex flex-col space-y-1.5">
        <span className="text-xs font-medium text-gray-400">Hex</span>
        <div className="flex items-center bg-[#101217] border border-[#252a38] rounded-md px-2.5 py-1.5 focus-within:border-emerald-500 w-32">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            placeholder="00FF66"
            maxLength={6}
            className="w-full bg-transparent text-white text-xs font-mono tracking-wider focus:outline-none uppercase"
          />
        </div>
        <span className="text-[11px] text-gray-500 leading-tight">
          Paste a colour to match a friend's crosshair.
        </span>
      </div>
    </div>
  );
};

function hsvToRgbDirect(h: number, s: number, v: number): [number, number, number] {
  let r = 0, g = 0, b = 0;
  const i = Math.floor((h / 60) % 6);
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
