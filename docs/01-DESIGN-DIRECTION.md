# OptiSight — Proposed Visual Direction & Implementation Plan

**Date:** 2026-09-21
**Premise:** OptiSight already has a strong, deliberately art-directed design world — the console system on the six migrated routes. This is **not** a redesign-from-zero. The direction below *extends the existing world to the whole app* and closes the audit's design/UX findings. The brief's own instruction governs: "Preserve the identity of the product while modernizing it."

---

## 1. Direction in one line

**An enterprise operations console for a low-light SOC floor: neutral zinc ground, one law — hue means severity — and density treated as respect for an expert under time pressure.** The redesign's job is to make all twelve routes obey that world, not to invent a new one.

## 2. Brand personality extracted from the product

| Attribute | Source | Consequence for design |
|---|---|---|
| Operational, unembellished | `PRODUCT.md` voice | Copy is console language, never marketing. "Sign in", not "Access Dashboard". |
| Expert audience under time pressure | SOC analyst on shift | Density over whitespace; keyboard-first; no motion that costs a decision. |
| Trust through honesty | Banking/FinTech, security product | Never assert a state that didn't happen (fixes FN-07, DS-02, DS-04). Provenance always visible (UX-02). |
| Calm, not alarming | 8-hour shift, wall panel | Colour is scarce; a red pixel means something. No ambient glow, no idle animation. |

## 3. Design tokens — already defined, keep and extend

The token system in `main.css` / `tailwind.config.js` is the design system. **No new palette is introduced.** Two additions close contrast findings:

| Token | Value | Purpose | Closes |
|---|---|---|---|
| `ink-muted` used for sidebar group labels | `#8a8a93` (was `ink-faint` 2.92:1) | Structural labels meet AA | DS-05 |
| `sev-critical-on-raised` | `#f87171` (6.4:1 on `#1f1f25`) | Severity text on hover/raised surfaces | DS-06 |

Everything else — the surface ramp, the severity hues, the 10–32px type scale with fixed line-heights, the ≤6px radii, the 150ms motion budget, the neutral focus ring — is retained verbatim. The direction's discipline is *not adding* to a system that is already coherent.

**Design principles (from the product, not generic):**
- **Density is respect** — every pixel of decoration is a row of evidence lost.
- **One anomaly, one owner** — information is routed, not broadcast.
- **Machine values are read, not skimmed** — mono + `tabular-nums` for IPs/hashes/ports/timestamps.
- **The stream never stops, so the interface must never accumulate** — bounded buffers, windowed rendering.
- **Support the decision; never take it** — surface evidence and offer actions; a human commits.

## 4. What changes, route by route

The redesign is a **migration of the six legacy routes into the existing world**, plus targeted honesty and accessibility fixes on the migrated ones.

### Legacy → console (the DS-01 migration)

