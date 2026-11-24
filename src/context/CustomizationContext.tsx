import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'slate' | 'dark' | 'ash' | 'paper' | 'glass';

export interface BackdropPreset {
  id: string;
  name: string;
  url: string | null;
  desc: string;
  thumbnail: string;
}

// Built-in looping dynamic animated backdrops (SVG / canvas data URIs)
export const BACKDROP_PRESETS: BackdropPreset[] = [
  {
    id: 'none',
    name: 'None',
    url: null,
    desc: 'Pure matte solid background',
    thumbnail: 'linear-gradient(135deg, #0c0d10 0%, #13161c 100%)',
  },
  {
    id: 'cyber-grid',
    name: 'Cyber Grid',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><defs><linearGradient id='cg' x1='0' y1='0' x2='0' y2='1'><stop offset='0%25' stop-color='%2305070a'/><stop offset='60%25' stop-color='%2309101a'/><stop offset='100%25' stop-color='%2300f076' stop-opacity='0.25'/></linearGradient><pattern id='grid' width='80' height='80' patternUnits='userSpaceOnUse'><path d='M 80 0 L 0 0 0 80' fill='none' stroke='%2300f076' stroke-opacity='0.12' stroke-width='1.5'/></pattern></defs><rect width='100%25' height='100%25' fill='url(%23cg)'/><rect width='100%25' height='100%25' fill='url(%23grid)'/></svg>",
    desc: 'Neon wireframe sci-fi grid',
    thumbnail: 'linear-gradient(135deg, #09101a 0%, #00f07633 100%)',
  },
  {
    id: 'matrix-rain',
    name: 'Matrix Stream',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><defs><linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0%25' stop-color='%23020403'/><stop offset='100%25' stop-color='%2305140b'/></linearGradient><pattern id='dots' width='40' height='40' patternUnits='userSpaceOnUse'><circle cx='20' cy='10' r='1.5' fill='%2300f076' fill-opacity='0.25'/><circle cx='10' cy='30' r='1' fill='%2300f076' fill-opacity='0.4'/><circle cx='30' cy='25' r='2' fill='%2300f076' fill-opacity='0.15'/></pattern></defs><rect width='100%25' height='100%25' fill='url(%23bg)'/><rect width='100%25' height='100%25' fill='url(%23dots)'/></svg>",
    desc: 'Digital cascade green particles',
    thumbnail: 'linear-gradient(135deg, #020403 0%, #00f07644 100%)',
  },
  {
    id: 'cosmic-glow',
    name: 'Cosmic Nebula',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><defs><radialGradient id='c1' cx='30%25' cy='30%25' r='50%25'><stop offset='0%25' stop-color='%231f1338' stop-opacity='0.8'/><stop offset='100%25' stop-color='%2308070d' stop-opacity='0'/></radialGradient><radialGradient id='c2' cx='70%25' cy='70%25' r='50%25'><stop offset='0%25' stop-color='%230b2e2b' stop-opacity='0.6'/><stop offset='100%25' stop-color='%2308070d' stop-opacity='0'/></radialGradient></defs><rect width='100%25' height='100%25' fill='%2306070a'/><rect width='100%25' height='100%25' fill='url(%23c1)'/><rect width='100%25' height='100%25' fill='url(%23c2)'/></svg>",
    desc: 'Deep violet and emerald stellar dust',
    thumbnail: 'linear-gradient(135deg, #1f1338 0%, #0b2e2b 100%)',
  },
  {
    id: 'dark-aurora',
    name: 'Dark Aurora',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080'><defs><linearGradient id='aurora' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23071318'/><stop offset='50%25' stop-color='%230c2419'/><stop offset='100%25' stop-color='%23060a10'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23aurora)'/></svg>",
    desc: 'Subtle glowing polar light stream',
    thumbnail: 'linear-gradient(135deg, #071318 0%, #0c2419 100%)',
  },
];

