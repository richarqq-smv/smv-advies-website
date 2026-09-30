import { useState } from 'react'
import { FileArrowDown, DownloadSimple, WarningCircle } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { genereerAdviesrapportDocx, downloadAdviesrapportBlob, bouwAdviesrapportBestandsnaam } from '../../lib/klantOmgeving/adviesrapportDocx'
import { PAKKET_RAPPORT_LABELS } from '../../lib/klantOmgeving/adviesrapport'
import { listDossierTaken } from '../../lib/klantOmgeving/api'

const PAKKET_KNOPPEN = [
  { id: 'basis', label: 'QuickScan-rapport' },
  { id: 'premium', label: 'Premium-rapport' },
  { id: 'gold', label: 'Gold-rapport' },
]

/**
 * Vult één van de drie bestaande klanttemplates (Basis/Premium/Gold) met
 * de dossiergegevens en definitieve adviespunten van dit dossier, en toont
 * daarna een controlescherm mét de gegenereerde blob, vóórdat de daadwerkelijke
 * download start (randvoorwaarde 14 — reproduceerbaar en controleerbaar; de
 * adviseur ziet altijd eerst wat nog ontbreekt, in plaats van een blind
 * gegenereerd document te versturen).
 *
 * Admin-only: het pakket is een expliciete keuze van de adviseur (geen
 * automatische afleiding uit dossier_commerciele_kansen.vervolgstap of
 * elders — zie randvoorwaarde 13), en alleen de adviseur stelt het
 * definitieve advies samen dat hierin verschijnt (adviespunten, nooit
 * automatische signalen).
 */
export function AdviesrapportGenerator({ dossier, adviespunten }) {
  const [adviseurNaam, setAdviseurNaam] = useState('')
  const [bezigMet, setBezigMet] = useState(null)
  const [fout, setFout] = useState(null)
  const [resultaat, setResultaat] = useState(null)

  // Productworkflow-ronde (0025_dossiers_pakket_id.sql): zodra het dossier
  // een bekend pakket heeft, is dat de bron van waarheid — de adviseur
  // hoeft niet opnieuw te kiezen. "Nog te bepalen" (pakket_id null) valt
  // terug op de oorspronkelijke 3 losse knoppen.
  const knoppen = dossier.pakket_id ? PAKKET_KNOPPEN.filter((p) => p.id === dossier.pakket_id) : PAKKET_KNOPPEN

  async function genereer(pakketId) {
    setFout(null)
    setResultaat(null)
    setBezigMet(pakketId)
    try {
      // Subsidiebegeleidingsplan (Gold) komt uit dossier_taken — alleen
      // opgehaald wanneer relevant, geen onnodige aanroep voor Basis/Premium.
      const subsidieTaken = pakketId === 'gold' ? (await listDossierTaken(dossier.dossier_id)).filter((t) => t.categorie === 'subsidie') : []
      const data = await genereerAdviesrapportDocx({ dossier, adviespunten, pakketId, adviseurNaam: adviseurNaam.trim() || null, subsidieTaken })
      setResultaat({ ...data, pakketId })
    } catch {
      setFout('Het genereren van het rapport is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezigMet(null)
    }
  }

  function downloaden() {
    if (!resultaat) return
    downloadAdviesrapportBlob(resultaat.blob, bouwAdviesrapportBestandsnaam({ dossier, pakketId: resultaat.pakketId }))
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Adviesrapport</p>
      <h3 className="mb-2 text-xl text-primary">Rapport genereren</h3>
      <p className="mb-4 text-sm text-foreground-muted">
        Vult de klantnaam, het pandadres, de samenvatting en de maatregelentabel automatisch in één van de bestaande SMV-sjablonen — op basis van het
        vastgelegde advies in dit dossier. Overige onderdelen van het sjabloon (zoals de bouwkundige analyse of offertevergelijking) blijven staan zoals in
        het sjabloon, voor handmatige aanvulling.
      </p>

      <div className="mb-4 max-w-xs">
        <label htmlFor="adviesrapport-adviseur" className="mb-1 block text-xs font-medium text-foreground-muted">
          Naam adviseur (op het rapport)
        </label>
        <input
          id="adviesrapport-adviseur"
          type="text"
          value={adviseurNaam}
          onChange={(e) => setAdviseurNaam(e.target.value)}
          placeholder="Bijv. Richard Schipper"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {knoppen.map((p) => (
          <Button key={p.id} type="button" variant="outline" size="sm" onClick={() => genereer(p.id)} disabled={bezigMet !== null}>
            <FileArrowDown size={15} />
            {bezigMet === p.id ? 'Bezig...' : `${p.label} (.docx)`}
          </Button>
        ))}
      </div>

      {fout ? (
        <p role="alert" className="mt-3 text-sm font-medium text-error">
          {fout}
        </p>
      ) : null}

      {resultaat ? (
        <div className="mt-5 rounded-lg border border-border bg-muted p-4">
          <p className="text-sm font-semibold text-primary">{PAKKET_RAPPORT_LABELS[resultaat.pakketId]} is klaar om te downloaden</p>

          {resultaat.ontbrekendeVelden.length > 0 ? (
            <div className="mt-3 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <WarningCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Nog aan te vullen vóór verzending naar de klant:</p>
                <ul className="mt-1 list-inside list-disc">
                  {resultaat.ontbrekendeVelden.map((veld) => (
                    <li key={veld}>{veld}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {resultaat.waarschuwingen.length > 0 ? (
            <div className="mt-3 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <WarningCircle size={16} className="mt-0.5 shrink-0" />
              <ul className="list-inside list-disc">
                {resultaat.waarschuwingen.map((tekst) => (
                  <li key={tekst}>{tekst}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button type="button" variant="primary" size="sm" onClick={downloaden} className="mt-3">
            <DownloadSimple size={15} /> Downloaden (.docx)
          </Button>
        </div>
      ) : null}
    </div>
  )
}
