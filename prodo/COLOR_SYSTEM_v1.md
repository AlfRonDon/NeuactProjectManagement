# Neuact EMS — Color System v1

**One color, one meaning.** Status colors signal severity. Chart colors signal data. Never mix the two. All other tokens derive from this base.

---

## 1. Foundation — Warm Taupe Neutrals

Greys, surfaces, text. Used wherever a UI element doesn't communicate status or data.

The foundation palette uses a **warm taupe** scale (not cool grey). This is a brand decision — the taupe tones feel warmer and more approachable than standard Tailwind greys.

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `--bg-canvas` | `#F6F4F4` | neutral-50 | Page background, behind cards |
| `--bg-surface` | `#FFFFFF` | white | Cards, modals, dropdowns |
| `--bg-subtle` | `#FBFAFA` | (half-step) | Identity columns, hover rows, secondary surfaces |
| `--border-subtle` | `#E9E5E4` | neutral-100 | Card borders, dividers, axis lines, table rows |
| `--border-strong` | `#D5CFCE` | neutral-200 | Inputs, selected states, focus rings |
| `--text-primary` | `#3D3837` | neutral-900 | Headings, key numbers, primary buttons |
| `--text-secondary` | `#7E7675` | neutral-600 | Labels, sublines, body text |
| `--text-tertiary` | `#938A89` | neutral-500 | Axis ticks, captions, low-priority data |
| `--text-inverse` | `#FFFFFF` | white | Text on dark or colored fills |
| `--ink-button` | `#3D3837` | neutral-900 | Primary button background |

### Full taupe scale (available but uncommon beyond the mapped tokens above)

| Step | Hex | Notes |
|---|---|---|
| neutral-50 | `#F6F4F4` | canvas / subtle bg |
| neutral-100 | `#E9E5E4` | border-subtle |
| neutral-200 | `#D5CFCE` | border-strong |
| neutral-300 | `#C1B9B8` | Available, uncommon |
| neutral-400 | `#ADA2A1` | Available, uncommon |
| neutral-500 | `#938A89` | text-tertiary |
| neutral-600 | `#7E7675` | text-secondary |
| neutral-700 | `#686160` | Available, uncommon |
| neutral-800 | `#524C4B` | Available, uncommon |
| neutral-900 | `#3D3837` | text-primary / ink-button |
| neutral-950 | `#1A1716` | Available, uncommon |

---

## 2. Status — Five severity tiers

Used wherever the UI communicates "how is this going?" — project pills, alert badges, blocker callouts, task urgency.

Five tiers, not four: `warn` (amber) and `hot` (orange) are different so "needs attention" doesn't read as urgently as "in trouble."

Each tier has three slots: `-bg` (subtle background, for pills), `-fg` (text/icon on that bg), `-solid` (the saturated color, for borders, dots, chart overlays).

| Tier | Means | `-bg` | `-fg` | `-solid` |
|---|---|---|---|---|
| **ok** | On track, complete, healthy | `#DCFCE7` | `#166534` | `#22C55E` |
| **info** | Neutral, in progress, informational | `#DBEAFE` | `#1E40AF` | `#3B82F6` |
| **warn** | Needs attention, at-risk, behind | `#FEF3C7` | `#92400E` | `#F59E0B` |
| **hot** | Urgent, full capacity, escalating | `#FFEDD5` | `#9A3412` | `#EA580C` |
| **bad** | Blocked, failed, over capacity | `#FEE2E2` | `#991B1B` | `#EF4444` |

```css
--ok-bg:   #DCFCE7;  --ok-fg:   #166534;  --ok-solid:   #22C55E;
--info-bg: #DBEAFE;  --info-fg: #1E40AF;  --info-solid: #3B82F6;
--warn-bg: #FEF3C7;  --warn-fg: #92400E;  --warn-solid: #F59E0B;
--hot-bg:  #FFEDD5;  --hot-fg:  #9A3412;  --hot-solid:  #EA580C;
--bad-bg:  #FEE2E2;  --bad-fg:  #991B1B;  --bad-solid:  #EF4444;
```

> **Rule.** Every place in the UI that communicates status uses one of these five tiers. "Behind by 4 days" → `warn`. "Overloaded" → `bad`. "Critical priority" → `hot`. No invented intermediate colors. No project-specific reds.

---

## 3. Workload Heatmap — derived

The four heatmap tiers in the workload calendar are status colors at a fixed opacity. **Don't pick new hex values for these.**

Same logic applies to any tinted background that signals load — timeline backgrounds, capacity gauges, dashboard tile fills.

| Heatmap level | Formula | Text color |
|---|---|---|
| Light | `--ok-solid` @ 0.20 | `--ok-fg` |
| Busy | `--warn-solid` @ 0.25 | `--warn-fg` |
| Full | `--hot-solid` @ 0.25 | `--hot-fg` |
| Over | `--bad-solid` @ 0.20 | `--bad-fg` |

---

## 4. Chart Series — reserved for data

Use these for line charts, multi-series comparisons, anywhere the eye needs to track distinct quantities. Status colors *overlay* the chart for events (red dot = blocker, amber band = at-risk window) but the underlying series stay neutral.

Planned, forecast, and baseline lines are always **dashed grey**, never colored.

