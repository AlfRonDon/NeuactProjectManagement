# Plan: Replicate NeuraReport V2 Design System into NeuactProjectManagement

## Context

The NeuactProjectManagement app (Next.js 14 + TypeScript + Tailwind) has **no design system** — all 25+ layout components use ad-hoc Tailwind classes. The goal is to replicate the NeuraReport V2 design system (React + MUI + JavaScript) with exact visual and structural fidelity, giving the PM app a production-grade component library, theme, and UX behavior layer.

**Key challenge:** Introducing MUI + Emotion into a Tailwind-only Next.js App Router project without breaking existing components.

**Hard constraint:** The entire app must be viewport-constrained — zero page-level scrolling, ever. All overflow is internal to components. This affects every phase below.

---

---

## Viewport-Constrained UI System (Cross-Cutting — Applies to ALL Phases)

### Current State (from research)
- **Target PM app already uses** `h-screen overflow-hidden flex flex-col` on all page components — partially viewport-constrained
- **But lacks:** root-level enforcement on html/body, formal AppLayout shell, density system, grid-based main layout
- **Source NeuraReport V2 uses:** flex-based viewport lock — sidebar + topnav fixed, only `PageContent` scrolls via `flex: 1; overflow: auto`; `FullHeightPageContainer` uses `calc(100vh - 64px)`

### Core Rule
The application must **never** produce page-level scrolling. No vertical scroll, no horizontal scroll. Layout fits within the viewport at all times.

### What gets added WHERE in the plan:

#### Phase 1 — tokens.ts: Add density tokens
```ts
export const density = {
  comfortable: { spacing: 8, fontSize: 14, gap: 12, padding: 16 },
  compact:     { spacing: 6, fontSize: 13, gap: 8,  padding: 12 },
  dense:       { spacing: 4, fontSize: 12, gap: 4,  padding: 8  },
} as const

export const viewport = {
  headerHeight: 56,
  sidebarWidth: 250,
  sidebarCollapsedWidth: 64,
  detailsPanelWidth: 320,
} as const
```

#### Phase 2 — muiTheme.ts: Viewport-aware overrides
- Add explicit breakpoints: `{ xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }`
- CssBaseline override adds root viewport lock:
  ```css
  html, body { height: 100%; width: 100%; overflow: hidden; margin: 0; padding: 0; }
  ```
- Typography body variants use `clamp()`: `fontSize: 'clamp(12px, 1vw, 16px)'`
- All MUI component overrides include `minWidth: 0` to prevent flex overflow

#### Phase 3 — globals.css: Root constraints + layout utilities
```css
html, body { height: 100%; width: 100%; overflow: hidden; }

.app-container {
  height: 100vh;    /* fallback */
  height: 100dvh;   /* wins where supported — MUST be after 100vh */
  width: 100vw;
  display: flex; flex-direction: column; overflow: hidden;
}

.main-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width, 250px) 1fr;
  height: 100%; overflow: hidden;
}
.main-layout--with-panel {
  grid-template-columns: var(--sidebar-width, 250px) 1fr var(--details-panel-width, 320px);
}

.scroll-container {
  overflow-y: auto; overflow-x: hidden;
  max-height: 100%; min-height: 0;
}
```

#### Phase 4 — styles.ts: Adapt PageContainers
- `FullHeightPageContainer`: Use `height: 'calc(100vh - 56px)'` (56px header from viewport tokens)
- Enforce `overflow: 'hidden'` on containers, `overflow: 'auto'` on content children
- `PaddedPageContainer`: Add `minHeight: 0`, `overflow: 'auto'` (scrolls within parent, never pushes page)

#### Phase 5 — Atoms: Add AppLayout + ViewportContainer atoms
New atoms (in addition to 4 from source):

| Component | Purpose |
|-----------|---------|
| `AppLayout/AppLayout.tsx` | Root app shell: `<div className="app-container">` wrapping Header + MainLayout |
| `MainLayout/MainLayout.tsx` | Grid container: `<div className="main-layout">` wrapping Sidebar + ContentArea |
| `ContentArea/ContentArea.tsx` | Flex column with `overflow: hidden`, children scroll internally |
| `ScrollContainer/ScrollContainer.tsx` | Reusable scroll wrapper: `overflow-y: auto, min-height: 0` |

All existing atoms (Surface, PageContainer, ActionButton, GlassDialog) get viewport constraints:
- `Surface`: Add `minWidth: 0, overflow: 'hidden'`
- `PageContainer`: `FullHeightPageContainer` uses `calc(100vh - var(--header-height, 56px))`

#### Phase 6-7 — Components: Enforce constraints
Every molecule/organism must define:
- `minWidth: 0` (prevents flex overflow bugs)
- `maxWidth: '100%'`
- Explicit `overflow` behavior (hidden or auto, never default)

#### Phase 9 — Hooks: Add useDensity + DensityProvider
```ts
// useDensity.ts — returns current mode for JS-side logic (show/hide elements)
export function useDensity(): 'comfortable' | 'compact' | 'dense'

// DensityProvider.tsx — sets data-density attribute on <body>, CSS vars handle styling
// NO theme re-creation. Zero React re-renders on density change.
export function DensityProvider({ children }: { children: React.ReactNode })
```

CSS variables (in globals.css) provide the actual values — components use `var(--density-spacing)` etc.

| Mode | Screen | --density-spacing | --density-font | --density-padding | --density-gap |
|------|--------|-------------------|----------------|-------------------|---------------|
| Comfortable | ≥1200px | 8px | 14px | 16px | 12px |
| Compact | 900–1200px | 6px | 13px | 12px | 8px |
| Dense | <900px | 4px | 12px | 8px | 4px |

