// Modern design system for RPM application
export const theme = {
  // Color Palette
  colors: {
    // Primary brand colors 
    primary: {
      main: '#3d5afe', // Vibrant blue for primary actions/brand
      light: '#8187ff',
      dark: '#0031ca',
      contrastText: '#ffffff',
    },
    
    // Secondary brand colors
    secondary: {
      main: '#4ecdc4', // Teal for secondary actions
      light: '#80fff7',
      dark: '#009b94',
      contrastText: '#ffffff',
    },
    
    // UI Colors
    ui: {
      background: '#f8faff', // Soft background for the app
      card: '#ffffff',
      hover: '#f0f4ff',
      divider: '#e0e6ed',
    },
    
    // Text Colors
    text: {
      primary: '#1e293b', // Dark slate for primary text
      secondary: '#64748b', // Lighter slate for secondary text
      disabled: '#94a3b8',
      hint: '#94a3b8',
    },
    
    // Status Colors
    status: {
      success: '#10b981', // Green
      warning: '#f59e0b', // Amber
      error: '#ef4444',   // Red
      info: '#3b82f6',    // Blue
    },
    
    // Task Priority Colors
    priority: {
      p0: '#ef4444',  // Critical - Red
      p1: '#f59e0b',  // High - Amber
      p2: '#3b82f6',  // Medium - Blue
      p3: '#64748b',  // Low - Slate
    },
    
    // Task Status Colors
    taskStatus: {
      todo: '#94a3b8',        // Gray
      in_progress: '#3b82f6', // Blue
      blocked: '#ef4444',     // Red
      done: '#10b981',        // Green
    },
    
    // Dark Theme Colors
    dark: {
      background: '#0f172a',
      card: '#1e293b',
      surface: '#334155',
      border: '#475569',
    },
  },
  
  // Typography scale
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
    
    // Font sizes using fluid typography approach (clamp for responsive sizes)
    h1: {
      fontWeight: 700,
      fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: "clamp(1.5rem, 3vw, 1.75rem)",
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: "clamp(1.125rem, 2vw, 1.25rem)",
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 500,
      textTransform: "none",
    },
  },
  
  // Spacing scale (for margins, paddings, etc.) in increments of 4px
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    xxl: '3rem',     // 48px
  },
  
  // Border radius scale
  borderRadius: {
    xs: '0.125rem',  // 2px
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',  // Fully rounded (for circles, pills)
  },
  
  // Shadows for elevation
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0px 4px 8px rgba(0, 0, 0, 0.12)',
    lg: '0px 8px 16px rgba(0, 0, 0, 0.08)',
    xl: '0px 16px 24px rgba(0, 0, 0, 0.12)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    medium: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Media breakpoints for responsive design
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
  },
};

// Common styled components helpers
export const flexCenter = `
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const flexBetween = `
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const flexColumn = `
  display: flex;
  flex-direction: column;
`;

// Helper for truncating text with ellipsis
export const textEllipsis = `
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Create media query helpers for responsive design
export const media = {
  xs: `@media (min-width: ${theme.breakpoints.xs})`,
  sm: `@media (min-width: ${theme.breakpoints.sm})`,
  md: `@media (min-width: ${theme.breakpoints.md})`,
  lg: `@media (min-width: ${theme.breakpoints.lg})`,
  xl: `@media (min-width: ${theme.breakpoints.xl})`,
  xxl: `@media (min-width: ${theme.breakpoints.xxl})`,
};

// Helper for using theme values in styled-components
export const getThemeValue = (path: string) => ({ theme }: any) => {
  const keys = path.split('.');
  return keys.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), theme);
};

export default theme;