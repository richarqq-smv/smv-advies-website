import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { List } from '@phosphor-icons/react'
import { ROUTES } from '../../lib/routes'
import { UitloggenKnop } from '../auth/UitloggenKnop'
import { Container } from '../ui/Container'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { ADMIN_NAV_GROEPEN } from '../../data/adminNavigation'
import { AdminMobileNav } from './AdminMobileNav'

/**
 * Admin-shell (mobiele-adminronde, 2026-09-30) — de volledige, eigen
 * omgeving voor /admin/*, met een eigen topbar/navigatie in plaats van de
 * publieke site-header/footer (zie App.jsx: dit staat sinds deze ronde
 * BUITEN <MainLayout />, niet meer erbinnen — de vorige opzet liet elke
 * admin-pagina onder de publieke Header/MobileNav/Footer/ContactFab/
 * CookieBanner renderen, wat precies is wat deze ronde oplost).
 *
 * Mobile-first: onder lg (1024px) een hamburger die AdminMobileNav opent
 * (zelfde bewezen drawer-patroon als de publieke MobileNav); vanaf lg een
 * platte horizontale balk, zelfde twee groepen/volgorde als voorheen.
 * Zelfde bestaande designtaal (kleuren/typografie/Container) als de rest
 * van de site — geen nieuw visueel merk.
 */
function navLinkClassName({ isActive }) {
  return `flex min-h-9 items-center rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
    isActive ? 'bg-primary text-white' : 'text-foreground-muted hover:bg-muted hover:text-primary'
  }`
}

export function AdminLayout() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const mobileNavOpen = menuOpen && !isDesktop

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Direct naar inhoud
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <Container className="max-w-5xl">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Menu openen"
                className="-ml-2 flex min-h-11 min-w-11 items-center justify-center rounded-md text-primary hover:bg-muted lg:hidden"
              >
                <List size={24} />
              </button>
              <NavLink to={ROUTES.admin} className="truncate font-heading text-base font-semibold text-primary">
                SMV Advies <span className="text-accent">Admin</span>
              </NavLink>
            </div>

            <nav aria-label="Admin" className="hidden items-center gap-1 lg:flex">
              {ADMIN_NAV_GROEPEN.map((groep, i) => (
                <div key={groep.label} className="flex items-center gap-1">
                  {i > 0 ? <span className="mx-1.5 h-5 w-px bg-border" aria-hidden="true" /> : null}
                  {/* Groepslabel alleen voor screenreaders — de scheidingsstreep hierboven is op desktop al genoeg visueel onderscheid, geen extra tekst nodig in de toch al compacte balk. */}
                  <span className="sr-only">{groep.label}</span>
                  {groep.items.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClassName}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>

            <UitloggenKnop className="hidden shrink-0 lg:inline-flex" />
          </div>
        </Container>
      </header>

      <AdminMobileNav open={mobileNavOpen} onClose={() => setMenuOpen(false)} />

      <main id="admin-main-content" className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
