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
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Derived, not synced via effect: the drawer is only ever open below the
  // lg breakpoint, so growing the viewport to desktop closes it for free.
  const mobileNavOpen = menuOpen && !isDesktop

  // Jump to top on route change so navigating never leaves the scroll
  // position of the previous page.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

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

      <main id="main-content" className="flex-1 pt-16 pb-20 lg:pt-[72px] lg:pb-0">
        <Outlet />
      </main>

      <Footer />
      <StickyMobileActions />
      <ContactFab />
    </div>
  )
}
