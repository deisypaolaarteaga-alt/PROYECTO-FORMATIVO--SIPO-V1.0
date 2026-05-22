// ============================================
// SIPO — Design Tokens
// Arquitectura Técnica Refinada — Colombia 2025
// ============================================

export const colors = {
  // Azules Steel — autoridad, estructura, confianza
  steelDark:    '#1C2B3A',
  steelMid:     '#2E4A63',
  steelLight:   '#8BA3B8',
  steelFog:     '#E6EFF8',

  // Naranja Óxido — acción, construcción, energía
  burnOrange:   '#C84B1A',
  burnLight:    '#D9652E',
  burnPale:     '#FAF0EB',
  burnDeep:     '#A83A14',

  // Dorado Arena — destacado, valor, resultado
  goldSand:     '#E8A937',
  goldLight:    '#F0C060',
  goldPale:     '#FEF9EC',
  goldDeep:     '#B8821A',

  // Neutros cálidos — papel, concreto, arena
  sand:         '#F4F2EE',
  concrete:     '#E2DDD6',
  mortar:       '#C8C0B5',
  stone:        '#7A7265',
  charcoal:     '#3D3530',
  ink:          '#1C1814',
  white:        '#FFFFFF',

  // Semánticos
  successBg:    '#E8F4E8',
  successText:  '#1A5C2A',
  successBorder:'#B8D9B8',

  warningBg:    '#FEF9EC',
  warningText:  '#8C5E00',
  warningBorder:'#E8C870',

  infoBg:       '#E6EFF8',
  infoText:     '#1C4A72',
  infoBorder:   '#A8C4DC',

  dangerBg:     '#FDE8E8',
  dangerText:   '#991B1B',
  dangerBorder: '#F0B8B8',

  draftBg:      '#F0F0EE',
  draftText:    '#5A5248',
  draftBorder:  '#D0CCC6',
} as const;

export const spacing = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  6:  '24px',
  8:  '32px',
  12: '48px',
  16: '64px',
  24: '96px',
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '20px', // badges only
} as const;

export const typography = {
  fontFamily: {
    sans:    "'IBM Plex Sans', var(--font-inter), system-ui, sans-serif",
    display: "'IBM Plex Sans', system-ui, sans-serif",
    mono:    "'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace",
  },
  fontSize: {
    xs:   ['11px', { lineHeight: '16px' }],
    sm:   ['13px', { lineHeight: '20px' }],
    base: ['15px', { lineHeight: '24px' }],
    lg:   ['17px', { lineHeight: '26px' }],
    xl:   ['20px', { lineHeight: '28px' }],
    '2xl':['28px', { lineHeight: '36px' }],
    '3xl':['36px', { lineHeight: '44px' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
  },
} as const;

export const transitions = {
  fast: '150ms ease-out',
  normal: '200ms ease-out',
} as const;

// Accent theme options — 4 colores del sistema SIPO
export const ACCENT_THEMES = {
  orange: { primary: '#C84B1A', hover: '#A83A14', pale: '#FAF0EB', label: 'Naranja Óxido' },
  gold:   { primary: '#B8821A', hover: '#E8A937', pale: '#FEF9EC', label: 'Dorado Arena' },
  blue:   { primary: '#1E5FA0', hover: '#3A78C0', pale: '#E6EFF8', label: 'Azul Plano' },
  green:  { primary: '#2D7A45', hover: '#3A9A58', pale: '#E8F4E8', label: 'Verde Topografía' },
} as const;

export type AccentTheme = keyof typeof ACCENT_THEMES;
