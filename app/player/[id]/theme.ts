export const theme = {
  colors: {
    primary: {
      bg: '#1a1f2e',
      secondary: '#252a3a',
      card: '#2a3142',
    },
    accent: {
      blue: '#4a90e2',
      cyan: '#5dd3e8',
      purple: '#8b5fd6',
      dark: '#1e2330',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b4c0d1',
      muted: '#7c8db5',
      accent: '#5dd3e8',
    },
    surface: {
      dark: '#1a1f2e',
      card: '#2a3142',
      border: '#3a4155',
      hover: '#343a4d',
    },
    status: {
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  gradients: {
    background: 'linear-gradient(135deg, #1a1f2e 0%, #252a3a 100%)',
    card: 'linear-gradient(145deg, #2a3142, #232937)',
    accent: 'linear-gradient(145deg, #4a90e2, #5dd3e8)',
    header: 'linear-gradient(145deg, #343a4d, #2a3142)',
    stat: 'linear-gradient(145deg, #2a3142, #232937)',
  },
  shadows: {
    card: '0 4px 20px rgba(0, 0, 0, 0.3)',
    cardHover: '0 6px 25px rgba(0, 0, 0, 0.4)',
    header: '0 8px 30px rgba(0, 0, 0, 0.4)',
    stat: '0 2px 10px rgba(0, 0, 0, 0.2)',
    inset: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(93, 211, 232, 0.3)',
  },
  borderRadius: {
    small: '6px',
    medium: '8px',
    large: '12px',
    xl: '16px',
    round: '50%',
    pill: '24px',
  },
  borders: {
    card: '1px solid #3a4155',
    accent: '1px solid #5dd3e8',
    subtle: '1px solid #2a3142',
  },
  fonts: {
    primary: "'Inter', 'Segoe UI', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1200px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
  },
};

export type Theme = typeof theme; 