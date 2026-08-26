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
      <Container className="flex h-16 items-center justify-between lg:h-[72px]">
        <NavLink to={ROUTES.home} aria-label="SMV Advies, terug naar home">
          <img src="/logo.png" alt="SMV Advies" className="h-11 w-auto lg:h-12" />
        </NavLink>

        <nav className="hidden items-center gap-1 lg:flex">
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

        <div className="hidden items-center gap-4 lg:flex">
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
          className="rounded-md p-2 text-primary hover:bg-muted lg:hidden"
        >
          <List size={24} />
        </button>
      </Container>
    </header>
  )
}
