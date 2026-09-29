# OptiSight — Phase 0/1 Audit

**Date:** 2026-09-21
**Scope:** `backend/` (Express 5 + Prisma + Socket.IO), `frontend/` (Nuxt 4 / Vue 3 / Tailwind v3)
**Method:** source review, running-application inspection (localhost:3000 / :3001), composited WCAG contrast measurement in-browser, authenticated and unauthenticated API probing, dependency audit.
**Status:** No application code changed. This document is evidence, not remediation.

---

## 1. Product model as built

| Dimension | Finding |
|---|---|
| **Purpose** | SaaS control plane unifying telemetry from disconnected enterprise IT systems (cloud, legacy DB, k8s, security tooling) into one real-time picture. Explicitly a *support* tool — surfaces evidence, never acts autonomously. |
| **Vertical** | Banking / FinTech. Legacy mainframe + Oracle must coexist with AWS, Azure, Kubernetes in one view. |
| **Primary user** | SOC analyst on shift. Low-light ops floor, wide monitor, wall panel, 8-hour rotation, measured on detection speed and miss rate. |
| **Secondary users** | IT Operations (dashboard), Infra/Data (logs), Management (reports), Global Admin (RBAC). |
| **Roles in DB** | Two only: `admin`, `analyst`. Default on self-registration: `analyst`. |
| **Roles in UI** | Four privilege tiers (`full`, `elevated`, `operational`, `read`) across 8 named roles, defined in `frontend/services/access/directory.ts`. **These two role models do not meet anywhere.** |
| **Routes** | 12: `/`, `/security`, `/logs`, `/integrations`, `/users`, `/subscription`, `/settings`, `/alerts`, `/reports`, `/login`, `/register`, `/payment`. |
| **Persistence** | NeonDB PostgreSQL via Prisma. Three models: `User`, `AuditLog`, `AlertEvent`. `AlertEvent` is **never read or written by any code**. |
| **Realtime** | Socket.IO. Server emits `threat-event` (bursty, 180–1080ms), `system-metrics` (3s), `anomaly-alert` (on RAM > 75%). |
| **External services** | Google Fonts (CSS + font files), DiceBear avatar API (`api.dicebear.com`). No payment processor, no threat-intel feed, no SIEM. |
| **Payments** | None. `/subscription` renders local fixtures from `services/billing/plans.ts`. `/payment` is a 9-line stub. No card data is collected anywhere. |
| **File upload** | **None.** No upload control, no multipart parser, no storage integration. The file-upload sections of the QA and security plans are therefore marked *Not Applicable — no attack surface*. |
| **Admin functionality** | `/users` (suspend, restore, enforce MFA, reset access, change role) — all client-side only, no API, no confirmation, no audit trail. |

### Data provenance — the load-bearing fact

Every threat record, IP, hash, hostname, MITRE technique, invoice, connector, and directory account in this application is **synthetic**. `backend/src/lib/threats.ts` and `frontend/services/soc/simulator.ts` generate it. `PRODUCT.md` states this and requires it be labelled wherever a viewer could mistake it for production data.

Nothing in the running UI labels it. The SOC page head reads `Production · Singapore · prod-apac-1 · 2,404 events in buffer` beside a green **LIVE** indicator. This is the single highest-impact product defect in the audit and is tracked as **UX-02**.

---

## 2. Architecture as built

```
Browser (Nuxt 4, SSR + client)
  ├── useCookie('optisight_token') ──┐  read path
  ├── localStorage['optisight_token']┘  write path (login)   ← BROKEN SEAM
  ├── $fetch  ──→  Express :3001  /api/*   (Bearer JWT, authenticate middleware)
  └── socket.io-client ──→ Express :3001   (NO credentials sent, NONE required)

Express 5
  ├── helmet()            — defaults, no CSP tuning for an API
  ├── cors()              — wildcard, all origins, all routes
  ├── rateLimit           — 100 / 15min / IP, shared across ALL /api incl. login
  ├── /api/auth/*         — register, login, me, logout   (Prisma → Postgres)
  ├── /api/stats|alerts|security|systems — authenticate, static/synthetic payloads
  └── io.on('connection') — unauthenticated, cors origin:'*'
```

