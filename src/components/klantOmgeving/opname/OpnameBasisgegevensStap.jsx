import { useEffect, useRef, useState } from 'react'
import { debounce } from '../../../lib/klantOmgeving/debounce'
import { updateOpname } from '../../../lib/klantOmgeving/api'
import { useLatestRef } from '../../../hooks/useLatestRef'

const INPUT_CLASSNAME =
  'w-full max-w-full rounded-lg border border-border px-3.5 py-2.5 text-base text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:bg-muted disabled:text-foreground-muted box-border'

/**
 * Basisgegevens (Pand/klant/adres/adviseur — hergebruikt uit het dossier
 * i.p.v. opnieuw ingetypt, opdracht §20) + Datum bezoek (bewerkbaar,
 * autosave). De "Voorbereiding"-checklistfase staat sinds de UX-ronde
 * (2026-10-01) niet meer hier, maar samen met de andere 5 fasen in de
 * Checklist-stap (opdracht §8: alle 6 fasen als één consistente
 * accordion-sectie).
 */
export function OpnameBasisgegevensStap({ opname, dossier, adviseurNaam, magBewerken, onOpnameChange }) {
  const [datum, setDatum] = useState(opname.opname_datum ?? '')
  const pendingRef = useRef(null)
  const onOpnameChangeRef = useLatestRef(onOpnameChange)
  const opnameIdRef = useLatestRef(opname.opname_id)

  const [opslaan] = useState(() =>
    debounce(async () => {
      if (pendingRef.current === null) return
      const waarde = pendingRef.current
      pendingRef.current = null
      try {
        const bijgewerkt = await updateOpname(opnameIdRef.current, { opnameDatum: waarde })
        if (bijgewerkt) onOpnameChangeRef.current(bijgewerkt)
      } catch {
        // Stille terugval: het datumveld blijft gewoon staan zoals de inspecteur het invulde, geen dataverlies — bij de volgende wijziging wordt opnieuw geprobeerd.
      }
    }, 800),
  )
  useEffect(() => () => opslaan.flush(), [opslaan])

  function datumChange(waarde) {
    setDatum(waarde)
    pendingRef.current = waarde
    opslaan()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Opname</p>
        <h2 className="text-2xl text-primary">Basisgegevens</h2>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <span className="mb-1 block text-xs font-medium text-foreground-muted">Pand / klant</span>
          <p className="rounded-lg border border-border bg-muted px-3.5 py-2.5 text-base break-words text-primary">
            {dossier.klanten?.naam || dossier.klanten?.bedrijfsnaam || 'Onbekende klant'}
          </p>
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-foreground-muted">Adres</span>
          <p className="rounded-lg border border-border bg-muted px-3.5 py-2.5 text-base break-words text-primary">
            {dossier.panden?.adres || dossier.panden?.omschrijving || 'Onbekend adres'}
          </p>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-foreground-muted">Datum bezoek</span>
          <input type="date" value={datum ?? ''} disabled={!magBewerken} onChange={(e) => datumChange(e.target.value)} onBlur={() => opslaan.flush()} className={INPUT_CLASSNAME} />
        </label>
        <div>
          <span className="mb-1 block text-xs font-medium text-foreground-muted">Adviseur</span>
          <p className="rounded-lg border border-border bg-muted px-3.5 py-2.5 text-base break-words text-primary">{adviseurNaam || 'Onbekend'}</p>
        </div>
      </div>
    </div>
  )
}
