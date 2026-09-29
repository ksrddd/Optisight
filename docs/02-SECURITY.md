# OptiSight — Security Assessment

**Date:** 2026-09-21
**Engagement type:** Defensive white-box review of the authorized local project environment only (`localhost:3000` frontend, `localhost:3001` backend). No external systems touched. No destructive payloads used.
**Frameworks:** OWASP Top 10 (2021), OWASP ASVS concepts, MITRE ATT&CK, Lockheed Martin Cyber Kill Chain.
**Verification note:** every finding marked *Verified* was reproduced against the running backend. The instance has no `DATABASE_URL`, so database-dependent flows (login success path, audit writes) were reviewed in source and exercised only to their pre-DB failure point.

---

## 1. Executive summary

The SOC front end is mature; the security *substrate underneath it* is a prototype and must be treated as one before any pilot. Two Critical issues let an unauthenticated party reach every protected surface:

1. **A hard-coded fallback JWT secret** (`'optisight-super-secret-key-2026'`) is compiled into both the auth route and the middleware. With no `JWT_SECRET` set — the running configuration — anyone can forge an admin token. **Verified:** a self-signed `role:admin` token was accepted by `/api/stats` and `/api/security` with HTTP 200.
2. **Authorization is effectively absent.** The `authenticate` middleware proves a token is *valid*; nothing checks *what the bearer may do*. The `authorize()` helper exists and is wired to no route. The Socket.IO threat feed requires no token at all — **verified**, 15 live threat events with source IPs, hostnames, and MITRE technique IDs received on an anonymous connection in 9 seconds.

Neither is exploited beyond proof; no data was modified. Because all data is synthetic today, real-world impact is currently limited to information the app itself fabricates — but every one of these controls must be correct *before* the app is wired to a real identity provider, a real SIEM, or a real customer estate, which is the entire point of the pilot.

| Severity | Count |
|---|---|
| Critical | 2 |
| High | 5 |
| Medium | 7 |
| Low | 4 |
| Informational | 2 |

**File upload:** Not applicable — the application has no upload surface (no control, no multipart parser, no storage). Assessed and excluded rather than skipped.

---

## 2. API surface inventory

| Method | Route | Auth required | Role enforced | User input | Sensitive op | Server validation |
|---|---|---|---|---|---|---|
| POST | `/api/auth/register` | No | — | firstName, lastName, email, password (JSON body) | Creates user, issues JWT | Presence + `password.length>=8` only |
| POST | `/api/auth/login` | No | — | email, password | Issues JWT, writes audit | Presence only |
| GET | `/api/auth/me` | Yes (JWT) | No | — | Reads own profile | Uses `req.user.id` from token |
| POST | `/api/auth/logout` | Yes (JWT) | No | — | Writes audit row | None |
| GET | `/api/stats` | Yes (JWT) | **No** | — | Synthetic metrics | n/a |
| GET | `/api/alerts` | Yes (JWT) | **No** | — | Synthetic alerts | n/a |
| GET | `/api/security` | Yes (JWT) | **No** | `?limit` (query) | Synthetic threat history | `Math.min(Number()||500, 2000)` — silently coerces |
| GET | `/api/systems` | Yes (JWT) | **No** | — | Synthetic systems | n/a |
| WS | `socket.io` connection | **No** | **No** | `ping-rtt` | Streams threat + metric feed | None |

**Structural observation:** no route reads a user-supplied object ID to fetch or mutate another user's resource, so classic IDOR/BOLA has no surface *today*. The risk is prospective: `/api/auth/me` is the template, and it correctly derives identity from `req.user.id` rather than a query parameter. Any future `/api/users/:id` or `/api/incidents/:id` must follow that pattern and add an ownership/role check — see SEC-AUTHZ-002.

---

## 3. Findings

Each: **Finding ID · Title · Component · Description · Evidence · Impact · Likelihood · Severity · Remediation · Verification.**

---

### SEC-AUTH-001 · Hard-coded fallback JWT secret → full authentication bypass · **CRITICAL**