**Four-layer frontend boundary** (`services/` → `composables/` → `pages/` → `components/`) is real, documented in `DESIGN.md`, and observed to hold on the six migrated routes. This is the codebase's strongest asset and the redesign must preserve it.

---

## 3. Current strengths

These are genuine and must survive the redesign.

1. **The SOC console is a serious piece of work.** Virtualized feed (`useVirtualList`) mounts ~28 rows regardless of a 5,000-event buffer; 250ms batched ingest; hold-while-working so rows never move under the cursor; bounded staging (750) and retention (5,000) — all correct decisions for shift-long sessions, and all documented with the reasoning.
2. **A real design system exists.** Tokens in `main.css` mirrored into `tailwind.config.js` under `surface` / `line` / `ink` / `sev`. One enforced law — *hue means severity, nothing else* — which is why focus rings are white and selection is a value step.
3. **Severity is never colour-alone.** `SeverityTag` renders a colour bar + monospace code (`CRIT`/`HIGH`/`MED`/`LOW`) + screen-reader label. Survives greyscale.
4. **Typographic discipline.** Custom scale below Tailwind's floor (10–32px) with fixed pixel line-heights so virtualized rows have exact heights. Monospace reserved for machine-comparable values only. `tabular-nums` throughout.
5. **Measured accessibility on the SOC surface.** In-browser audit of `/security`: 0 unnamed interactive elements, 0 touch targets under 24×24, feed correctly exposed as `role="grid"`, correct `alt` handling, 3 landmarks present.
6. **Motion is reasoned, not decorative.** Row recency drawn from data rather than animation (correct under DOM recycling); drawer animates from reactive state because feed re-renders were cancelling `<Transition>`; `requestAnimationFrame` with a 32ms fallback for throttled tabs; global `prefers-reduced-motion` collapse.
7. **Graceful transport degradation.** Socket loss falls back to a local generator and the command bar reports `LOCAL` instead of `LIVE` — the UI never silently lies about *transport*.

---

## 4. The central problem: two products in one binary

Six routes (`/security`, `/users`, `/subscription`, `/logs`, `/integrations`, `/settings`) plus the app shell were migrated to the console design system. Six were not (`/`, `/alerts`, `/reports`, `/login`, `/register`, `/payment`). The legacy `glass-*` utilities are still live in `main.css` to keep them rendering.

A user moving from Dashboard to Security crosses a hard border between two unrelated visual worlds:

| | Legacy routes | Migrated routes |
|---|---|---|
| Ground | `slate-950` `#020617` (blue-tinted) | `surface-base` `#09090b` (neutral zinc) |
| Surfaces | `backdrop-blur-lg`, `rounded-2xl`, `shadow-lg` | 1px `#27272a` rule + value step, no blur/shadow |
| Hue | indigo, sky, emerald, rose, amber — **decorative** | severity only — **semantic** |
| Radii | 12–16px | ≤6px |
| H1 | 30px bold | 20px medium |
| Row density | 96px alert rows | 24–36px |
| Motion | 0.4–0.8s fade-ins, infinite pulse | ≤150ms, one authored moment |

This is not a cosmetic split. On the legacy Dashboard, indigo, emerald and rose are applied to *Systems Online*, *Data Nodes*, and *Active Threats* with no consistent meaning, while on the SOC console red means exactly one thing. An analyst who learns the colour law on `/security` is actively misled on `/`.

---

## 5. Findings

Format per brief: **Current State → Problem → Risk / UX Impact → Recommended Change → Priority**.
Security findings carry full detail in `docs/02-SECURITY.md`; only the UX-facing consequences appear here.

---

### FUNCTIONAL

#### FN-01 · Login does not establish a session · **P0**
**Current State** — `pages/login.vue:95` writes the JWT to `localStorage`. `composables/useUser.ts:22` reads it from `useCookie('optisight_token')`. `pages/register.vue:166` writes it to the cookie. Login also calls `updateProfile()` rather than the composable's `login()`, so `status` is never set true.
**Problem** — The write path and the read path are different storage mechanisms. Registering works. Logging in does not.
**Risk / UX Impact** — After a successful login the user lands on `/` with no usable token. `useFetch('/api/stats')` sends `Bearer undefined` and 401s. The dashboard silently displays `stats?.activeAlerts || 3` — a hard-coded 3 — so the failure is invisible. A returning user can *never* reach authenticated data; only a brand-new registration works. Verified in source; the running instance has no `DATABASE_URL`, so end-to-end login returns 500 and could not be exercised live.
**Recommended Change** — Delete the `localStorage` write. Call `useUser().login(token, user)` from `handleLogin`. Make the composable the only module that touches token storage; no page reads or writes it directly.
**Priority** — P0

