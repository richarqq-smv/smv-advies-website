import { NavLink, Outlet } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'
import { UitloggenKnop } from '../auth/UitloggenKnop'
import { Container } from '../ui/Container'

/**
 * Gedeelde navigatie voor de hele Admin-omgeving (Admin-ronde, 2026-09-28;
 * uitgebreid met Offertes/Facturen/Administratie in de Administratie-
 * ronde) — bewust een extra, dunne laag BINNEN de bestaande MainLayout
 * (site-header/footer blijven ongewijzigd, zie App.jsx), niet een
 * vervanging daarvan. Elke admin-subpagina staat hierdoor altijd één klik
 * bij elkaar vandaan — dit is dus ook de "← Admin Dashboard"-mogelijkheid
 * die de losse pagina's zelf niet meer apart hoeven te bouwen.
 *
 * Subpagina's van Administratie zelf (Kosten/BTW/Instellingen) staan
 * bewust NIET in deze balk — die blijven bereikbaar via kaarten op
 * /admin/administratie (zelfde "compact/overzichtelijk"-afweging als
 * Commerciële kansen, dat ook niet los in deze balk staat).
 *
 * `end` op de Dashboard-link: zonder die vlag zou NavLink "/admin" als
 * prefix ook op elke sub-pagina (/admin/planning, /admin/dossiers, ...)
 * als actief markeren.
 */
const ADMIN_NAV_ITEMS = [
  { to: ROUTES.admin, label: 'Admin Dashboard', end: true },
  { to: ROUTES.adminPlanning, label: 'Planning' },
  { to: ROUTES.adminDossiers, label: 'Klanten & dossiers' },
  { to: ROUTES.watKanWachten, label: 'Wat kan wachten' },
  { to: ROUTES.archief, label: 'Archief' },
  { to: ROUTES.adminOffertes, label: 'Offertes' },
  { to: ROUTES.adminFacturen, label: 'Facturen' },
  { to: ROUTES.adminAdministratie, label: 'Administratie' },
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
            <nav aria-label="Admin" className="flex flex-wrap gap-1">
              {ADMIN_NAV_ITEMS.map((item) => (
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