| Route | Current | Target |
|---|---|---|
| `/` Dashboard | Glass cards, decorative hues, random charts, fabricated metrics, fake AI panel | Posture strip (real counters from the shared stream), honest system-status list reusing SOC severity grammar, charts bound to `useSystemState` or removed. Single source of truth shared with `/security` (fixes UX-01). Fabricated figures removed or demonstration-marked (DS-02). |
| `/alerts` Alert Center | Wrong endpoint, hover-only actions, colour-only severity, blank state | Console table grammar (fixed-height rows, shared `gridTemplateColumns`), `SeverityTag`, always-visible actions, real `/api/alerts` with working team-routing tabs (the product's positioning story), full state machine. |
| `/reports` Reports | Glass, gradient bars, fake generation, mixed language, false "100%" | Console panels, English-only, honest metrics (labelled synthetic), real export or a clearly-disabled control with reason. |
| `/login` `/register` | Blur blobs, glow logo, spy-fiction copy, fake "biometric encryption", unlabelled inputs, 800ms fade | Quiet centered form on `surface-base`, plain copy, labelled inputs with `autocomplete`, ≤200ms settle, real password-reset entry point. |
| `/payment` | 9-line stub | Removed / redirect to `/subscription`. |

### Migrated routes — honesty & a11y passes

- **Shell (all routes):** `DEMONSTRATION DATA` provenance marker in the command bar (UX-02); skip-to-content link + heading-order fix (UX-04); `role="status"` live region for critical arrivals and toasts (UX-05); real role in the operator block (UX-06); sidebar group-label contrast (DS-05).

## 5. Figma deliverable structure

Delivered as a single Figma file, page per section (matches the brief's 01–09):

1. **01 Design Audit** — the split-world diagram and the finding index (from `00-AUDIT.md`).
2. **02 Information Architecture** — the three nav groups, 11 real routes, the cross-team routing model.
3. **03 User Flow** — analyst triage flow (read pressure → narrow → open incident → act) and the auth flow.
4. **04 Low-Fi Wireframes** — the six migrating routes at console density.
5. **05 Design System** — the existing tokens formalised as Figma variables + the component set below.
6. **06 Hi-Fi Screens** — the six routes rebuilt in the console world.
7. **07 Responsive** — SOC and Dashboard at 400 / 768 / 1440 / 2560.
8. **08 Prototype** — triage and auth flows.
9. **09 Handoff** — component→SFC mapping (§6 below), token table, the two contrast additions.

Because the codebase already *is* the source of truth, the Figma file will be generated **from the running components** (via the `figma-generate-library` / `figma-generate-design` skills) so design and code do not diverge — not hand-drawn to then diverge from code.

## 6. Component → Vue SFC mapping (handoff)

The design system already exists as SFCs. Figma components map 1:1; no component is invented that the code lacks.

| Design-system component | Existing SFC / class | Notes |
|---|---|---|
| Button (default/primary/danger) | `.btn`/`.btn-primary`/`.btn-danger` in `main.css` | states defined |
| Input / Textarea / Select | `.input` | add labelled variants for auth |
| Checkbox / Radio / Switch | settings switch pattern | formalise |
| Tabs | Alert Center / Settings tab rows | wire handlers (FN-03) |
| Sidebar / Navigation | `components/Sidebar.vue` | a11y fixes |
| Card / Panel | `.panel` grammar | replaces `glass-card` |
| Table | shared `gridTemplateColumns` pattern | the console table |
| Modal / Drawer | `components/ui/SlideOver.vue` | reuse for confirmations |
| Toast | `components/Toast.vue` | add `role="status"` |
| Badge / Status / Severity | `SeverityTag`, `PrivilegeTag` | reuse on `/alerts` |
| Skeleton | *new* | needed for FN-04 |
| Empty state / Error state | *new* | needed for FN-04 |

The two genuinely new components (Skeleton, Empty/Error state) are the only additions — everything else is promotion of what exists.

## 7. Motion

Retain the system's discipline: micro-interactions 150ms, no idle animation, one authored moment (the drawer). GSAP is **not** introduced — the product's own rule is "every interactive transition resolves inside 150ms", and the audit found the *problem* is too much motion (login fade, random-chart animation), not too little. Adding a motion library would work against the direction. `prefers-reduced-motion` collapse stays global.

## 8. Implementation phasing

**Phase A — security & correctness (no design dependency, do now):**
SEC-AUTH-001, SEC-AUTHZ-001, SEC-API-001 (Critical); FN-01 (login session, also closes SEC-SESSION-002 direction), FN-02 (route guards). These are correctness, ship independent of Figma sign-off.

**Phase B — honesty layer (small, high-impact):**
UX-02 provenance marker, UX-01 single-source counters, DS-02/DS-04 remove fabricated claims, FN-07 stop asserting fake outcomes. Mostly deletions and one shared composable; large trust payoff.

**Phase C — legacy route migration (after Figma review):**
DS-01 across `/`, `/alerts`, `/reports`, `/login`, `/register`; delete `/payment`; then delete `glass*` from `main.css`.

**Phase D — accessibility & performance polish:**
UX-04/05, A11Y-01/02, DS-05/06, PF-01/02.

Preserve throughout: the four-layer boundary, windowed rendering, the one law, severity-not-colour-alone, the `dense` shell mode, module vocabulary, `lucide-vue-next`.

## 9. Regression checklist (run before merging any phase)

- [ ] Login → land on `/` → `/api/stats` returns authorized data (not the `|| 3` fallback).
- [ ] Logged-out deep link to `/users` → redirected to `/login`.
- [ ] Forged-fallback-secret token → 401 (SEC-AUTH-001).
- [ ] Anonymous socket connect → refused before any `threat-event` (SEC-API-001).
- [ ] `/` Active Threats == `/security` critical count (single source, UX-01).
- [ ] Every synthetic surface shows the `DEMONSTRATION DATA` marker (UX-02).
- [ ] No `glass*` class remains in the codebase; `main.css` legacy block deleted.
- [ ] `SeverityTag` used on `/alerts`; no colour-only severity anywhere.
- [ ] Alert Center: loading (skeleton) / empty / error / ready all render; team tabs filter.
- [ ] No `opacity-0` hides a focusable element (UX-03).
- [ ] Skip link present and first in tab order; H1 precedes sidebar labels in the a11y tree.
- [ ] Critical arrivals and toasts announced via `role="status"`.
- [ ] Contrast: sidebar group labels ≥4.5:1; severity-on-raised ≥4.5:1.
- [ ] SOC console unchanged: virtualization, 250ms batch, hold-while-working, keyboard triage, drawer focus trap all still pass (QA-SOC-01..08).
- [ ] `prefers-reduced-motion` still collapses all motion.
- [ ] Responsive: `/security` and `/` usable at 400 / 768 / 1440 / 2560.
