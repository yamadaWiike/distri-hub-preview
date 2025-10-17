// UI-related constants
export const COLORS = {
  PRIMARY: 'blue',
  SECONDARY: 'gray',
  SUCCESS: 'green',
  WARNING: 'yellow',
  ERROR: 'red',
  INFO: 'cyan'
} as const;

export const SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl'
} as const;

export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px', 
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px'
} as const;

export const Z_INDEX = {
  DROPDOWN: 50,
  MODAL: 100,
  NOTIFICATION: 200,
  TOOLTIP: 300
} as const;

export const ANIMATION_DURATION = {
  FAST: '150ms',
  NORMAL: '300ms',
  SLOW: '500ms'
} as const;