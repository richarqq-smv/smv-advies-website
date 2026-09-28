import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowCounterClockwise, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../lib/routes'
import { adminListGearchiveerdeDossiers, herstelDossier } from '../lib/klantOmgeving/api'
import { formatDatumNl } from '../lib/klantOmgeving/offerte'

/**
 * Dossier-archief (admin-feature, 2026-09-28) — toont uitsluitend
 * gearchiveerde dossiers (adminListGearchiveerdeDossiers(), het spiegelbeeld
 * van adminListDossiers() op /admin, zie api.js). Archiveren gebeurt op
 * /admin zelf (prullenbakknop); hier staat alleen de terugweg: Herstellen.
 * Geen tweede dossierweergave — "openen" navigeert altijd naar het
 * bestaande DossierDetail.jsx, exact zoals /admin dat ook al doet.
 */
export default function Archief() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [dossiers, setDossiers] = useState([])

  const [herstelId, setHerstelId] = useState(null) // dossier_id in bevestigingsstap
  const [herstelBezig, setHerstelBezig] = useState(false)
  const [herstelFoutId, setHerstelFoutId] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    adminListGearchiveerdeDossiers()
      .then((rows) => actief && setDossiers(rows))
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [])

  async function bevestigHerstellen(dossierId) {
    setHerstelBezig(true)
    setHerstelFoutId(null)
    try {
      await herstelDossier(dossierId)
      setDossiers((rows) => rows.filter((d) => d.dossier_id !== dossierId))
      setHerstelId(null)
    } catch {
      setHerstelFoutId(dossierId)
    } finally {
      setHerstelBezig(false)
    }
  }

  return (
    <>
      <Seo title="Archief" description="Gearchiveerde adviesdossiers." noindex />
      <PageHero eyebrow="Beheer" title="Gearchiveerde dossiers" description="Dossiers die uit het actieve overzicht zijn gehaald, maar nog volledig bewaard blijven." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <div className="mb-4">
            <Button to={ROUTES.admin} variant="ghost" size="sm" className="-ml-3">
              Terug naar Klanten en dossiers
            </Button>
          </div>
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : dossiers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
              Er staan geen gearchiveerde dossiers.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {dossiers.map((d) =>
                herstelId === d.dossier_id ? (
                  <li key={d.dossier_id}>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm">
                      <span className="text-primary">Dossier herstellen? Het dossier wordt weer actief en verschijnt weer in het normale overzicht.</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => bevestigHerstellen(d.dossier_id)} disabled={herstelBezig}>
                          {herstelBezig ? 'Bezig...' : 'Ja, herstellen'}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setHerstelId(null)} disabled={herstelBezig}>
                          Annuleren
                        </Button>
                      </div>
                    </div>
                  </li>
                ) : (
                  <li key={d.dossier_id}>
                    <div className="flex items-stretch gap-2">
                      <Link
                        to={ROUTES.dossier(d.dossier_id)}
                        className="flex flex-1 flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm hover:border-accent hover:bg-muted"
                      >
                        <span className="font-medium text-primary">{d.klanten?.naam || d.klanten?.bedrijfsnaam || 'Onbekende klant'}</span>
                        <span className="text-foreground-muted">{d.panden?.omschrijving || d.panden?.adres || 'Onbekend pand'}</span>
                        <span className={d.status === 'afgerond' ? 'text-accent' : 'text-foreground-muted'}>{d.status === 'afgerond' ? 'Afgerond' : 'Open'}</span>
                        <span className="text-xs text-foreground-muted">Gearchiveerd op {formatDatumNl(d.gearchiveerd_op?.slice(0, 10))}</span>
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setHerstelId(d.dossier_id)}
                        aria-label="Dossier herstellen"
                        title="Dossier herstellen"
                      >
                        <ArrowCounterClockwise size={16} /> Herstellen
                      </Button>
                    </div>
                    {herstelFoutId === d.dossier_id ? (
                      <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-error">
                        <WarningCircle size={13} weight="fill" />
                        Herstellen is niet gelukt. Probeer het opnieuw.
                      </p>
                    ) : null}
                  </li>
                ),
              )}
            </ul>
          )}
        </Container>
      </Section>
    </>
  )
}
