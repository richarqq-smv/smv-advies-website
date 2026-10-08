import { ROUTES } from '../lib/routes'

/**
 * Eén bron van waarheid voor de admin-navigatie — gedeeld tussen de
 * desktop-balk en de mobiele drawer (AdminLayout.jsx/AdminMobileNav.jsx),
 * zelfde opzet als NAV_ITEMS in data/navigation.js voor de publieke site.
 * Bevat uitsluitend routes die al daadwerkelijk bestaan (zie App.jsx) —
 * geen MJOP/Advies/Rapporten/Documenten/Opnames als los top-level item:
 * die functionaliteit leeft al binnen een Dossier (DossierDetail.jsx),
 * niet als eigen adminpagina.
 */
/**
 * Drie herkenbare groepen i.p.v. één lange, ongegroepeerde balk (UX-
 * herontwerp, 2026-10-08, Fase 9) — dezelfde route-set als voorheen, nu
 * gegroepeerd op wat een adviseur ermee doet: dagelijks werk aan
 * klanten/dossiers, de adviesondersteunende naslag (Subsidies/Wat kan
 * wachten), en financiële administratie. Geen enkele route toegevoegd of
 * verwijderd, puur een indeling — zie ADMIN_NAV_GROEPEN hieronder voor de
 * daadwerkelijke rendering (AdminLayout.jsx/AdminMobileNav.jsx).
 */
export const ADMIN_BEHEER_NAV_ITEMS = [
  { to: ROUTES.admin, label: 'Dashboard', end: true },
  { to: ROUTES.adminPlanning, label: 'Planning' },
  { to: ROUTES.adminDossiers, label: 'Klanten & dossiers' },
  { to: ROUTES.archief, label: 'Archief' },
]

// Advies-ondersteunende naslag — geen klant/dossierbeheer zelf, wel
// onderdeel van het adviesproces (zie DossierSubsidies.jsx's link naar
// /admin/subsidies vanuit een dossier, dezelfde onderliggende route).
export const ADMIN_ADVIES_NAV_ITEMS = [
  { to: ROUTES.adminSubsidies, label: 'Subsidies' },
  { to: ROUTES.watKanWachten, label: 'Wat kan wachten' },
]

// Omzet/Openstaand/Resultaat/Instellingen en Commerciële kansen staan
// bewust NIET in deze navigatie — exact zelfde, ongewijzigde keuze als de
// vorige versie van dit bestand: die blijven bereikbaar via klikbare
// kaarten op /admin en /admin/administratie (zie Admin.jsx/
// AdminAdministratie.jsx). Deze ronde herstructureert alleen de groepering,
// niet welke routes er wel/niet in staan.
export const ADMIN_ADMINISTRATIE_NAV_ITEMS = [
  { to: ROUTES.adminAdministratie, label: 'Administratie' },
  { to: ROUTES.adminOffertes, label: 'Offertes' },
  { to: ROUTES.adminFacturen, label: 'Facturen' },
  { to: ROUTES.adminKosten, label: 'Kosten' },
  { to: ROUTES.adminBtw, label: 'BTW' },
]

/** Eén bron van waarheid voor de 3 groepen + hun label, voor AdminLayout.jsx/AdminMobileNav.jsx — voorkomt dat de twee navigaties ooit uit elkaar lopen. */
export const ADMIN_NAV_GROEPEN = [
  { label: 'Werk', items: ADMIN_BEHEER_NAV_ITEMS },
  { label: 'Advies', items: ADMIN_ADVIES_NAV_ITEMS },
  { label: 'Administratie', items: ADMIN_ADMINISTRATIE_NAV_ITEMS },
]

/**
 * Externe links in de mobiele admin-navigatie — geen interne route, dus
 * geen `to`/NavLink zoals hierboven, maar een gewone `href` die in een
 * nieuw tabblad opent. Vooralsnog alleen de Porkbun-webmail (geen iframe,
 * geen eigen mailpagina — zie AdminMobileNav.jsx): de admin-gebruiker
 * verlaat de SMV-admin niet, die blijft gewoon open in het andere tabblad.
 */
export const ADMIN_EXTERNE_NAV_ITEMS = [{ href: 'https://webmail.porkbun.com/?_task=mail&_mbox=INBOX', label: 'E-mail' }]
