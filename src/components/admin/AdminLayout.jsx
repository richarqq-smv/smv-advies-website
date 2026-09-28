import { NavLink, Outlet } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'
import { UitloggenKnop } from '../auth/UitloggenKnop'
import { Container } from '../ui/Container'

/**
 * Gedeelde navigatie voor de hele Admin-omgeving (Admin-ronde, 2026-09-28;
 * uitgebreid met Offertes/Facturen/Administratie in de Administratie-
 * ronde, en met een expliciete "Beheer"/"Administratie"-groepering in de
 * Klantomgeving-/Administratie-detailronde) — bewust een extra, dunne laag
 * BINNEN de bestaande MainLayout (site-header/footer blijven ongewijzigd,
 * zie App.jsx), niet een vervanging daarvan. Elke admin-subpagina staat
 * hierdoor altijd één klik bij elkaar vandaan — dit is dus ook de
 * "← Admin Dashboard"-mogelijkheid die de losse pagina's zelf niet meer
 * apart hoeven te bouwen.
 *
 * Twee groepen (zoals expliciet gevraagd), zelfde platte <nav> — puur een
 * visuele scheiding via een verticale streep, geen geneste navigatie.
 * Omzet/Openstaand/Resultaat/Instellingen staan bewust NIET in deze balk —
 * die blijven bereikbaar via klikbare kaarten op /admin/administratie
 * (zelfde "compact/overzichtelijk"-afweging als Commerciële kansen).
 *
 * `end` op de Dashboard-link: zonder die vlag zou NavLink "/admin" als
 * prefix ook op elke sub-pagina (/admin/planning, /admin/dossiers, ...)
 * als actief markeren.
 */
const BEHEER_NAV_ITEMS = [
  { to: ROUTES.admin, label: 'Dashboard', end: true },
  { to: ROUTES.adminPlanning, label: 'Planning' },
  { to: ROUTES.adminDossiers, label: 'Klanten & dossiers' },
  { to: ROUTES.watKanWachten, label: 'Wat kan wachten' },
  { to: ROUTES.archief, label: 'Archief' },
]

const ADMINISTRATIE_NAV_ITEMS = [
  { to: ROUTES.adminAdministratie, label: 'Administratie' },
  { to: ROUTES.adminOffertes, label: 'Offertes' },
  { to: ROUTES.adminFacturen, label: 'Facturen' },
  { to: ROUTES.adminKosten, label: 'Kosten' },
  { to: ROUTES.adminBtw, label: 'BTW' },
]

function navLinkClassName({ isActive }) {
  return `rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
    isActive ? 'bg-primary text-white' : 'text-foreground-muted hover:bg-muted hover:text-primary'
  }`
}

export function AdminLayout() {
  return (
    <>
      <div className="border-b border-border bg-white print:hidden">
        <Container className="max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <nav aria-label="Admin" className="flex flex-wrap items-center gap-1">
              {BEHEER_NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClassName}>
                  {item.label}
                </NavLink>
              ))}
              <span className="mx-1.5 h-5 w-px bg-border" aria-hidden="true" />
              {ADMINISTRATIE_NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClassName}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <UitloggenKnop />
          </div>
        </Container>
      </div>
      <Outlet />
    </>
  )
}
