import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Header } from '../components/layout/Header'
import { MobileNav } from '../components/layout/MobileNav'
import { Footer } from '../components/layout/Footer'
import { StickyMobileActions } from '../components/layout/StickyMobileActions'
import { ContactFab } from '../components/layout/ContactFab'
import { CookieBanner } from '../components/layout/CookieBanner'
import { NAV_ITEMS } from '../data/navigation'
import { useMediaQuery } from '../hooks/useMediaQuery'

export function MainLayout() {
  const { pathname, hash } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1440px)')

  // Derived, not synced via effect: the drawer is only ever open below the
  // header's 1440px breakpoint, so growing the viewport to desktop closes
  // it for free.
  const mobileNavOpen = menuOpen && !isDesktop

  // Jump to top on route change so navigating never leaves the scroll
  // position of the previous page — except when the URL carries a hash
  // (bijv. /pakketten#pakket-gold, zie PricingCard.jsx "Meer informatie"):
  // dan naar die sectie scrollen in plaats van naar boven. De doelpagina
  // is vaak lazy-loaded (zie App.jsx) en kan nog aan het mounten zijn
  // wanneer dit effect draait, dus een paar animation frames proberen in
  // plaats van direct op te geven bij een nog ontbrekend element.
  useEffect(() => {
    if (hash) {
      let geannuleerd = false
      let pogingen = 0
      const probeerScrollen = () => {
        if (geannuleerd) return
        const doel = document.getElementById(hash.slice(1))
        if (doel) {
          doel.scrollIntoView()
        } else if (pogingen < 30) {
          pogingen += 1
          requestAnimationFrame(probeerScrollen)
        }
      }
      probeerScrollen()
      return () => {
        geannuleerd = true
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Direct naar inhoud
      </a>

      {/*
        MobileNav is rendered as a sibling of Header, not a child of it.
        Header has backdrop-blur (backdrop-filter), which establishes a new
        CSS containing block for fixed/absolute descendants — nesting the
        full-screen MobileNav overlay inside it collapsed the overlay to
        the header's own (small) box instead of the viewport.
      */}
      <Header onMenuOpen={() => setMenuOpen(true)} />
      <MobileNav items={NAV_ITEMS} open={mobileNavOpen} onClose={() => setMenuOpen(false)} />
      <CookieBanner />

      <main id="main-content" className="flex-1 pt-16 pb-20 min-[1440px]:pt-[72px] min-[1440px]:pb-0">
        <Outlet />
      </main>

      <Footer />
      <StickyMobileActions />
      <ContactFab />
    </div>
  )
}