#### FN-02 · No authentication guard on any route · **P0**
**Current State** — No `frontend/middleware/` directory exists. No page declares `definePageMeta({ middleware })`. Verified against the running server: all 12 routes return HTTP 200 fully rendered to a request carrying no credentials, including `/users` (RBAC administration) and `/subscription` (billing).
**Problem** — There is no client route protection, and no server-side page protection either.
**Risk / UX Impact** — The employee directory page serves 22 distinct email-shaped identifiers, department, role, MFA status and last-active timestamps to anyone with the URL. All synthetic today; the page is already public for the day it is wired to a real `/api/users`. Cross-referenced as **SEC-AUTHZ-001**.
**Recommended Change** — Add `middleware/auth.global.ts` redirecting unauthenticated users to `/login?next=<path>`; add `middleware/admin.ts` for `/users`. Treat both as UX affordances only — the server-side control in SEC-AUTHZ-001 is the actual boundary.
**Priority** — P0

#### FN-03 · Alert Center fetches the wrong endpoint and discards the result · **P1**
**Current State** — `pages/alerts.vue:96` awaits `useFetch('/api/stats')` into `rawAlerts`, which is never referenced again. The three alerts are hard-coded in `onMounted`. `/api/alerts` exists on the backend and is never called. The tab row (All / IT Operations / SOC) has no click handlers.
**Problem** — The page performs a pointless unauthenticated network call, ignores the real endpoint, and presents three static rows behind non-functional filters.
**Risk / UX Impact** — "Cross-team routing of a single anomaly" is one of the two mechanisms `PRODUCT.md` names as the product's defensible positioning. The page that demonstrates it does not work, and the team filter — which *is* the routing story — does nothing.
**Recommended Change** — Call `/api/alerts` with auth; wire the tabs to a reactive filter; drop the fixture.
**Priority** — P1

#### FN-04 · Alert Center renders blank for ~3s with no loading or empty state · **P1**
**Current State** — Observed in browser: on first paint the page shows title, tabs, and a hairline rule, then nothing for roughly three seconds. `v-if="pending"` is false (the fetch resolved) while `alerts` is still `[]` (populated in `onMounted`). The gap between those two states renders an empty `<transition-group>`. There is no empty state for the dismiss-all case either.
**Problem** — Two of the three list states (loading-but-not-pending, empty) are unhandled.
**Risk / UX Impact** — The Alert Center looks broken on every visit. Dismissing all three alerts leaves a bare rounded rectangle.
**Recommended Change** — A single derived state machine: `loading | error | empty | ready`. Skeleton rows for loading (matching final row height so nothing shifts), a real empty state for zero results, and a distinct one for "filtered to zero" offering a filter reset.
**Priority** — P1

#### FN-05 · `/payment` is a reachable unstyled stub · **P1**
**Current State** — `pages/payment.vue` is nine lines: `<h1>Payment</h1>`. It renders inside the full app shell — sidebar, command bar, operator footer — with a single line of unstyled text. Unlinked from navigation but directly reachable.
**Risk / UX Impact** — A live route in a product being positioned for a banking pilot renders as a blank page under the word "Payment". Anyone who finds the URL sees an abandoned build.
**Recommended Change** — Delete the route, or redirect `/payment → /subscription`. Do not build a payment form: no processor is integrated and card handling is out of scope.
**Priority** — P1

#### FN-06 · Logout is client-only · **P2**
**Current State** — `useUser().logout()` clears the cookie and navigates. `POST /api/auth/logout` — which exists and writes the `LOGOUT` audit row — is never called.
**Risk / UX Impact** — No logout is ever recorded. Combined with SEC-SESSION-001 (stateless JWT, no revocation), a token copied before logout stays valid for the remainder of its 24h life.
**Recommended Change** — Call the endpoint, then clear local state regardless of its outcome.
**Priority** — P2

