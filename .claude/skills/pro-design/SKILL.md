---
name: pro-design
description: Use for any request to (re)design, restyle or visually improve SMV Advies pages/components, or to review the site's design quality. Runs a bounded four-part process (brand, pattern library, motion, verification loop) so changes look professionally designed and consistent with the existing SMV identity — not generic, and not a blind redesign.
---

# Pro Design — SMV Advies

The brief wins. If the user pins a specific style, font, palette, page or scope, follow it exactly. Everything below fills gaps and sets the default guardrails for this project.

**Scope discipline first:** a request to *review* or *check* the design is not a request to *implement* changes. State clearly which mode you're in (review / proposal / implementation) before doing anything, and stay in that mode unless the user asks otherwise. Never widen a single-page or single-section request into a site-wide redesign. Never commit or push without the user's explicit go-ahead after this round — that approval never carries over to a later round.

## 1. Brand first — but it already exists here, don't re-derive it

This project already has a settled brand. Do **not** write a new brand sheet or run a confirmation round — read the existing sources instead:

- `CLAUDE.md` (repo root) — project conventions, domain/email setup, prior decisions.
- `src/index.css` — the actual `@theme` tokens: colors (`--color-*`), fonts (`--font-heading`/`--font-body`), radius scale (`--radius-*`, with a documented hierarchy comment above the scale — read it, don't reinvent it), `--ease-default`.
- `src/data/company.js` — company name, contact details, copy constants.
- Already-rendered pages (dev server or `dist/`) for how tokens are actually used.

Current pillars, confirmed in those sources — keep unless there is a concrete, demonstrated problem (not just taste):
- Colors: navy (`--color-primary` `#16293a`) + goud/accent (`--color-accent` `#9d7720`, with `-light`/`-dark` variants), white background, muted neutrals. No gradients, no new accent hues.
- Typography: Fraunces Variable (serif, headings) + Inter Variable (sans, body) — both self-hosted via `@fontsource-variable`, no external font requests.
- Voice: bouwkundig/energieadvies, vertrouwen, deskundigheid, rust — not hypey, not AI-template language.

Every color, font, radius and spacing value used in a change must trace back to an existing token or an explicitly-justified new one. No hardcoded hex/px values in components when a token already covers the case.

## 2. Pattern library (before layout)

- For each section you touch, name the pattern and why (hero, feature rows, comparison, pricing, FAQ, testimonials, process steps) — and check whether SMV already has an established version of it (`src/components/home/`, `src/components/pakketten/`, `src/components/ui/`) before inventing a new one. Reuse existing components over writing new ones.
- Use numbered steps only when the content is a real sequence.
- If browser/web access is available and the user's request benefits from external reference, study at most two or three strong sites in a comparable industry (bouwkundig advies, energieadvies, B2B professional services) — but SMV's own identity wins over any reference; note explicitly which observations come from reference sites vs. SMV's own pages, and never copy a competitor's distinctive pattern wholesale.
- Reject these defaults unless the brief asks for them: cream background with a serif and a terracotta accent; near-black with one acid-green or orange accent; purple gradients; identical rounded cards with the same shadow on everything; a small ALL CAPS label above every heading; one word of every headline in a different color. (SMV already has navy/goud + Fraunces/Inter — don't drift toward a generic alternative.)
- Prioritize proposed changes by impact, consistency and accessibility/conversion relevance — not by "make it look different." Every change needs a stated concrete reason (a real inconsistency, a measured UX problem, a verified accessibility gap), never "to look more designed."
- Reuse existing design tokens and components first; add a new token or variant only when the existing scale genuinely can't express what's needed, and say why in one line.

## 3. Motion

- One orchestrated moment at most per page (hero load sequence or one scroll scene) — check `src/components/ui/Reveal.jsx` and existing usage before adding new motion primitives.
- Add motion that answers an action: hover, focus, open, close, confirm.
- UI transitions run 150–250ms. Hero sequences run 600–900ms. Use `var(--ease-default)` (already defined) rather than inventing a new easing curve.
- Respect `prefers-reduced-motion` (already handled site-wide in `src/index.css`'s `@layer base` — verify new motion respects it too). Never leave content hidden waiting for an animation.
- No fade-and-slide on every section. No hover transform on every card.

## 4. Verification loop

- Build the whole scoped change first, then verify — don't verify piecemeal mid-build.
- Start the dev server (`npm run dev -- --port <port>`) and open it with Playwright (Chromium at `/opt/pw-browsers/chromium-*/chrome-linux/chrome` in this environment) or Claude in Chrome if available.
- Screenshot desktop at 1440px wide and mobile at 390px wide, for every page/section actually changed.
- Check: horizontal overflow, clipped text, contrast (WCAG AA), broken images, console errors, visible keyboard focus states, hero visible in the first screen, no overlap between fixed/floating elements (cookie banner, `ContactFab`, `StickyMobileActions` — see their existing coordination via `COOKIE_BANNER_VISIBILITY_EVENT` in `src/lib/consent.js`), existing routes/links/contact functionality still intact.
- Fix everything found in one batch. Run one confirming round. **Maximum two verification rounds total** — after the second, stop and report, don't keep polishing.
- Run `npm test`, `npm run lint`, `npm run build` after any code change (not just on request) and resolve regressions before reporting done.

## Quality floor

Responsive to phone width, WCAG AA contrast, visible focus states, real Dutch copy (no lorem ipsum, no placeholder text left in), no dark mode needed (SMV's brand doesn't require it — don't add one unasked).

## Project-specific guardrails (non-negotiable, not just defaults)

- Never touch Supabase schema, RLS policies, auth, or the admin environment as part of a design pass — that is out of scope for this skill entirely.
- Never add a new dependency, plugin, MCP server or external script to satisfy a design idea. Work with what's already in `package.json` and already-imported libraries.
- Preserve all existing routes, SEO (`Seo` component, structured data, `scripts/prerender.mjs` entries), accessibility attributes, and functional behavior (cookie consent, contact links, forms) exactly as-is unless the specific request calls for changing them.
- No blind find-and-replace across many files (e.g. mass radius/icon-weight renames) — every touched file needs its own concrete reason, per the token/pattern library section above.
- Never commit or push without the user's explicit, round-specific permission.

## Hand-off

State which mode you ran in (review / proposal / implementation). Deliver working files (if implementing) or a clear written proposal (if reviewing), plus a two-sentence summary of the design direction taken and what the verification loop caught — and explicitly flag anything left unverified or out of scope.
