import { NavLink } from 'react-router-dom'
import { List, Phone } from '@phosphor-icons/react'
import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { NAV_ITEMS } from '../../data/navigation'
import { COMPANY } from '../../data/company'
import { ROUTES } from '../../lib/routes'
import { cn } from '../../lib/cn'

export function Header({ onMenuOpen }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      {/*
        Breakpoint is xl (1280px), not lg (1024px): logo + 9 nav items +
        phone number + Contact button don't comfortably fit at 1024px —
        the phone number used to wrap onto 4 separate lines there. Rather
        than compress the phone number specifically, the whole desktop
        layout now only renders where it actually fits; MainLayout's
        isDesktop check, MobileNav and StickyMobileActions all switch at
        this same xl threshold so the hamburger menu (which already
        includes full nav + CTA + phone) covers the gap consistently.
      */}
      <Container className="flex h-16 items-center justify-between xl:h-[72px]">
        <NavLink to={ROUTES.home} aria-label="SMV Advies, terug naar home">
          <img
            src="/logo-header.png"
            alt="SMV Advies"
            width="199"
            height="112"
            className="h-11 w-auto xl:h-12"
          />
        </NavLink>

        <nav className="hidden items-center gap-1 xl:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3.5 py-2 text-[0.95rem] font-medium transition-colors duration-200 ease-default',
                  isActive ? 'text-accent' : 'text-primary hover:text-secondary',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 xl:flex">
          <a
            href={COMPANY.phoneHref}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-secondary"
          >
            <Phone size={16} weight="bold" />
            {COMPANY.phone}
          </a>
          <Button to={ROUTES.contact} size="sm">
            Contact
          </Button>
        </div>

        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Menu openen"
          className="rounded-md p-2 text-primary hover:bg-muted xl:hidden"
        >
          <List size={24} />
        </button>
      </Container>
    </header>
  )
}
