import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Trash, WarningCircle } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { ROUTES } from '../../lib/routes'
import { getOffertesVoorDossier, deleteOfferte, updateOfferteStatus, getFacturenVoorDossier, createFactuur, getFactuurInstellingen } from '../../lib/klantOmgeving/api'
import { euro, formatDatumNl, OFFERTE_TOEGESTANE_OVERGANGEN } from '../../lib/klantOmgeving/offerte'
import { berekenFactuurTotalen, bouwFactuurKlantSnapshot, bouwFactuurRegelsVanuitOfferte, standaardVervaldatum } from '../../lib/klantOmgeving/factuur'

// Knoptekst per mogelijke volgende status — alleen de overgangen die
// OFFERTE_TOEGESTANE_OVERGANGEN daadwerkelijk toestaat komen ooit in beeld
// (zie STATUS_ACTIES hieronder), dus deze labels hoeven geen ongeldige
// combinatie te dekken.
const OVERGANG_LABEL = {
  verstuurd: 'Markeer als verstuurd',
  geaccepteerd: 'Markeer als geaccepteerd',
  afgewezen: 'Markeer als afgewezen',
  geannuleerd: 'Annuleren',
}

// Overgangen die de offerte in een terminale status zetten (geen weg
// terug — zie bewaak_offerte_integriteit in 0005_offertes.sql) krijgen een
// expliciete bevestigingsstap, zelfde patroon als "Verwijderen" hieronder.
const TERMINALE_STATUSSEN = new Set(['geaccepteerd', 'afgewezen', 'geannuleerd'])

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
 *
 * `magBeheren` (werkfase Fase 3, default false — veiligste kant): alleen
 * waar/wanneer de aanroeper al heeft vastgesteld dat dit een admin-sessie
 * is worden de status-overgang- en verwijderknoppen getoond. Sinds
 * offertes_select_klant (0007_offertes_klant_select.sql) ziet een klant
 * deze lijst ook voor zijn eigen dossier — RLS zou een mutatiepoging toch
 * al weigeren (offertes_update_admin/offertes_delete_admin_concept vereisen
 * is_admin()), dit verbergt alleen knoppen die voor een klant toch altijd
 * zouden falen. "Bekijken" blijft voor iedereen zichtbaar.
 *
 * `klant`/`contactpersoon` (Administratie-ronde, 2026-09-28): alleen nodig
 * voor "Factuur maken" (bouwFactuurKlantSnapshot) — een klant ziet die knop
 * toch nooit (magBeheren-gate hieronder), dus deze props blijven voor een
 * klant-sessie gewoon ongebruikt in plaats van een aparte query te forceren.
 */
