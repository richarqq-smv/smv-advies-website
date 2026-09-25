/**
 * Single source of truth for route paths. Import ROUTES instead of
 * hardcoding path strings so navigation, links and <Route> definitions
 * never drift out of sync.
 */
export const ROUTES = {
  home: '/',
  pakketten: '/pakketten',
  energieIndicatie: '/energie-indicatie',
  over: '/over',
  werkwijze: '/werkwijze',
  werkgebied: '/werkgebied',
  cases: '/cases',
  blog: '/blog',
  blogPost: (slug) => `/blog/${slug}`,
  faq: '/faq',
  contact: '/contact',
  privacy: '/privacy',
  voorwaarden: '/voorwaarden',
  // Intern adviesinstrument, bewust niet in NAV_ITEMS/sitemap opgenomen en
  // geserveerd met noindex — zie src/pages/MjopTool.jsx.
  mjopTool: '/MJOP-Tool',
  // Accountroutes — zelfde behandeling als mjopTool: geen link in
  // NAV_ITEMS/sitemap, wel noindex, wel prerendered (lege formulieren
  // bevatten geen klantdata, dus geen bezwaar om ze statisch te serveren).
  inloggen: '/inloggen',
  registreren: '/registreren',
  wachtwoordVergeten: '/wachtwoord-vergeten',
  // Echte klantomgeving — alleen bereikbaar ingelogd (RequireAuth in
  // App.jsx). /dossier/:id is bewust NIET in scripts/prerender.mjs
  // opgenomen: het dossier bestaat pas na aanmaken in de database en de
  // inhoud is per definitie klant-specifiek, dus geen statisch te
  // genereren pad (zie DossierDetail.jsx).
  account: '/account',
  dossier: (dossierId) => `/dossier/${dossierId}`,
  admin: '/admin',
  // Offerte-preview/print (Fase 3) — buiten MainLayout gerouteerd (geen
  // header/nav/footer), zodat de printweergave nooit sitenavigatie bevat.
  // Zelfde reden als /dossier/:id om niet in scripts/prerender.mjs te
  // staan: bestaat pas na het aanmaken van een offerte, per definitie
  // klant-/offertespecifiek.
  offertePreview: (dossierId, offerteId) => `/dossier/${dossierId}/offerte/${offerteId}`,
}