**Component** — `backend/src/routes/auth.routes.ts:9`, `backend/src/middleware/auth.middleware.ts:4`.
**Description** — Both modules define `const JWT_SECRET = process.env.JWT_SECRET || 'optisight-super-secret-key-2026'`. The literal is committed to the repository. When `JWT_SECRET` is unset — as in the running instance and any deploy that forgets it — the application signs and verifies tokens with a public constant. Anyone who has read the source (open repo, decompiled bundle, or this document) can mint a token with any `id`, `email`, and `role`.
**Evidence (verified live)** —
```
$ node -e "jwt.sign({id:'attacker-0000',role:'admin',...},'optisight-super-secret-key-2026')"
$ curl -H "Authorization: Bearer <forged>" http://localhost:3001/api/stats
HTTP 200  {"activeAlerts":8,"systemsOnline":42,...}
$ curl -H "Authorization: Bearer <forged>" http://localhost:3001/api/security?limit=2
HTTP 200  [{"id":"EVT-...","severity":"high","srcIp":"10.4.104.58",...}]
```
**Impact** — Complete authentication bypass. Every JWT-protected endpoint is reachable as an arbitrary forged identity, including any future admin-gated route. Existing user sessions are forgeable and, because the secret is static, unrevocable by rotation-of-one-user.
**Likelihood** — High. The secret is public and the unset-env condition is the current default.
**Remediation** —
1. Remove the fallback entirely. Fail fast at boot: `if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required')`.
2. Define the secret once in a config module both files import; never duplicate it.
3. Rotate to a 256-bit random secret in every environment. Treat the committed literal as burned.
4. Add a startup check that refuses to run in production with a secret shorter than 32 bytes.
**Verification** — After the fix, a token signed with the old literal must return 401. Boot with no `JWT_SECRET` must abort, not start.

---

### SEC-AUTHZ-001 · No server-side authorization; role never checked · **CRITICAL**

**Component** — All protected routes; `authorize()` in `auth.middleware.ts` (defined, unused).
**Description** — `authenticate` verifies the token and attaches `req.user`. No route calls `authorize([...])`. The token *carries* a role, but no endpoint reads it. The application's authorization model therefore lives entirely in the client (route visibility, the `/users` page), which the server does not enforce. Frontend restrictions are not access control.
**Evidence** — `grep -rn "authorize(" backend/src` returns only the definition. All four data routes use `authenticate` alone. Unauthenticated HTTP probing shows the frontend serves `/users` and `/subscription` with HTTP 200 (no server-side page auth either).
**Impact** — Any authenticated (or, via SEC-AUTH-001, any forged) principal has identical access regardless of role. The moment a genuinely privileged action is added — user administration, billing changes, RBAC edits — it will be reachable by every analyst and every forger unless authorization is retrofitted first.
**Likelihood** — High as a design gap; impact scales with the next feature added.
**Remediation** —
1. Apply `authorize(['admin'])` to every administrative route as it is created.
2. Enforce authorization server-side on a deny-by-default basis: a route without an explicit policy returns 403.
3. Never trust the client `role` claim for a decision the client also renders; re-read the user's role from the database for sensitive actions rather than from the token, so a stale or forged claim cannot elevate.
**Verification** — SEC-AUTHZ test cases in §6: an `analyst` token receives 403 on an admin route; an `admin` token receives 200.

---

### SEC-AUTHZ-002 · Object-ownership pattern must be established before resource routes exist · **MEDIUM** (prospective)

**Component** — Future `/api/users/:id`, `/api/incidents/:id`, etc.
**Description** — No resource-by-ID route exists yet, so there is no live IDOR. This finding is a guardrail, not a bug: the one identity-scoped route (`/api/auth/me`) correctly uses `req.user.id`. Document and enforce that pattern before the first `:id` route ships.
**Impact if ignored** — Horizontal escalation (User A reads/edits User B) the day an ID-addressed route is added without an ownership check.
**Remediation** — A shared `assertOwnershipOr(role)` helper; ownership derived from the token subject, never from a request parameter that names the target.
**Severity** — Medium (prospective).

---

### SEC-API-001 · Socket.IO feed is unauthenticated · **HIGH**

**Component** — `backend/src/index.ts` `io.on('connection')`; `Server({ cors: { origin: '*' } })`.
**Description** — The websocket namespace performs no handshake authentication. Any client that can reach the port receives the full threat and metric stream. The REST backfill (`/api/security`) is gated; the live tail — the primary data path per `PRODUCT.md` — is not.
**Evidence (verified live)** —
```
socket = io('http://localhost:3001', {transports:['websocket']})   // no auth
→ connected, socket id aaHsNdpxzmTNyYB2AAAB
→ 15 threat-event messages in 9s incl. srcIp, asset, technique.id (T1068, T1213…)
→ system-metrics {cpu, ram} every 3s
```
**Impact** — Confidentiality bypass of the feature the product is built around. With real telemetry this would leak live attack data, internal hostnames, and infrastructure metrics to any network-adjacent party. Also a resource-exhaustion surface: unbounded anonymous connections each spawn two server timers.
**Likelihood** — High; the endpoint is open by default and CORS is wildcard.
**Remediation** —
1. Authenticate the socket handshake: `io.use((socket,next)=>{ verify(socket.handshake.auth.token) ... })`, rejecting on failure.
2. Restrict `cors.origin` to the known frontend origin(s).
3. Cap connections per IP and idle-timeout silent sockets.
**Verification** — SEC-AUTH-002 in §6: a socket connection with no/invalid token is refused before any `threat-event` is emitted.