#### FN-07 · Admin actions are theatre · **P1**
**Current State** — `pages/users.vue:handleAction` mutates a local array and raises a toast. Suspend → `"has been signed out everywhere"`. Enforce MFA → `"must enrol a second factor at next sign-in"`. Reset → `"A new sign-in link was sent"`. No API call, no email, no session revocation, no confirmation dialog, no audit entry. State resets on reload.
**Problem** — The UI asserts security outcomes that did not occur.
**Risk / UX Impact** — An administrator suspends a compromised account during an incident, is told it is signed out everywhere, and moves on. Nothing happened. This is worse than an error, because it stops the operator from taking the action that would have worked.
**Recommended Change** — Until `/api/users` exists, label the surface as a non-operational preview and replace outcome claims with intent ("Suspension queued — not yet connected to the identity provider"). When wired, every destructive action requires a typed-confirmation dialog naming the target, and writes an `AuditLog` row.
**Priority** — P1

#### FN-08 · `AlertEvent` model is dead · **P3**
**Current State** — Defined in `schema.prisma`, migrated, never queried or written.
**Recommended Change** — Either back `/api/alerts` with it, or drop it. A schema that lies about what is persisted misleads the next engineer.
**Priority** — P3

---

### DESIGN

#### DS-01 · Two design systems ship simultaneously · **P0**
**Current State** — Section 4 above. Legacy `glass`, `glass-dark`, `glass-card` utilities remain in `main.css` and are used by six routes.
**Problem** — Hue is semantic on half the app and decorative on the other half.
**Risk / UX Impact** — The colour law is the product's core visual mechanism. Half-enforced, it is worse than absent: an analyst trained to read red as *operational fact* on `/security` sees rose "Active Threats" cards, emerald "Synced" pills and indigo "Load Balanced" text on `/` where those hues mean nothing. It also reads as an unfinished product to a pilot buyer.
**Recommended Change** — Migrate the six legacy routes to the console system. Delete `glass*` from `main.css` in the same commit that removes the last usage — a retained legacy utility is an invitation to regress.
**Priority** — P0

#### DS-02 · Fabricated operational and financial metrics · **P0**
**Current State** — `/`: `99.99% Uptime`, `Data Nodes Active 32/32`, `Core Banking DB — Operational (9ms latency)`, `External API Gateway — DDoS Attempt Blocked`, `Payment Processors — Load Balanced (6 nodes)`, `Live Revenue Stream ฿840,280`, `Transaction Revenue ฿15,420,202`. `/reports`: `Threats Blocked 100%`, `Brute Force Attempts 14,210`, `Infrastructure Cost ฿412,000`. All hard-coded string literals or `Math.random()`.
**Problem** — `PRODUCT.md` states plainly: no uptime or accuracy benchmarks exist, no real customers, no pricing validation.
**Risk / UX Impact** — "Threats Blocked: 100%" is a claim no security product can make. In a banking pilot these read as capability assertions. This is the reputational risk in the audit, not merely a UX one.
**Recommended Change** — Every fabricated figure is either (a) removed, (b) bound to a real source, or (c) rendered inside an explicitly marked demonstration frame. Revenue belongs to no user in the product's user model — cut it rather than re-theme it.
**Priority** — P0

#### DS-03 · "AI Predictive Analysis" panel contains no analysis · **P1**
**Current State** — Two static `<div>`s with fixed copy ("Node 3 will reach 95% capacity in 7 days"), a "High Probability" pill, an indigo glow blob, and a gradient `border-left`. No model, no computation, no data binding.
**Risk / UX Impact** — Predictive analysis is the second of the two mechanisms `PRODUCT.md` names as defensible positioning. Presenting a hard-coded string as a forecast is the clearest instance of the pattern the brief prohibits — decoration standing in for capability.
**Recommended Change** — Compute a real projection from `useSystemState` history (linear extrapolation to threshold is honest and sufficient), show the input series and the method, and label confidence with its actual basis. If that is out of scope for the pilot, remove the panel.
**Priority** — P1