#### Phase 10 — layout.tsx: Root enforcement
- `<html>` and `<body>` get `className="h-full w-full overflow-hidden"`
- Body wraps children in `<div className="app-container">`

### Breakpoint Discipline
```ts
breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } }
```
Each breakpoint adjusts layout structure, not just shrinks elements.

### Fallback Strategy (when space is insufficient)
1. Reduce density (spacing, font size)
2. Collapse non-critical sections (sidebar → icon-only 64px, hide detail panels)
3. Introduce internal scroll within components
4. Paginate or truncate content
5. **NEVER** allow page scroll or layout break

### Forbidden Behavior
- Page-level scroll (anywhere)
- Layout overflow beyond viewport
- Random wrapping or shifting of components
- Default MUI spacing causing drift
- Unbounded components (no explicit overflow)

### Viewport Validation Criteria
- No scrollbars on `<body>` at any viewport size
- Layout remains stable across all breakpoints
- No overlapping or cut-off components
- Internal scroll works where required
- Visual alignment is consistent

---

## Stability Rules (Research-Backed Fixes for Failure Points)

### Rule 1: Tailwind Scope Lock — Single Layout Authority
**Problem:** Tailwind utilities on MUI components override Emotion-injected styles unpredictably.
**Research:** Source NeuraReport V2 uses zero Tailwind — pure MUI `sx`/`styled()`. Target PM app's existing 25+ layouts use Tailwind exclusively. These two worlds must not mix.
**Fix — strict boundary:**
- `src/shared/` and `src/components/core|ux|modals.tsx`: MUI `sx` prop and `styled()` ONLY. Zero Tailwind classes.
- `src/app/*/page.tsx`: Tailwind allowed for page-level layout (`h-full`, `flex`, `gap-4`) but NOT on MUI component props.
- `src/components/layouts/`: Continue pure Tailwind (standalone, no MUI inside).
- **Layout authority:** MUI owns component styling. CSS Grid (`.main-layout`) owns page structure. Tailwind is utilities-only.

