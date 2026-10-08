/**
 * Single source of truth for route paths. Import ROUTES instead of
 * hardcoding path strings so navigation, links and <Route> definitions
 * never drift out of sync.
 */
export const ROUTES = {
  home: '/',
  pakketten: '/pakketten',
  // Anchor naar de uitgebreide informatiesectie van één pakket op
  // /pakketten (Meer-informatie-ronde, 2026-10-07) — PricingCard.jsx en
  // Pakketten.jsx gebruiken allebei deze ene functie, zodat het anchor-id
  // nooit tussen "waar de knop naartoe linkt" en "waar de sectie staat"
  // uit elkaar kan lopen.
  pakketAnchor: (pakketId) => `/pakketten#pakket-${pakketId}`,
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
  // Mobiele-opnameronde (2026-09-30) — /dossier/:id (hieronder, ongewijzigd)
  // blijft de klant-eigen route onder MainLayout; een admin die vanuit
  // /admin/dossiers doorklikt komt nu hier terecht: dezelfde DossierDetail-
  // pagina/component, maar gerouteerd onder AdminLayout (geen publieke
  // header/footer) — zie App.jsx. bepaalDossierOverzichtRoute(isAdmin) en
  // "Terug naar dossiers" blijven ongewijzigd naar adminDossiers wijzen.
  adminDossierDetail: (dossierId) => `/admin/dossiers/${dossierId}`,
  // De eigenlijke mobiele opnameflow — altijd in dossiercontext (Admin ->
  // Dossiers -> dossier -> Opnames -> nieuwe/bestaande opname), nooit een
  // dossieroverstijgende lijst (die bestaat bewust niet, zie opdracht §14).
  adminOpname: (dossierId, opnameId) => `/admin/dossiers/${dossierId}/opnames/${opnameId}`,
  // Subsidiebegeleidingsronde (2026-10-xx) — zelfde padvorm als adminOpname
  // hierboven, altijd in dossiercontext, admin-only (zie App.jsx).
  adminSubsidieBegeleiding: (dossierId) => `/admin/dossiers/${dossierId}/subsidie`,
  adminPlanning: '/admin/planning',
  adminKansen: '/admin/kansen',
  // RVO-subsidie-naslag (onderzoeksronde 2026-10-07) — admin-only,
  // maandelijks gesynchroniseerde referentielijst, zie AdminSubsidies.jsx.
  adminSubsidies: '/admin/subsidies',
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
