/**
 * CMD Design System — Single Source of Truth
 *
 * All design tokens, patterns, and shared constants used across the app.
 * Derived from the Portfolio Overview dashboard (main page).
 *
 * FONTS (via Tailwind):
 *   font-sans  → Geist (body text, labels, buttons)
 *   font-serif → Source Serif 4 (section titles, headings)
 *   font-mono  → Geist Mono (numbers, percentages, data values)
 *
 * FONT SIZES (via Tailwind):
 *   text-2xs=9px  text-xs=10px  text-sm=11px  text-md=12px
 *   text-base=14px  text-lg=16px  text-xl=20px  text-2xl=24px
 *
 * NEUTRAL PALETTE (warm taupe, not cool grey):
 *   neutral-50=#F6F4F4  neutral-100=#E9E5E4  neutral-200=#D5CFCE
 *   neutral-300=#C1B9B8  neutral-400=#ADA2A1  neutral-500=#938A89
 *   neutral-600=#7E7675  neutral-700=#686160  neutral-800=#524C4B
 *   neutral-900=#3D3837  neutral-950=#1A1716
 *
 * STATUS TOKENS (via Tailwind: ok/info/warn/hot/bad):
 *   ok:   bg=#DCFCE7 fg=#166534 solid=#22C55E  (done, success)
 *   info: bg=#DBEAFE fg=#1E40AF solid=#3B82F6  (to-do, info)
 *   warn: bg=#FEF3C7 fg=#92400E solid=#F59E0B  (active, in-progress)
 *   hot:  bg=#FFEDD5 fg=#9A3412 solid=#EA580C  (near-cap, urgent)
 *   bad:  bg=#FEE2E2 fg=#991B1B solid=#EF4444  (blocked, error)
 */

/* ── Page Layout ───────────────────────────────────────── */

/** Standard page shell: full viewport, no scroll on outer container */
export const PAGE_SHELL = "h-screen bg-neutral-50 overflow-hidden flex flex-col";

/** Standard page header bar (white bar, bottom border, consistent padding) */
export const PAGE_HEADER = "bg-white border-b border-neutral-100 px-5 py-2 flex items-center gap-3 shrink-0";

/** Back button in page header */
export const HEADER_BACK_BTN = "p-1.5 rounded-lg hover:bg-neutral-100 transition-colors";
export const HEADER_BACK_ICON = "w-4 h-4 text-neutral-500";

/** Logo in page header */
export const HEADER_LOGO = "w-6 h-6 rounded-md shrink-0 object-cover";

/** Page title in header (serif font) */
export const HEADER_TITLE = "text-base font-serif font-semibold text-neutral-950";

/** Content area below header */
export const PAGE_CONTENT = "flex-1 overflow-hidden min-h-0";
export const PAGE_CONTENT_PADDED = "flex-1 overflow-hidden min-h-0 p-3";
export const PAGE_CONTENT_SCROLL = "flex-1 overflow-y-auto p-5 space-y-5";

/* ── Cards ──────────────────────────────────────────────── */

/** Standard card: white bg, neutral-200 border, 8px radius */
export const CARD = "bg-white rounded-lg border border-neutral-200";

/** Card with shadow (for standalone widget cards) */
export const CARD_SHADOW = "bg-white rounded-lg border border-neutral-200 shadow-xsmall";

/** Card header (inside a card, with bottom border) */
export const CARD_HEADER = "px-4 py-3 border-b border-neutral-100";

/** Card title text (serif, bold) */
export const CARD_TITLE = "text-sm font-serif font-bold text-neutral-950";

/** Card section title with icon */
export const CARD_TITLE_WITH_ICON = "flex items-center gap-2";

/** Card body padding */
export const CARD_BODY = "p-4";

/* ── Status System ──────────────────────────────────────── */

