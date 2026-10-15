import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'
import { BEDRIJFSPAND_HOTSPOTS, BEDRIJFSPAND_CATEGORIE_LABELS } from '../../data/bedrijfspandHotspots'

/**
 * Interactieve bedrijfspand-doorsnede (/werkwijze, ronde 2026-10-15).
 * De afbeelding (bedrijfspand-interactief.png) bevat zelf al 24 kleine
 * blauwe stippen — de knoppen hieronder liggen daar exact bovenop (zie
 * x/y in bedrijfspandHotspots.js, pixel-gemeten op de originele PNG) en
 * zijn groot genoeg om die onderliggende stippen volledig af te dekken,
 * zodat er geen dubbele cirkel ontstaat. Vaste CSS-pixelmaat voor de
 * zichtbare stip (niet procentueel): die blijft overal even groot,
 * alleen de positie (procenten) schaalt mee met de afbeelding.
 *
 * Desktop: vaste informatiekolom naast de afbeelding (nooit overlappend
 * met de afbeelding zelf). Mobiel: dezelfde kolom komt door de grid
 * vanzelf onder de afbeelding te staan — geen aparte mobiele layout
 * nodig.
 */
export function InteractiefBedrijfspand() {
  const [selectedId, setSelectedId] = useState(null)
  const selected = BEDRIJFSPAND_HOTSPOTS.find((hotspot) => hotspot.id === selectedId) ?? null

  function selecteer(id) {
    setSelectedId((huidig) => (huidig === id ? null : id))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="relative">
        <img
          src="/bedrijfspand-interactief.png"
          alt="Doorsnede van een bedrijfspand met kantoren, magazijn, technische installaties en buiteninfrastructuur, met klikbare punten per onderdeel"
          width="1513"
          height="1040"
          loading="lazy"
          className="w-full rounded-xl border border-border"
        />
        {BEDRIJFSPAND_HOTSPOTS.map((hotspot) => {
          const actief = selectedId === hotspot.id
          return (
            <button
              key={hotspot.id}
              type="button"
              onClick={() => selecteer(hotspot.id)}
              aria-label={hotspot.title}
              aria-pressed={actief}
              className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-5 w-5 rounded-full border-2 border-white shadow-sm transition-transform duration-200',
                  actief ? 'scale-125 bg-accent' : 'bg-primary hover:scale-110',
                )}
              />
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-border bg-white p-5 lg:sticky lg:top-24">
        {selected ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.1em] text-accent uppercase">
                  {BEDRIJFSPAND_CATEGORIE_LABELS[selected.category]}
                </p>
                <h3 className="mt-1.5 text-lg font-semibold text-primary">{selected.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Paneel sluiten"
                className="shrink-0 rounded-md p-1 text-foreground-muted hover:text-primary"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{selected.description}</p>
            {selected.link ? (
              <Link
                to={selected.link.to}
                className="mt-4 inline-block text-sm font-medium text-accent underline underline-offset-2 hover:text-secondary"
              >
                {selected.link.label}
              </Link>
            ) : null}
          </>
        ) : (
          <p className="text-sm leading-relaxed text-foreground-muted">
            Klik op een punt in de afbeelding voor uitleg over dat onderdeel van het pand.
          </p>
        )}
      </div>
    </div>
  )
}
