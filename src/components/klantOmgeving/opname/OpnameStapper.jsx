import { Check } from '@phosphor-icons/react'

/**
 * Compacte stapnavigatie (UX-ronde 2026-10-01, responsiviteitsronde
 * daarna) — met 4 stappen (Basisgegevens/Onderdelen/Checklist/Afronden).
 * Een vaste `grid-cols-4` i.p.v. een horizontaal scrollende rij: de rij
 * paste op smalle schermen niet volledig in beeld en moest zelf scrollen,
 * wat precies de horizontale-scroll-ervaring is die deze ronde juist
 * overal weghaalt. Een grid met 4 gelijke kolommen past per definitie
 * altijd binnen de paginabreedte; labels mogen wrappen (geen
 * `whitespace-nowrap` meer) i.p.v. afgekapt of uit beeld te vallen.
 */
export function OpnameStapper({ stappen, huidigeIndex, voltooideIndices, onSpringNaar }) {
  return (
    <div className="sticky top-14 z-30 border-b border-border bg-white">
      <div className="grid grid-cols-4 gap-1 px-2 py-2 sm:gap-2 sm:px-3">
        {stappen.map((stap, index) => {
          const actief = index === huidigeIndex
          const voltooid = voltooideIndices.has(index)
          return (
            <button
              key={stap.key}
              type="button"
              onClick={() => onSpringNaar(index)}
              aria-current={actief ? 'step' : undefined}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-center text-[11px] leading-tight font-medium transition-colors sm:text-xs ${
                actief ? 'bg-primary text-white' : voltooid ? 'bg-accent/10 text-accent' : 'bg-muted text-foreground-muted'
              }`}
            >
              {voltooid && !actief ? <Check size={13} weight="bold" /> : <span className="text-[10px] opacity-70">{index + 1}</span>}
              <span className="break-words">{stap.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
