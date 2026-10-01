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
export const ADMIN_BEHEER_NAV_ITEMS = [
  { to: ROUTES.admin, label: 'Dashboard', end: true },
  { to: ROUTES.adminPlanning, label: 'Planning' },
  { to: ROUTES.adminDossiers, label: 'Klanten & dossiers' },
  { to: ROUTES.watKanWachten, label: 'Wat kan wachten' },
  { to: ROUTES.archief, label: 'Archief' },
]

// Omzet/Openstaand/Resultaat/Instellingen en Commerciële kansen staan
// bewust NIET in deze navigatie — exact zelfde, ongewijzigde keuze als de
// vorige versie van dit bestand: die blijven bereikbaar via klikbare
// kaarten op /admin en /admin/administratie (zie Admin.jsx/
// AdminAdministratie.jsx). Deze ronde herstructureert alleen de shell,
// niet welke routes er wel/niet in staan.
export const ADMIN_ADMINISTRATIE_NAV_ITEMS = [
  { to: ROUTES.adminAdministratie, label: 'Administratie' },
  { to: ROUTES.adminOffertes, label: 'Offertes' },
  { to: ROUTES.adminFacturen, label: 'Facturen' },
  { to: ROUTES.adminKosten, label: 'Kosten' },
  { to: ROUTES.adminBtw, label: 'BTW' },
]

/**
 * Externe links in de mobiele admin-navigatie — geen interne route, dus
 * geen `to`/NavLink zoals hierboven, maar een gewone `href` die in een
 * nieuw tabblad opent. Vooralsnog alleen de Porkbun-webmail (geen iframe,
 * geen eigen mailpagina — zie AdminMobileNav.jsx): de admin-gebruiker
 * verlaat de SMV-admin niet, die blijft gewoon open in het andere tabblad.
 */
export const ADMIN_EXTERNE_NAV_ITEMS = [{ href: 'https://webmail.porkbun.com/?_task=mail&_mbox=INBOX', label: 'E-mail' }]