### Rule 2: Portal Safety with `overflow: hidden`
**Problem:** MUI overlays (Modal, Tooltip, Popper, Snackbar) render via portals. Could clip inside `overflow: hidden` containers.
**Research:** Source NeuraReport V2 uses MUI defaults — no portal overrides. MUI portals to `document.body` by default. `overflow: hidden` on body clips in-flow content only — fixed/absolute positioned portal descendants escape.
**Fix:** MUI's default portal behavior (portals to `document.body`) is correct. Do NOT set custom `container` props.
- **Stacking context protection:** Do NOT apply `transform`, `filter`, or `perspective` CSS to any ancestor of portal-triggering components. These create new stacking contexts that trap fixed-position portals. In `globals.css`, add a warning comment. In practice: `backdrop-filter: blur()` on glass components is safe (it's on the portal itself, not an ancestor). If a future component needs `transform` on a container, it must NOT contain modal/tooltip triggers — move them outside the transform context.
- Verify during Phase 10 that modals render above everything when opened from deep within nested containers.

### Rule 3: Explicit Layout States (Grid Flexibility)
**Problem:** `.main-layout` grid assumes sidebar always present.
**Research:** Source uses CSS width transition (250px → 64px, 200ms) with conditional rendering of sidebar labels. Target PM app has no sidebar collapse mechanism at all.
**Fix:** Define layout state variants in globals.css:
```css
.main-layout { grid-template-columns: var(--sidebar-width, 250px) 1fr; }
.main-layout--with-panel { grid-template-columns: var(--sidebar-width, 250px) 1fr var(--details-panel-width, 320px); }
.main-layout--collapsed { grid-template-columns: var(--sidebar-collapsed-width, 64px) 1fr; }
.main-layout--collapsed--with-panel { grid-template-columns: var(--sidebar-collapsed-width, 64px) 1fr var(--details-panel-width, 320px); }
.main-layout--no-sidebar { grid-template-columns: 1fr; }
```
Do NOT animate `grid-template-columns` — browser reflow cost is high. Instead, the sidebar column uses a fixed CSS variable that transitions:
```css
.main-layout { grid-template-columns: var(--sidebar-current-width) 1fr; }
/* Sidebar element animates its own width: */
.sidebar { width: var(--sidebar-current-width); transition: width 200ms ease; }
```
Grid stays stable; sidebar width animates. `MainLayout` atom accepts `variant` prop to set the CSS variable.

### Rule 4: Density via CSS Variables (NOT Theme Re-creation)
**Problem:** Hook-only density means components can ignore it. Theme re-creation on resize causes full subtree re-render + flicker.
**Research:** Source has NO density system at all — only `data-compact-tables` for table density. This is a NEW feature for the PM app.
**Fix:** CSS variable approach — theme stays static, density is reactive via CSS:
- MUI theme is created ONCE at startup with `comfortable` defaults. Never re-created on resize.
- `DensityProvider` (client component) uses `useMediaQuery` to set a `data-density` attribute on `<body>`:
  ```tsx
  // Sets: <body data-density="comfortable|compact|dense">
  ```
- globals.css maps density modes to CSS custom properties:
  ```css
  body[data-density="comfortable"] { --density-spacing: 8px; --density-font: 14px; --density-gap: 12px; --density-padding: 16px; }
  body[data-density="compact"]     { --density-spacing: 6px; --density-font: 13px; --density-gap: 8px;  --density-padding: 12px; }
  body[data-density="dense"]       { --density-spacing: 4px; --density-font: 12px; --density-gap: 4px;  --density-padding: 8px;  }
  ```
- Components use `var(--density-spacing)` etc. in their `sx` props or styled components.
- `useDensity()` hook still exists for JS-side logic (e.g., conditionally hiding elements), but styling reads CSS vars — zero React re-renders on density change.
- MUI module augmentation NOT needed for density — it lives in CSS, not theme object.
- **SSR hydration:** Default density during SSR is `comfortable` (set via `globals.css` base rule, not JS). The `body[data-density="comfortable"]` CSS vars are the defaults. `DensityProvider` only changes the attribute client-side if viewport is smaller — no hydration mismatch because the CSS vars exist with default values before JS runs. If JS hasn't run yet, comfortable spacing applies (correct for SSR which assumes desktop).

### Rule 5: Strategic `min-width: 0` / `min-height: 0`
**Problem:** Flex children without `min-height: 0` prevent scroll activation.
**Research:** Source applies `minWidth: 0` strategically on 5 specific flex containers (MainContent, SearchInput, breadcrumbs). NOT global. Target PM app: only ~5 of 72 `overflow-y-auto` components pair with `min-h-0`.
**Fix:** Direct children only (NOT deep descendants — that breaks inputs, images, grid sizing):
```css
.app-container > *,
.main-layout > *,
.scroll-container > * {
  min-width: 0;
  min-height: 0;
}
```
- All shared atoms/molecules/organisms explicitly include `minWidth: 0` in their root `sx`.
- `ScrollContainer` atom enforces `minHeight: 0` on itself automatically.
- Deeper nesting handled per-component, not via global selector.

### Rule 6: Z-Index System
**Problem:** No centralized z-index layering.
**Research:** Source uses MUI defaults (Modal: 1300, Tooltip: 1500, Snackbar: 1400, AppBar: 1100, Drawer: 1200) plus ad-hoc `zIndex: 1300` on search popper. Target uses only z-10, z-20, z-50 in Tailwind.
**Fix:** Use MUI's built-in z-index scale (already correct for component layering). Add explicit `zIndex` config in `createAppTheme()`:
```ts
zIndex: {
  mobileStepper: 1000,
  fab: 1050,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
}
```
This matches MUI defaults but makes them explicit and auditable. Add z-index tokens for non-MUI elements:
```ts
export const zIndex = {
  stickyHeader: 10,    // matches target's z-10 pattern
  dropdown: 20,        // matches target's z-20 pattern
  overlay: 50,         // matches target's z-50 pattern
} as const
```

### Rule 7: Focus & Accessibility
**Problem:** Target PM app has almost no focus states (only hover). Source has comprehensive `focus-visible` with 2px outline + 4px box-shadow glow.
**Research:** Source MuiButton/MuiIconButton use `'&:focus-visible': { outline: '2px solid ...', outlineOffset: 2, boxShadow: '0 0 0 4px ...' }`. Global CSS adds `:focus-visible { outline: 2px solid var(--primary-500); outline-offset: 2px; }`.
**Fix:** Focus states come "for free" with the MUI theme replication (Phase 2). The component overrides already include focus-visible styling. The global `:focus-visible` rule in globals.css (Phase 3) covers non-MUI elements. Rule 1 (no Tailwind on MUI components) ensures Emotion-injected focus styles are never overridden.

### Rule 8: Vertical Stacking Constraint
**Problem:** Horizontal grid is constrained, but vertical stacking inside ContentArea can still overflow viewport.
**Fix:** Every vertical layout inside `ContentArea` must follow:
```tsx
display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden'
```
Only the innermost content section scrolls (via `ScrollContainer` or `overflow: auto`). No naked vertical stacking — every flex column must be height-bounded.
- `ContentArea` atom enforces this on itself
- Page components that use `ContentArea` split into: fixed header section (`flexShrink: 0`) + scrollable body (`flex: 1, overflow: auto, minHeight: 0`)
- Double-scroll prevention: only ONE scroll surface per visual column

### Rule 9: Content Priority Hierarchy
**Problem:** Collapse/hide logic without priority model leads to arbitrary UX.
**Fix:** Define three tiers:
1. **Core content** (never hidden): Primary data view (table, board, list), page header, action buttons
2. **Secondary panels** (collapsible): Detail panels, sidebar nav labels, filters/facets, chat panels
3. **Decorative/UI extras** (removable at dense): Status badges, avatars, timestamps, sparkline charts, empty-state illustrations

Collapse order at breakpoints:
- `lg → md`: Detail panel hides, sidebar collapses to icon-only (64px)
- `md → sm`: Sidebar fully hidden (hamburger menu), secondary info truncated
- `sm → xs`: Single-column layout, only core content visible, dense spacing

### Rule 10: Component Layout Contract
**Problem:** Rules degrade without enforcement mechanism.
**Fix:** Every shared component (`src/shared/`) must satisfy this contract (enforced during code review):
```
✓ Has explicit overflow (hidden or auto) on root element
✓ Has minWidth: 0 on root element
✓ Does not use height/width that could push parent beyond viewport
✓ No position: fixed/absolute that escapes nearest clipping ancestor (except portals)
✓ No className prop that accepts Tailwind classes (MUI components only)
```
The `Surface`, `ContentArea`, `ScrollContainer` atoms serve as contract-compliant wrappers. Components that need scrolling MUST wrap content in `ScrollContainer` — no raw `overflow: auto` without `minHeight: 0`.

### Rule 11: No `className` on Shared Components
**Problem:** Devs can accidentally pass Tailwind classes to MUI-based shared components, breaking styles.
**Fix:** Shared component prop interfaces do NOT expose `className`. They expose `sx` (MUI system prop) for style customization:
```ts
interface SurfaceProps extends Omit<PaperProps, 'className'> { ... }
```
- Page-level code uses `sx` to customize shared components
- `className` is reserved for Tailwind-only contexts (existing layouts)
- This is a convention enforced by TypeScript types — `className` omitted from prop interfaces

### Rule 12: Use `100dvh` Not `100vh` — Consistent Order
**Problem:** `100vh` does not equal actual visible height on mobile. Content gets cut off with no scroll recovery.
**Fix:** All viewport height references: `100vh` FIRST, `100dvh` SECOND. CSS last-declaration-wins means `100dvh` takes effect where supported, `100vh` is fallback.
```css
.app-container {
  height: 100vh;   /* fallback — older browsers */
  height: 100dvh;  /* override — wins where supported */
}
```
**This order is MANDATORY everywhere.** No exceptions. Grep for `100vh` after implementation to verify no stale ordering.
- `FullHeightPageContainer`: `height: calc(100vh - 56px); height: calc(100dvh - 56px);`
- In `muiTheme.ts` CssBaseline: same order
- In `globals.css` `.app-container`: same order

### Rule 13: Single Spacing Authority — MUI Owns Spacing
**Problem:** CSS vars (`--density-spacing`) and MUI `theme.spacing()` are two competing spacing systems. Components will mix them → visual drift.
**Fix:** MUI `theme.spacing()` is the SOLE spacing authority inside shared components:
- `theme.spacing(1)` = 8px (comfortable), stays constant. MUI spacing is the base unit.
- CSS density vars (`--density-spacing`, `--density-gap`, `--density-padding`) are used ONLY for:
  - Page-level layout gaps (`.main-layout` grid gap)
  - Tailwind-based layout components
  - Non-MUI elements
- Inside `src/shared/` components: use `theme.spacing()` and `sx` prop. NEVER `var(--density-*)`.
- Density affects shared components via `useDensity()` hook when explicit size changes are needed (e.g., switching `size="small"` on buttons at dense mode).
- This eliminates the hybrid problem: MUI components use MUI spacing. Page layouts use CSS vars. No mixing.
- **Acknowledged tradeoff:** At dense mode, layout gaps compress (4px) while MUI components retain 8px internal spacing. This is intentional — components stay readable while layout compresses. The visual rhythm difference is accepted as a conscious design decision, not a bug.

### Rule 14: Scroll Ownership — Programmatic Enforcement
**Problem:** "One scroll surface per column" is a convention. Nested scrolls will appear unintentionally.
**Fix:** `ScrollContainer` atom is the ONLY way to create a scroll surface in shared components:
```tsx
// ScrollContainer enforces: overflow-y: auto, minHeight: 0, scrollbar styling
// It also sets a data attribute for debugging:
<div data-scroll-owner="true" style={{ overflowY: 'auto', minHeight: 0 }}>
```
- In shared components (`src/shared/`): raw `overflow: auto` on any element other than `ScrollContainer` is a violation. Only `ScrollContainer` creates scroll surfaces.
- `ScrollContainer` checks for nested `data-scroll-owner` in dev mode and warns:
  ```ts
  if (process.env.NODE_ENV === 'development') {
    // Warn if a ScrollContainer is nested inside another ScrollContainer
  }
  ```
- Page-level Tailwind code can use `overflow-y-auto` freely (existing layouts don't go through shared components).
- **Raw `overflow: auto` detection:** In dev mode, CssBaseline injects a MutationObserver that warns when any element inside `src/shared/` has `overflow: auto` or `overflow-y: auto` without `data-scroll-owner`. This catches bypass via raw CSS/sx in addition to nested ScrollContainer detection.

### Rule 15: Component → Priority Tier Mapping
**Problem:** Content priority hierarchy (Rule 9) without specific component mapping becomes subjective.
**Fix:** Explicit mapping:

**Tier 1 — Core (never hidden):**
- PageHeader (title + primary actions)
- DataTable / TaskBoard / KanbanBoard (primary data view)
- Form inputs in modals
- Navigation tabs/breadcrumbs
- ActionButton (primary CTAs)

**Tier 2 — Secondary (collapsible at md):**
- Sidebar navigation labels (collapse to icons at 64px)
- Detail/inspector panels (hide below lg)
- Filter bars and facet panels
- SectionHeader subtitle text
- InfoTooltip trigger icons
- Chat/activity panels

**Tier 3 — Decorative (removable at dense/sm):**
- Empty state illustrations
- Status dot animations (pulse, glow)
- Sparkline charts in table cells
- Avatar images (replace with initials)
- Relative timestamps ("2h ago" → hide)
- Skeleton animation effects (simplify to static)

### Rule 16: DataTable Integration Contract (Not Deferred)
**Problem:** DataTable (55K LOC) is the most complex component. Deferring it entirely means the hardest viewport integration is untested.
**Fix:** DataTable is still deferred for FULL port, but Phase 7 includes a DataTable viewport contract stub:
```tsx
// src/shared/organisms/DataTable/DataTable.tsx — contract stub
// Full port is a separate task, but the stub establishes:
// 1. Root container: display: flex, flexDirection: column, overflow: hidden, minWidth: 0
// 2. Toolbar: flexShrink: 0 (search, filters, actions)
// 3. Table wrapper: flex: 1, overflow: hidden (contains both scroll axes)
//    3a. Horizontal: overflow-x: auto on table container (single horizontal scroll)
//    3b. Vertical: overflow-y: auto on same container (combined scroll surface = ONE ScrollContainer)
//    3c. Sticky columns: position: sticky, left: 0 inside the horizontal scroll
//    3d. Sticky header: position: sticky, top: 0 inside the vertical scroll
// 4. Pagination: flexShrink: 0 (fixed height)
// 5. No virtualization in stub — full port adds it
// 6. Column resizing: columns use min-width + flex, not fixed width
```
This ensures horizontal + vertical scroll coexist in a SINGLE scroll surface (no double-scroll). The combined scroll container is wrapped in `ScrollContainer` with `overflowX: 'auto'` override.

### Rule 17: Focus Navigation + `overflow: hidden`
**Problem:** Keyboard-focused element may be off-screen inside `overflow: hidden` container with no scroll to reveal it.
**Fix:**
- `ScrollContainer` (the ONLY scroll surface) uses `scroll-padding` to ensure focused elements are visible:
  ```css
  scroll-padding: 8px;
  ```
- `ContentArea` with `overflow: hidden` must NOT contain focusable elements directly — focusable content must be inside a `ScrollContainer` child.
- This is enforced by Rule 14 (scroll ownership): if content can receive focus, it must be inside a scroll surface.
- For modals/dialogs: MUI handles focus trapping automatically — no additional work needed.
- **Auto-scroll on focus:** `ScrollContainer` also sets `scroll-behavior: smooth` so browser natively scrolls focused elements into view. For edge cases where browser auto-scroll fails (deeply nested containers), `ScrollContainer` adds an `onFocusCapture` handler that calls `event.target.scrollIntoView({ block: 'nearest' })` — ensures focus is always visible.

### Rule 18: Tailwind Parent ↔ MUI Child Isolation
**Problem:** Page-level Tailwind layout (`gap-*`, `items-*`, `justify-*`) can conflict with MUI child component spacing expectations.
**Fix:** MUI shared components must be self-contained — they define their own internal spacing, never rely on parent flex/grid gap:
- Every shared component root sets `box-sizing: border-box` (inherited from global reset)
- Internal spacing uses `sx={{ p, m, gap }}` — never inherits from parent
- If a Tailwind parent applies `gap-4`, MUI children see extra spacing but it's additive, not conflicting, because:
  - MUI components use padding/margin, not gap inheritance
  - Shared components set their own `p` and `m` values
- **Convention + helper:** When placing MUI shared components inside Tailwind layouts, isolation is needed. Provide a `<Slot>` utility atom that wraps children with `flex-1 min-w-0 overflow-hidden`:
  ```tsx
  // src/shared/atoms/Slot/Slot.tsx — thin isolation wrapper
  export const Slot = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`flex-1 min-w-0 overflow-hidden ${className || ''}`}>{children}</div>
  )
  
  // Usage:
  <div className="flex gap-4">
    <Slot><Surface>...</Surface></Slot>
    <Slot><Surface>...</Surface></Slot>
  </div>
  ```
  `Slot` is the ONE shared component that uses `className` (Tailwind) because it exists at the boundary between Tailwind layout and MUI components. This is the exception to Rule 11.

### Rule 19: Mobile Viewport Model
**Problem:** Mobile has keyboard overlays, gesture areas, viewport instability. Under-modeled.
**Fix:**
- `100dvh` (Rule 12) handles browser chrome/address bar
- Keyboard overlay: when virtual keyboard opens, `100dvh` shrinks to visible area — this is correct behavior. Content reflows inside the constrained space.
- At `xs` breakpoint (<600px):
  - Sidebar fully hidden (hamburger menu trigger)
  - Single-column layout (`.main-layout--no-sidebar`)
  - Dense spacing active
  - Detail panels hidden (only accessible via modal/drawer)
  - Touch targets: minimum 44x44px (enforced via MUI component overrides — buttons already have `minHeight: 40px`, increased to 44px at xs)
- Gesture areas: no custom swipe handlers in Phase 0-10. If added later, they must respect `overflow: hidden` containers.
- **Safe area insets:** In globals.css, `.app-container` includes:
  ```css
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  ```
  This handles notches, bottom bars, and rounded corners on iOS/Android. The padding is inside the viewport lock, so content adjusts without triggering scroll.
- **iOS overscroll prevention:** Add `overscroll-behavior: none` to `html, body` in globals.css to prevent iOS bounce/rubber-banding which can visually break the viewport constraint.

### Rule 20: Behavioral Verification (Not Just Visual)
**Problem:** Checklist validates appearance, not behavioral correctness.
**Fix:** Expanded verification in Phase 10:

**Visual checks (existing):** items 1-18 in checklist

**Behavioral checks (NEW):**
- Focus traversal: Tab through every interactive element on a page — no focus trap outside modals, no invisible focused elements
- Resize stress: drag browser from 1920px to 320px width — no layout break, no page scroll, no content loss (core tier)
- Nested scroll detection: in dev mode, `ScrollContainer` warns if nested — verify zero warnings on all pages
- Density transition: resize across 1200px and 900px boundaries — spacing/font changes smoothly, no layout jump
- Portal layering: open Modal from inside a deeply nested `overflow: hidden` container — modal renders above everything
- Keyboard overlay (mobile): open an input inside a modal on mobile — content stays visible, no page scroll
- Data stress: render 1000+ rows in a table — table scrolls internally, page stays locked

---

## Phase 0: MUI Installation & Emotion SSR Setup

### Install Dependencies
```bash
cd /home/rohith/desktop/NeuactProjectManagement/prodo/frontend
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled @emotion/cache zustand
```

### Create: `src/lib/EmotionRegistry.tsx`
- Next.js App Router SSR Emotion cache registry using `useServerInsertedHTML`
- `prepend: true` so MUI styles inject BEFORE Tailwind (Tailwind gets higher specificity)
- Mark `'use client'`

### Modify: `src/app/layout.tsx`
- Wrap children with `Providers` component (created in Phase 2)
- Keep `bg-neutral-50 text-neutral-900 antialiased` body classes

### Verification
- Render `<MuiButton variant="contained">` alongside a Tailwind `<button>` — both must render correctly
- Existing `/test-layouts` page must be unaffected

---

## Phase 1: Design Tokens

### Copy verbatim: `shared/theme/tokens.js` → `src/shared/theme/tokens.ts`
- Source: `/home/rohith/desktop/Neurareport V2/frontend/src/shared/theme/tokens.js` (200 lines)
- All 200 lines copy exact — only add `as const` for type inference and explicit type annotations
- Every hex value, spacing number, shadow string, font stack preserved 1:1
- Exports: `neutral`, `primary`, `status`, `secondary*` (9 palettes), `palette`, `fontFamily*` (5), `figmaShadow`, `figmaSpacing`, `figmaComponents`
- **NEW (viewport):** Add `density` and `viewport` token objects (see Viewport section above)

### Modify: `tailwind.config.js`
- Inject tokens into `theme.extend.colors` (neutral, primary, status palettes)
- Inject `fontFamily`, `boxShadow`, `borderRadius`, `spacing` from tokens
- This ensures Tailwind components and MUI components use identical values
- Note: Overrides Tailwind's default `neutral` palette (warm paper tones vs cool gray — intentional)

### Verification
- `npx tsc --noEmit` passes
- Import tokens in a test file, confirm all exports available

---

## Phase 2: MUI Theme Factory

### Copy verbatim: `shared/theme/muiTheme.js` → `src/shared/theme/muiTheme.ts` (1,246 lines)
- Source: `/home/rohith/desktop/Neurareport V2/frontend/src/shared/theme/muiTheme.js`
- Add MUI module augmentation at top for custom palette properties (`lighter`, `background.surface`, `background.overlay`, `background.sidebar`) and custom typography variants (`displayLarge`, `displaySmall`, `code`, `paragraphLarge`, `paragraphXSmall`, `navigationItem`, `smallText`, `tinyText`)
- `createAppTheme(mode)` factory — copy all dark/light palettes, 15 typography variants, 40+ component overrides
- Adaptation: Remove `#root` selector in CssBaseline override (Next.js doesn't use `#root`)
- **NEW (viewport):** Add `html, body { height: 100%; width: 100%; overflow: hidden }` to CssBaseline; add breakpoints `{ xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }`; body typography uses `clamp()` for responsive sizing
- All values copy exact

### Create: `src/shared/theme/useThemeStore.ts` (6 lines)
- Source: uses zustand `create()` — `{ variant: 'default-light', setVariant }`
- Add TypeScript interface

### Create: `src/shared/theme/ThemeProvider.tsx` (12 lines)
- Source: `/home/rohith/desktop/Neurareport V2/frontend/src/shared/theme/ThemeProvider.jsx`
- Add `'use client'` directive
- Wraps `MuiThemeProvider` + `CssBaseline`

### Create: `src/shared/theme/index.ts` (6 lines)
- Barrel export: tokens, theme, createAppTheme, ThemeProvider, useThemeStore

### Create: `src/app/theme.ts` (36 lines — bridge)
- Source: `/home/rohith/desktop/Neurareport V2/frontend/src/app/theme.js`
- Re-exports all tokens + theme for backward-compatible `@/app/theme` imports

### Create: `src/app/Providers.tsx`
- `'use client'` wrapper combining: EmotionRegistry → ThemeProvider → ToastProvider → ErrorBoundary → AuthWrapper
- `layout.tsx` stays as server component, renders `<Providers>{children}</Providers>`

### Verification
- `<Typography variant="displayLarge">` renders at 52px Space Grotesk
- `<Button variant="contained">` has 8px borderRadius, no ripple, correct colors

---

## Phase 3: Global CSS & Font Assets

### Copy font files to `public/fonts/`
- Source: `/home/rohith/desktop/Neurareport V2/frontend/public/fonts/Inter-Variable.woff2`
- Source: `/home/rohith/desktop/Neurareport V2/frontend/public/fonts/SpaceGrotesk-Variable.woff2`

### Modify: `src/app/globals.css` (704 lines appended after Tailwind directives)
- Source: `/home/rohith/desktop/Neurareport V2/frontend/src/app/index.css`
- Keep `@tailwind base/components/utilities` at top
- Append: `@font-face` declarations, `:root` CSS custom properties, typography utility classes, component styles, animation keyframes, layout utilities, scrollbar styles, print styles
- Remove `* { box-sizing }` reset (Tailwind preflight handles this)
- Remove `#root` selector (not applicable in Next.js)
- **NEW (viewport):** Add root constraints (`html, body { height: 100%; overflow: hidden }`), `.app-container`, `.main-layout`, `.main-layout--with-panel`, `.scroll-container` utility classes (see Viewport section)

### Verification
- Inter and Space Grotesk load (check Network tab)
- `.text-display-large` class renders 52px Space Grotesk
- Scrollbar styling visible

---

## Phase 4: Styled Utilities & Animations

### Copy verbatim: `styles/styles.jsx` → `src/styles/styles.ts` (495 lines)
- Source: `/home/rohith/desktop/Neurareport V2/frontend/src/styles/styles.jsx`
- 15 keyframe animations: `fadeIn`, `fadeInUp`, `slideUp`, `slideDown`, `slideIn`, `slideInLeft`, `slideInRight`, `pulse`, `bounce`, `shake`, `float`, `shimmer`, `glow`, `spin`, `typing`
- Styled containers: `PaddedPageContainer`, `FullHeightPageContainer`, `GlassCard`
- Styled form elements: `StyledFormControl`, `ExportButton`, `RefreshButton`
- Shadow utilities: `shadow` object
- Components: `Button` (forwardRef, 3 sizes, loading state), `IconButton`, `Input`, `Kbd`
- Convert all to TypeScript with prop interfaces

### Verification
- `GlassDialog` renders with blur backdrop
- `Button` sizes (small/medium/large) render at correct heights (32/40/44px)

---

## Phase 5: Atoms (4 source + 4 new viewport atoms)

### Target: `src/shared/atoms/`

**From source (copy verbatim + TS):**
| Component | Source Size | Notes |
|-----------|-----------|-------|
| `Surface/Surface.tsx` | 675B | `styled(Paper)` with baseSx, forwardRef. Add `minWidth: 0, overflow: 'hidden'` |
| `PageContainer/PageContainer.tsx` | 748B | `FullHeightPageContainer` uses `calc(100vh - 56px)`, `PaddedPageContainer` gets `minHeight: 0, overflow: 'auto'` |
| `ActionButton/ActionButton.tsx` | 301B | `styled(MuiButton)` |
| `GlassDialog/GlassDialog.tsx` | 711B | `styled(Dialog)` with glassmorphism |

**New viewport atoms:**
| Component | Purpose |
|-----------|---------|
| `AppLayout/AppLayout.tsx` | Root shell: `div.app-container` → Header + MainLayout. Enforces `height: 100vh, overflow: hidden` |
| `MainLayout/MainLayout.tsx` | Grid container: `div.main-layout` → Sidebar slot + ContentArea. Uses CSS grid with token-based column widths |
| `ContentArea/ContentArea.tsx` | Flex column wrapper: `flex: 1, overflow: hidden, minWidth: 0`. Children scroll internally |
| `ScrollContainer/ScrollContainer.tsx` | Reusable scroll wrapper: `overflow-y: auto, overflow-x: hidden, minHeight: 0, maxHeight: '100%'` |

Each gets `index.ts` barrel. Top-level `atoms/index.ts` barrel.

---

## Phase 6: Molecules (6 of 10 — skip domain-specific)

### Target: `src/shared/molecules/`

| Component | Source Size | Copy/Skip |
|-----------|-----------|-----------|
| `PageHeader/PageHeader.tsx` | 4.6K | Copy verbatim + TS types |
| `EmptyState/EmptyState.tsx` | 2.5K | Copy verbatim + TS types |
| `LoadingState/LoadingState.tsx` | 8.0K | Copy verbatim (LoadingState + Skeleton + ContentSkeleton) |
| `InfoTooltip/InfoTooltip.tsx` | 3.1K | Copy verbatim + TS types |
| `SectionHeader/SectionHeader.tsx` | 2.1K | Copy verbatim + TS types |
| `NetworkStatusBanner/NetworkStatusBanner.tsx` | 6.7K | Copy verbatim, adapt hook import path |
| `ConnectionSelector` | 2.9K | **SKIP** — NeuraReport-specific |
| `TemplateSelector` | 2.5K | **SKIP** — NeuraReport-specific |
| `SendToMenu` | 3.8K | **SKIP** — NeuraReport-specific |
| `ImportFromMenu` | 3.8K | **SKIP** — NeuraReport-specific |

Each gets directory + `index.ts`. Top-level `molecules/index.ts` barrel.

---

## Phase 7: Organisms (4 of 7 — skip domain-specific)

### Target: `src/shared/organisms/`

| Component | Source Size | Copy/Skip |
|-----------|-----------|-----------|
| `ErrorBoundary/ErrorBoundary.tsx` | 5.8K | Copy, remove Sentry, `import.meta.env` → `process.env.NODE_ENV` |
| `ConfirmModal/ConfirmModal.tsx` | 4.9K | Copy, change localStorage key to `neuact_pm_preferences` |
| `ModalShell/ModalShell.tsx` | 12K | Copy verbatim (exports Modal + Drawer) |
| `ToastProvider/ToastProvider.tsx` | 3.5K | Copy verbatim (exports ToastProvider + useToast) |
| `DataTable` | 1K stub → 55K real | **CONTRACT STUB** — viewport-compliant skeleton (see Rule 16). Full port separate task. |
| `IframePreview` | 205B | **SKIP** — not needed for PM |
| `FeedbackPanel` | 7.8K | **SKIP** — not core for PM |

Each gets directory + `index.ts`. Top-level `organisms/index.ts` barrel.

---

## Phase 8: Core UI Bridge Files

### Create: `src/components/core.tsx`
- Re-exports from shared hierarchy (ErrorBoundary, ToastProvider, useToast, LoadingState, Skeleton, ContentSkeleton, EmptyState, PageHeader, SectionHeader, InfoTooltip, Surface)
- Inline components from source: OfflineBanner, SuccessCelebration, useCelebration, FavoriteButton

### Create: `src/components/ux.tsx`
- Port from source (40K): ActivityPanel, DisabledTooltip, ValidatedTextField, CharacterCounter, OperationHistoryProvider, useOperationHistory
- Skip NeuraReport-specific: ReportGlossaryNotice, AiUsageNotice

### Create: `src/components/modals.tsx`
- Bridge re-export: Modal, Drawer, ConfirmModal

---

## Phase 9: Hooks (3 source + 1 new viewport hook)

### Target: `src/shared/hooks/`

| Hook | Source | Copy/Skip |
|------|--------|-----------|
| `useKeyboardShortcuts.ts` | Domain-neutral | Copy, adapt SHORTCUTS for PM (NEW_TASK instead of NEW_REPORT) |
| `useNetworkStatus.ts` | Domain-neutral | Copy, adapt health check URL to Django backend |
| `useDataTableState.ts` | Domain-neutral | Copy verbatim |
| **`useDensity.ts`** | **NEW** | Returns `'comfortable' \| 'compact' \| 'dense'` based on MUI `useMediaQuery` breakpoints. Components use this to adjust spacing/fontSize/padding from density tokens |
| `useBootstrapState.ts` | Adaptable | Defer — needs PM-specific cache keys |
| `useCrossPageActions.ts` | NeuraReport-specific | **SKIP** |
| `useIncomingTransfer.ts` | NeuraReport-specific | **SKIP** |
| `useJobsList.ts` | NeuraReport-specific | **SKIP** |
| `useSharedData.ts` | NeuraReport-specific | **SKIP** |
| `useStepTimingEstimator.ts` | NeuraReport-specific | **SKIP** |

Barrel export: `src/shared/hooks/index.ts`

---

## Phase 10: Provider Integration

### Modify: `src/app/layout.tsx`
- Import `Providers` component
- Final nesting: `<html> → <body> → <Providers>{children}</Providers>`
- `Providers.tsx` handles: EmotionRegistry → ThemeProvider → DensityProvider → ToastProvider → ErrorBoundary → AuthWrapper
- **Viewport enforcement:** `<html className="h-full w-full overflow-hidden">`, `<body className="h-full w-full overflow-hidden">`, body wraps children in `<div className="app-container">`
- DensityProvider sets `data-density` attribute on body — CSS vars activate automatically
- **Route change handling:** `overflow: hidden` on body disables browser scroll restoration. This is actually DESIRED — viewport-locked apps don't need scroll restoration. But `ScrollContainer` instances inside `ContentArea` should reset their scroll position on route change. Add a `usePathname()` effect in `ContentArea` that resets child scroll positions to top on navigation. Anchor navigation (`#section`) is not supported in viewport-locked mode — use programmatic `scrollIntoView()` inside `ScrollContainer` instead.

---

## Execution Order & Dependencies

```
Phase 0 (MUI install)     ← blocks everything
  ↓
Phase 1 (tokens.ts)       ← blocks Phase 2, 4, 5, 6, 7
  ↓
Phase 2 (muiTheme.ts)     ← blocks Phase 4, 5, 6, 7
  ↓
Phase 3 (CSS + fonts)     ← parallel with Phase 2
  ↓
Phase 4 (styles.ts)       ← blocks Phase 5, 6, 7
  ↓
Phase 5 (atoms)           ← blocks Phase 6
Phase 6 (molecules)       ← blocks Phase 7
Phase 7 (organisms)       ← blocks Phase 8
Phase 8 (core bridges)    ← parallel with Phase 9
Phase 9 (hooks)           ← independent after Phase 1
  ↓
Phase 10 (providers)      ← final integration
```

## Files Summary

### New Files (~45)
- `src/lib/EmotionRegistry.tsx`
- `src/app/Providers.tsx`
- `src/app/theme.ts` (bridge)
- `src/shared/theme/tokens.ts`
- `src/shared/theme/muiTheme.ts`
- `src/shared/theme/useThemeStore.ts`
- `src/shared/theme/ThemeProvider.tsx`
- `src/shared/theme/index.ts`
- `src/styles/styles.ts`
- `src/shared/atoms/` (8 components × 2 files + 1 barrel = 17 files) — includes 4 new viewport atoms
- `src/shared/molecules/` (6 components × 2 files + 1 barrel = 13 files)
- `src/shared/organisms/` (4 components × 2 files + 1 barrel = 9 files)
- `src/shared/hooks/` (4 hooks + 1 barrel = 5 files) — includes useDensity
- `src/components/core.tsx`
- `src/components/ux.tsx`
- `src/components/modals.tsx`

### Modified Files (3)
- `src/app/layout.tsx`
- `src/app/globals.css`
- `tailwind.config.js`

### Copied Assets (2)
- `public/fonts/Inter-Variable.woff2`
- `public/fonts/SpaceGrotesk-Variable.woff2`

## Verification Checklist

1. `npm run build` succeeds with no errors
2. Existing `/test-layouts` page renders identically
3. MUI `<Button>`, `<Typography>`, `<Paper>` render with correct design tokens
4. Glass-morphism effects (GlassDialog, ConfirmModal) render blur + transparency
5. Animations (fadeInUp, slideUp, bounce, shake) play correctly
6. Font rendering: Inter for body, Space Grotesk for display headings
7. Dark/light mode toggle works via `useThemeStore`
8. Toast notifications appear via `useToast()`
9. ErrorBoundary catches and renders fallback UI
10. Keyboard shortcuts fire via `useKeyboardShortcuts()`

### Viewport Constraint Validation
11. **No scrollbars on `<body>`** at any viewport size (320px to 2560px)
12. `html` and `body` have `overflow: hidden` enforced
13. AppLayout shell constrains to `100dvh × 100vw`
14. Content areas scroll internally (tables, lists, panels)
15. Sidebar and header remain fixed/visible at all viewport sizes
16. `useDensity()` returns correct mode at each breakpoint
17. Grid-based main layout has no implicit wrapping
18. No component pushes layout beyond viewport bounds

### Behavioral Validation (Rule 20)
19. Focus traversal: Tab through all interactive elements — no invisible focus, no escaping traps
20. Resize stress: drag 1920px → 320px — no layout break, no page scroll, core content visible
21. Nested scroll: zero `ScrollContainer` nesting warnings in dev console
22. Density transition: cross 1200px/900px boundaries — smooth spacing/font change, no layout jump
23. Portal layering: Modal from deep `overflow: hidden` nesting renders above all content
24. Keyboard overlay (mobile): virtual keyboard doesn't cause page scroll
25. Data stress: 1000+ table rows scroll internally, page stays locked
26. DataTable stub: stub component fits viewport contract (flex column, header fixed, body scrolls, horizontal scroll coexists)
27. Route change: navigate between pages — `ScrollContainer` resets to top, no stale scroll position
28. iOS Safari: no rubber-banding bounce on body (`overscroll-behavior: none` holds)
29. Safe area: content doesn't clip under notch/home indicator on mobile
30. Stacking context: no `transform`/`filter` ancestor traps modal portals
31. `100dvh` consistency: grep confirms `100vh` always precedes `100dvh` (never reversed)
