import { NavLink } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { COMPANY } from '../../data/company'
import { ROUTES } from '../../lib/routes'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { cn } from '../../lib/cn'

export function MobileNav({ items, open, onClose }) {
  useLockBodyScroll(open)

  return (
    <div className="fixed inset-0 z-[100] lg:hidden" inert={!open}>
      <div
        className={cn(
          'absolute inset-0 bg-primary/40 transition-opacity duration-300 ease-default',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background shadow-xl',
          'transition-transform duration-300 ease-default',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="font-heading text-lg text-primary">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Menu sluiten"
            className="rounded-md p-2 text-primary hover:bg-muted"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-3 text-base font-medium text-primary',
                  isActive ? 'bg-muted text-accent' : 'hover:bg-muted',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border px-5 py-5">
          <Button to={ROUTES.energieIndicatie} onClick={onClose} className="w-full">
            Gratis energie-indicatie
          </Button>
          <a href={COMPANY.phoneHref} className="mt-3 block text-center text-sm text-foreground-muted">
            {COMPANY.phone}
          </a>
        </div>
      </div>
    </div>
  )
}
