import { WarningCircle } from '@phosphor-icons/react'
import { formatTijdstipNl } from '../../lib/klantOmgeving/activiteitenFeed'

/**
 * Dashboard-meldingenblokje (ronde 2026-10-16): één gesorteerde lijst van
 * klantactiviteit (koppelcode verzilverd, account gekoppeld, document
 * geüpload, pand toegevoegd) en mailstatus (gelukt/mislukt) door elkaar —
 * puur presentatie, alle samenstelling/sortering zit al in
 * `activiteiten` (zie lib/klantOmgeving/activiteitenFeed.js), precies
 * zoals VandaagOverzicht.jsx dat voor zijn eigen categorieën doet.
 */
export function RecenteActiviteit({ activiteiten }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Meldingen</p>
      <h2 className="mb-1 text-xl text-primary">Recente activiteit</h2>
      <p className="mb-4 text-xs text-foreground-muted">Klantacties en mailverzending van de laatste tijd.</p>

      {activiteiten.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
          Nog geen activiteit om te tonen.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
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
      )}
    </div>
  )
}