export const STATUS_META: Record<string, {
  label: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
}> = {
  done:    { label: "Done",    dot: "bg-ok-solid",   bg: "bg-ok-bg",   text: "text-ok-fg",   border: "border-ok-solid/20" },
  active:  { label: "Active",  dot: "bg-warn-solid", bg: "bg-warn-bg", text: "text-warn-fg", border: "border-warn-solid/20" },
  in_progress: { label: "Active", dot: "bg-warn-solid", bg: "bg-warn-bg", text: "text-warn-fg", border: "border-warn-solid/20" },
  blocked: { label: "Blocked", dot: "bg-bad-solid",  bg: "bg-bad-bg",  text: "text-bad-fg",  border: "border-bad-solid/20" },
  todo:    { label: "To Do",   dot: "bg-info-solid", bg: "bg-info-bg", text: "text-info-fg", border: "border-info-solid/20" },
  backlog: { label: "Backlog", dot: "bg-neutral-300",bg: "bg-neutral-100", text: "text-neutral-500", border: "border-neutral-200" },
  in_review: { label: "In Review", dot: "bg-info-solid/70", bg: "bg-info-bg", text: "text-info-fg", border: "border-info-solid/20" },
};

export const PRIORITY_META: Record<string, { dot: string; text: string; bg: string }> = {
  critical: { dot: "bg-bad-solid",  text: "text-bad-fg",  bg: "bg-bad-bg" },
  urgent:   { dot: "bg-bad-solid",  text: "text-bad-fg",  bg: "bg-bad-bg" },
  high:     { dot: "bg-hot-solid",  text: "text-hot-fg",  bg: "bg-hot-bg" },
  medium:   { dot: "bg-warn-solid", text: "text-warn-fg", bg: "bg-warn-bg" },
  low:      { dot: "bg-neutral-300",text: "text-neutral-500", bg: "bg-neutral-100" },
};

export const HEALTH_META: Record<string, {
  label: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
}> = {
  "on-track": { label: "On Track", dot: "bg-ok-solid",   bg: "bg-ok-bg",   text: "text-ok-fg",   border: "border-ok-solid/20" },
  "at-risk":  { label: "At Risk",  dot: "bg-warn-solid", bg: "bg-warn-bg", text: "text-warn-fg", border: "border-warn-solid/20" },
  "critical": { label: "Critical", dot: "bg-hot-solid",  bg: "bg-hot-bg",  text: "text-hot-fg",  border: "border-hot-solid/20" },
};

/* ── Status Badge Component Classes ─────────────────────── */

/** Small status badge: text-xs font-semibold px-2 py-0.5 rounded-lg */
export const STATUS_BADGE = "text-xs font-semibold px-2 py-0.5 rounded-lg";

/** Status dot: w-1.5 h-1.5 or w-2 h-2 rounded-full */
export const STATUS_DOT_SM = "w-1.5 h-1.5 rounded-full shrink-0";
export const STATUS_DOT = "w-2 h-2 rounded-full shrink-0";

/* ── KPI / Stat Boxes ───────────────────────────────────── */

/** KPI stat box (colored bg with border) */
export const KPI_BOX = "rounded px-2 py-1 text-center";
export const KPI_VALUE = "text-xs font-black";
export const KPI_LABEL_SM = "text-sm";

/** Larger KPI card */
export const KPI_CARD = "bg-white rounded-lg border border-neutral-200 p-4";
export const KPI_CARD_LABEL = "text-xs text-neutral-400 uppercase font-semibold";
export const KPI_CARD_VALUE = "text-2xl font-mono font-black text-neutral-950 mt-1";

/* ── Typography Patterns ────────────────────────────────── */

/** Section title (serif, inside cards/panels) */
export const SECTION_TITLE = "text-sm font-serif font-bold text-neutral-950";

/** Uppercase label (metadata, column headers) */
export const UPPERCASE_LABEL = "text-xs font-bold text-neutral-500 uppercase tracking-wider";

/** Data value (mono font for numbers) */
export const DATA_VALUE = "font-mono font-bold tabular-nums";

/** Muted text */
export const TEXT_MUTED = "text-neutral-400";
export const TEXT_SECONDARY = "text-neutral-500";
export const TEXT_BODY = "text-neutral-700";
export const TEXT_PRIMARY = "text-neutral-950";

