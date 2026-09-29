# Design

Recorded from the built console. This world replaces the previous glassmorphic identity across the app shell and six routes: Security (SOC), Access Control, Plan & Billing, System Logs, Data Sources, and Settings.

**Migrated:** `/security`, `/users`, `/subscription`, `/logs`, `/integrations`, `/settings`, plus the shell (`layouts/default.vue`, `Sidebar`, `Header`, `Toast`).
**Not yet migrated:** `/` (Dashboard), `/alerts`, `/reports`, `/login`, `/register`, `/payment` — these still use the legacy `glass-*` utilities, which are deliberately retained in `main.css` so they keep rendering.

## The one law

**Hue means severity. Nothing else.**

Structure, hierarchy, state, selection, and focus are all carried by neutral value steps on a zinc ramp. Because no decorative element is ever allowed a hue, a red pixel anywhere on this surface is always an operational fact. This is the rule that every other decision below defers to — it is why the focus ring is white rather than blue, why selection is a background step rather than an accent, and why low-severity volume is drawn at reduced opacity.

## Color

Defined as CSS custom properties in `frontend/assets/css/main.css` and mirrored into Tailwind under `surface`, `line`, `ink`, and `sev` in `frontend/tailwind.config.js`.

| Role | Token | Value |
|---|---|---|
| Ground | `surface-base` | `#09090b` |
| Panel / raised | `surface-raised` | `#0e0e11` |
| Header / footer bars | `surface-panel` | `#121216` |
| Overlay (drawer, palette) | `surface-overlay` | `#17171c` |
| Row hover / selected | `surface-hover` | `#1f1f25` |
| Hairline rule | `line-faint` | `#1c1c1f` |
| Standard border | `line` | `#27272a` |
| Emphasis border | `line-strong` | `#3f3f46` |
| Primary text | `ink-primary` | `#fafafa` |
| Secondary text | `ink-secondary` | `#a1a1aa` (7.75:1) |
| Muted text | `ink-muted` | `#8a8a93` (5.82:1) |
| Decorative / disabled | `ink-faint` | `#5c5c66` — never body copy |

Severity: `critical #ef4444` (5.29:1), `high #f59e0b` (9.26:1), `medium #eab308`, `low #10b981`. All meet WCAG AA for normal text on the base ground.

**Visual weight scales with severity.** Because a real detection feed is bottom-heavy, drawing every band at full saturation would let the least important one dominate. Fills step down: critical at full opacity, high at `/85`, medium at `/55`, low at `/35`. The heat matrix additionally caps its opacity ramp per severity (`CELL_RAMP` in `AttackSurface.vue`) so a busy hour of port scans can never out-shout one exfiltration cell.

**Baseline states get no hue at all.** Where a value is the norm for its surface rather than a signal, it renders neutral even though it sits on a severity scale. This is the rule that keeps colour scarce as the world spread across six routes:

| Surface | Coloured | Neutral (baseline) |
|---|---|---|
| Threat feed | critical, high | medium, low |
| Access control | Full, Elevated privilege | Operational, Read |
| System logs | ERROR, WARN | INFO, DEBUG |
| Data sources | Warning, Disconnected | Connected, Syncing |
| Usage meters | ≥80% of limit | below 80% |

Applied literally, two thirds of the access directory would have been amber and the entire log console tinted. The tell that a scale needs this treatment is simple: if most rows carry the colour, it has stopped being a signal.

Color strategy is **Restrained**: a neutral ground with semantic accent only. Dark is not a category default here — it comes from the use scene recorded in PRODUCT.md (a low-light operations floor, wall-mounted panels, shift-long sessions).

## Typography

