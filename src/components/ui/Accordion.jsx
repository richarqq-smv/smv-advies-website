import { useId, useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'

/**
 * Generieke in-/uitklapbare sectie (dossierpagina-compactronde) — bewust
 * geen eigen "kaart"-styling om de inhoud heen: de bestaande componenten
 * (DossierWerkruimte/BouwkundigeAnalyse/DossierHealthCheck/DossierTaken/
 * EnergieSnapshot) hebben zelf al hun kaart/kop, en worden hier ongewijzigd
 * als children doorgegeven — dit is alleen de klikbare kopregel erboven.
 * Zo blijft elke component exact hetzelfde, ook op de plekken waar hij
 * zonder Accordion wordt hergebruikt (Account.jsx/Klantgesprek.jsx).
 */
export function Accordion({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-white px-5 py-3.5 text-left shadow-sm transition-colors hover:border-accent/40"
      >
        <span className="text-base font-medium text-primary">{title}</span>
        <CaretDown size={18} className={`shrink-0 text-foreground-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div id={contentId} className="mt-3">
          {children}
        </div>
      ) : null}
    </div>
  )
}
