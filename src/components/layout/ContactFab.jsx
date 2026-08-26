import { useState } from 'react'
import { ChatCircleText, EnvelopeSimple, Phone, X } from '@phosphor-icons/react'
import { COMPANY } from '../../data/company'
import { cn } from '../../lib/cn'

const ACTIONS = [
  { label: 'Bellen', href: COMPANY.phoneHref, icon: Phone },
  { label: 'E-mail', href: `mailto:${COMPANY.email}`, icon: EnvelopeSimple },
]

/**
 * Floating expandable contact button (desktop + mobile). Kept from the
 * previous site's UX because it tested well as a low-friction contact path.
 */
export function ContactFab() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed right-4 bottom-20 z-[90] flex flex-col items-end gap-3 lg:bottom-6">
      <div
        inert={!open}
        className={cn(
          'flex flex-col items-end gap-2 transition-all duration-300 ease-default',
          open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        {ACTIONS.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="flex items-center gap-2 rounded-full border border-border bg-background/95 py-2 pr-4 pl-3 text-sm font-medium text-primary shadow-lg backdrop-blur-sm hover:bg-muted"
          >
            <action.icon size={18} weight="bold" className="text-accent" />
            {action.label}
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Contactopties sluiten' : 'Contactopties openen'}
        aria-expanded={open}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/95 text-primary shadow-lg backdrop-blur-sm transition-transform duration-200 ease-default hover:scale-105"
      >
        {open ? <X size={20} /> : <ChatCircleText size={20} weight="bold" />}
      </button>
    </div>
  )
}
