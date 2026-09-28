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
  // /admin is sinds de Admin-ronde (2026-09-28) het centrale Admin
  // Dashboard/startpunt — de klanten/dossiers-lijst zelf staat op
  // adminDossiers hieronder (was voorheen de inhoud van /admin zelf).
  admin: '/admin',
  adminDossiers: '/admin/dossiers',
  adminPlanning: '/admin/planning',
  adminKansen: '/admin/kansen',
  // Werkfase Fase 8 — dossier-overstijgend, admin-only, geen klantroute.
  watKanWachten: '/admin/wat-kan-wachten',
  // Dossier-archief (admin-feature, 2026-09-28) — zelfde behandeling als
  // watKanWachten hierboven: admin-only, geen klantroute.
  archief: '/admin/archief',
  // Administratie-uitbreiding (2026-09-28) — offertes/facturen/financiële
  // administratie, allemaal admin-only, geen klantroute. /admin/facturen/:id
  // is bewust GEEN publiek/voorspelbaar deelbare URL (zie
  // FactuurDetail.jsx): admin-only RLS + RequireAdmin is de toegangsgrens,
  // niet de onvoorspelbaarheid van het pad (een uuid raden is geen
  // beveiliging, RLS wel).
  adminOffertes: '/admin/offertes',
  adminFacturen: '/admin/facturen',
  adminFactuurDetail: (factuurId) => `/admin/facturen/${factuurId}`,
  adminAdministratie: '/admin/administratie',
  adminOmzet: '/admin/administratie/omzet',
  adminOpenstaand: '/admin/administratie/openstaand',
  adminResultaat: '/admin/administratie/resultaat',
  adminKosten: '/admin/administratie/kosten',
  adminBtw: '/admin/administratie/btw',
  adminInstellingen: '/admin/administratie/instellingen',
  // Klantomgeving-uitbreiding (2026-09-28) — "Mijn facturen" op /account
  // hergebruikt letterlijk FactuurDetail.jsx (zelfde component als
  // adminFactuurDetail hierboven, admin-acties verbergen zichzelf al via
  // een isAdmin-check), maar bereikbaar via de klant-eigen routeboom
  // (RequireAuth, geen RequireAdmin) — vandaar een los pad in plaats van
  // hergebruik van /admin/facturen/:id zelf. Zelfde niet-voorspelbare-URL-
  // redenering als adminFactuurDetail: RLS (facturen_select_klant) is de
  // toegangsgrens, niet het pad.
  mijnFactuur: (factuurId) => `/account/facturen/${factuurId}`,
  // Offerte-preview/print (Fase 3) — buiten MainLayout gerouteerd (geen
  // header/nav/footer), zodat de printweergave nooit sitenavigatie bevat.
  // Zelfde reden als /dossier/:id om niet in scripts/prerender.mjs te
  // staan: bestaat pas na het aanmaken van een offerte, per definitie
  // klant-/offertespecifiek.
  offertePreview: (dossierId, offerteId) => `/dossier/${dossierId}/offerte/${offerteId}`,
  // Klaar-voor-klantgesprek (werkfase Fase 7) — admin-only voorbereidingsscherm
  // voor de adviseur, geen klantroute. Zelfde reden als offertePreview om niet
  // in scripts/prerender.mjs te staan: bestaat pas na aanmaken, dossierspecifiek.
  klantgesprek: (dossierId) => `/dossier/${dossierId}/klantgesprek`,
}
