// Design tokens — single source of truth for colours, fonts, spacing.
// Every page imports from here so if we ever rebrand, it's one file to change.

export const colours = {
    bg: '#fdf8f2',           // cream for page background
    primary: '#1a2744',      // navy for headings, primary text
    action: '#b85c38',       // terracotta for buttons, accents
    surface: '#f5edd8',      // light sand for card backgrounds
    border: '#d4c4a8',       // border lines
    muted: '#7a6a5a',        // secondary text
    text: '#1f1a16',         // body text
    error: '#b71c1c',        // error red
    errorBg: '#fdecea',      // error background
    success: '#2e7d32',      // confirm green
    accentLight: '#3d5a73',  // medium navy
    accentGold: '#c9a84c',   // secondary accent
}

export const fonts = {
    body: 'Geist, system-ui, -apple-system, sans-serif',
    mono: "'JetBrains Mono', monospace",
}

// Consistent radii across cards, inputs, buttons
export const radii = {
    sm: '3px',
    md: '6px',
    lg: '10px',
    xl: '12px',
}

// Common spacing values in px — keeps padding/margin consistent
export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '14px',
    lg: '20px',
    xl: '28px',
    xxl: '36px',
}