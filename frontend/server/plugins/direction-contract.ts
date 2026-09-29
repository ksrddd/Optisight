/**
 * Emits the SOC console's direction contract into the rendered HTML.
 *
 * The same comment heads `app.vue`, where it is the reminder a developer
 * re-reads on every edit — but Vue's SFC compiler strips template comments from
 * production builds, so a contract that lives only there is one nobody can
 * audit in a shipped artifact. This puts it back, as the first child of <body>.
 *
 * Keep the text below in sync with the comment in `app.vue`.
 */
const DIRECTION_CONTRACT = `<!--
  THESIS: The triage queue IS the page. Refuses the dashboard arrangement
  where cards own the viewport and the table is the last section.
  OWN-WORLD: #09090b ground, 1px #27272a rules, radii <=6px, zero blur or
  glow, Inter for UI and JetBrains Mono for machine values. One law: hue
  means severity and nothing else, so focus and selection are neutral.
  STORY: the analyst reads queue pressure in one glance, narrows to what is
  theirs, opens an incident in place, and acts without losing the stream.
  FIRST VIEWPORT: fixed 100vh grid - 216px nav, 48px command bar, 56px page
  head, 4-up KPI strip, then the virtualised feed beside a 320px attack
  surface rail. The primary action sits in the slide-over.
  FORM: enterprise operations console. Brief-pinned world; the concept roll
  is waived under the pinned-direction rule.
  FINISH: unreviewed and undocumented is unfinished; this build ends with
  the finish review, the verdict, and DESIGN.md
-->`

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.bodyPrepend.push(DIRECTION_CONTRACT)
  })
})
