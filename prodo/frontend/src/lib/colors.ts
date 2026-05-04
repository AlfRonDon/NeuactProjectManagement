/**
 * Color System v1 — deterministic color helpers.
 * See /COLOR_SYSTEM_v1.md §6 (avatars) and §8 (projects).
 */

// ── Avatar colors — 5 buckets from chart-series bg/fg pairs ──

const AVATAR_BG = ['#E0E7FF', '#CCFBF1', '#FCE7F3', '#EDE9FE', '#FEF3C7'] as const;
const AVATAR_FG = ['#3730A3', '#115E59', '#9D174D', '#5B21B6', '#92400E'] as const;

function hash31(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function avatarColors(name: string): { bg: string; fg: string } {
  const i = hash31(name.toLowerCase().trim()) % 5;
  return { bg: AVATAR_BG[i], fg: AVATAR_FG[i] };
}

// ── Project colors — 4 buckets from series-1..4 ──

const PROJECT_COLORS = ['#6366F1', '#14B8A6', '#EC4899', '#8B5CF6'] as const;

export function projectColor(slug: string): string {
  return PROJECT_COLORS[hash31(slug.toLowerCase().trim()) % 4];
}

/** The four allowed project-color options for admin pickers. */
export const PROJECT_COLOR_OPTIONS = [...PROJECT_COLORS];
