import React, { useRef, useEffect, useCallback } from 'react';

interface ColorWheelProps {
  title: string;
  mode: 'hue' | 'darken';
  value: number; // for hue: -180..180; for darken: 0..100
  selectedHueAngle: number; // 0..360 for darken target color
  onChangeAngle: (angle: number) => void;
  onReset: () => void;
  centerPrimaryText: string;
  centerSecondaryText: string;
  caption: string;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({
  title,
  mode,
  value,
  selectedHueAngle,
  onChangeAngle,
  onReset,
  centerPrimaryText,
  centerSecondaryText,
  caption,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  const ringNames = [
    { deg: 0, name: 'Red' },
    { deg: 60, name: 'Yellow' },
    { deg: 120, name: 'Green' },
    { deg: 180, name: 'Cyan' },
    { deg: 240, name: 'Blue' },
    { deg: 300, name: 'Magenta' },
  ];

  // Draw wheel on canvas
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = cx - 12;
    const innerR = outerR - 22;

    ctx.clearRect(0, 0, size, size);

    // Draw rainbow ring
    for (let angle = 0; angle < 360; angle += 1) {
      const startRad = ((angle - 90) * Math.PI) / 180;
      const endRad = ((angle + 1.5 - 90) * Math.PI) / 180;

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startRad, endRad);
      ctx.arc(cx, cy, innerR, endRad, startRad, true);
      ctx.closePath();

      ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.fill();
    }

    // Outer subtle border
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner ring border
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw indicator notch / pip for current angle
    const displayAngle = mode === 'hue' ? (value < 0 ? 360 + value : value) : selectedHueAngle;
    const notchRad = ((displayAngle - 90) * Math.PI) / 180;
    const midR = (outerR + innerR) / 2;
    const pipX = cx + Math.cos(notchRad) * midR;
    const pipY = cy + Math.sin(notchRad) * midR;

    ctx.beginPath();
    ctx.arc(pipX, pipY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [mode, value, selectedHueAngle]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const updateFromMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Angle clockwise from top (0 deg at top = Red in standard Plexus wheel orientation)
    let deg = Math.round((Math.atan2(y, x) * 180) / Math.PI + 90);
    if (deg < 0) deg += 360;
    deg = deg % 360;

    if (mode === 'hue') {
      // Map 0..360 to -180..180
      let hueVal = deg > 180 ? deg - 360 : deg;
      onChangeAngle(hueVal);
    } else {
      onChangeAngle(deg);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    updateFromMouse(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) {
      updateFromMouse(e);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const step = e.deltaY < 0 ? 1 : -1;
    if (mode === 'hue') {
      let next = Math.max(-180, Math.min(180, value + step));
      onChangeAngle(next);
    } else {
      let next = (selectedHueAngle + step + 360) % 360;
      onChangeAngle(next);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs font-semibold text-gray-300 mb-2">{title}</span>

      {/* Circular wheel container */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={176}
          height={176}
          className="absolute inset-0 cursor-pointer"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={onReset}
          onWheel={handleWheel}
        />

        {/* Center circle readout */}
        <div
          className="w-24 h-24 rounded-full bg-[#13151b] border border-[#232733] flex flex-col items-center justify-center shadow-inner cursor-pointer pointer-events-none select-none text-center px-1"
        >
          <span className="text-xl font-bold text-white tracking-tight leading-none mb-1">
            {centerPrimaryText}
          </span>
          <span className="text-[10px] text-gray-400 font-medium leading-tight">
            {centerSecondaryText}
          </span>
        </div>
      </div>

      {/* Caption text matching PlexusX */}
      <span className="text-[11px] text-gray-400 mt-2 text-center select-none">
        {caption}
      </span>
    </div>
  );
};