- **Inter** for all UI text; **JetBrains Mono** for machine-readable values only — timestamps, IPs, ports, hashes, event IDs, hostnames, counts, and hexdumps. Loaded from Google Fonts in `nuxt.config.ts` with system fallbacks.
- Monospace is never used decoratively. If a value is not read or compared character by character, it is set in Inter.
- The scale is shifted below Tailwind's default floor because a console needs steps a marketing page does not: `2xs 10px`, `xs 11px`, `sm 12px`, `base 13px`, `md 14px`, `lg 16px`, `xl 20px`, `2xl 26px`, `3xl 32px`. Line-heights are fixed pixel values so virtualized rows can rely on an exact row height.
- `font-variant-numeric: tabular-nums` on all mono and all numerals, so columns of figures align and compare.
- Section labels: `2xs`, uppercase, `tracking-[0.08em]`, `ink-muted` (`.panel-title` / `.field-label`).

## Structure

The SOC route opts into a **fixed-viewport shell**: the document never scrolls, only the virtualized feed and the attack-surface rail do. Pages declare this with `definePageMeta({ dense: true })`; `layouts/default.vue` branches on it so every unmigrated route keeps its original scrolling canvas.

```
216px sidebar │ 48px command bar
              │ 56px page head
              │ KPI strip (4-up desktop, swipe row on phones)
              │ 38px filter bar
              │ virtualized feed (flex-1) │ 320px attack surface rail
                                          └ 540px slide-over drawer
```

The KPI strip is deliberately unequal (`xl:grid-cols-[1.05fr_1.35fr_1fr_1fr]`) — the metric that triggers action gets more room than the ones providing context.

## Components

Density conventions: panels are a 1px `line` border plus a value step — no blur, no shadow, no glow. Radii never exceed 6px. Controls are 24–28px tall. Panel headers are 36px.

- `.panel`, `.panel-header`, `.panel-title`, `.field-label` — panel grammar.
- `.btn`, `.btn-primary`, `.btn-danger` — 28px, 4px radius, `line` border.
- `.chip` / `.chip-on` — 24px multi-select filter toggles; the selected state is a value step, not a hue.
- `.input` — 28px, `surface-input` ground.
- `.kbd` — 18px keycap for shortcut hints.

Feature components are grouped by domain:

- `components/ui/` — `SlideOver`, the shared drawer shell (scrim, focus trap, enter/exit, Escape).
- `components/soc/` — `ThreatFeed`, `AttackSurface`, `IncidentDrawer`, `CommandPalette`, `FilterBar`, `KpiCard`, `SeverityTag`, `SeverityMixBar`, `Sparkline`.
- `components/access/` — `PrivilegeTag`, `UserDrawer`.
- `components/logs/` — `LogDrawer`.
- `components/sources/` — `ConnectorDrawer`.
- `components/account/` — `UsageMeter`.

`KpiCard` exposes a `viz` slot so a metric can bring its own visualization. Four identical cards each carrying an identical sparkline is the template signature this avoids: Threat Level ships a severity distribution bar instead, because a composite index is a ratio and a trend line would say less about it than the mix does.

### Recurring page grammar

Every migrated route is built from the same four parts, which is what makes them read as one product rather than six pages:

1. **56px page head** — title, one line of live context, right-aligned actions.
2. **Posture strip** — either KPI cards (SOC) or a rule-separated fact row that doubles as a filter (Access Control, Data Sources). The fact row exists so the card strip does not become the answer to every page.
3. **Filter bar** — multi-select chips carrying live counts, plus a search field. Chips report what narrowing will cost before it is clicked.
4. **Main table + 320px rail** — the record list beside its own aggregate view, with row click opening a slide-over.

Settings deliberately breaks this: it is a form surface, so it uses a section nav plus a left-aligned 720px column and a save/reset pair in the head.

### Tables

Rows are fixed-height and never wrap: 24px (log lines), 32px (threat feed), 36px (accounts, connectors, invoices). Columns are declared as one `gridTemplateColumns` string shared by the header and every row, so the header cannot drift from its data. Machine-comparable columns (asset, source IP, hostname) get guaranteed `minmax()` minimums before descriptive columns take remaining space; secondary labels are deferred to `xl:`/`2xl:` rather than allowed to truncate an identifier.

## Severity encoding