---

### SEC-CONF-001 · Wildcard CORS on the API and the socket · **HIGH**

**Component** — `app.use(cors())` and `Server({ cors:{ origin:'*' } })`.
**Description** — Both the REST API and the websocket accept all origins. `cors()` with no options reflects any origin and allows the default method/header set.
**Evidence (verified)** — Preflight from `Origin: https://evil.example` to `/api/auth/login` returned `204` with `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Headers: authorization`.
**Impact** — Any website a logged-in user visits can call the API from the user's browser and read the response. Because the token is stored in a non-`HttpOnly` cookie *and* (on login) `localStorage`, a malicious origin combined with SEC-SESSION-002 can both read the token and use the API. Wildcard origin also blocks a future move to `credentials: 'include'` cookies, which browsers forbid with `*`.
**Likelihood** — Medium–High.
**Remediation** — Explicit allowlist: `cors({ origin: [FRONTEND_ORIGIN], credentials: true })`. Same origin list for the socket.
**Verification** — Preflight from an unlisted origin returns no `Access-Control-Allow-Origin`.

---

### SEC-ERR-001 · Stack-trace and filesystem-path disclosure on errors · **HIGH**

**Component** — Express default error handler (no custom handler); malformed-body path.
**Description** — There is no error-handling middleware and no `NODE_ENV=production` guarantee. Express 5's default handler returns the error stack for unhandled errors, and the body-parser rejects malformed JSON with a full trace.
**Evidence (verified)** —
```
$ curl -X POST -d '{bad json' -H 'Content-Type: application/json' /api/auth/login
SyntaxError: Expected property name ... at JSON.parse (<anonymous>)
  at parse (C:\Users\ks\Documents\GitHub\Optisight\backend\node_modules\body-parser\lib\types\json.js:72:19)
  at C:\Users\ks\...   ← absolute server filesystem paths disclosed
$ curl /api/nope   →  "Cannot GET /api/nope"  (route enumeration confirmation)
```
**Impact** — Discloses absolute install paths, dependency versions, and internal structure — reconnaissance that shortens the path to a working exploit (maps to ATT&CK T1592 / T1082). Login internal errors also return `500 "Internal server error"` which, while generic in message, is the wrong status semantics (see SEC-ERR-002).
**Likelihood** — High; trivially triggered.
**Remediation** —
1. Add a terminal error-handling middleware that logs the full error server-side and returns a generic body with a correlation ID.
2. Set `NODE_ENV=production` in deployed environments.
3. Add a JSON body-parse error branch returning `400 { error: 'Malformed request body' }`.
**Verification** — Malformed body returns a generic 400 with no stack; unknown routes return a generic 404 JSON.

---

### SEC-AUTH-003 · No brute-force or credential-stuffing control on login · **HIGH**

**Component** — `/api/auth/login`; the shared `apiLimiter`.
**Description** — The only throttle is the global 100-requests / 15-min / IP limiter shared across *all* `/api` traffic. It is not scoped to login, not keyed by account, and easily within a stuffing budget. There is no account lockout, no exponential backoff, no CAPTCHA step, and — per SEC-CONF-002 — no `trust proxy`, so behind a proxy the limiter keys every request to the proxy IP and collapses to a single global bucket.
**Evidence (verified)** — 30 sequential login attempts against one account all processed (returned 500 only because no DB is configured; the limiter did not intervene, and remaining-quota headers decremented normally). The limiter also silently spends legitimate users' quota: an analyst polling the app can be locked out of login by unrelated GETs.
**Impact** — Online password guessing against a known/enumerated account (see SEC-AUTH-004) is unrestrained per-account. Shared-bucket design also enables a cheap DoS: 100 anonymous GETs lock a whole source IP — including a NAT'd office — out of login.
**Likelihood** — Medium.
**Remediation** —
1. A dedicated, stricter limiter on `/api/auth/login` and `/register`, keyed by `email` + IP.
2. Progressive delay / temporary lockout after N failures, with the lockout event audited (the model already has `LOGIN_FAILED` rows to build on).
3. Configure `app.set('trust proxy', 1)` so per-IP keying is correct behind the platform proxy (see SEC-CONF-002).
**Verification** — N+1 rapid failed logins for one account return `429`; unrelated GETs do not consume the login budget.

