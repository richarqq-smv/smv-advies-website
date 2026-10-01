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
        Breakpoint is een eigen 1440px-grens, niet xl (1280px): logo + 9
        nav-items + telefoonnummer + Contact-knop hebben op één regel
        gemeten ~1311px nodig (zie git-geschiedenis) — dat past nooit
        binnen de gedeelde <Container>, die voor leesbare body-copy
        bewust op max-w-[1200px] staat (1136px content-breedte). Deze
        balk krijgt daarom zijn eigen, bredere max-breedte (1440px, geeft
        1376px content-breedte — ruim 60px marge), en het omslagpunt naar
        de volledige desktopbalk ligt op exact het punt waar die breedte
        ook daadwerkelijk beschikbaar is. MainLayout's isDesktop-check,
        MobileNav en StickyMobileActions switchen op dezelfde grens, zodat
        de hamburgermenu (met dezelfde volledige nav + CTA + telefoon) de
        tussenliggende breedtes consistent blijft afdekken.
      */}
      <Container className="flex h-16 max-w-[1440px] items-center justify-between min-[1440px]:h-[72px]">
        <NavLink to={ROUTES.home} aria-label="SMV Advies, terug naar home">
          <img
            src="/logo-header.png"
            alt="SMV Advies"
            width="199"
            height="112"
            className="h-11 w-auto min-[1440px]:h-12"
          />
        </NavLink>

        <nav className="hidden items-center gap-1 min-[1440px]:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3.5 py-2 text-[0.95rem] font-medium whitespace-nowrap transition-colors duration-200 ease-default',
                  isActive ? 'text-accent' : 'text-primary hover:text-secondary',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 min-[1440px]:flex">
          <a
            href={COMPANY.phoneHref}
            className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-primary hover:text-secondary"
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
          className="rounded-md p-2 text-primary hover:bg-muted min-[1440px]:hidden"
        >
          <List size={24} />
        </button>
      </Container>
    </header>
  )
}