Severity is **never** carried by color alone. `SeverityTag` renders a colored bar plus a monospace text code (`CRIT` / `HIGH` / `MED` / `LOW`) plus a screen-reader-only full label. The tag survives greyscale, and every heat-matrix cell and composition segment carries a `title` naming its count and severity.

## Motion

Every interactive transition resolves inside 150ms (`--t-fast 80ms`, `--t-base 120ms`, `--t-slow 150ms`, ease `cubic-bezier(0.16, 1, 0.3, 1)`). There is one authored moment — the incident drawer arriving from the edge it belongs to, with its scrim fading in alongside.

Two motion decisions are load-bearing:

1. **Row recency is data, not animation.** Virtualized rows are recycled, so an entrance transition would fire on the wrong row. Events under 15 seconds old are drawn with a severity-tinted dot and a brighter timestamp — computed from the data, zero animation cost, correct under DOM recycling.
2. **The drawer animates from reactive state, not `<Transition>`.** The feed behind it re-renders four times a second, and those patches were cancelling the enter transition mid-flight and stranding the panel half off-screen. A state-bound class cannot be interrupted that way.

The open flip is driven by `requestAnimationFrame` **with a 32ms timer fallback** (`SlideOver.vue`). rAF is suspended in a hidden or throttled tab; without the fallback, a user who opened a drawer and switched tabs would return to an off-screen panel behind a fully opaque scrim — an invisible wall over the page.

`prefers-reduced-motion: reduce` collapses all transitions globally.

## Feed behavior

These are design decisions as much as engineering ones, and the interface would be wrong without them:

- **Windowed rendering** (`composables/useVirtualList.ts`). Mounted DOM nodes are a function of viewport height, not dataset length — roughly 28 rows regardless of the 5,000 buffered. The feed footer reports mounted rows, buffer occupancy, and batch interval, because on a shift-long session those are operational facts.
- **250ms batched ingest.** Arrivals accumulate in a non-reactive staging array and commit once per window, so a burst of 40 events is one render pass rather than 40.
- **Hold-while-working.** While the pointer is over the feed, or while it is scrolled away from the newest event, arrivals accumulate off-screen and the visible rows do not move at all. Without this, the row under the cursor is replaced between mousedown and mouseup and the analyst opens the wrong incident. A pill reports the held count and restores the flow.
- **Bounded everything.** 5,000 retained events, 750 staged; both truncate oldest-first.

## Accessibility

WCAG 2.1 AA. Focus is a 2px `ink-primary` ring at 1px offset — neutral by design, since a colored ring would read as a severity signal. The feed is a keyboard-first surface (`↑`/`↓` navigate, `↵` inspect, `Home` jump to latest); the drawer traps Tab, closes on Escape, and restores focus to its opener. `Cmd/Ctrl+K` opens the command palette from anywhere.

## Layering

`z-30` command bar · `z-40/50` mobile nav scrim and sidebar · `z-60/61` drawer scrim and panel · `z-70` command palette · `z-100` toasts.

## Boundaries

Four layers, enforced in both directions:

- **`services/`** owns all I/O and all domain data. `soc/` (REST, Socket.IO transport, offline simulator, shared types), `logs/` (log transport + generator), `access/` (roles, modules, directory), `billing/` (tiers, capabilities, usage, invoices).
- **`composables/`** orchestrate: batch, bound, and expose reactive views. They perform no I/O and generate no data — `useThreatStream` and `useLogStream` both take records from a transport callback and do nothing but shape them. `useVirtualList` is pure windowing.
- **`pages/`** wire services to components and own filter state.
- **`components/`** are presentational: props in, events out, no data access. A component never defines a permission table, a price, or a severity mapping that another surface also needs.

Swapping Socket.IO for SSE, or the local generators for a real SIEM, touches one file per domain.

## Not in this world

No glassmorphism, backdrop blur, or translucent cards. No glows, neon, or gradient text. No decorative 3D or wireframe globes. No colored `border-left` accents above 1px. No nested cards. No same-size icon-plus-heading card grids as page structure. No monospace as a costume for "technical." No emoji standing in for icons.