---

### SEC-SESSION-001 · Stateless JWT with no revocation; logout does not invalidate · **MEDIUM**

**Component** — Token issuance (`expiresIn:'1d'`), `useUser.logout()`, `/api/auth/logout`.
**Description** — Tokens are stateless and valid for 24h. There is no server-side session store, deny-list, or token version. Logout is client-only (FN-06) and even the server logout endpoint only writes an audit row — it cannot invalidate the token. A password change (were one implemented) would not revoke outstanding tokens.
**Impact** — A leaked or shoulder-surfed token remains valid for up to a day regardless of logout or password reset. On a shared wall-panel workstation this is a realistic exposure.
**Likelihood** — Medium.
**Remediation** — Shorter access-token lifetime (15–30 min) with a refresh token, or a server-side token-version/`jti` deny-list checked in `authenticate`. Bump the user's token version on password change and on explicit "sign out everywhere".
**Verification** — SEC-SESSION test in §6: a token presented after server-side logout/revocation returns 401.

---

### SEC-SESSION-002 · Access token stored in JavaScript-readable cookie and localStorage · **HIGH**

**Component** — `pages/register.vue:166` (`useCookie`, `secure:false`), `pages/login.vue:95` (`localStorage`), `composables/useUser.ts`.
**Description** — The register flow stores the JWT in a cookie created with `sameSite:'lax'` and `secure:false` and **no `httpOnly`** (Nuxt `useCookie` cannot set `HttpOnly` for a value it reads on the client). The login flow additionally writes it to `localStorage`. Both stores are readable by any script running on the page.
**Impact** — Any XSS (see SEC-XSS-001 for current exposure) or malicious third-party script yields immediate full token theft. `secure:false` permits transmission over plaintext HTTP, exposing the token to network interception in any non-TLS deployment. This is what makes the wildcard-CORS and no-`HttpOnly` combination materially worse than either alone.
**Likelihood** — Medium (gated on an XSS or a hostile script today; the app's low XSS surface is the only mitigant).
**Remediation** — Move the session to an `HttpOnly; Secure; SameSite=Strict` cookie set by the *server* on login, not by the client. Remove the `localStorage` write entirely (also fixes FN-01). The client should never hold the raw token.
**Verification** — `document.cookie` and `localStorage` contain no token after login; the session cookie shows `HttpOnly` and `Secure` in devtools.

---

### SEC-AUTH-004 · User enumeration via distinct responses · **MEDIUM**

**Component** — `/api/auth/register` (409 "account with this email already exists") and `/api/auth/login` timing.
**Description** — Registration returns a distinct 409 for an existing email, directly confirming account existence. Login returns a uniform message but branches early for an unknown user (no bcrypt compare) versus a bad password (full bcrypt compare), a timing oracle.
**Impact** — An attacker can build a list of valid corporate accounts to target with the unthrottled guessing of SEC-AUTH-003.
**Likelihood** — Medium.
**Remediation** — Generic registration response ("If this email is not already registered, you'll receive a confirmation"). Constant-time login: run a dummy bcrypt compare on the unknown-user branch so both paths take comparable time.
**Verification** — Existing and non-existing emails return indistinguishable status, body, and timing distribution.

---

### SEC-INPUT-001 · Input validation library present but unused · **MEDIUM**

**Component** — All routes; `zod@4` is a dependency and is never imported.
**Description** — Validation is ad-hoc presence checks. Email format is unvalidated (Prisma `@unique` is the only guard). `/api/security?limit` is coerced with `Number(req.query.limit)||500` — `?limit=abc` silently becomes 500 (**verified: HTTP 200**), `?limit=-5` returns `[]` (**verified**). No body size caps beyond body-parser defaults, no type/shape enforcement, no allowlist.
**Impact** — Low direct impact today (no input reaches SQL — Prisma parameterizes — or a shell), but the absence of a validation layer is the pre-condition for the next injection or mass-assignment bug. Registration accepts arbitrary extra body fields; only the "next feature" separates this from mass assignment.
**Likelihood** — Medium as a latent enabler.
**Remediation** — A Zod schema per route, validated at the boundary; reject (400) rather than coerce. Strict object schemas (`.strict()`) so unexpected fields are rejected, not ignored. Explicit numeric bounds on `limit`.
**Verification** — `SEC-INPUT` cases in §6 return 400 for malformed/out-of-range input rather than 200 with a coerced value.

---

### SEC-INJECT-001 · Injection exposure assessment · **LOW** (no live vector found)

**Component** — Data layer (Prisma), realtime layer, template layer.
**Description** — Reviewed for SQL/NoSQL/OS-command/template/LDAP injection. Findings: all DB access is through Prisma's parameterized client — no raw SQL, no `$queryRawUnsafe`. No `child_process`, `exec`, `eval`, or `new Function` anywhere in `backend/src` or `frontend`. No server-side template engine rendering user input. No LDAP. User input reaching a sensitive sink was **not found**.
**Impact** — None currently.
**Likelihood** — Low.
**Remediation** — Preventive: keep to Prisma's safe query builder; never introduce `$queryRawUnsafe` with interpolated input; keep the Zod boundary (SEC-INPUT-001) so a future sink is fed validated data.
**Severity** — Low (informational-preventive).

---

### SEC-XSS-001 · Cross-site scripting exposure assessment · **LOW** (no live vector found)

**Component** — Vue render layer.
**Description** — Reviewed for stored/reflected/DOM XSS. No `v-html`, no `innerHTML`, no `eval`, no `new Function` in application code (`grep` clean across `.vue`/`.ts`). Vue's mustache interpolation auto-escapes, and all displayed data is either synthetic-server-generated or user-profile text rendered through `{{ }}`. The user-controlled `name` on registration is reflected via `{{ user.name }}` (escaped) and passed into a DiceBear URL — URL-context, not HTML-context — as a query seed.
**Impact** — None found today. Flagged because SEC-SESSION-002 makes the *cost* of any future XSS maximal (instant token theft), so the low-surface posture must be preserved deliberately.
**Likelihood** — Low.
**Remediation** — Keep `v-html` out of the codebase (add a lint rule). URL-encode the DiceBear seed. Tighten the app's own CSP (the API's helmet CSP does not cover the Nuxt app origin).
**Severity** — Low.

