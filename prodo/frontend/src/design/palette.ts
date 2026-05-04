/**
 * CMD Design System — Raw Design Tokens
 *
 * Single source of truth for ALL hex color values, font stacks, and
 * font-size scale used across the app.
 * Components that need raw values (Canvas 2D, inline styles, Recharts props)
 * import from here. Tailwind-class patterns live in tokens.ts.
 *
 * Mirrors the CMD reference at /home/rohith/CMD.
 */

/* ── Font Stacks (for inline styles / Canvas 2D) ──────── */

/** Geist — primary UI font (body, labels, buttons). Weights: 400/500/600/700. */
export const FONT_SANS  = "'Geist', system-ui, -apple-system, sans-serif";

/** Geist Mono — numeric data, chart labels, KPIs, percentages. Weights: 400/500/700. */
export const FONT_MONO  = "'Geist Mono', ui-monospace, Consolas, monospace";

/** Source Serif 4 — page titles, section headers (h1, h2). Weights: 400–700. */
export const FONT_SERIF = "'Source Serif 4', Georgia, serif";

/* ── Font Size Scale ───────────────────────────────────── */

export const FONT_SIZE = {
  '2xs':  9,
  'xs':   10,
  'sm':   11,
  'md':   12,
  'base': 14,
  'lg':   16,
  'xl':   20,
  '2xl':  24,
  '3xl':  28,
} as const;

/* ── Neutral Palette (warm taupe) ──────────────────────── */

export const NEUTRAL = {
  50:  "#F6F4F4",
  100: "#E9E5E4",
  200: "#D5CFCE",
  300: "#C1B9B8",
  400: "#ADA2A1",
  500: "#938A89",
  600: "#7E7675",
  700: "#686160",
  800: "#524C4B",
  900: "#3D3837",
  950: "#1A1716",
} as const;

/* ── Primary (Indigo) ──────────────────────────────────── */

export const PRIMARY = {
  400: "#818CF8",
  500: "#6366F1",
  600: "#4F46E5",
  700: "#4338CA",
  800: "#3730A3",
} as const;

/* ── Status Hex Values ─────────────────────────────────── */

export const STATUS_HEX = {
  ok:   { bg: "#DCFCE7", fg: "#166534", solid: "#22C55E" },
  info: { bg: "#DBEAFE", fg: "#1E40AF", solid: "#3B82F6" },
  warn: { bg: "#FEF3C7", fg: "#92400E", solid: "#F59E0B" },
  hot:  { bg: "#FFEDD5", fg: "#9A3412", solid: "#EA580C" },
  bad:  { bg: "#FEE2E2", fg: "#991B1B", solid: "#EF4444" },
} as const;

/* ── Foundation Aliases ────────────────────────────────── */

export const FOUNDATION = {
  surface:  "#FFFFFF",
  canvas:   "#F6F4F4",
  subtle:   "#FBFAFA",
  borderSubtle: "#E9E5E4",
  borderStrong: "#D5CFCE",
  textPrimary:   "#3D3837",
  textSecondary: "#7E7675",
  textTertiary:  "#938A89",
  textInverse:   "#FFFFFF",
} as const;

/* ── Chart Series ──────────────────────────────────────── */

/** Primary 5-color + planned (grey dashed) series. */
export const SERIES_COLORS = {
  1: "#6366F1",       // Indigo
  2: "#14B8A6",       // Teal
  3: "#EC4899",       // Pink
  4: "#8B5CF6",       // Purple
  5: "#F59E0B",       // Amber
  planned: "#9CA3AF", // Grey
} as const;

/** Extended 12-color palette for donut / multi-series charts (CMD). */
export const SERIES_EXTENDED = [
  "#6366F1", "#3B82F6", "#22C55E", "#F59E0B",
  "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6",
  "#F97316", "#06B6D4", "#84CC16", "#A855F7",
] as const;

/** Ordered array form of the 6-color series (line/area/bar/donut). */
export const SERIES_ARRAY = [
  "#6366F1", "#14B8A6", "#EC4899", "#8B5CF6", "#F59E0B", "#9CA3AF",
] as const;

/* ── Heatmap Gradient (green scale, CMD) ───────────────── */

export const HEATMAP_GRADIENT = [
  "#F0FDF4", "#BBF7D0", "#86EFAC", "#4ADE80", "#22C55E",
  "#16A34A", "#15803D", "#166534", "#14532D",
] as const;

/* ── Gauge Colors ──────────────────────────────────────── */

export const GAUGE = {
  good:    "#22C55E",
  warning: "#F59E0B",
  danger:  "#EF4444",
  empty:   "#F3F4F6",
} as const;

/* ── Zone / Category Colors (CMD MapCanvas) ────────────── */

