// ════════════════════════════════════════════════════════════════════════════
// WEALTHMETRIC — REDESIGNED GLOBAL_CSS
// Drop-in replacement for the GLOBAL_CSS constant in your App.jsx
// Design system: "Precision Capital" — slate surfaces, amber-gold accent,
// tabular numerals, editorial typography
// ════════════════════════════════════════════════════════════════════════════

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700;900&display=swap');

  /* ── Reset ── */
  *{box-sizing:border-box;margin:0;padding:0}

  /* ── Design tokens ── */
  :root{
    /* Surfaces */
    --bg-page:   #F7F5F0;    /* warm off-white — not GitHub grey */
    --bg-card:   #FFFFFF;
    --bg-raised: #FEFEFE;
    --bg-muted:  #F2F0EB;
    --bg-invert: #16140F;    /* near-black for hero / banner use */

    /* Borders */
    --border-subtle: #E4E0D8;
    --border-mid:    #C8C3B8;
    --border-strong: #A09890;

    /* Text */
    --text-primary:   #1A1714;
    --text-secondary: #5A5650;
    --text-tertiary:  #8A8480;
    --text-invert:    #F7F5F0;

    /* Accent — warm amber-gold (replaces flat teal) */
    --accent:         #C17F24;
    --accent-light:   #F5E6C8;
    --accent-dim:     #8A5A18;
    --accent-glow:    rgba(193,127,36,0.15);

    /* Functional */
    --green:    #2A7A4B;
    --green-bg: #EAF5EE;
    --red:      #B83232;
    --red-bg:   #FDEAEA;
    --blue:     #1D5FAA;
    --blue-bg:  #E8F0FA;
    --purple:   #6B3FA0;

    /* Number rendering */
    --font-num: 'DM Mono', 'Roboto Mono', monospace;
    --font-body:'DM Sans', system-ui, sans-serif;
    --font-display:'Playfair Display', Georgia, serif;

    /* Radius */
    --r-sm: 6px;
    --r-md: 10px;
    --r-lg: 16px;
    --r-xl: 22px;

    /* Shadow */
    --shadow-card: 0 1px 3px rgba(26,23,20,0.06), 0 1px 12px rgba(26,23,20,0.04);
    --shadow-raised:0 2px 8px rgba(26,23,20,0.08), 0 0 0 1px rgba(26,23,20,0.04);
  }

  /* ── Base ── */
  body{
    background: var(--bg-page);
    font-family: var(--font-body);
    color: var(--text-primary);
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Range inputs ── */
  input[type=range]{
    -webkit-appearance:none;
    width:100%;height:4px;
    background: var(--border-subtle);
    border-radius:2px;outline:none
  }
  input[type=range]::-webkit-slider-thumb{
    -webkit-appearance:none;
    width:18px;height:18px;border-radius:50%;
    background: var(--accent);
    cursor:pointer;
    border:2.5px solid var(--bg-card);
    box-shadow:0 1px 6px rgba(193,127,36,0.35)
  }

  /* ── Text inputs ── */
  input[type=number],input[type=month],input[type=text]{
    background: var(--bg-card);
    border: 1.5px solid var(--border-subtle);
    border-radius: var(--r-md);
    color: var(--text-primary);
    padding:9px 13px;
    font-size:14px;width:100%;outline:none;
    font-family: var(--font-body);
    transition: border-color 0.15s, box-shadow 0.15s
  }
  input[type=number]:focus,input[type=month]:focus,input[type=text]:focus{
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow)
  }

  /* ── Select ── */
  select{
    background: var(--bg-card);
    border: 1.5px solid var(--border-subtle);
    border-radius: var(--r-md);
    color: var(--text-primary);
    padding:9px 13px;
    font-size:14px;outline:none;
    font-family: var(--font-body);
    transition: border-color 0.15s
  }
  select:focus{
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow)
  }

  /* ── Card ──
     The core surface. Warm white with a subtle shadow — no harsh grey border. */
  .card{
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-lg);
    padding: 20px 22px;
    box-shadow: var(--shadow-card);
    transition: box-shadow 0.2s
  }

  /* ── Pill / toggle buttons ── */
  .pill{
    cursor:pointer;
    padding:6px 14px;
    border-radius: var(--r-sm);
    font-size:12px;font-weight:600;
    transition:all 0.15s;
    border: 1.5px solid var(--border-subtle);
    white-space:nowrap;user-select:none;
    background: var(--bg-card);
    color: var(--text-secondary);
    letter-spacing:0.01em
  }
  .pill.on{
    background: var(--accent);
    color: #FFFFFF;
    border-color: var(--accent);
    box-shadow: 0 2px 8px rgba(193,127,36,0.3)
  }
  .pill.off:hover{
    color: var(--text-primary);
    border-color: var(--accent);
    background: var(--accent-light)
  }

  /* ── Asset pills ── */
  .asset-pill{
    cursor:pointer;padding:5px 12px;border-radius:20px;
    font-size:12px;font-weight:600;
    transition:all 0.15s;
    border:1.5px solid transparent;
    white-space:nowrap;user-select:none
  }

  /* ── Labels (uppercase metadata) ── */
  .lbl{
    font-size:10px;
    color: var(--text-tertiary);
    letter-spacing:1.8px;
    text-transform:uppercase;
    font-weight:600;
    margin-bottom:8px
  }

  /* ── Toggle switch ── */
  .toggle-sw{
    width:40px;height:22px;border-radius:11px;
    transition:background 0.2s;
    display:flex;align-items:center;padding:3px;
    cursor:pointer;flex-shrink:0
  }
  .toggle-kn{
    width:16px;height:16px;border-radius:50%;
    background:white;
    transition:transform 0.2s;
    box-shadow:0 1px 3px rgba(26,23,20,0.25)
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:var(--bg-page)}
  ::-webkit-scrollbar-thumb{background:var(--border-mid);border-radius:3px}
  ::-webkit-scrollbar-thumb:hover{background:var(--border-strong)}

  /* ── Nav tabs ── */
  .nav-tab{
    cursor:pointer;
    padding:8px 18px;
    border-radius: var(--r-md);
    font-size:13px;font-weight:600;
    transition:all 0.18s;
    display:flex;align-items:center;gap:7px;
    white-space:nowrap;user-select:none;
    letter-spacing:0.01em
  }
  .nav-tab.active{
    background: var(--accent);
    color:#FFFFFF;
    box-shadow:0 2px 10px rgba(193,127,36,0.35)
  }
  .nav-tab.inactive{
    color: var(--text-secondary);
    border:1.5px solid var(--border-subtle);
    background: var(--bg-card)
  }
  .nav-tab.inactive:hover{
    color: var(--text-primary);
    border-color: var(--accent);
    background: var(--accent-light)
  }

  /* ── Range track helper ── */
  .range-track{position:relative;height:6px;background:var(--border-subtle);border-radius:3px;margin:8px 0}
  .range-fill{position:absolute;height:100%;background:var(--accent);border-radius:3px;pointer-events:none}
  .dual-thumb{position:absolute;width:18px;height:18px;background:var(--accent);border-radius:50%;top:50%;transform:translate(-50%,-50%);cursor:pointer;border:2.5px solid var(--bg-card);box-shadow:0 1px 6px rgba(193,127,36,0.4)}

  /* ── Number display helper ──
     Use on any element showing a ₹ value for tabular mono rendering */
  .num{
    font-family: var(--font-num);
    font-variant-numeric: tabular-nums;
    letter-spacing:-0.02em
  }

  /* ── Stat banner (used in results header strips) ── */
  .stat-banner{
    background: var(--bg-invert);
    border: 1px solid rgba(193,127,36,0.2);
    border-radius: var(--r-lg);
    padding:16px 22px
  }

  /* ── Hero gradient text (for display numbers) ── */
  .hero-num{
    font-family: var(--font-num);
    font-variant-numeric: tabular-nums;
    font-weight:700;
    background: linear-gradient(135deg, var(--accent) 0%, #E8A830 60%, #F5C842 100%);
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    background-clip:text
  }
`;

// ════════════════════════════════════════════════════════════════════════════
// UPDATED DESIGN TOKENS — use these to update your inline styles
// ════════════════════════════════════════════════════════════════════════════

export const T = {
  // The new accent replaces #0d9373 everywhere
  accent:       'var(--accent)',        // was #0d9373
  accentLight:  'var(--accent-light)',  // was #f0fdf9
  accentDim:    'var(--accent-dim)',    // was #059669

  // Surfaces
  bgPage:   'var(--bg-page)',    // was #f6f8fa
  bgCard:   'var(--bg-card)',    // was #ffffff
  bgMuted:  'var(--bg-muted)',   // was #f6f8fa (alt)
  bgInvert: 'var(--bg-invert)', // was #0d1a14

  // Text
  textPrimary:   'var(--text-primary)',   // was #1f2328
  textSecondary: 'var(--text-secondary)', // was #444c56
  textTertiary:  'var(--text-tertiary)',  // was #656d76

  // Borders
  borderSubtle: 'var(--border-subtle)', // was #d0d7de
  borderMid:    'var(--border-mid)',

  // Semantic (keep these close to original hues)
  green:  '#2A7A4B',   // was #34d399 (made deeper)
  greenBg:'#EAF5EE',
  red:    '#B83232',
  redBg:  '#FDEAEA',
  blue:   '#1D5FAA',
  blueBg: '#E8F0FA',
  purple: '#6B3FA0',
  amber:  'var(--accent)',

  // Typography
  fontBody:    "var(--font-body)",
  fontNum:     "var(--font-num)",    // for ₹ amounts
  fontDisplay: "var(--font-display)",// for hero headlines

  // Radius
  rSm: 'var(--r-sm)',
  rMd: 'var(--r-md)',
  rLg: 'var(--r-lg)',
};

// ════════════════════════════════════════════════════════════════════════════
// CHART COLORS — replace your chart stroke/fill colors
// ════════════════════════════════════════════════════════════════════════════

export const CHART = {
  primary:   '#C17F24',   // amber-gold  (was #0d9373 teal)
  secondary: '#1D5FAA',   // slate blue  (was #3b82f6)
  tertiary:  '#6B3FA0',   // warm purple (was #a78bfa)
  quaternary:'#B83232',   // deep red    (was #ef4444)
  quinary:   '#2A7A4B',   // forest green(was #34d399)
  neutral:   '#8A8480',   // warm grey   (was #656d76)
  grid:      '#E4E0D8',   // warm border (was #d0d7de)
  tooltip: {
    bg:     '#1A1714',
    border: '#3A3530',
    text:   '#F7F5F0',
  },
};

// ════════════════════════════════════════════════════════════════════════════
// TOP-LEVEL CHANGES TO MAKE IN YOUR CODE
// Search-replace guide
// ════════════════════════════════════════════════════════════════════════════

/*
  1. FONT PAIR
     Replace: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@700;800&display=swap'
     With: the @import already in GLOBAL_CSS above (DM Sans + DM Mono + Playfair Display)

  2. BODY TEXT FONT
     Replace: font-family:'Inter',sans-serif
     With:    font-family: var(--font-body)

  3. DISPLAY/HEADING FONT (was Syne)
     Replace: fontFamily:"Syne,sans-serif"   and  fontFamily:"Syne"
     With:    fontFamily:"var(--font-display)"
     NOTE: Use Playfair Display sparingly — hero headline, logo, big stat numbers only.
           For section headers and card titles, just use DM Sans 600 weight.

  4. NUMBER FONT
     Any element showing a ₹ amount (formatINR output) should use:
       fontFamily:"var(--font-num)", fontVariantNumeric:"tabular-nums"
     This makes rupee amounts feel like a Bloomberg terminal.

  5. PRIMARY COLOR: #0d9373  →  var(--accent) / #C17F24
  6. LIGHT GREEN BG: #f0fdf9  →  var(--accent-light) / #F5E6C8
  7. DARKER GREEN:  #059669  →  var(--accent-dim) / #8A5A18
  8. PAGE BG:  #f6f8fa  →  var(--bg-page) / #F7F5F0
  9. CARD BG:  #0d1a14  →  var(--bg-invert) / #16140F  (dark card interiors)
  10.TEXT: #1f2328 → var(--text-primary), #444c56 → var(--text-secondary)
  11.BORDER: #d0d7de → var(--border-subtle)

  KEEP THESE AS-IS (they work well with the new palette):
  - #3b82f6 blue (for SIP/secondary accent)
  - #f59e0b amber (already close to new accent, can unify)
  - #a78bfa purple
  - #ef4444 red
  - Chart gradients — just swap stopColor to #C17F24

  NAV BAR:
  - Change background from #ffffff + border to:
    background: var(--bg-card); border-bottom: 1px solid var(--border-subtle);
    box-shadow: 0 1px 0 var(--border-subtle), 0 4px 16px rgba(26,23,20,0.06);

  HERO SECTION (HomePage):
  - background radial gradient: change #10b98115 → rgba(193,127,36,0.08)
  - h1 gradient: from #f0f6fc/c3f8e0/10b981 → to #1A1714/#8A5A18/#C17F24
  - The live calculator box:
    border: 1px solid var(--border-mid)
    box-shadow: 0 20px 60px rgba(26,23,20,0.12), 0 0 0 1px rgba(193,127,36,0.12)
    background prefix: #fefefe (not dark)

  STAT CARDS (dark strips like ".stat-banner"):
  - background: var(--bg-invert)  (very dark, near black)
  - border: 1px solid rgba(193,127,36,0.18)
  - Text values: color: var(--accent) for the primary numbers

  CARD HOVER:
  - onMouseEnter borderColor → T.accent (amber border glow)
  - box-shadow: 0 16px 40px rgba(26,23,20,0.10), 0 0 0 1px rgba(193,127,36,0.20)
*/