export function OffertesHistorie({ dossierId, refreshSignal, magBeheren = false, klant = null, contactpersoon = null }) {
  const navigate = useNavigate()
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [offertes, setOffertes] = useState([])
  const [verwijderId, setVerwijderId] = useState(null) // id in bevestigingsstap
  const [verwijderBezig, setVerwijderBezig] = useState(false)
  const [verwijderFoutId, setVerwijderFoutId] = useState(null)

  // Statusovergang (Fase 2 — offerte-lifecycle): welke offerte een
  // bevestigingsstap toont (alleen voor terminale overgangen, zie
  // TERMINALE_STATUSSEN), welke net bezig is, en een foutmelding per id —
  // zelfde lichte aanpak als de bestaande verwijder-flow hierboven.
  const [overgangBevestigId, setOvergangBevestigId] = useState(null) // `${offerteId}:${nieuweStatus}` in bevestigingsstap
  const [overgangBezigId, setOvergangBezigId] = useState(null)
  const [overgangFoutId, setOvergangFoutId] = useState(null)

  // Factuur-vanuit-offerte (Administratie-ronde, 2026-09-28): per offerte-id
  // hooguit één (de meest recente) gekoppelde factuur — een offerte kan in
  // de praktijk maar één keer gefactureerd worden, maar mocht dat ooit
  // vaker gebeuren dan toont deze lijst bewust alleen de laatste, niet om
  // de weergave te vervuilen.
  const [facturenPerOfferte, setFacturenPerOfferte] = useState({})
  const [factuurMakenBezig, setFactuurMakenBezig] = useState(null) // offerte.id
  const [factuurMakenFoutId, setFactuurMakenFoutId] = useState(null)

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

  useEffect(() => {
    if (!magBeheren) return undefined
    let actief = true
    getFacturenVoorDossier(dossierId)
      .then((rows) => {
        if (!actief) return
        const perOfferte = {}
        for (const factuur of rows) {
          if (factuur.offerte_id && !perOfferte[factuur.offerte_id]) {
            perOfferte[factuur.offerte_id] = factuur
          }
        }
        setFacturenPerOfferte(perOfferte)
      })
      .catch(() => {
        // Stil falen: de "Factuur maken"-knop blijft dan gewoon zichtbaar in
        // plaats van een tweede foutmelding naast de offertelijst te tonen.
      })
    return () => {
      actief = false
    }
  }, [dossierId, magBeheren, refreshSignal])

  /**
   * Bouwt een onafhankelijke factuur-snapshot vanuit de huidige inhoud van
   * de offerte (bouwFactuurRegelsVanuitOfferte) — de offerte zelf wordt
   * hier nooit aangepast, en een latere wijziging van de offerte raakt
   * deze factuur niet meer (zie factuur.js/0014_facturen.sql).
   */
  async function maakFactuur(offerte) {
    setFactuurMakenBezig(offerte.id)
    setFactuurMakenFoutId(null)
    try {
      const regels = bouwFactuurRegelsVanuitOfferte(offerte)
      const totalen = berekenFactuurTotalen(regels)
      const klantSnapshot = bouwFactuurKlantSnapshot({ klant, contactpersoon })
      const instellingen = await getFactuurInstellingen()
      const vervaldatum = standaardVervaldatum(new Date(), instellingen.standaard_betalingstermijn_dagen)
      const factuur = await createFactuur({
        klantId: klant?.klant_id,
        dossierId,
        offerteId: offerte.id,
        vervaldatum,
        regels,
        subtotaalExclBtw: totalen.subtotaalExclBtw,
        btwBedrag: totalen.btwBedrag,
        totaalInclBtw: totalen.totaalInclBtw,
        klantSnapshot,
      })
      navigate(ROUTES.adminFactuurDetail(factuur.factuur_id))
    } catch {
      setFactuurMakenFoutId(offerte.id)
      setFactuurMakenBezig(null)
    }
  }

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

  /**
   * Voert een statusovergang uit. De database (`bewaak_offerte_integriteit`,
   * 0005_offertes.sql) is de enige echte handhaving van welke overgangen
   * geldig zijn — deze functie stuurt alleen wat de UI al aanbiedt via
   * OFFERTE_TOEGESTANE_OVERGANGEN, maar vertrouwt daar niet blind op: een
   * afwijzing door de database komt hier gewoon als fout naar boven.
   */
  async function voerOvergangUit(offerteId, nieuweStatus) {
    setOvergangBezigId(offerteId)
    setOvergangFoutId(null)
    try {
      const bijgewerkt = await updateOfferteStatus(offerteId, nieuweStatus)
      setOffertes((rows) => rows.map((o) => (o.id === offerteId ? bijgewerkt : o)))
      setOvergangBevestigId(null)
    } catch {
      setOvergangFoutId(offerteId)
    } finally {
      setOvergangBezigId(null)
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
          {magBeheren ? 'Nog geen offertes. Gebruik "Offerte maken" hieronder om de eerste offerte voor dit dossier op te stellen.' : 'Nog geen offertes voor dit dossier.'}
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
                    {offerte.verzonden_op ? <>Verstuurd op {formatDatumNl(offerte.verzonden_op.slice(0, 10))} · </> : null}
                    Geldig tot {formatDatumNl(offerte.geldig_tot)}
                    {isVerlopen(offerte) ? <span className="ml-1.5 font-medium text-error">Verlopen</span> : null}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {magBeheren && verwijderId === offerte.id ? (
                    <>
                      <span className="text-xs text-foreground-muted">Weet u het zeker?</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => bevestigVerwijderen(offerte.id)} disabled={verwijderBezig}>
                        Ja, verwijderen
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderId(null)} disabled={verwijderBezig}>
                        Annuleren
                      </Button>
                    </>
                  ) : magBeheren && overgangBevestigId?.startsWith(`${offerte.id}:`) ? (
                    <>
                      <span className="text-xs text-foreground-muted">Dit kan niet ongedaan worden gemaakt. Weet u het zeker?</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => voerOvergangUit(offerte.id, overgangBevestigId.slice(offerte.id.length + 1))}
                        disabled={overgangBezigId === offerte.id}
                      >
                        Ja, doorvoeren
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setOvergangBevestigId(null)} disabled={overgangBezigId === offerte.id}>
                        Annuleren
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button as="link" to={ROUTES.offertePreview(dossierId, offerte.id)} variant="ghost" size="sm">
                        <FileText size={15} /> Bekijken
                      </Button>
                      {magBeheren
                        ? (OFFERTE_TOEGESTANE_OVERGANGEN[offerte.status] ?? []).map((nieuweStatus) => (
                            <Button
                              key={nieuweStatus}
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={overgangBezigId === offerte.id}
                              onClick={() =>
                                TERMINALE_STATUSSEN.has(nieuweStatus)
                                  ? setOvergangBevestigId(`${offerte.id}:${nieuweStatus}`)
                                  : voerOvergangUit(offerte.id, nieuweStatus)
                              }
                            >
                              {OVERGANG_LABEL[nieuweStatus]}
                            </Button>
                          ))
                        : null}
                      {magBeheren && offerte.status === 'concept' ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderId(offerte.id)}>
                          <Trash size={15} /> Verwijderen
                        </Button>
                      ) : null}
                      {magBeheren && facturenPerOfferte[offerte.id] ? (
                        <Button as="link" to={ROUTES.adminFactuurDetail(facturenPerOfferte[offerte.id].factuur_id)} variant="ghost" size="sm">
                          <FileText size={15} /> Factuur {facturenPerOfferte[offerte.id].factuurnummer}
                        </Button>
                      ) : magBeheren ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => maakFactuur(offerte)} disabled={factuurMakenBezig === offerte.id}>
                          <FileText size={15} /> Factuur maken
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              {magBeheren && verwijderFoutId === offerte.id ? (
                <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-error">
                  <WarningCircle size={13} weight="fill" />
                  Verwijderen is niet gelukt. Probeer het opnieuw.
                </p>
              ) : null}
              {magBeheren && overgangFoutId === offerte.id ? (
                <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-error">
                  <WarningCircle size={13} weight="fill" />
                  Statuswijziging is niet gelukt. Probeer het opnieuw.
                </p>
              ) : null}
              {magBeheren && factuurMakenFoutId === offerte.id ? (
                <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-error">
                  <WarningCircle size={13} weight="fill" />
                  Factuur aanmaken is niet gelukt. Probeer het opnieuw.
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