export const ZONE_COLORS = {
  external:   { bg: "#FF634720", border: "#FF634766", label: "#FF6347CC" },
  electrical: { bg: "#6366F118", border: "#6366F14D", label: "#6366F1B3" },
  production: { bg: "#3B82F618", border: "#3B82F64D", label: "#3B82F6B3" },
  hvac:       { bg: "#22C55E14", border: "#22C55E40", label: "#22C55ECC" },
  utilities:  { bg: "#F59E0B1A", border: "#F59E0B66", label: "#D97706B3" },
} as const;

/* ── Status-to-Hex Map (for Canvas 2D / inline styles) ── */

export const STATUS_COLOR_HEX: Record<string, string> = {
  backlog:     NEUTRAL[200],       // #D5CFCE
  todo:        STATUS_HEX.info.solid,  // #3B82F6
  in_progress: STATUS_HEX.warn.solid,  // #F59E0B
  active:      STATUS_HEX.warn.solid,  // #F59E0B
  in_review:   PRIMARY[500],       // #8B5CF6 → using series-4
  done:        STATUS_HEX.ok.solid,    // #22C55E
  cancelled:   NEUTRAL[500],       // #938A89
  blocked:     STATUS_HEX.bad.solid,   // #EF4444
};

// Fix in_review to match series-4 (purple)
STATUS_COLOR_HEX.in_review = "#8B5CF6";

/* ── Priority Border Colors (Canvas 2D) ────────────────── */

export const PRIORITY_BORDER_HEX: Record<string, string> = {
  critical: STATUS_HEX.hot.solid,  // #EA580C
  high:     STATUS_HEX.hot.solid,  // #EA580C
  medium:   NEUTRAL[500],          // #938A89
  low:      NEUTRAL[200],          // #D5CFCE
};

/* ── Risk-Level Colors ─────────────────────────────────── */

export const RISK_COLOR_HEX: Record<string, { fill: string; stroke: string }> = {
  low:      { fill: "rgba(34, 197, 94, 0.12)",  stroke: "#22C55E" },
  medium:   { fill: "rgba(245, 158, 11, 0.12)", stroke: "#F59E0B" },
  high:     { fill: "rgba(234, 88, 12, 0.12)",  stroke: "#EA580C" },
  critical: { fill: "rgba(239, 68, 68, 0.15)",  stroke: "#EF4444" },
};

/* ── Diagnostic Bar Colors (CMD Sprint Diagnostic) ────── */

export const DIAGNOSTIC_BAR_COLORS = [
  "#dc2626", "#ea580c", "#f59e0b", "#fbbf24", "#fcd34d", "#d6cfc1",
] as const;

export const DIAGNOSTIC_ACCENT = {
  primary:   "#EA580C",
  fill:      "rgba(234,88,12,0.10)",
  darkText:  "#1a1208",
  mutedText: "#5a4f3f",
  caption:   "#9c8870",
  topLabel:  "#c2410c",
  dotHigh:   "#ea580c",
  dotLow:    "#059669",
} as const;

/* ── Dark Theme Colors ─────────────────────────────────── */

export const DARK = {
  bg:       "#1A1F2E",
  bgAlt:    "#2D3348",
  border:   "#374151",
  text:     "#E5E7EB",
  textMuted: "#D1D5DB",
  accent:   "#6366F1",
} as const;

/* ── Chart Axis / Grid / Tooltip (for Recharts) ────────── */

export const CHART_AXIS_STYLE = {
  fontSize: FONT_SIZE.xs,
  fontFamily: FONT_SANS,
  fill: NEUTRAL[500],
} as const;

export const CHART_AXIS_MONO_STYLE = {
  fontSize: FONT_SIZE.sm,
  fontFamily: FONT_MONO,
  fill: NEUTRAL[500],
} as const;

export const CHART_GRID_COLOR = NEUTRAL[100]; // #E9E5E4

export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "#fff",
  border: `1px solid ${NEUTRAL[100]}`,
  borderRadius: 8,
  padding: "8px 12px",
  fontFamily: FONT_SANS,
  fontSize: FONT_SIZE.sm,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

export const CHART_TOOLTIP_DARK_STYLE: React.CSSProperties = {
  backgroundColor: DARK.bg,
  border: "none",
  borderRadius: 6,
  padding: "8px 12px",
  fontFamily: FONT_SANS,
  fontSize: FONT_SIZE.sm,
  color: "#fff",
};

/* ── Shadows ───────────────────────────────────────────── */

export const SHADOW = {
  xsmall:   "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
  card:     "0 1px 4px rgba(0,0,0,0.05)",
  medium:   "0 4px 12px rgba(0,0,0,0.08)",
  elevated: "0 12px 28px rgba(0,0,0,0.08), 0 0 0 1px #D1D5DB",
  large:    "0 8px 24px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)",
  modal:    "0 32px 80px rgba(0,0,0,0.22)",
} as const;