#### DS-04 · Fake security assurances in auth copy · **P1**
**Current State** — `/login` footer: `"All nodes encrypted."` `/register` footer: `"BIOMETRIC ENCRYPTION ENABLED"`. `/register` consent: `"Security Protocols"` linking to `#`. Navigation metaphor throughout: "Request access card", "Identify here", "Already have clearance?", "Access Dashboard".
**Problem** — The brief explicitly prohibits meaningless security indicators. "Biometric encryption" describes nothing that exists; there is no biometric factor and no MFA of any kind.
**Risk / UX Impact** — A false assurance on the login screen of a security product is the worst possible place for one. The spy-fiction vocabulary also costs clarity: "Request access card" is not obviously "create an account".
**Recommended Change** — Remove both footer claims. Plain operational language: "Sign in", "Create account", "Forgot password?". If a trust statement is wanted, state a true one (for example the session timeout) or none.
**Priority** — P1

#### DS-05 · `ink-faint` used for structural headings · **P2**
**Current State** — `Sidebar.vue` renders the group labels Operations / Security / Administration as `<h2 class="text-ink-faint">` at 10px. Measured in-browser with full alpha compositing: **2.92:1** against `surface-raised #0e0e11`. AA requires 4.5:1. `DESIGN.md` itself defines `ink-faint` as "decorative / disabled only, **never body copy**".
**Risk / UX Impact** — The system violates its own documented token rule, on the app shell, so it affects all 12 routes.
**Recommended Change** — Promote to `ink-muted` (#8a8a93, 5.14:1 on `surface-raised` — passes). Applies to the feed footer's buffer total as well: same token, same measurement.
**Priority** — P2

#### DS-06 · `sev-critical` fails AA on the hover/selected surface · **P2**
**Current State** — `DESIGN.md` records `critical #ef4444` at 5.29:1, which is correct against `surface-base #09090b`. Measured against `surface-hover #1f1f25` — where the sidebar's critical-count badge actually renders when the SOC row is selected — it is **4.36:1**. Below AA for 10px text.
**Risk / UX Impact** — The single most urgent number in the navigation is the one that drops below threshold, and only in its selected state.
**Recommended Change** — Define `sev-critical-on-raised` (`#f87171`, 6.4:1 on `#1f1f25`) and use it wherever severity text sits on a raised or hover surface. Add the raised-ground column to the contrast table in `DESIGN.md` so the claim is verifiable per surface, not per token.
**Priority** — P2

#### DS-07 · Legacy pages contradict every stated visual prohibition · **P1**
**Current State** — `DESIGN.md` §"Not in this world" forbids glassmorphism, backdrop blur, glows, gradient fills, and coloured `border-left` above 1px. The legacy routes contain: `blur-[120px]` ambient blobs (login, register), `backdrop-blur-lg` cards (all six), `shadow-[0_0_15px_rgba(244,63,94,0.3)]` glows (index, alerts), `bg-gradient-to-r from-indigo-500/10` (index), `border-l-2 border-indigo-400` (index), `drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]` on the logo (login), and `filter: drop-shadow(...)` on the chart canvas (index).
**Recommended Change** — Covered by DS-01; itemised here so the migration has a checklist.
**Priority** — P1

#### DS-08 · Mixed-language UI · **P2**
**Current State** — `/reports` renders its period selector as `รายวัน / รายเดือน / รายปี` inside an otherwise entirely English interface, with English labels on the same row ("Audit Period", "Financial Period").
**Risk / UX Impact** — Neither a Thai UI nor an English one. No i18n layer exists, so this is not a locale — it is two languages in one control.
**Recommended Change** — Pick one language for the pilot (English, matching the rest). If Thai is required, that is an i18n project, not a string swap.
**Priority** — P2

---

### UX

#### UX-01 · The product reproduces the data silo it exists to eliminate · **P0**
**Current State** — `/` reports **Active Threats (SOC): 3**. `/security` at the same moment reports **Active critical incidents: 36**, with a Critical chip count of 130. The dashboard number is the literal fallback in `stats?.activeAlerts || 3`, displayed because the API call 401s (FN-01).
**Problem** — Two pages of one product give different answers to the same question, and the wrong one is displayed with full confidence and no error state.
**Risk / UX Impact** — This is the exact failure `PRODUCT.md` names as the reason the product exists: "the delay and disagreement that occur when each team reads its own console". It occurs inside a single console. IT Ops reads 3 and stands down; SOC reads 36.
**Recommended Change** — One source of truth for cross-surface counters, derived from the same stream the SOC page consumes. Never fall back to a plausible literal — a failed fetch must render as a failed fetch.
**Priority** — P0

#### UX-02 · Synthetic data presented as production telemetry · **P0**
**Current State** — `/security` head: `Production · Singapore · prod-apac-1 · 2,404 events in buffer`, beside a green **LIVE** pill. Every record is generated by `backend/src/lib/threats.ts`. The environment switcher offers "Production · Singapore", "Production · Frankfurt", "Disaster recovery · Jakarta" — none of which exist.
**Problem** — The UI distinguishes socket-vs-local *transport* (`LIVE` / `LOCAL`) but never distinguishes real-vs-synthetic *data*. Both states are synthetic.
**Risk / UX Impact** — Highest-impact finding in the audit. An analyst cannot tell demonstration data from an incident. A pilot evaluator sees fabricated attack telemetry labelled as their production estate. `PRODUCT.md` requires this labelling and it is absent.
**Recommended Change** — A persistent, non-dismissible `DEMONSTRATION DATA` marker in the command bar wherever synthetic records are displayed, driven by a build-time `dataSource: 'synthetic' | 'live'` flag rather than a hand-placed string. Extend to the incident drawer and to any exported artefact. The marker uses the neutral ramp, not a severity hue — it is a provenance fact, not an operational one.
**Priority** — P0

#### UX-03 · Primary alert actions are invisible and keyboard-unreachable · **P1**
**Current State** — `pages/alerts.vue`: `class="opacity-0 group-hover:opacity-100"` on the container holding "Run Diagnostics" and "Acknowledge".
**Risk / UX Impact** — Three compounding failures. (1) Discoverability: the only two actions on the page are invisible until hover. (2) Keyboard: a tab-focused button inside an `opacity-0` parent is focusable but not visible — a WCAG 2.4.7 failure and, for a keyboard-first analyst audience, a hard block. (3) Touch: no hover on tablets, so the actions are unreachable in the wall-panel and tablet contexts the product targets. The reserved space also leaves each row roughly 40px of dead vertical area.
**Recommended Change** — Actions always visible. Use the established `.btn` value-step hover for emphasis, never opacity for presence. Any `opacity-0` that hides a focusable element is a bug class worth a lint rule.
**Priority** — P1

#### UX-04 · No skip link; heading order inverted · **P2**
**Current State** — Measured on `/security`. Document heading order: `H2 Operations → H2 Security → H2 Administration → H1 Security Operations → H3 …`. No `a[href^="#"]` skip target anywhere.
**Risk / UX Impact** — Screen-reader users navigating by heading meet three sidebar group labels before learning what page they are on. Keyboard users traverse 11 nav links plus the operator block on every navigation before reaching the feed — on a surface whose own design doc calls it "a keyboard-first surface".
**Recommended Change** — Skip-to-content link as the first focusable element, visible on focus. Demote sidebar group labels from `<h2>` to non-heading elements carrying `aria-label` on their `<ul>` — they label a list, they are not document sections.
**Priority** — P2

#### UX-05 · The live feed has no live region · **P2**
**Current State** — Measured on `/security`: zero elements with `aria-live`, `role="status"`, `role="alert"`, or `role="log"`. The feed is correctly `role="grid"`, but a grid whose rows change four times a second announces nothing.
**Risk / UX Impact** — A screen-reader user receives no notification of an arriving critical event on a product whose success metric is detection speed. Toasts are likewise silent, so action confirmations ("Host isolated") are never announced.
**Recommended Change** — A polite `role="status"` region announcing critical arrivals only, rate-limited to one announcement per batch window and suppressed while hold-while-working is engaged — matching the existing visual hold semantics rather than fighting them. `role="status"` on the toast container.
**Priority** — P2

#### UX-06 · Sidebar asserts a role the user does not have · **P2**
**Current State** — `Sidebar.vue` hard-codes `SOC Analyst · Tier 2` beneath the user's name. Observed rendering as `Guest User / SOC Analyst · Tier 2` while fully unauthenticated. Separately, `pages/settings.vue:88` exposes a free-text input labelled "Job role" bound to `profileForm.role` — the same field name as the JWT authorization claim.
**Risk / UX Impact** — On an access-control product, the shell displays a privilege level unrelated to the account. The settings field conflates a display job title with the authorization role; harmless today because nothing gates on client `user.role`, and a latent client-side privilege-escalation display the moment anything does.
**Recommended Change** — Bind the subtitle to the real role, with a neutral placeholder when unknown. Rename the profile field to `jobTitle` and keep `role` server-owned and read-only in the UI.
**Priority** — P2

#### UX-07 · Non-functional controls throughout · **P2**
**Current State** — Alert Center team tabs (no handler); Header notification bell (no handler, permanent unread dot); `/settings` "Security key" tab (`scan()` raises a toast and nothing else); `/reports` generate buttons (fake progress timer, no file produced, toast claims "securely prepared"); `/login` "Forgot password?" → `href="#"`; `/register` "Security Protocols" and "Data Privacy" → `href="#"`.
**Risk / UX Impact** — Every dead control spends user trust. The password-reset link is the costly one: a locked-out user clicks it, the page jumps to top, and there is no recovery path anywhere in the product.
**Recommended Change** — Each control is wired, visibly disabled with a stated reason, or removed. Password reset needs a real flow (see the remediation backlog) — a dead link is the wrong answer for the one case where the user is already blocked.
**Priority** — P2

#### UX-08 · 800ms fade-in on the login screen · **P3**
**Current State** — `.animate-fade-in { animation: fadeIn 0.8s }` on `/login` and `/register`. Observed: the form is substantially unreadable for roughly the first half-second after navigation.
**Risk / UX Impact** — The app's entry point delays its own legibility. Well outside the 150ms budget the console system sets for itself, and outside the brief's 250–400ms UI-transition guidance. Covered by `prefers-reduced-motion`, which does not help the majority who have not set it.
**Recommended Change** — Remove it, or reduce to a ≤200ms opacity-only settle with no transform.
**Priority** — P3

#### UX-09 · Dashboard charts animate random data · **P3**
**Current State** — `pages/index.vue` regenerates both ApexCharts series from `Math.random()` every 3s, with a 1000ms dynamic animation. The network chart draws a `LIMIT: 85%` threshold annotation against values that never approach it.
**Risk / UX Impact** — Continuous motion in peripheral vision for an eight-hour shift, carrying no information. The threshold annotation teaches a reading the data cannot support.
**Recommended Change** — Bind to `useSystemState` history. If the series stays synthetic, it falls under the UX-02 demonstration marker.
**Priority** — P3

---

### ACCESSIBILITY

Summary of the measured position. WCAG 2.1 AA is a stated product requirement.

| Check | Migrated routes | Legacy routes |
|---|---|---|
| Accessible names on interactive elements | **Pass** (0 unnamed on `/security`) | Partial — icon-only elements present |
| Touch targets ≥24×24 | **Pass** (0 violations) | Pass |
| Colour contrast AA | 3 distinct failures (DS-05, DS-06) | 8+ distinct failures (worst 2.92:1) |
| Severity not colour-alone | **Pass** — bar + mono code + SR label | **Fail** — `/alerts` severity is icon colour only |
| Keyboard operability | Strong (feed arrows, `↵`, `Home`, focus trap, Escape) | **Fail** — UX-03 hover-only actions |
| Focus visibility | **Pass** — 2px neutral ring, 1px offset | Ring inherited; defeated by `opacity-0` parents |
| Heading order | **Fail** — UX-04 | **Fail** — UX-04 |
| Skip link | **Fail** | **Fail** |
| Live regions | **Fail** — UX-05 | **Fail** |
| `prefers-reduced-motion` | **Pass** — global collapse | Pass (inherited) |
| Form labels | n/a | **Fail** — see A11Y-01 |

#### A11Y-01 · Auth form inputs have no programmatic labels · **P1**
**Current State** — `/login` and `/register`: every field uses a bare `<label>` with no `for`, and the input has no `id`, no `aria-label`, and no `aria-describedby`. No `autocomplete` attributes. The register consent checkbox has no label association. The password-strength meter is announced as nothing.
**Risk / UX Impact** — Screen-reader users hear "edit text, blank" for both fields on the only screen that grants access to the product. Password managers cannot reliably fill, which pushes users toward weaker, memorable passwords — an accessibility failure with a direct security consequence.
**Recommended Change** — `id`/`for` pairs, `autocomplete="email"` and `"current-password"` / `"new-password"`, `aria-describedby` linking the strength meter and the error region, and `aria-live="polite"` on the error container.
**Priority** — P1

#### A11Y-02 · Severity conveyed by colour alone on `/alerts` · **P1**
**Current State** — Severity is a coloured icon circle (rose / amber / sky). No text label, no shape difference beyond the icon glyph, no SR-only string.
**Risk / UX Impact** — Directly contradicts the product's own accessibility commitment ("severity is never encoded by colour alone"). The migrated `SeverityTag` already solves this and is not used here.
**Recommended Change** — Use `components/soc/SeverityTag.vue`.
**Priority** — P1

---

### PERFORMANCE

#### PF-01 · Two independent 3-second timers drive whole-page re-renders · **P2**
**Current State** — `app.vue` runs a global `setInterval(syncSystem, 3000)` for the lifetime of the app. `pages/index.vue` runs a second 3s interval rebuilding both chart series by array copy. `Header.vue` runs a 1s clock interval. On a shift-long session these never stop.
**Risk / UX Impact** — The dashboard's interval replaces both series arrays every 3s, forcing ApexCharts to re-render two SVG charts with a 1000ms animation each — continuously, whether or not the tab is visible. The SOC feed's careful 250ms batching exists precisely to avoid this pattern; the dashboard does the opposite.
**Recommended Change** — Suspend timers on `document.visibilitychange`. Push chart updates through a single shared heartbeat rather than per-page intervals. Cap ApexCharts `dynamicAnimation` to the 150ms system budget.
**Priority** — P2

#### PF-02 · Render-blocking Google Fonts with no self-hosting · **P2**
**Current State** — `nuxt.config.ts` links a Google Fonts stylesheet for Inter (4 weights) + JetBrains Mono (3 weights) with `preconnect` and `display=swap`.
**Risk / UX Impact** — A third-party render-blocking request on an internal operations tool, in a banking environment where outbound access to `fonts.googleapis.com` may be filtered entirely. If blocked, the console falls back to system fonts and the fixed pixel line-heights that virtualized rows depend on are computed against different metrics.
**Recommended Change** — Self-host both families as subset `woff2` with matching `@font-face` metric overrides. Removes a third-party dependency, an external origin from CSP, and a fallback-metrics risk in one change.
**Priority** — P2

#### PF-03 · Eager ApexCharts on a route that may not need it · **P3**
**Current State** — `plugins/apexcharts.client.ts` registers globally; `/` imports two chart types. ApexCharts is the largest client dependency in the bundle.
**Recommended Change** — Already correctly lazy on the SOC drawer; apply the same `defineAsyncComponent` treatment to dashboard charts.
**Priority** — P3

---

### SECURITY

Full detail, evidence, and remediation in **`docs/02-SECURITY.md`**. Headline count:

| Severity | Count | Lead findings |
|---|---|---|
| Critical | 2 | Hard-coded JWT fallback secret → full auth bypass (verified live) · No server-side authorization on any route |
| High | 5 | Unauthenticated Socket.IO feed (verified) · Stack-trace disclosure (verified) · Wildcard CORS · No brute-force control · Token in JS-readable cookie |
| Medium | 7 | 400-instead-of-401 · No token revocation · User enumeration · Zod present but unused · `db push` deploy · Missing `trust proxy` · Incomplete failed-login logging |
| Low / Info | 6 | Dependency CVEs (2 critical, 11 high transitive) · Unused `sqlite3` · Dead `authorize()` helper · Weak password policy |

---

## 6. What the redesign must not break

1. The four-layer boundary (`services` → `composables` → `pages` → `components`).
2. Windowed rendering, 250ms batching, hold-while-working, bounded buffers.
3. The one law: hue means severity.
4. Severity never colour-alone.
5. Monospace reserved for machine-comparable values.
6. The fixed-viewport `dense: true` shell mode.
7. Module vocabulary: Data Sources, Alert Center, Security (SOC), System Logs, Access Control, Subscription.
8. `lucide-vue-next` as the only icon source.

## 7. Recommended sequence

**Now, independent of design review** — SEC-01 and SEC-02 (Critical), FN-01 and FN-02 (P0 functional). These are security correctness, not design decisions, and should not wait on a Figma approval cycle.

**After design review** — DS-01 migration of the six legacy routes, carrying UX-02's provenance marker and UX-01's single source of truth into the new surfaces.
