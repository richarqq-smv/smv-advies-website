import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowCounterClockwise, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { AdminTerugKnop } from '../components/admin/AdminTerugKnop'
import { ROUTES } from '../lib/routes'
import { adminListGearchiveerdeDossiers, herstelDossier, adminListGearchiveerdeKlanten, herstelKlant } from '../lib/klantOmgeving/api'
import { formatDatumNl } from '../lib/klantOmgeving/offerte'

/**
 * Dossier-archief (admin-feature, 2026-09-28) — toont uitsluitend
 * gearchiveerde dossiers (adminListGearchiveerdeDossiers(), het spiegelbeeld
 * van adminListDossiers() op /admin/dossiers, zie api.js). Archiveren
 * gebeurt op AdminDossiers.jsx (prullenbakknop); hier staat alleen de
 * terugweg: Herstellen. Geen tweede dossierweergave — "openen" navigeert
 * altijd naar het bestaande DossierDetail.jsx. Sinds de
 * responsiviteitsronde staat hier ook weer een eigen "Terug naar
 * dashboard"-knop (AdminTerugKnop) — de AdminLayout-topnavigatie zit op
 * mobiel achter een hamburgermenu, dus een rechtstreeks zichtbare terugweg
 * blijft nodig, ook al bestaat die bredere navigatie ernaast.
 *
 * Sinds 2026-10-01 ook gearchiveerde Klanten (0031_klant_archief.sql) —
 * archiveren gebeurt op AdminDossiers.jsx, hier staat (net als bij
 * dossiers) alleen de terugweg: Herstellen. herstelKlant() herstelt zowel
 * de klant als de dossiers die via die klant-archivering zijn
 * meegearchiveerd (gearchiveerd_via_klant) — een dossier dat los van de
 * klant was gearchiveerd staat na klant-herstel dus terecht nog gewoon in
 * de dossierlijst hieronder.
 */
export default function Archief() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [dossiers, setDossiers] = useState([])
  const [klanten, setKlanten] = useState([])

  const [herstelId, setHerstelId] = useState(null) // dossier_id in bevestigingsstap
  const [herstelBezig, setHerstelBezig] = useState(false)
  const [herstelFoutId, setHerstelFoutId] = useState(null)

  const [herstelKlantId, setHerstelKlantId] = useState(null)
  const [herstelKlantBezig, setHerstelKlantBezig] = useState(false)
  const [herstelKlantFoutId, setHerstelKlantFoutId] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    Promise.all([adminListGearchiveerdeDossiers(), adminListGearchiveerdeKlanten()])
      .then(([d, k]) => {
        if (!actief) return
        setDossiers(d)
        setKlanten(k)
      })
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

  async function bevestigKlantHerstellen(klantId) {
    setHerstelKlantBezig(true)
    setHerstelKlantFoutId(null)
    try {
      await herstelKlant(klantId)
      setKlanten((rows) => rows.filter((k) => k.klant_id !== klantId))
      // De cascade-hersteldde dossiers van deze klant horen nu weer bij de
      // actieve dossierlijst (/admin/dossiers), niet meer hier — zelfde
      // gearchiveerd_via_klant-filter als herstelKlant() zelf gebruikt.
      setDossiers((rows) => rows.filter((d) => !(d.klant_id === klantId && d.gearchiveerd_via_klant)))
      setHerstelKlantId(null)
    } catch {
      setHerstelKlantFoutId(klantId)
    } finally {
      setHerstelKlantBezig(false)
    }
  }

  return (
    <>
      <Seo title="Archief" description="Gearchiveerde klanten en adviesdossiers." noindex />
      <PageHero
        eyebrow="Beheer"
        title="Archief"
        description="Klanten en dossiers die uit het actieve overzicht zijn gehaald, maar nog volledig bewaard blijven."
      />
      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <AdminTerugKnop />
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="mb-3 text-lg text-primary">Gearchiveerde klanten ({klanten.length})</h2>
                {klanten.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
                    Er staan geen gearchiveerde klanten.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {klanten.map((k) =>
                      herstelKlantId === k.klant_id ? (
                        <li key={k.klant_id}>
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm">
                            <span className="text-primary">
                              Klant herstellen? De klant wordt weer actief, samen met de dossiers die bij het archiveren van deze klant zijn meegegaan.
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button type="button" variant="ghost" size="sm" onClick={() => bevestigKlantHerstellen(k.klant_id)} disabled={herstelKlantBezig}>
                                {herstelKlantBezig ? 'Bezig...' : 'Ja, herstellen'}
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setHerstelKlantId(null)} disabled={herstelKlantBezig}>
                                Annuleren
                              </Button>
                            </div>
                          </div>
                        </li>
                      ) : (
                        <li key={k.klant_id}>
                          <div className="flex items-stretch gap-2">
                            <div className="flex flex-1 flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm">
                              <span className="font-medium text-primary">{k.naam || k.bedrijfsnaam || 'Naamloze klant'}</span>
                              <span className="text-foreground-muted">{k.dossiers?.[0]?.count ?? 0} dossier(s)</span>
                              <span className="text-xs text-foreground-muted">Gearchiveerd op {formatDatumNl(k.gearchiveerd_op?.slice(0, 10))}</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setHerstelKlantId(k.klant_id)}
                              aria-label="Klant herstellen"
                              title="Klant herstellen"
                            >
                              <ArrowCounterClockwise size={16} /> Herstellen
                            </Button>
                          </div>
                          {herstelKlantFoutId === k.klant_id ? (
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
              </div>

              <div>
                <h2 className="mb-3 text-lg text-primary">Gearchiveerde dossiers ({dossiers.length})</h2>
                {dossiers.length === 0 ? (
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
                              <span className={d.status === 'afgerond' ? 'text-accent' : 'text-foreground-muted'}>
                                {d.status === 'afgerond' ? 'Afgerond' : 'Open'}
                              </span>
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
              </div>
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
