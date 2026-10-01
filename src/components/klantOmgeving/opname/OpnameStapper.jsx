import { Check } from '@phosphor-icons/react'

/**
 * Compacte stapnavigatie (UX-ronde, 2026-10-01) — met nog maar 4 stappen
 * (Basisgegevens/Onderdelen/Checklist/Afronden, sinds de 17 onderdelen en
 * 6 checklist-fasen zelf accordions zijn geworden) past een simpele rij
 * tabs beter en kost minder schermhoogte dan de vorige uitklapbare
 * stappenlijst (opdracht §7: "de bovenste voortgangsbalk mag niet te veel
 * ruimte innemen"). De rij scrollt zelf horizontaal (`overflow-x-auto`)
 * als de labels een keer niet allemaal passen — dat scrollt alleen deze
 * rij, nooit de hele pagina (opdracht §5).
 */
export function OpnameStapper({ stappen, huidigeIndex, voltooideIndices, onSpringNaar }) {
  return (
    <div className="sticky top-14 z-30 border-b border-border bg-white">
      <div className="flex gap-1.5 overflow-x-auto px-3 py-2">
        {stappen.map((stap, index) => {
          const actief = index === huidigeIndex
          const voltooid = voltooideIndices.has(index)
          return (
            <button
              key={stap.key}
              type="button"
              onClick={() => onSpringNaar(index)}
              aria-current={actief ? 'step' : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                actief ? 'bg-primary text-white' : voltooid ? 'bg-accent/10 text-accent' : 'bg-muted text-foreground-muted'
              }`}
            >
              {voltooid && !actief ? <Check size={13} weight="bold" /> : null}
              {stap.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
