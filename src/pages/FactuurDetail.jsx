import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Printer, Trash, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { Button } from '../components/ui/Button'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { FactuurDocument } from '../components/admin/FactuurDocument'
import { ROUTES } from '../lib/routes'
import { getFactuur, getFactuurInstellingen, updateFactuurStatus, corrigeerFactuurBetaling, deleteFactuur, checkIsAdmin } from '../lib/klantOmgeving/api'
import { FACTUUR_TOEGESTANE_OVERGANGEN, FACTUUR_STATUS_LABELS, buildFactuurMailto } from '../lib/klantOmgeving/factuur'

// Overgangen die hier als generieke knop verschijnen — "verzonden" staat
// hier bewust NIET in: die overgang hoort uitsluitend bij de aparte
// "Factuur verzenden"-actie hieronder (opdracht sectie 9), zodat verzenden
// altijd samengaat met het daadwerkelijk versturen van de e-mail, niet met
// een losse statusknop die per ongeluk zonder verzending wordt gebruikt.
// "verzonden" als terugkeer vanuit "betaald" loopt via de aparte
// "Betaling corrigeren"-actie (corrigeerFactuurBetaling), ook niet hier.
const OVERGANG_LABEL = {
  betaald: 'Markeer als betaald',
  vervallen: 'Markeer als vervallen',
  geannuleerd: 'Annuleren',
}

const TERMINALE_STATUSSEN = new Set(['geannuleerd'])

/**
 * Factuurdetail — sinds de Administratie-ronde (2026-09-28) bereikbaar op
 * twee paden die exact hetzelfde component renderen: /admin/facturen/:id
 * (binnen AdminLayout/RequireAdmin) en, sinds de Klantomgeving-
 * detailronde, /account/facturen/:id (RequireAuth, geen RequireAdmin — de
 * eigen klant, RLS: facturen_select_klant). `isAdmin` (checkIsAdmin(),
 * zelfde patroon als DossierDetail.jsx) bepaalt welke variant dit is: de
 * admin-actiebalk (statusovergangen, verzenden, betaling corrigeren,
 * verwijderen) én de interne notitie zijn ALLEEN zichtbaar voor een admin
 * — RLS staat een klant sowieso geen enkele van die mutaties toe, dit
 * verbergt alleen bedieningselementen die voor een klant toch altijd
 * zouden falen (zelfde redenering als OffertesHistorie.jsx's magBeheren).
 *
 * De print-/PDF-weergave (FactuurDocument.jsx) is voor beide varianten
 * identiek — de actiebalk en AdminLayout's eigen navigatiebalk zijn beide
 * `print:hidden`, zodat "Afdrukken/PDF" hoe dan ook een schone factuur
 * oplevert.
 *
 * Nog geen door de gebruiker aangeleverde factuur-sjabloon beschikbaar in
 * deze repository — zie het eindrapport van deze ronde voor wat daarvoor
 * nog nodig is. FactuurDocument.jsx is bewust zo gebouwd dat een sjabloon
 * later zonder wijzigingen hier omheen kan worden geplaatst.
 */
