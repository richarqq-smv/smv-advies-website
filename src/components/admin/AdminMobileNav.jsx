import { NavLink } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { UitloggenKnop } from '../auth/UitloggenKnop'
import { ADMIN_BEHEER_NAV_ITEMS, ADMIN_ADMINISTRATIE_NAV_ITEMS } from '../../data/adminNavigation'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { cn } from '../../lib/cn'

/**
 * Mobiele admin-navigatiedrawer — zelfde bewezen patroon als
 * components/layout/MobileNav.jsx (overlay + slide-in paneel, body-scroll-
 * lock, `inert` voor toetsenbord/screenreader-navigatie buiten de open
 * drawer), hier met admin-eigen inhoud (geen telefoonnummer/CTA, wel een
 * uitlogknop). Grote touch targets (py-3.5, min-h-[44px]) — iOS' eigen
 * richtlijn voor minimale aanraakdoelgrootte.
 */
export function AdminMobileNav({ open, onClose }) {
  useLockBodyScroll(open)

  return (
    <div className="fixed inset-0 z-[100] lg:hidden" inert={!open}>
      <div
        className={cn('absolute inset-0 bg-primary/40 transition-opacity duration-300 ease-default', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute inset-y-0 left-0 flex w-full max-w-xs flex-col bg-background shadow-xl',
          'transition-transform duration-300 ease-default',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="font-heading text-lg text-primary">SMV Advies Admin</span>
          <button type="button" onClick={onClose} aria-label="Menu sluiten" className="-mr-2 flex min-h-11 min-w-11 items-center justify-center rounded-md text-primary hover:bg-muted">
            <X size={22} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {ADMIN_BEHEER_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn('flex min-h-11 items-center rounded-md px-3.5 py-3 text-base font-medium text-primary', isActive ? 'bg-muted text-accent' : 'hover:bg-muted')
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="my-2 border-t border-border" />

          {ADMIN_ADMINISTRATIE_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn('flex min-h-11 items-center rounded-md px-3.5 py-3 text-base font-medium text-primary', isActive ? 'bg-muted text-accent' : 'hover:bg-muted')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border px-5 py-4">
          <UitloggenKnop className="w-full" />
        </div>
      </div>
    </div>
  )
}