/* ── Button Patterns ────────────────────────────────────── */

/** Primary button (dark) */
export const BTN_PRIMARY = "bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors";

/** Ghost button */
export const BTN_GHOST = "text-sm text-neutral-400 hover:text-neutral-700 transition-colors";

/** Tab button (active/inactive states) */
export const TAB_ACTIVE = "bg-neutral-900 text-white";
export const TAB_INACTIVE = "text-neutral-500 hover:bg-neutral-100";
export const TAB_BASE = "text-sm font-semibold px-2 py-1 rounded-lg transition-all";

/* ── Filter Pill / Tab Bar ──────────────────────────────── */

/** Filter pill (used in status/urgency filters) */
export const FILTER_PILL = "text-sm font-semibold px-2 py-1 rounded-lg transition-all";
export const FILTER_PILL_ACTIVE = "bg-neutral-900 text-white";

/** Filter bar container */
export const FILTER_BAR = "px-3 py-1.5 border-b border-neutral-100 flex gap-1.5 shrink-0";

/* ── Chart Styling ──────────────────────────────────────── */
// Re-exported from palette.ts for backwards compat.
// New code should import directly from @/design/palette or @/design.
export {
  CHART_AXIS_STYLE,
  CHART_AXIS_MONO_STYLE,
  CHART_GRID_COLOR,
  CHART_TOOLTIP_STYLE,
  CHART_TOOLTIP_DARK_STYLE,
  SERIES_COLORS,
  SERIES_EXTENDED,
  SERIES_ARRAY,
  HEATMAP_GRADIENT,
  GAUGE,
  DIAGNOSTIC_BAR_COLORS,
  DIAGNOSTIC_ACCENT,
  STATUS_COLOR_HEX,
  PRIORITY_BORDER_HEX,
  RISK_COLOR_HEX,
  HEALTH_CONFIG,
  DARK,
  SHADOW,
  ZONE_COLORS,
  // Calendar / timeline
  CAL_STATUS,
  CAL_BAR_COLOR,
  CAL_LEGEND,
  CAL_BAR_STYLES,
  CAL_UI,
  CAL_PRIORITY,
  // Dependencies
  DEP_STATUS_PILL,
  DEP_STATUS_DOT,
  DEP_SEGMENT,
  DEP_SEVERITY,
  DEP_SIDE_BAR,
  // Neutral / foundation hex
  NEUTRAL,
  PRIMARY,
  STATUS_HEX,
  FOUNDATION,
} from "./palette";

/* ── Avatar & Project Colors ───────────────────────────── */
// Re-exported from palette.ts for single-import convenience.
export {
  AVATAR_NAMED as AVATAR_COLORS,
  AVATAR_BG,
  AVATAR_FG,
  avatarColors,
  avatarColors as getAvatarColor,
  projectColor,
  PROJECT_COLORS,
  PROJECT_COLOR_OPTIONS,
} from "./palette";

/* ── Misc Patterns ──────────────────────────────────────── */

/** Divider */
export const DIVIDER = "border-t border-neutral-100";
export const DIVIDER_VERTICAL = "w-px h-6 bg-neutral-200 shrink-0";

/** List row hover */
export const LIST_ROW = "px-3 py-2 border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition-colors";

/** Modal overlay */
export const MODAL_OVERLAY = "fixed inset-0 bg-black/30 z-50 flex items-center justify-center";
export const MODAL_CARD = "bg-white rounded-lg border border-neutral-200 shadow-xl";

/** Form input */
export const INPUT = "w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-info-solid bg-white";
export const LABEL = "text-sm text-neutral-500 uppercase font-bold block mb-1";

/** Progress bar */
export const PROGRESS_BAR_TRACK = "w-full h-2 bg-neutral-100 rounded-full";
export const PROGRESS_BAR_FILL = "h-full rounded-full";

/** Days left helper styling */
export function daysLeftStyle(daysLeft: number): string {
  if (daysLeft < 0) return "text-bad-fg";
  if (daysLeft <= 3) return "text-warn-fg";
  return "text-neutral-400";
}
