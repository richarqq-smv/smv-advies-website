import { CaretDown } from '@phosphor-icons/react'

/**
 * Generieke, compacte accordion-sectie voor de mobiele opnameflow
 * (UX-ronde, 2026-10-01) — gebruikt voor zowel de 17 onderdelen als de 6
 * checklist-fasen en elke individuele waarneming. Dichtgeklapt toont
 * alleen titel + compacte statusregel (geen grote badges, opdracht §9);
 * de body wordt pas gerenderd als `open` — dat is bewust geen CSS
 * display:none maar een echte conditional render, zodat een
 * waarnemingskaart z'n lopende autosave-timer netjes flusht bij het
 * dichtklappen (zelfde flush-op-unmount-mechanisme als bij stapnavigatie,
 * zie OpnameWaarnemingCard).
 */
export function OpnameAccordionItem({ title, subtitle, subtitleTone = 'muted', open, onToggle, children, level = 'onderdeel' }) {
  const isWaarneming = level === 'waarneming'
  return (
    <div className={isWaarneming ? 'rounded-lg border border-border bg-white' : 'rounded-xl border border-border bg-white'}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[inherit] px-4 py-2.5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-medium text-primary ${isWaarneming ? 'text-sm' : 'text-sm tracking-wide uppercase'}`}>{title}</span>
          {subtitle ? (
            <span className={`block truncate text-xs ${subtitleTone === 'accent' ? 'font-medium text-accent' : 'text-foreground-muted'}`}>{subtitle}</span>
          ) : null}
        </span>
        <CaretDown size={16} className={`shrink-0 text-foreground-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="border-t border-border p-4">{children}</div> : null}
    </div>
  )
}
