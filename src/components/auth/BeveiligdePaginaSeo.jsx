import { Seo } from '../seo/Seo'

/**
 * Head-tags voor een route achter RequireAuth/RequireAdmin zolang de
 * toegang nog niet is vastgesteld (sessie laden, admin-check, en tijdens
 * het prerenderen — dan is er nooit een sessie). Zonder dit rendert de
 * guard niets, en neemt scripts/prerender.mjs de title/robots over van de
 * vórige gerenderde route (zie seoRegistry.js) — voor een interne route
 * kan dat zelfs "index, follow" zijn. Altijd noindex.
 */
export function BeveiligdePaginaSeo() {
  return <Seo title="Beveiligde omgeving" description="Deze pagina is alleen toegankelijk na inloggen." noindex />
}