/* ── Avatar Colors ─────────────────────────────────────── */

/** Named avatar overrides. */
export const AVATAR_NAMED: Record<string, { bg: string; fg: string }> = {
  rohith: { bg: "#cecbf6", fg: "#26215c" },
  priya:  { bg: "#fcd6e0", fg: "#5c2133" },
  arjun:  { bg: "#9fe1cb", fg: "#04342c" },
};

/** 5-bucket fallback palettes. */
export const AVATAR_BG = ["#E0E7FF", "#CCFBF1", "#FCE7F3", "#EDE9FE", "#FEF3C7"] as const;
export const AVATAR_FG = ["#3730A3", "#115E59", "#9D174D", "#5B21B6", "#92400E"] as const;

/** Project color options (4 buckets from series 1–4). */
export const PROJECT_COLORS = ["#6366F1", "#14B8A6", "#EC4899", "#8B5CF6"] as const;

/* ── Health Config (ProjectCards gradient styling) ────── */

export const HEALTH_CONFIG: Record<string, {
  gradient: string; border: string;
  pillBg: string; pillBorder: string; pillText: string;
  label: string; trendColor: string; sparkColor: string;
  warningIcon: string;
}> = {
  critical: {
    gradient: `from-[${STATUS_HEX.bad.bg}] to-white`,
    border: `border-[#fca5a5] border-2`,
    pillBg: `bg-[${STATUS_HEX.bad.bg}]`, pillBorder: "border-[#fca5a5]",
    pillText: "text-[#b91c1c]",
    label: "Critical", trendColor: STATUS_HEX.bad.solid, sparkColor: STATUS_HEX.bad.solid,
    warningIcon: "▲",
  },
  "at-risk": {
    gradient: `from-[${STATUS_HEX.warn.bg}] to-white`,
    border: "border-[#fde68a]",
    pillBg: `bg-[${STATUS_HEX.warn.bg}]`, pillBorder: "border-[#fcd34d]",
    pillText: "text-[#b45309]",
    label: "At Risk", trendColor: STATUS_HEX.warn.solid, sparkColor: STATUS_HEX.warn.solid,
    warningIcon: "▲",
  },
  "on-track": {
    gradient: `from-[${STATUS_HEX.ok.bg}] to-white`,
    border: "border-[#86efac]",
    pillBg: `bg-[${STATUS_HEX.ok.bg}]`, pillBorder: "border-[#86efac]",
    pillText: "text-[#15803d]",
    label: "On Track", trendColor: STATUS_HEX.ok.solid, sparkColor: STATUS_HEX.ok.solid,
    warningIcon: "○",
  },
};

/* ── Calendar / Timeline Palette ───────────────────────── */

/**
 * Calendar-specific status colors (Figma-translated palette).
 * Used by CalendarView and dependencies page for inline styles.
 */
export const CAL_STATUS: Record<string, { bg: string; border: string; label: string }> = {
  done:        { bg: "#c0dd97", border: "#97c459", label: "done" },
  in_progress: { bg: "#faeeda", border: "#ef9f27", label: "in progress" },
  active:      { bg: "#faece7", border: "#d85a30", label: "active" },
  blocked:     { bg: "#fcebeb", border: "#e24b4a", label: "blocked" },
  in_review:   { bg: "#b5d4f4", border: "#378add", label: "in review" },
  todo:        { bg: "#e6f1fb", border: "#85b7eb", label: "to do" },
  backlog:     { bg: "#e5e5e2", border: "#888780", label: "backlog" },
};

/** Calendar status bar colors (solid fill for strips/bars). */
export const CAL_BAR_COLOR: Record<string, string> = {
  done: "#97c459", in_progress: "#ef9f27", active: "#d85a30",
  blocked: "#e24b4a", in_review: "#378add", todo: "#85b7eb", backlog: "#888780",
};

/** Calendar legend items. */
export const CAL_LEGEND = [
  { color: "#97c459", label: "done" },
  { color: "#ef9f27", label: "in progress" },
  { color: "#d85a30", label: "active" },
  { color: "#e24b4a", label: "blocked" },
  { color: "#378add", label: "in review" },
  { color: "#85b7eb", label: "to do" },
  { color: "#888780", label: "backlog" },
] as const;