---

### SEC-CSRF-001 · State-changing requests rely on bearer tokens, not cookies · **LOW**

**Component** — Auth routes.
**Description** — State-changing endpoints authenticate via the `Authorization` header, which browsers do not attach automatically cross-site, so classic CSRF does not apply to the header-token flow. **However**, if SEC-SESSION-002's remediation moves the session to a cookie (recommended), CSRF protection becomes mandatory at that point.
**Impact** — None today; a prerequisite to get right during the session-cookie migration.
**Remediation** — On adopting cookie sessions: `SameSite=Strict` plus a double-submit or per-session CSRF token on state-changing routes.
**Severity** — Low (conditional).

---

### SEC-CONF-002 · `trust proxy` unset behind a platform proxy · **MEDIUM**

**Component** — `backend/src/index.ts`; Railway/Nixpacks deploy (`railway.json`).
**Description** — The app never calls `app.set('trust proxy', ...)`. Deployed behind Railway's proxy, `req.ip` becomes the proxy address, so the rate limiter keys every request to one IP (defeating per-client limiting) and audit logs record the proxy IP instead of the client's.
**Impact** — Rate limiting collapses to a single global bucket (amplifies SEC-AUTH-003); forensic audit rows attribute every action to the proxy.
**Remediation** — `app.set('trust proxy', 1)` (or the platform's specific hop count). Verify `express-rate-limit`'s proxy validation passes.
**Severity** — Medium.

---

### SEC-CONF-003 · `prisma db push` on every deploy · **MEDIUM**

**Component** — `railway.json` `startCommand: "... npx prisma db push && npm start"`.
**Description** — Production start runs `db push`, which force-syncs the schema to the database without a migration history and can drop columns/data to match. Migrations exist (`prisma/migrations/`) but are bypassed.
**Impact** — Risk of silent data loss on a schema change; no auditable migration trail; a schema drift can destroy the `AuditLog` table the security model depends on.
**Remediation** — Use `prisma migrate deploy` (already scripted as `db:migrate`) in the start command. Reserve `db push` for local prototyping.
**Severity** — Medium.

---

### SEC-LOG-001 · Incomplete and inconsistent security logging · **MEDIUM**

**Component** — Auth routes; audit model.
**Description** — Good: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `REGISTER_SUCCESS` are audited with IP. Gaps: a failed login for a *non-existent* user writes no row (the code returns before the audit write), so the most important brute-force signal — guessing usernames — is invisible. No lockout events (none exist). No admin actions (none reach the server). No alerting/monitoring on repeated failures. Positive: no passwords or full tokens are logged anywhere (checked) — the audit `details` are safe strings.
**Impact** — The audit trail cannot reconstruct an enumeration or stuffing campaign because the highest-signal events are the ones not recorded.
**Remediation** — Audit failed logins for unknown emails too (with a hashed/generalized identifier to avoid storing probe input verbatim). Add lockout and privilege-change events when those features land. Forward audit rows to a monitored sink. Continue never logging secrets.
**Severity** — Medium.

---

### SEC-DEP-001 · Vulnerable dependencies · **LOW→HIGH depending on exposure**

**Component** — `backend/package-lock.json`, `frontend/package-lock.json`.
**Evidence (verified via `npm audit`)** —
- **Backend:** 10 advisories (1 critical `tar`, 5 high incl. `ws`, `engine.io`, `socket.io-parser`, `brace-expansion`, `ip-address`; 3 moderate; 1 low). The `ws`/`engine.io` chain is *runtime* (Socket.IO) and network-facing — the relevant ones. `tar` is transitive/build-time.
- **Frontend:** 29 advisories (4 critical incl. `shell-quote`, `seroval`, `@nuxt/devtools`, `tar`; 13 high incl. `nuxt`, `postcss`, `vite`, `lodash`, `ws`). Most are dev/build-chain (`devtools`, `vite`, `svgo`, `simple-git`) and do not ship to production; `ws` and `socket.io-parser` are runtime.
**Impact** — The runtime `ws` DoS advisory (memory exhaustion from crafted frames) is directly reachable given the unauthenticated socket (SEC-API-001). Build-chain criticals matter for CI integrity, not the shipped app.
**Remediation** — `npm audit fix` in both packages; re-test the socket after `ws`/`engine.io` bumps. Track runtime vs build-chain separately so the count does not mask the two that matter. Remove `sqlite3` (unused — the datasource is Postgres) to drop a native-build dependency and its transitive `tar`/`node-gyp` chain.
**Severity** — Runtime subset: High. Build-chain subset: Low.

---

### SEC-CONF-004 · Weak password policy · **LOW**

**Component** — `/api/auth/register` (`password.length >= 8` only).
**Description** — Minimum 8 characters, no other server-side rule. The client shows a strength meter (SEC-adjacent UX) but the server accepts `"aaaaaaaa"`. No breach-list check.
**Remediation** — Enforce a real policy server-side (length ≥ 12 recommended, or zxcvbn-style scoring), reject known-breached passwords, and keep the client meter as guidance only. Never rely on the client meter as the control.
**Severity** — Low.

---

### SEC-CONF-005 · Dead security scaffolding invites false confidence · **INFORMATIONAL**

**Component** — `authorize()` (unused), `AlertEvent` model (unused), `sqlite3` dep (unused), `zod` (unused).
**Description** — Multiple half-wired security-relevant pieces exist unused. A reviewer skimming for "is there authorization?" finds `authorize()` and may assume it is applied.
**Remediation** — Wire them or remove them. Unused security scaffolding is a documentation hazard.
**Severity** — Informational.

---

### SEC-CONF-006 · Helmet CSP covers the API, not the app · **INFORMATIONAL**

**Component** — `helmet()` on Express; no CSP on the Nuxt origin.
**Description** — Helmet applies a restrictive CSP to `:3001` API JSON responses (verified in headers), which is where it matters least — an API serving JSON is not a script-execution context. The Nuxt app on `:3000`, which *is*, ships without an app-level CSP. See §5 for the header-by-header rationale.
**Remediation** — Add a Nitro route-rules CSP to the frontend (script-src self, no inline once feasible, connect-src limited to the API + socket origin), and self-host fonts (PF-02) so `fonts.gstatic.com` need not be allowlisted.
**Severity** — Informational (hardening).

---

## 4. MITRE ATT&CK threat model

Not a checklist — a narrative of how an intrusion could *progress* given this architecture. Only techniques the architecture actually exposes are included.

| Stage | Technique (ID) | Entry point / behaviour | Affected component | Existing control | Detection opportunity | Mitigation |
|---|---|---|---|---|---|---|
| **Initial Access** | Valid Accounts (T1078) | Forge admin JWT with the public fallback secret | Auth middleware | None (secret is public) | A valid token whose `id` matches no DB user | SEC-AUTH-001: remove fallback, fail-fast |
| **Initial Access** | Exploit Public-Facing App (T1190) | Anonymous Socket.IO connection | Realtime layer | None | Sockets with no prior authenticated HTTP session | SEC-API-001: authenticate handshake |
| **Execution** | — | No command/script execution sink exists (no `exec`/`eval`; Prisma parameterized) | — | n/a (SEC-INJECT-001) | — | Preserve the no-sink posture |
| **Persistence** | Account Manipulation (T1098) | Self-register, or (future) create/elevate accounts via unguarded admin route | `/api/auth/register`, future `/api/users` | Default role `analyst` on register | New-account and role-change audit rows | SEC-AUTHZ-001: server-side role checks + audit |
| **Privilege Escalation** | Valid Accounts (T1078) | Set `role:'admin'` in a forged token | Auth | None | Role claim not matching server-side role of record | SEC-AUTH-001 + re-read role server-side |
| **Credential Access** | Brute Force (T1110) | Unthrottled per-account login guessing after enumeration | `/api/auth/login` | Global IP limiter only | Bursts of `LOGIN_FAILED` per account | SEC-AUTH-003: per-account throttle + lockout |
| **Credential Access** | Steal Web Session Cookie (T1539) | Read the non-`HttpOnly` cookie / `localStorage` token via any injected script | Session storage | None | Unusual token reuse from new IP | SEC-SESSION-002: `HttpOnly` server cookie |
| **Discovery** | System Info Discovery (T1082) / Gather Victim Host Info (T1592) | Trigger stack traces to map install paths and versions; enumerate routes via 404 text | Error handler | None | 4xx/5xx spikes with malformed bodies | SEC-ERR-001: generic errors, `NODE_ENV=production` |
| **Collection** | Data from App (T1213) | Drain the threat/metric feed over the anonymous socket | Realtime layer | None | Long-lived anonymous sockets, high egress | SEC-API-001 + connection caps |
| **Command & Control** | — | No outbound C2 primitive in the app; DiceBear/Fonts are the only egress | — | — | Unexpected outbound from the server host | Egress allowlist at the network layer |
| **Exfiltration** | Exfiltration Over Web Service (T1567) | Pull data through the open socket or forged-token REST calls | Realtime + REST | None | Volume anomalies per principal | Authn everywhere + per-principal quotas |
| **Impact** | Endpoint DoS (T1499) | Crafted `ws` frames (SEC-DEP-001) or unbounded anonymous sockets exhaust memory | `ws` / Socket.IO | None | Memory/connection-count climb | Patch `ws`; cap connections; idle timeout |

**Reading of the model:** the intrusion story is short and shallow because there is no execution sink and the data is synthetic — an attacker can *read everything* and *impersonate anyone*, but cannot run code or reach a real asset *through the app*. The controls that close the story are all authentication/authorization ones (SEC-AUTH-001, SEC-AUTHZ-001, SEC-API-001). Fix those three and the model loses its Initial Access and Privilege Escalation edges.

---

## 5. Cyber Kill Chain view

| Stage | What could happen here | Telemetry that would detect it | Control that reduces it |
|---|---|---|---|
| **Reconnaissance** | Read the public repo / bundle for the JWT literal and route map; trigger stack traces for paths & versions | Malformed-request 4xx spikes; 404 route-scan patterns | SEC-ERR-001 (generic errors); secret rotation makes the literal worthless |
| **Weaponization** | Craft a `role:admin` JWT offline with the known secret; prepare `ws` DoS frames | None (offline) | SEC-AUTH-001 removes the signing key from the attacker's hands |
| **Delivery** | Present the forged token to REST; open an anonymous socket | Tokens with unknown `id`; sockets without a prior auth handshake | SEC-AUTHZ-001 (verify subject); SEC-API-001 (authn socket) |
| **Exploitation** | Accepted forged token → full API; open socket → full feed | 200s for a subject that does not exist in `User`; anonymous-connection metric | SEC-AUTH-001 + SEC-API-001 |
| **Installation** | Self-register a persistent account; (future) create/elevate accounts | `REGISTER_SUCCESS` from unexpected IPs; role-change audit | Registration throttle; SEC-AUTHZ-001 + audit on role change |
| **Command & Control** | No in-app C2 primitive; would require host-level compromise out of app scope | Outbound connections from the server host beyond DiceBear/Fonts | Network egress allowlist; self-host fonts (removes one egress) |
| **Actions on Objectives** | Drain/monitor the feed; impersonate; DoS the socket | Egress volume per principal; connection-count and memory climb | Authn everywhere; per-principal quotas; patch `ws` |

---

## 6. Security test cases

Status legend: **PASS** = behaves securely, **FAIL** = vulnerable, **N/A** = no surface.

| ID | Scenario | Expected | Observed | Status | Sev if failed |
|---|---|---|---|---|---|
| SEC-AUTH-001 | Forged JWT signed with the public fallback secret, `role:admin` | 401 | **200 on `/api/stats` & `/api/security`** | **FAIL** | Critical |
| SEC-AUTH-002 | Socket.IO connect with no credentials | Handshake refused, no events | **Connected; 15 threat events in 9s** | **FAIL** | High |
| SEC-AUTH-003 | 30 rapid failed logins for one account | Throttle / lockout ≤ N | All processed; no login-scoped limit | **FAIL** | High |
| SEC-AUTH-004 | Register with an existing email | Non-committal response | 409 "account already exists" (enumeration) | **FAIL** | Medium |
| SEC-AUTH-005 | `alg:none` unsigned token | 401 | **400** (rejected, but wrong status — SEC-ERR-002) | PASS* | — |
| SEC-AUTH-006 | Invalid/garbage token | 401 | **400** (rejected, wrong status) | PASS* | — |
| SEC-AUTH-007 | Expired token | 401 | Rejected (400) | PASS* | — |
| SEC-AUTHZ-001 | Unauthenticated request to a protected resource | 401 | 401 on API; **but frontend `/users` served 200** | PARTIAL | Critical |
| SEC-AUTHZ-002 | `analyst` token on a (future) admin route | 403 | No admin route exists to test | N/A (prospective) | Critical |
| SEC-INPUT-001 | `/api/security?limit=abc` | 400 | **200, silently coerced to 500** | **FAIL** | Medium |
| SEC-INPUT-002 | `/api/security?limit=-5` | 400 | **200, `[]`** | **FAIL** | Medium |
| SEC-INPUT-003 | Malformed JSON body to `/login` | Generic 400 | **Stack trace with FS paths** | **FAIL** | High |
| SEC-CONF-001 | Preflight from `evil.example` | No CORS allow | **`Access-Control-Allow-Origin: *`** | **FAIL** | High |
| SEC-ERR-001 | Unknown route | Generic 404 JSON | `Cannot GET /api/nope` (route confirmation) | **FAIL** | High |
| SEC-SESSION-001 | Reuse token after logout | 401 | Token still valid (no revocation) | **FAIL** | Medium |
| SEC-SESSION-002 | Read token from `document.cookie` / `localStorage` | Not readable | **Readable in both** | **FAIL** | High |
| SEC-XSS-001 | Inject `<script>` via profile name | Escaped/inert | Escaped by Vue (no live vector) | **PASS** | — |
| SEC-INJECT-001 | SQL metacharacters in email/login | Parameterized, no effect | Prisma parameterizes; no sink | **PASS** | — |
| SEC-UPLOAD-001 | Upload a `.svg`/`.php` file | Rejected | No upload surface exists | **N/A** | — |

\* *PASS on outcome (token rejected) but the status code is 400 where 401 is correct — tracked as SEC-ERR-002 below.*

**SEC-ERR-002 · Auth failures return 400, not 401 · LOW** — `auth.middleware.ts` returns `400 "Invalid token"` on any verify failure. Semantically these are `401 Unauthorized`. Low impact, but it misleads clients and monitoring (a 400 reads as "client sent garbage", not "authentication failed"). Fix: return 401 for all token-verification failures.

---

## 7. Remediation priority

**Do first (Critical — do not wait on design review):**
1. SEC-AUTH-001 — remove the JWT fallback, fail-fast, rotate secret.
2. SEC-AUTHZ-001 — server-side authorization, deny-by-default.
3. SEC-API-001 — authenticate the Socket.IO handshake.

**High, next:**
4. SEC-ERR-001 — error handler + `NODE_ENV=production`.
5. SEC-CONF-001 — CORS allowlist.
6. SEC-AUTH-003 — login-scoped throttle + `trust proxy` (SEC-CONF-002).
7. SEC-SESSION-002 — `HttpOnly; Secure` server-set session cookie (also closes FN-01).
8. SEC-DEP-001 (runtime subset) — patch `ws`/`engine.io`.

**Medium/Low:** SEC-INPUT-001 (Zod boundary), SEC-SESSION-001 (revocation), SEC-AUTH-004 (enumeration), SEC-LOG-001, SEC-CONF-003 (`migrate deploy`), SEC-CONF-004 (password policy), SEC-ERR-002, remaining dependency and hygiene items.

Nothing here was exploited beyond read-only proof, and no data was modified during the assessment.