| Token | Hex | Name | Use |
|---|---|---|---|
| `--series-1` | `#6366F1` | indigo | Primary metric, "Actual" |
| `--series-2` | `#14B8A6` | teal | Comparison series, "Last sprint" |
| `--series-3` | `#EC4899` | pink | Tertiary series |
| `--series-4` | `#8B5CF6` | violet | Quaternary series |
| `--series-5` | `#F59E0B` | amber | Quinary series — note: same hex as `--warn-solid`. Only use when status meaning isn't present in the same chart |
| `--series-planned` | `#9CA3AF` | dashed grey | Planned, forecast, baseline, target |

---

## 5. Task Categories — by team

Task bars in the workload calendar use chart-series colors keyed to the **owning team**. Priority is shown separately (a small dot or label), not by changing the bar color.

| Team | Color | Token |
|---|---|---|
| Platform | indigo | `--series-1` |
| Frontend | teal | `--series-2` |
| Design | pink | `--series-3` |
| Data | violet | `--series-4` |

If a fifth team is added, use `--series-5` (amber) — but only if no warn-status indicator appears in the same view.

---

## 6. Avatars — hashed to series, never status

A user's avatar color is deterministic: hash their name into the five chart-series buckets. This keeps avatars visually distinct from status pills, so a person's identity color never gets mistaken for "this person is in trouble."

```js
const SERIES_BG = ['#E0E7FF', '#CCFBF1', '#FCE7F3', '#EDE9FE', '#FEF3C7'];
const SERIES_FG = ['#3730A3', '#115E59', '#9D174D', '#5B21B6', '#92400E'];

function avatarColors(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const i = h % 5;
  return { bg: SERIES_BG[i], fg: SERIES_FG[i] };
}
```

> Avoid using status `-bg` / `-fg` pairs for avatars. They will collide visually with status pills elsewhere on the page.

---

## 7. Decision tree

When reaching for a color, walk this list top-down. The first match wins.

1. Is it text, a border, or a surface? → **foundation** (warm taupe neutrals)
2. Does it communicate "how is this going?" → **status** (ok / info / warn / hot / bad)
3. Is it a tinted background showing a load level? → **status @ 0.20–0.25 opacity**
4. Is it a line, bar, or area in a chart? → **chart series**
5. Is it a task bar identifying a team? → **chart series, keyed to team**
6. Is it an avatar? → **chart series `-bg` / `-fg` pair, hashed from name**
7. Is it a project identity color? → **chart series, hashed from project id** (§8)
8. Is it a nav category color? → **decorative, scoped** (§10)
9. None of the above? → **you're inventing a color. Stop.**

---

## 8. Project Colors — hashed to series

Projects need a stable identity color for progress rings, project pills, and card accents. Use the first four `--series-*` colors, hashed from the project slug/id:

| Bucket | Token | Hex |
|---|---|---|
| 0 | `--series-1` | `#6366F1` (indigo) — default |
| 1 | `--series-2` | `#14B8A6` (teal) |
| 2 | `--series-3` | `#EC4899` (pink) |
| 3 | `--series-4` | `#8B5CF6` (violet) |

```js
const PROJECT_COLORS = ['#6366F1', '#14B8A6', '#EC4899', '#8B5CF6'];

function projectColor(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return PROJECT_COLORS[h % 4];
}
```

> The color picker in admin should offer only these four options — no free hex input.

---

## 9. Migration notes — what changes from current page

Concrete drift to fix:

- **At least four reds** are in use today (project Critical, blocker zone, "Over" heatmap, blocker dot). Collapse all to `--bad-solid` `#EF4444` or its bg/fg pair. "Critical" priority uses `--hot-solid` instead (urgent, not broken).
- **Three greens** (On Track pill, ✓ marks, "Light" heatmap). Collapse to `--ok-*`.
- **Two ambers** (At Risk pill, Actual line, task bars). Status uses of amber → `--warn-*`. Chart line uses of amber → switch to `--series-1` (indigo) so "data" reads differently from "warning."
- **Avatar pastels** (the pink/blue/green initials) don't appear anywhere else. Replace with hashed `--series-*` pairs.
- **Burndown "Actual" line** is currently amber, which collides with the warn-status meaning of amber. Switch to `--series-1`.
- **Burndown "Ideal" line** is currently blue (#3B82F6), which collides with info-solid. Switch to `--series-planned` (#9CA3AF) dashed.
- **Task bars** in workload calendar currently use red/amber/blue with no consistent meaning. Re-color by owning team using `--series-*`.
- **Project colors** were ad-hoc hex values. Now hashed into `--series-*` buckets.
- **Purple for roles/change types** — Admin role badge → `--info-*` (roles aren't status). "Breaking" change type → `--bad-*` (breaking IS bad).
- **Foundation greys** — all inline hex values (`#E9E5E4`, `#1A1716`, `#938A89`, etc.) replaced with CSS custom properties pointing to the taupe neutrals.

---

## 10. Decorative / Scoped Colors

Some colors exist outside the system by design:

- **Nav-tree category tiles** use decorative background colors (emerald, teal, rose, etc.) for visual classification. These are not status, not data, not identity. They bypass the status palette intentionally.
- **Third-party widgets** (Stripe, Auth0, etc.) have their own visual contracts — don't touch.
- **Logos and brand marks** — don't touch.

If adding a new decorative color, prefix tokens with `--nav-*` and document the exception here.

---

*Color System v1 · Warm taupe foundation · 5 status tiers · 6 chart series · 4 project buckets. Maintained alongside this file.*