/** Timeline bar styles (Figma-translated). */
export const CAL_BAR_STYLES: Record<string, {
  bg: string; border: string; fg: string;
  borderStyle?: string; opacity?: number;
}> = {
  done:        { bg: "#c0dd97", border: "#639922", fg: "#173404", opacity: 0.78 },
  in_progress: { bg: "#faeeda", border: "#ba7517", fg: "#412402" },
  active:      { bg: "#faece7", border: "#d85a30", fg: "#4a1b0c" },
  blocked:     { bg: "#fcebeb", border: "#e24b4a", fg: "#501313" },
  in_review:   { bg: "#b5d4f4", border: "#185fa5", fg: "#042c53" },
  todo:        { bg: "#e6f1fb", border: "#378add", fg: "#0c447c", borderStyle: "dashed" },
  backlog:     { bg: "#e5e5e2", border: "#888780", fg: "#2c2c2a" },
};

/** Calendar UI neutral tones (Figma palette). */
export const CAL_UI = {
  pageBg:      "#faf9f5",
  panelBg:     "#f1efe8",
  cardBg:      "#ffffff",
  border:      "#e5e3dd",
  textDark:    "#2c2c2a",
  textMid:     "#5f5e5a",
  textMuted:   "#888780",
  todayBorder: "#f0c97d",
  todayBg:     "#faeeda",
  todayText:   "#412402",
  todayAccent: "#0c447c",
  blockedBg:   "#fcebeb",
  blockedBorder: "#f09595",
  blockedText: "#501313",
  blockedDark: "#791f1f",
  criticalAccent: "#a32d2d",
} as const;

/* ── Dependencies Page Palette ─────────────────────────── */

export const DEP_STATUS_PILL: Record<string, { bg: string; border: string; text: string; label: string }> = {
  done:        { bg: "#c0dd97", border: "#639922", text: "#173404", label: "done" },
  active:      { bg: "#faeeda", border: "#ba7517", text: "#412402", label: "active" },
  in_progress: { bg: "#faeeda", border: "#ba7517", text: "#412402", label: "active" },
  blocked:     { bg: "#fcebeb", border: "#f09595", text: "#501313", label: "blocked" },
  todo:        { bg: "#f1efe8", border: "#b4b2a9", text: "#2c2c2a", label: "todo" },
  backlog:     { bg: "#f1efe8", border: "#b4b2a9", text: "#2c2c2a", label: "backlog" },
  in_review:   { bg: "#f1efe8", border: "#b4b2a9", text: "#2c2c2a", label: "review" },
};

export const DEP_STATUS_DOT: Record<string, string> = {
  done: "#639922", active: "#ba7517", in_progress: "#ba7517",
  blocked: "#a32d2d", todo: "#b4b2a9", backlog: "#b4b2a9", in_review: "#0c447c",
};

export const DEP_SEGMENT: Record<string, { bg: string; text: string }> = {
  done:        { bg: "#97c459", text: "#173404" },
  active:      { bg: "#fac775", text: "#412402" },
  in_progress: { bg: "#fac775", text: "#412402" },
  blocked:     { bg: "#f09595", text: "#501313" },
  todo:        { bg: "#d3d1c7", text: "#2c2c2a" },
  backlog:     { bg: "#d3d1c7", text: "#2c2c2a" },
  in_review:   { bg: "#b5d4f4", text: "#0c447c" },
};

export const DEP_SEVERITY: Record<string, { bg: string; text: string }> = {
  critical: { bg: "#a32d2d", text: "#fcebeb" },
  high:     { bg: "#a32d2d", text: "#fcebeb" },
  medium:   { bg: "#faeeda", text: "#412402" },
  low:      { bg: "#f1efe8", text: "#5f5e5a" },
};

export const DEP_SIDE_BAR: Record<string, string> = {
  critical: "#a32d2d", high: "#a32d2d", medium: "#ef9f27", low: "#b4b2a9",
};

/** Priority pill colors for calendar task cards. */
export const CAL_PRIORITY: Record<string, { bg: string; fg: string }> = {
  high:   { bg: "#faece7", fg: "#4a1b0c" },
  medium: { bg: "#faeeda", fg: "#412402" },
  low:    { bg: "#e6f1fb", fg: "#0c447c" },
};

/* ── Color Helper Functions ────────────────────────────── */

function hash31(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic avatar colors from a name string. */
export function avatarColors(name: string): { bg: string; fg: string } {
  const key = name.toLowerCase().trim();
  if (AVATAR_NAMED[key]) return AVATAR_NAMED[key];
  const i = hash31(key) % 5;
  return { bg: AVATAR_BG[i], fg: AVATAR_FG[i] };
}

/** Deterministic project color from a slug string. */
export function projectColor(slug: string): string {
  return PROJECT_COLORS[hash31(slug.toLowerCase().trim()) % 4];
}

/** The four allowed project-color options for admin pickers. */
export const PROJECT_COLOR_OPTIONS = [...PROJECT_COLORS];