export default function FactuurDetail() {
  const { factuurId } = useParams()
  const [laden, setLaden] = useState(true)
  const [nietGevonden, setNietGevonden] = useState(false)
  const [factuur, setFactuur] = useState(null)
  const [instellingen, setInstellingen] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [overgangBevestigStatus, setOvergangBevestigStatus] = useState(null)
  const [overgangBezig, setOvergangBezig] = useState(false)
  const [overgangFout, setOvergangFout] = useState(false)

  const [verwijderBevestig, setVerwijderBevestig] = useState(false)
  const [verwijderBezig, setVerwijderBezig] = useState(false)
  const [verwijderFout, setVerwijderFout] = useState(false)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setNietGevonden(false)
    Promise.all([getFactuur(factuurId), getFactuurInstellingen()])
      .then(([f, i]) => {
        if (!actief) return
        setFactuur(f)
        setInstellingen(i)
      })
      .catch(() => {
        if (actief) setNietGevonden(true)
      })
      .finally(() => {
        if (actief) setLaden(false)
      })
    // Losse aanroep, mag nooit de factuurweergave blokkeren — bij een fout
    // blijft isAdmin simpelweg false (veiligste kant, zie DossierDetail.jsx).
    checkIsAdmin()
      .then((admin) => actief && setIsAdmin(Boolean(admin)))
      .catch(() => {})
    return () => {
      actief = false
    }
  }, [factuurId])

  async function voerOvergangUit(nieuweStatus) {
    setOvergangBezig(true)
    setOvergangFout(false)
    try {
      const bijgewerkt = await updateFactuurStatus(factuur.factuur_id, nieuweStatus)
      setFactuur(bijgewerkt)
      setOvergangBevestigStatus(null)
    } catch {
      setOvergangFout(true)
    } finally {
      setOvergangBezig(false)
    }
  }

  async function verzendFactuur() {
    setOvergangBezig(true)
    setOvergangFout(false)
    try {
      const bijgewerkt = await updateFactuurStatus(factuur.factuur_id, 'verzonden')
      setFactuur(bijgewerkt)
      window.location.href = buildFactuurMailto(bijgewerkt, instellingen)
    } catch {
      setOvergangFout(true)
    } finally {
      setOvergangBezig(false)
    }
  }

  async function corrigeerBetaling() {
    setOvergangBezig(true)
    setOvergangFout(false)
    try {
      const bijgewerkt = await corrigeerFactuurBetaling(factuur.factuur_id)
      setFactuur(bijgewerkt)
    } catch {
      setOvergangFout(true)
    } finally {
      setOvergangBezig(false)
    }
  }

  async function bevestigVerwijderen() {
    setVerwijderBezig(true)
    setVerwijderFout(false)
    try {
      await deleteFactuur(factuur.factuur_id)
      window.location.href = ROUTES.adminFacturen
    } catch {
      setVerwijderFout(true)
      setVerwijderBezig(false)
    }
  }

  return (
    <>
      <Seo title="Factuur" description="Factuurdetail." noindex />
      <Section tone="white" noTopPadding>
        <Container className="max-w-[900px]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <Button as="link" to={isAdmin ? ROUTES.adminFacturen : ROUTES.account} variant="ghost" size="sm">
              <ArrowLeft size={16} /> Terug
            </Button>
            {factuur ? (
              <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
                <Printer size={16} /> Afdrukken / Opslaan als PDF
              </Button>
            ) : null}
          </div>

          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : nietGevonden || !factuur || !instellingen ? (
            <p className="rounded-lg border border-dashed border-border bg-white px-5 py-6 text-center text-sm text-foreground-muted">
              Deze factuur bestaat niet, of u heeft er geen toegang toe.
            </p>
          ) : (
            <>
              {isAdmin ? (
                <>
                  <div className="mb-6 flex flex-wrap items-center gap-2 print:hidden">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tracking-wide text-foreground-muted uppercase">
                      {FACTUUR_STATUS_LABELS[factuur.status] ?? factuur.status}
                    </span>

                    {factuur.status === 'concept' ? (
                      <Button type="button" variant="primary" size="sm" onClick={verzendFactuur} disabled={overgangBezig}>
                        Factuur verzenden
                      </Button>
                    ) : null}

                    {overgangBevestigStatus ? (
                      <>
                        <span className="text-xs text-foreground-muted">Dit kan niet ongedaan worden gemaakt. Weet u het zeker?</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => voerOvergangUit(overgangBevestigStatus)} disabled={overgangBezig}>
                          Ja, doorvoeren
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setOvergangBevestigStatus(null)} disabled={overgangBezig}>
                          Annuleren
                        </Button>
                      </>
                    ) : (
                      (FACTUUR_TOEGESTANE_OVERGANGEN[factuur.status] ?? [])
                        .filter((s) => s !== 'verzonden')
                        .map((nieuweStatus) => (
                          <Button
                            key={nieuweStatus}
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={overgangBezig}
                            onClick={() =>
                              TERMINALE_STATUSSEN.has(nieuweStatus) ? setOvergangBevestigStatus(nieuweStatus) : voerOvergangUit(nieuweStatus)
                            }
                          >
                            {OVERGANG_LABEL[nieuweStatus]}
                          </Button>
                        ))
                    )}

                    {factuur.status === 'betaald' ? (
                      <Button type="button" variant="ghost" size="sm" onClick={corrigeerBetaling} disabled={overgangBezig}>
                        Betaling corrigeren
                      </Button>
                    ) : null}

                    {factuur.status === 'concept' ? (
                      verwijderBevestig ? (
                        <>
                          <span className="text-xs text-foreground-muted">Weet u het zeker?</span>
                          <Button type="button" variant="ghost" size="sm" onClick={bevestigVerwijderen} disabled={verwijderBezig}>
                            Ja, verwijderen
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderBevestig(false)} disabled={verwijderBezig}>
                            Annuleren
                          </Button>
                        </>
                      ) : (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderBevestig(true)}>
                          <Trash size={15} /> Verwijderen
                        </Button>
                      )
                    ) : null}
                  </div>

                  {overgangFout ? (
                    <p role="alert" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-error print:hidden">
                      <WarningCircle size={15} weight="fill" />
                      Actie is niet gelukt. Probeer het opnieuw.
                    </p>
                  ) : null}
                  {verwijderFout ? (
                    <p role="alert" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-error print:hidden">
                      <WarningCircle size={15} weight="fill" />
                      Verwijderen is niet gelukt. Probeer het opnieuw.
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="mb-6 print:hidden">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tracking-wide text-foreground-muted uppercase">
                    {FACTUUR_STATUS_LABELS[factuur.status] ?? factuur.status}
                  </span>
                </div>
              )}

              <div className="rounded-2xl border border-border bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-12">
                <FactuurDocument factuur={factuur} instellingen={instellingen} toonNotitie={isAdmin} />
              </div>
            </>
          )}
        </Container>
      </Section>
    </>
  )
}
