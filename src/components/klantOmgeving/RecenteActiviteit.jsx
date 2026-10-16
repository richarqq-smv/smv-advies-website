import { useId, useState } from 'react'
import { CaretDown, WarningCircle } from '@phosphor-icons/react'
import { formatTijdstipNl } from '../../lib/klantOmgeving/activiteitenFeed'

/**
 * Dashboard-meldingenblokje (ronde 2026-10-16): één gesorteerde lijst van
 * klantactiviteit (koppelcode verzilverd, account gekoppeld, document
 * geüpload, pand toegevoegd) en mailstatus (gelukt/mislukt) door elkaar —
 * puur presentatie, alle samenstelling/sortering zit al in
 * `activiteiten` (zie lib/klantOmgeving/activiteitenFeed.js), precies
 * zoals VandaagOverzicht.jsx dat voor zijn eigen categorieën doet.
 *
 * De lijst zelf is in-/uitklapbaar (standaard dicht, zodat het blokje geen
 * grote ruimte op het dashboard inneemt zodra er veel activiteit is) —
 * zelfde klik-/pijltje-interactie als components/ui/Accordion.jsx, maar
 * hier losstaand toegepast omdat de "Meldingen"-kop en toelichting altijd
 * zichtbaar moeten blijven (in tegenstelling tot Accordion, waar de title
 * zelf de enige altijd-zichtbare tekst is).
 */
export function RecenteActiviteit({ activiteiten }) {
  const [open, setOpen] = useState(false)
  const contentId = useId()

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Meldingen</p>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-xl text-primary">Recente activiteit</h2>
        {activiteiten.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={contentId}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            {open ? 'Inklappen' : `Tonen (${activiteiten.length})`}
            <CaretDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        ) : null}
      </div>
      <p className="mb-4 text-xs text-foreground-muted">Klantacties en mailverzending van de laatste tijd.</p>

      {activiteiten.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
          Nog geen activiteit om te tonen.
        </p>
      ) : open ? (
        <ul id={contentId} className="flex flex-col gap-1.5">
          {activiteiten.map((item) => (
            <li
              key={item.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-sm ${
                item.type === 'mail-mislukt' ? 'border-error/30 bg-error/5' : 'border-border bg-white'
              }`}
            >
              <span className={`flex items-center gap-1.5 ${item.type === 'mail-mislukt' ? 'font-medium text-error' : 'text-primary'}`}>
                {item.type === 'mail-mislukt' ? <WarningCircle size={14} weight="fill" /> : null}
                {item.tekst}
              </span>
              <span className="text-xs text-foreground-muted">{formatTijdstipNl(item.tijdstip)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
