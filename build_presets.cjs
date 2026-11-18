const fs = require('fs');
const comm = JSON.parse(fs.readFileSync('src/data/community-presets.json', 'utf8'));
const ent = JSON.parse(fs.readFileSync('src/data/entitlement_decoded.json', 'utf8'));

const fileContent = `// Auto-generated exact presets from PlexusX installation

export interface CommunityPreset {
  id: string;
  kind: 'look' | 'crosshair' | 'display' | 'config';
  name: string;
  game: string;
  blurb: string;
  code: string;
  values: any;
  author: string;
  screenshot: string | null;
  copies: number;
  created_at: string;
}

export interface OfficialLook {
  game: string;
  name: string;
  subtitle: string;
  saturation: number;
  vibrance: number;
  brightness: number;
  gamma: number;
  contrast: number;
  temperature: number;
  glyph: string;
  art: string;
  highlights: number;
  shadows: number;
  blacks: number;
  whites: number;
  shadow_tint: number;
  highlight_tint: number;
  formula?: number;
  darken?: number;
  darken_hue?: number;
  hue_turn?: number;
  hue_turn_amount?: number;
  hue_complement?: number;
  colour_vision?: number;
  mix_percent?: number[];
}

export interface CrosshairDesign {
  id: string;
  name: string;
  family: string;
  size_tenths: number;
  thickness_tenths: number;
  gap_tenths: number;
  arm_top: boolean;
  arm_bottom: boolean;
  arm_left: boolean;
  arm_right: boolean;
  dot_tenths?: number;
  circle_tenths?: number;
  diagonal: boolean;
  outline: boolean;
}

export const COMMUNITY_PRESETS: CommunityPreset[] = ${JSON.stringify(comm.presets, null, 2)};

export const COMMUNITY_GAMES: string[] = ${JSON.stringify(comm.games, null, 2)};

export const OFFICIAL_LOOKS: OfficialLook[] = ${JSON.stringify(ent.payload.looks.presets, null, 2)};

export const OFFICIAL_CROSSHAIRS: CrosshairDesign[] = ${JSON.stringify(ent.payload.crosshair_designs.designs, null, 2)};
`;

fs.writeFileSync('src/data/presets.ts', fileContent, 'utf8');
console.log('src/data/presets.ts written successfully!');
