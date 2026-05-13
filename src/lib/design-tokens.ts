// ============================================
// SIPO — Design Tokens
// Paleta de construcción profesional Colombia
// ============================================

export const colors = {
  // Azules — autoridad, estructura, confianza
  steelDark:    '#1C2B3A',
  steelMid:     '#2E4A63',
  steelLight:   '#8BA3B8',
  steelFog:     '#E6EFF8',

  // Naranjas — energía, construcción, acción
  burnOrange:   '#E8571A',
  burnLight:    '#F07848',
  burnPale:     '#FFF0E8',
  burnDeep:     '#C44A10',

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

  warningBg:    '#FFF8E6',
  warningText:  '#7A5800',
  warningBorder:'#F0D080',

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
    sans: "var(--font-inter), 'Inter', system-ui, sans-serif",
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

// Accent theme options
export const ACCENT_THEMES = {
  orange:  { primary: '#E8571A', hover: '#F07848', pale: '#FFF0E8', label: 'Naranja Obra' },
  blue:    { primary: '#1E6FB8', hover: '#3A8AD4', pale: '#E6EFF8', label: 'Azul Plano' },
  green:   { primary: '#2D7A45', hover: '#3A9A58', pale: '#E8F4E8', label: 'Verde Topografía' },
  gray:    { primary: '#4A5568', hover: '#5A6578', pale: '#F0F0EE', label: 'Gris Acero' },
} as const;

export type AccentTheme = keyof typeof ACCENT_THEMES;
