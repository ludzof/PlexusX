import React from 'react';
import { CrosshairSettings } from '../types/electron';

interface CrosshairRendererProps {
  settings: CrosshairSettings;
  previewWidth?: number;
  previewHeight?: number;
  showCenterGrid?: boolean;
}

export const CrosshairRenderer: React.FC<CrosshairRendererProps> = ({
  settings,
  previewWidth = 600,
  previewHeight = 400,
  showCenterGrid = false,
}) => {
  const {
    size = 8,
    thickness = 2,
    gap = 4,
    dotSize = 2,
    dotOpacity = 100,
    circleRadius = 12,
    rotation = 0,
    opacity = 100,
    colour = '#00ff66',
    color = '#00ff66',
    outline = true,
    outlineThickness = 1,
    outlineColour = '#000000',
    offsetX = 0,
    offsetY = 0,
    armTop = true,
    armBottom = true,
    armLeft = true,
    armRight = true,
    centreDot = false,
    showCircle = false,
    chevron = false,
    imagePath = null,
    imageScalePercent = 100,
  } = settings;

  const activeColor = colour || color || '#00ff66';
  const effectiveOutlineColour = outlineColour || '#000000';
  const mainOpacity = (opacity ?? 100) / 100;
  const effectiveDotOpacity = mainOpacity * ((dotOpacity ?? 100) / 100);

  const cx = previewWidth / 2;
  const cy = previewHeight / 2;
  const halfThick = thickness / 2;
  const ot = outline ? outlineThickness : 0;

  return (
    <svg
      width={previewWidth}
      height={previewHeight}
      className="pointer-events-none select-none overflow-hidden"
      style={{ shapeRendering: 'crispEdges' }}
    >
      {showCenterGrid && (
        <g stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1">
          <line x1={cx} y1={0} x2={cx} y2={previewHeight} strokeDasharray="3 3" />
          <line x1={0} y1={cy} x2={previewWidth} y2={cy} strokeDasharray="3 3" />
        </g>
      )}

      {/* Target Crosshair Centered at cx + offsetX, cy + offsetY with Rotation */}
      <g
        transform={`translate(${cx + offsetX}, ${cy + offsetY}) rotate(${rotation})`}
      >
        {/* If Image Crosshair is active */}
        {imagePath ? (
          <image
            href={imagePath}
            x={(-previewWidth * (imageScalePercent / 100)) / 2}
            y={(-previewHeight * (imageScalePercent / 100)) / 2}
            width={previewWidth * (imageScalePercent / 100)}
            height={previewHeight * (imageScalePercent / 100)}
            opacity={mainOpacity}
          />
        ) : (
          <>
            {/* 1. OUTLINE LAYER (drawn behind) */}
            {ot > 0 && (
              <g fill={effectiveOutlineColour} stroke={effectiveOutlineColour}>
                {/* Circle Ring Outline */}
                {showCircle && (
                  <circle
                    cx={0}
                    cy={0}
                    r={circleRadius}
                    fill="none"
                    stroke={effectiveOutlineColour}
                    strokeWidth={thickness + ot * 2}
                    style={{ shapeRendering: 'geometricPrecision' }}
                  />
                )}

                {/* Left Arm Outline */}
                {armLeft && (
                  chevron ? (
                    <g transform="rotate(-45)">
                      <rect
                        x={-(gap + size) - ot}
                        y={-halfThick - ot}
                        width={size + ot * 2}
                        height={thickness + ot * 2}
                      />
                    </g>
                  ) : (
                    <rect
                      x={-(gap + size) - ot}
                      y={-halfThick - ot}
                      width={size + ot * 2}
                      height={thickness + ot * 2}
                    />
                  )
                )}

                {/* Right Arm Outline */}
                {armRight && (
                  chevron ? (
                    <g transform="rotate(45)">
                      <rect
                        x={gap - ot}
                        y={-halfThick - ot}
                        width={size + ot * 2}
                        height={thickness + ot * 2}
                      />
                    </g>
                  ) : (
                    <rect
                      x={gap - ot}
                      y={-halfThick - ot}
                      width={size + ot * 2}
                      height={thickness + ot * 2}
                    />
                  )
                )}

                {/* Top Arm Outline */}
                {armTop && !chevron && (
                  <rect
                    x={-halfThick - ot}
                    y={-(gap + size) - ot}
                    width={thickness + ot * 2}
                    height={size + ot * 2}
                  />
                )}

                {/* Bottom Arm Outline */}
                {armBottom && !chevron && (
                  <rect
                    x={-halfThick - ot}
                    y={gap - ot}
                    width={thickness + ot * 2}
                    height={size + ot * 2}
                  />
                )}

                {/* Center Dot Outline */}
                {centreDot && (
                  <rect
                    x={-dotSize / 2 - ot}
                    y={-dotSize / 2 - ot}
                    width={dotSize + ot * 2}
                    height={dotSize + ot * 2}
                    opacity={(dotOpacity ?? 100) / 100}
                  />
                )}
              </g>
            )}

            {/* 2. FOREGROUND COLOR LAYER */}
            <g fill={activeColor} stroke={activeColor}>
              {/* Circle Ring */}
              {showCircle && (
                <circle
                  cx={0}
                  cy={0}
                  r={circleRadius}
                  fill="none"
                  stroke={activeColor}
                  strokeWidth={thickness}
                  opacity={mainOpacity}
                  style={{ shapeRendering: 'geometricPrecision' }}
                />
              )}

              {/* Left Arm */}
              {armLeft && (
                chevron ? (
                  <g transform="rotate(-45)">
                    <rect
                      x={-(gap + size)}
                      y={-halfThick}
                      width={size}
                      height={thickness}
                      opacity={mainOpacity}
                    />
                  </g>
                ) : (
                  <rect
                    x={-(gap + size)}
                    y={-halfThick}
                    width={size}
                    height={thickness}
                    opacity={mainOpacity}
                  />
                )
              )}

              {/* Right Arm */}
              {armRight && (
                chevron ? (
                  <g transform="rotate(45)">
                    <rect
                      x={gap}
                      y={-halfThick}
                      width={size}
                      height={thickness}
                      opacity={mainOpacity}
                    />
                  </g>
                ) : (
                  <rect
                    x={gap}
                    y={-halfThick}
                    width={size}
                    height={thickness}
                    opacity={mainOpacity}
                  />
                )
              )}

              {/* Top Arm */}
              {armTop && !chevron && (
                <rect
                  x={-halfThick}
                  y={-(gap + size)}
                  width={thickness}
                  height={size}
                  opacity={mainOpacity}
                />
              )}

              {/* Bottom Arm */}
              {armBottom && !chevron && (
                <rect
                  x={-halfThick}
                  y={gap}
                  width={thickness}
                  height={size}
                  opacity={mainOpacity}
                />
              )}

              {/* Center Dot */}
              {centreDot && (
                <rect
                  x={-dotSize / 2}
                  y={-dotSize / 2}
                  width={dotSize}
                  height={dotSize}
                  opacity={effectiveDotOpacity}
                />
              )}
            </g>
          </>
        )}
      </g>
    </svg>
  );
};
