# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (for the SOC surface): the security analyst on shift.** They sit in front of a wide monitor for an eight-hour rotation inside a bank or FinTech operations floor, often with this dashboard on a wall panel beside them. Their job is triage: watch a continuous stream of detections, decide within seconds which ones are real, and act — isolate the host, block the source, or dismiss the noise. They are measured on how fast they detect and how few real threats they miss. They read IP addresses, hashes, and timestamps as fluently as prose, and they are hostile to any pixel that costs them a row of visible data.

Other confirmed audiences of the wider platform (from `OPTISIGHT_GUIDE.md`):

- **IT Operations** — the main dashboard; cross-department system health in one view.
- **Infrastructure / Data team** — centralized logging and deep data-flow inspection.
- **Management** — exported weekly performance and threat-assessment reports.
- **Global Admin** — access control and RBAC over which team sees which module.

## Product Purpose

OptiSight is a SaaS control plane that ingests telemetry from the many disconnected IT systems of a large enterprise — cloud providers, legacy databases, container clusters, security tooling — and presents it as one real-time picture. It exists to kill **data silos**: the delay and disagreement that occur when each team reads its own console and no one sees the same truth at the same moment.

It is explicitly a **support tool**, not an autonomous remediation system. Success is measured in decision speed: IT Ops, SOC, and Infra reaching a correct conclusion faster and with fewer cross-team handoffs than they could with separate consoles.

## Positioning

Two mechanisms a neighboring monitoring product could not truthfully copy:

1. **Cross-team routing of a single anomaly.** One detection is classified and delivered to the team that owns the response — an intrusion goes to SOC, a latency spike goes to IT Ops — rather than broadcasting every event to everyone.
2. **Proactive prediction over reactive alerting.** Predictive analysis forecasts failures before threshold breach (storage approaching capacity, an API trending toward its rate limit), converting the operating posture from reactive to proactive.

The enterprise context is banking and FinTech, where legacy mainframe and Oracle systems must coexist in the same view as AWS, Azure, and Kubernetes.

## Operating Context

- Analysts work in a low-light operations room, on wide desktop monitors, frequently with a second wall-mounted display; sessions run for hours without a page reload.
- Data arrives continuously over Socket.IO from the Express backend (`backend/src/index.ts`), currently emitting `system-metrics` every 3s and `anomaly-alert` on threshold breach.
- REST endpoints under `/api` are JWT-protected and rate-limited to 100 requests per 15 minutes, so polling is not a viable data strategy — the stream is.
- Modules in production use today: Dashboard, Data Sources & Integrations, Alert Center, Security (SOC), System Logs, Access Control, Export Reports, Subscription & Billing, Settings.

## Capabilities and Constraints

**Confirmed stack (existing codebase):** Nuxt 4 / Vue 3 Composition API, Tailwind CSS v3 with `@nuxtjs/tailwindcss`, `lucide-vue-next` icons, ApexCharts, `socket.io-client`. Backend is Express 5 + TypeScript, Prisma ORM, JWT auth, Helmet, rate limiting.

**Constraints that bind future work:**

- Tailwind is **v3**, not v4. The project has no Radix/shadcn primitives and no TanStack packages; components are hand-authored Vue SFCs.
- Long-lived sessions make memory growth a real defect, not a theoretical one. Continuously appended feeds must be windowed and bounded.
- The app shell (`layouts/default.vue`, `components/Sidebar.vue`, `components/Header.vue`) is shared by all routes; changes there are product-wide.
- Threat data shown in the SOC feed is **synthetic demonstration data**. The backend has no real threat-intelligence integration.

**Explicitly undecided:** whether the remaining routes migrate to the SOC surface's visual system, and whether real threat-intel feeds (MITRE ATT&CK enrichment, actual firewall telemetry) are in scope for the pilot.

## Brand Commitments

- Product name **OptiSight**; logo at `frontend/public/logo.png`.
- Voice is operational and unembellished — the language of an operations console, not marketing.
- Icon library is fixed to `lucide-vue-next`.
- Module vocabulary is fixed and must be preserved: Data Sources, Alert Center, Security (SOC), System Logs, Access Control, Subscription.

**Binding visual constraint recorded from the user's brief** (recorded here, not expanded — the visual world itself lives in DESIGN.md): high-density enterprise precision UI, deep neutral zinc dark ground, semantic severity color only, monospace reserved for machine-readable values, and an explicit prohibition on glassmorphism, neon glow, decorative 3D, and low-density card layouts.

## Evidence on Hand

- `OPTISIGHT_GUIDE.md` — the authoritative module-by-module product description (Thai).
- Working auth (register/login/session recovery) against NeonDB PostgreSQL.
- Live Socket.IO metric simulation.
- `frontend/composables/useSystemState.ts` — a real, relational connector dataset (12 named integrations with type, status, and ingest rate) that other surfaces already read from.

**Absences future work must not fabricate:** no real customers, no pricing validation, no uptime or accuracy benchmarks, no security certifications, no real attacker telemetry. All threat records, IPs, hashes, and MITRE mappings are synthetic and must be labeled as such wherever a viewer could mistake them for production data.

## Product Principles

1. **Density is respect.** These users are experts under time pressure. Every pixel spent on decoration is a row of evidence they cannot see.
2. **One anomaly, one owner.** Information is routed to the team that must act, never broadcast to everyone equally.
3. **Machine values are read, not skimmed.** IPs, hashes, ports, and timestamps get treatment that supports character-by-character comparison.
4. **The stream never stops, so the interface must never accumulate.** Long-session stability outranks feature richness.
5. **Support the decision; never take it.** The product surfaces evidence and offers actions — a human commits them.

## Accessibility & Inclusion

WCAG 2.1 AA is a stated requirement for this surface: all text and meaningful UI boundaries must meet contrast minimums against the dark ground. Because severity is the primary decision axis, **severity is never encoded by color alone** — every severity carries a redundant text label or shape. The interface must be fully operable from the keyboard, since analysts triage far faster by keyboard than by pointer.
