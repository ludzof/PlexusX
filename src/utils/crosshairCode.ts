import { CrosshairSettings } from '../types/electron';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ#';
const PREFIX = 'PXC-';

// Character normalization table matching PlexusX ShareCodeText.Normalize
export function normalizeShareCodeText(s: string): string {
  let result = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    // Ignore invisible characters
    if (
      code === 0x00a0 ||
      code === 0x200b ||
      code === 0x200c ||
      code === 0x200d ||
      code === 0x2060 ||
      code === 0xfeff
    ) {
      continue;
    }
    // Fullwidth ASCII conversion
    if (code >= 0xff01 && code <= 0xff5e) {
      result += String.fromCharCode(code - 0xfee0);
    } else {
      result += s[i];
    }
  }
  return result;
}

function checksum(body: string): number {
  let num = 0;
  for (let i = 0; i < body.length; i++) {
    const idx = ALPHABET.indexOf(body[i]);
    if (idx < 0) return -1;
    num += (idx + 1) * (2 * i + 1);
  }
  return num % 32;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const int = parseInt(clean, 16);
  if (isNaN(int)) return [0, 240, 118];
  return [(int >> 16) & 0xff, (int >> 8) & 0xff, int & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toH = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

export function encodeCrosshairCode(c: CrosshairSettings): string {
  const armTop = c.armTop ?? (c.shape === 'cross');
  const armBottom = c.armBottom ?? (c.shape === 'cross' || c.shape === 't');
  const armLeft = c.armLeft ?? (c.shape === 'cross' || c.shape === 't' || c.chevron);
  const armRight = c.armRight ?? (c.shape === 'cross' || c.shape === 't' || c.chevron);
  const showCircle = c.showCircle ?? (c.shape === 'circle');
  const centreDot = c.centreDot ?? (c.shape === 'dot');
  const outline = c.outline ?? true;
  const rotation = Math.max(0, Math.min(90, c.rotation ?? (c.diagonal ? 45 : 0)));
  const chevron = c.chevron ?? false;

  let flags = 0;
  if (armTop) flags |= 1;
  if (armBottom) flags |= 2;
  if (armLeft) flags |= 4;
  if (armRight) flags |= 8;
  if (showCircle) flags |= 16;
  if (centreDot) flags |= 32;
  if (outline) flags |= 64;
  if (rotation === 45) flags |= 128;
  if (chevron) flags |= 256;

  const colour = c.colour || c.color || '#00ff66';
  const [cr, cg, cb] = hexToRgb(colour);
  const outlineColour = c.outlineColour || '#000000';
  const [or, og, ob] = hexToRgb(outlineColour);

  const outlineThicknessTenths = Math.round((c.outlineThickness ?? 1) * 10);
  const offsetX = clamp(Math.round(c.offsetX ?? 0), -200, 200);
  const offsetY = clamp(Math.round(c.offsetY ?? 0), -200, 200);
  const dotOpacity = clamp(Math.round(c.dotOpacity ?? 100), 10, 100);
  const outlineColourInt = (or << 16) | (og << 8) | ob;

  const flagLong = chevron || (rotation !== 0 && rotation !== 45) || dotOpacity !== 100 || outlineColourInt !== 0;
  const flagMid = flagLong || rotation === 45 || outlineThicknessTenths !== 10 || offsetX !== 0 || offsetY !== 0;

  const array: number[] = [
    flags,
    clamp(Math.round(c.size * 10), 0, 1023),
    clamp(Math.round(c.thickness * 10), 0, 1023),
    clamp(Math.round(c.gap * 10), 0, 1023),
    clamp(Math.round((c.dotSize ?? c.thickness) * 10), 0, 1023),
    clamp(Math.round((c.circleRadius ?? (c.gap + c.size)) * 10), 0, 1023),
    clamp(Math.round(c.opacity ?? 100), 0, 100),
    cr,
    cg,
    cb,
    clamp(outlineThicknessTenths, 0, 40),
    offsetX + 200,
    offsetY + 200,
    rotation,
    dotOpacity,
    or,
    og,
    ob,
  ];

  const count = flagLong ? 18 : flagMid ? 13 : 10;
  let body = '';
  for (let i = 0; i < count; i++) {
    const val = clamp(array[i], 0, 1023);
    body += ALPHABET[Math.floor(val / 32)];
    body += ALPHABET[val % 32];
  }

  const cs = checksum(body);
  body += ALPHABET[cs];
  return PREFIX + body;
}

export function tryDecodeCrosshairCode(code: string): CrosshairSettings | null {
  if (!code || typeof code !== 'string') return null;
  const normalized = normalizeShareCodeText(code).trim().toUpperCase();
  if (!normalized.startsWith(PREFIX)) return null;

  const body = normalized.substring(PREFIX.length);
  let valueCount = 0;
  if (body.length === 21) valueCount = 10;
  else if (body.length === 27) valueCount = 13;
  else if (body.length === 37) valueCount = 18;
  else return null;

  for (let i = 0; i < body.length; i++) {
    if (ALPHABET.indexOf(body[i]) < 0) return null;
  }

  const expectedCs = checksum(body.substring(0, valueCount * 2));
  const actualCs = ALPHABET.indexOf(body[valueCount * 2]);
  if (expectedCs !== actualCs) return null;

  const values: number[] = [];
  for (let i = 0; i < valueCount; i++) {
    const hi = ALPHABET.indexOf(body[i * 2]);
    const lo = ALPHABET.indexOf(body[i * 2 + 1]);
    values.push(hi * 32 + lo);
  }

  const flags = values[0];
  const armTop = (flags & 1) !== 0;
  const armBottom = (flags & 2) !== 0;
  const armLeft = (flags & 4) !== 0;
  const armRight = (flags & 8) !== 0;
  const showCircle = (flags & 16) !== 0;
  const centreDot = (flags & 32) !== 0;
  const outline = (flags & 64) !== 0;
  const diagonal = (flags & 128) !== 0;

  const size = Math.round(clamp(values[1], 5, 300)) / 10;
  const thickness = Math.round(clamp(values[2], 5, 100)) / 10;
  const gap = Math.round(clamp(values[3], 0, 300)) / 10;
  const dotSize = Math.round(clamp(values[4], 5, 100)) / 10;
  const circleRadius = Math.round(clamp(values[5], 10, 400)) / 10;
  const opacity = clamp(values[6], 10, 100);
  const colour = rgbToHex(values[7], values[8], values[9]);

  let outlineThickness = 1;
  let offsetX = 0;
  let offsetY = 0;
  if (valueCount >= 13) {
    outlineThickness = Math.round(clamp(values[10], 0, 40)) / 10;
    offsetX = clamp(values[11] - 200, -200, 200);
    offsetY = clamp(values[12] - 200, -200, 200);
  }

  let chevron = false;
  let rotation = diagonal ? 45 : 0;
  let dotOpacity = 100;
  let outlineColour = '#000000';
  if (valueCount === 18) {
    chevron = (flags & 256) !== 0;
    rotation = clamp(values[13], 0, 90);
    dotOpacity = clamp(values[14], 10, 100);
    outlineColour = rgbToHex(values[15], values[16], values[17]);
  }

  return {
    enabled: true,
    shape: showCircle && !armLeft ? 'circle' : (!armTop && armBottom && armLeft && armRight) ? 't' : chevron ? 'chevron' : (!armTop && !armBottom && !armLeft && !armRight && centreDot) ? 'dot' : 'cross',
    armTop,
    armBottom,
    armLeft,
    armRight,
    showCircle,
    centreDot,
    outline,
    diagonal: rotation === 45,
    chevron,
    size,
    thickness,
    gap,
    dotSize,
    dotOpacity,
    circleRadius,
    rotation,
    opacity,
    colour,
    color: colour,
    outlineThickness,
    outlineColour,
    offsetX,
    offsetY,
  };
}
