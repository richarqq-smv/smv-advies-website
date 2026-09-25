import { useEffect, useState } from 'react'
import { FileText, Trash, WarningCircle } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { ROUTES } from '../../lib/routes'
import { getOffertesVoorDossier, deleteOfferte } from '../../lib/klantOmgeving/api'
import { euro, formatDatumNl } from '../../lib/klantOmgeving/offerte'

const STATUS_LABELS = {
  concept: 'Concept',
  verstuurd: 'Verstuurd',
  geaccepteerd: 'Geaccepteerd',
  afgewezen: 'Afgewezen',
  geannuleerd: 'Geannuleerd',
}

// Uitsluitend visuele indeling binnen de bestaande kleurtokens (geen
// nieuwe kleuren) — geen aparte "verlopen"-status, zie OfferteStatusBadge.
const STATUS_CLASSES = {
  concept: 'bg-muted text-foreground-muted',
  verstuurd: 'bg-accent/10 text-accent',
  geaccepteerd: 'bg-primary/10 text-primary',
  afgewezen: 'bg-error-bg text-error',
  geannuleerd: 'border border-dashed border-border text-foreground-muted',
}

function OfferteStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${STATUS_CLASSES[status] ?? STATUS_CLASSES.concept}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function isVerlopen(offerte) {
  // Alleen relevant zolang de offerte nog geen eindstatus heeft — puur een
  // UI-signalering op basis van `geldig_tot`, wijzigt nooit `status` zelf
  // (geen nieuwe "verlopen"-status, zie bouwprompt).
  return (offerte.status === 'concept' || offerte.status === 'verstuurd') && offerte.geldig_tot < new Date().toISOString().slice(0, 10)
}

/**
 * Offertehistorie van een Dossier (Fase 4) — een aanvullende leeslaag
 * bovenop de bestaande `offertes`-tabel en de Fase 3 preview. Bouwt geen
 * tweede offerteweergave: "openen" navigeert altijd naar de bestaande
 * OffertePreview (ROUTES.offertePreview), en een concept openen is hier
 * altijd de preview bekijken — nooit de oorspronkelijke OfferteEditor
 * opnieuw invullen (een opgeslagen offerte is een snapshot, geen
 * bewerkbaar formulier).
 *
 * `refreshSignal` (van DossierDetail, opgehoogd door OfferteEditor na een
 * geslaagde opslag) laat deze lijst herladen zodra een nieuwe offerte is
 * aangemaakt, zonder dat de twee componenten elkaars interne state kennen.
 */
export function OffertesHistorie({ dossierId, refreshSignal }) {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [offertes, setOffertes] = useState([])
  const [verwijderId, setVerwijderId] = useState(null) // id in bevestigingsstap
  const [verwijderBezig, setVerwijderBezig] = useState(false)
  const [verwijderFoutId, setVerwijderFoutId] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    getOffertesVoorDossier(dossierId)
      .then((rows) => {
        if (actief) setOffertes(rows)
      })
      .catch(() => {
        if (actief) setFout('Offertes laden is niet gelukt. Probeer het opnieuw.')
      })
      .finally(() => {
        if (actief) setLaden(false)
      })
    return () => {
      actief = false
    }
  }, [dossierId, refreshSignal])

  async function bevestigVerwijderen(offerteId) {
    setVerwijderBezig(true)
    setVerwijderFoutId(null)
    try {
      await deleteOfferte(offerteId)
      setOffertes((rows) => rows.filter((o) => o.id !== offerteId))
      setVerwijderId(null)
    } catch {
      setVerwijderFoutId(offerteId)
    } finally {
      setVerwijderBezig(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Offertes</p>
      <h3 className="mb-4 text-xl text-primary">Offertehistorie</h3>

      {laden ? (
        <p className="text-sm text-foreground-muted">Bezig met laden...</p>
      ) : fout ? (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
          <WarningCircle size={15} weight="fill" />
          {fout}
        </p>
      ) : offertes.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          Nog geen offertes. Gebruik "Offerte maken" hieronder om de eerste offerte voor dit dossier op te stellen.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {offertes.map((offerte) => (
            <div key={offerte.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-primary">{offerte.offerte_nummer}</p>
                  <p className="text-xs text-foreground-muted">
                    {formatDatumNl(offerte.offerte_datum)} · {offerte.snapshot?.pakket?.naam}
                  </p>
                </div>
                <OfferteStatusBadge status={offerte.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-lg font-medium text-primary">{euro(offerte.totaal)}</p>
                  <p className="text-xs text-foreground-muted">
                    Geldig tot {formatDatumNl(offerte.geldig_tot)}
                    {isVerlopen(offerte) ? <span className="ml-1.5 font-medium text-error">Verlopen</span> : null}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {verwijderId === offerte.id ? (
                    <>
                      <span className="text-xs text-foreground-muted">Weet u het zeker?</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => bevestigVerwijderen(offerte.id)} disabled={verwijderBezig}>
                        Ja, verwijderen
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderId(null)} disabled={verwijderBezig}>
                        Annuleren
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button as="link" to={ROUTES.offertePreview(dossierId, offerte.id)} variant="ghost" size="sm">
                        <FileText size={15} /> Bekijken
                      </Button>
                      {offerte.status === 'concept' ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderId(offerte.id)}>
                          <Trash size={15} /> Verwijderen
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              {verwijderFoutId === offerte.id ? (
                <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-error">
                  <WarningCircle size={13} weight="fill" />
                  Verwijderen is niet gelukt. Probeer het opnieuw.
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