export interface CustomizationContextType {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  guiOpacity: number; // 40..100
  setGuiOpacity: (o: number) => void;
  matteBlur: boolean;
  setMatteBlur: (b: boolean) => void;
  glassSheen: boolean;
  setGlassSheen: (s: boolean) => void;
  backdropUrl: string | null;
  backdropName: string;
  setBackdrop: (url: string | null, name: string) => void;
  backdropDim: number; // 0..90%
  setBackdropDim: (d: number) => void;
  backdropBlur: number; // 0..30px
  setBackdropBlur: (b: number) => void;
  resetToDefaults: () => void;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(
  undefined
);

export const CustomizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    return (localStorage.getItem('plexus_theme') as ThemeType) || 'slate';
  });

  const [guiOpacity, setGuiOpacityState] = useState<number>(() => {
    const saved = localStorage.getItem('plexus_gui_opacity');
    return saved ? parseInt(saved, 10) : 90;
  });

  const [matteBlur, setMatteBlurState] = useState<boolean>(() => {
    const saved = localStorage.getItem('plexus_matte_blur');
    return saved !== null ? saved === 'true' : true;
  });

  const [glassSheen, setGlassSheenState] = useState<boolean>(() => {
    const saved = localStorage.getItem('plexus_glass_sheen');
    return saved !== null ? saved === 'true' : true;
  });

  const [backdropUrl, setBackdropUrlState] = useState<string | null>(() => {
    return localStorage.getItem('plexus_backdrop_url') || null;
  });

  const [backdropName, setBackdropNameState] = useState<string>(() => {
    return localStorage.getItem('plexus_backdrop_name') || 'None';
  });

  const [backdropDim, setBackdropDimState] = useState<number>(() => {
    const saved = localStorage.getItem('plexus_backdrop_dim');
    return saved ? parseInt(saved, 10) : 35;
  });

  const [backdropBlur, setBackdropBlurState] = useState<number>(() => {
    const saved = localStorage.getItem('plexus_backdrop_blur');
    return saved ? parseInt(saved, 10) : 0;
  });

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    localStorage.setItem('plexus_theme', t);
  };

  const setGuiOpacity = (o: number) => {
    setGuiOpacityState(o);
    localStorage.setItem('plexus_gui_opacity', o.toString());
  };

  const setMatteBlur = (b: boolean) => {
    setMatteBlurState(b);
    localStorage.setItem('plexus_matte_blur', b ? 'true' : 'false');
  };

  const setGlassSheen = (s: boolean) => {
    setGlassSheenState(s);
    localStorage.setItem('plexus_glass_sheen', s ? 'true' : 'false');
  };

  const setBackdrop = (url: string | null, name: string) => {
    setBackdropUrlState(url);
    setBackdropNameState(name);
    if (url) {
      try {
        localStorage.setItem('plexus_backdrop_url', url);
      } catch (e) {
        console.warn('Backdrop too large for localStorage, kept in memory session:', e);
      }
    } else {
      localStorage.removeItem('plexus_backdrop_url');
    }
    localStorage.setItem('plexus_backdrop_name', name);
  };

  const setBackdropDim = (d: number) => {
    setBackdropDimState(d);
    localStorage.setItem('plexus_backdrop_dim', d.toString());
  };

  const setBackdropBlur = (b: number) => {
    setBackdropBlurState(b);
    localStorage.setItem('plexus_backdrop_blur', b.toString());
  };

  const resetToDefaults = () => {
    setTheme('slate');
    setGuiOpacity(90);
    setMatteBlur(true);
    setGlassSheen(true);
    setBackdrop(null, 'None');
    setBackdropDim(35);
    setBackdropBlur(0);
  };

  return (
    <CustomizationContext.Provider
      value={{
        theme,
        setTheme,
        guiOpacity,
        setGuiOpacity,
        matteBlur,
        setMatteBlur,
        glassSheen,
        setGlassSheen,
        backdropUrl,
        backdropName,
        setBackdrop,
        backdropDim,
        setBackdropDim,
        backdropBlur,
        setBackdropBlur,
        resetToDefaults,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
};

export const useCustomization = () => {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within CustomizationProvider');
  }
  return context;
};
