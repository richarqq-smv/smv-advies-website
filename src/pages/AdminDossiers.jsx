import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DownloadSimple, Trash, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { AdminTerugKnop } from '../components/admin/AdminTerugKnop'
import { ROUTES } from '../lib/routes'
import { adminListKlanten, adminListDossiers, adminImporteerKlant, archiveerDossier } from '../lib/klantOmgeving/api'
import { magDossierArchiveren } from '../lib/klantOmgeving/dossierArchief'
import { loadAllKlanten, loadAllPanden, loadAllDossiers, loadAllKlantPandRelaties } from '../lib/dossier'
import { bouwDossiersCsv, triggerCsvDownload } from '../lib/klantOmgeving/csvExport'

/**
 * Klanten & dossiers (/admin/dossiers) — sinds de Admin-ronde (2026-09-28)
 * losgetrokken van /admin zelf, dat nu het Admin Dashboard is (zie
 * Admin.jsx). Verder ONGEWIJZIGDE inhoud/functionaliteit t.o.v. het oude
 * /admin: dezelfde klanten-/dossierslijst, dezelfde lokale-data-import,
 * dezelfde archiveerknop (dossierArchief.js). Alleen "Vandaag voor SMV"
 * (VandaagOverzicht) is verhuisd naar het nieuwe Dashboard — dat past daar
 * beter (openstaande acties, in één oogopslag, vóór je specifiek een
 * klant/dossier opzoekt).
 *
 * Uitsluitend bereikbaar voor een echte admin (RequireAdmin in App.jsx);
 * de echte grens is RLS, zoals overal in deze module.
 */
export default function AdminDossiers() {
  const [laden, setLaden] = useState(true)
  const [klanten, setKlanten] = useState([])
  const [dossiers, setDossiers] = useState([])
  const [zoekterm, setZoekterm] = useState('')

  const [lokaleKlanten, setLokaleKlanten] = useState([])
  const [importBezig, setImportBezig] = useState(null) // klantId die momenteel importeert, of null
  const [importFout, setImportFout] = useState(null)
  const [geimporteerd, setGeimporteerd] = useState(new Set())

  // Archiveren (admin-feature, 2026-09-28) — zelfde lichte inline-
  // bevestigingspatroon als OffertesHistorie.jsx se Verwijderen.
  const [archiveerId, setArchiveerId] = useState(null) // dossier_id in bevestigingsstap
  const [archiveerBezig, setArchiveerBezig] = useState(false)
  const [archiveerFoutId, setArchiveerFoutId] = useState(null)

  useEffect(() => {
    laadAlles()
    laadLokaleData()
  }, [])

  async function laadAlles() {
    setLaden(true)
    try {
      const [k, d] = await Promise.all([adminListKlanten(), adminListDossiers()])
      setKlanten(k)
      setDossiers(d)
    } finally {
      setLaden(false)
    }
  }

  function laadLokaleData() {
    try {
      const klanten = loadAllKlanten()
      const panden = loadAllPanden()
      const dossiers = loadAllDossiers()
      const relaties = loadAllKlantPandRelaties()
      const pandenById = Object.fromEntries(panden.map((p) => [p.pandId, p]))
      const lijst = klanten.map((klant) => ({
        klant,
        panden: relaties.filter((r) => r.klantId === klant.klantId).map((r) => pandenById[r.pandId]).filter(Boolean),
        dossiers: dossiers.filter((d) => d.klantId === klant.klantId),
      }))
      setLokaleKlanten(lijst)
    } catch {
      setLokaleKlanten([])
    }
  }

  async function importeer(item) {
    setImportFout(null)
    setImportBezig(item.klant.klantId)
    try {
      await adminImporteerKlant(item)
      setGeimporteerd((v) => new Set([...v, item.klant.klantId]))
      await laadAlles()
    } catch {
      setImportFout(`Importeren van "${item.klant.naam || item.klant.bedrijfsnaam}" is niet gelukt.`)
    } finally {
      setImportBezig(null)
    }
  }

  /**
   * `adminListDossiers()` geeft alleen actieve (niet-gearchiveerde)
   * dossiers terug (zie api.js) — een geslaagde archivering hoeft dus
   * alleen lokaal uit `dossiers` te worden gefilterd, geen herlaad-ronde
   * nodig. Het dossier zelf blijft intact in de database, zichtbaar op
   * Archief.jsx.
   */
  async function bevestigArchiveren(dossierId) {
    setArchiveerBezig(true)
    setArchiveerFoutId(null)
    try {
      await archiveerDossier(dossierId)
      setDossiers((rows) => rows.filter((d) => d.dossier_id !== dossierId))
      setArchiveerId(null)
    } catch {
      setArchiveerFoutId(dossierId)
    } finally {
      setArchiveerBezig(false)
    }
  }

  const gefilterdeKlanten = klanten.filter((k) => {
    const q = zoekterm.trim().toLowerCase()
    if (!q) return true
    return [k.naam, k.bedrijfsnaam, k.email].some((v) => (v ?? '').toLowerCase().includes(q))
  })

  return (
    <>
      <Seo title="Klanten & dossiers" description="Beheer klanten, panden en adviesdossiers." noindex />
      <PageHero eyebrow="Beheer" title="Klanten & dossiers" description="Beheer klanten, panden en adviesdossiers." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <AdminTerugKnop />
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : (
            <div className="flex flex-col gap-8">
              {lokaleKlanten.length > 0 ? (
                <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
                  <h2 className="text-lg text-primary">Lokale demogegevens gevonden</h2>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Deze klanten staan nog alleen lokaal in deze browser (van vóór de echte database). Importeren kopieert ze eenmalig naar de database — de
                    lokale gegevens blijven ongewijzigd staan, er wordt niets verwijderd.
                  </p>
                  {importFout ? <p role="alert" className="mt-3 text-sm font-medium text-error">{importFout}</p> : null}
                  <ul className="mt-4 flex flex-col gap-2">
                    {lokaleKlanten.map((item) => (
                      <li key={item.klant.klantId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-primary">{item.klant.naam || item.klant.bedrijfsnaam || 'Naamloze klant'}</p>
                          <p className="text-xs text-foreground-muted">
                            {item.panden.length} pand(en), {item.dossiers.length} dossier(s)
                          </p>
                        </div>
                        {geimporteerd.has(item.klant.klantId) ? (
                          <span className="text-sm font-medium text-accent">Geïmporteerd</span>
                        ) : (
                          <Button type="button" variant="outline" size="sm" onClick={() => importeer(item)} disabled={importBezig === item.klant.klantId}>
                            {importBezig === item.klant.klantId ? 'Bezig...' : 'Importeren'}
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <h2 className="mb-3 text-lg text-primary">Klanten ({klanten.length})</h2>
                <input
                  type="search"
                  placeholder="Zoek op naam, bedrijfsnaam of e-mail"
                  value={zoekterm}
                  onChange={(e) => setZoekterm(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                />
                {gefilterdeKlanten.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Geen klanten gevonden.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {gefilterdeKlanten.map((k) => (
                      <li key={k.klant_id} className="rounded-lg border border-border bg-white px-4 py-3 text-sm">
                        <p className="font-medium text-primary">{k.naam || k.bedrijfsnaam || 'Naamloze klant'}</p>
                        {/* Werkfase Fase 14: klikbaar bellen/mailen — direct bruikbaar op mobiel, geen extra stap via kopiëren. */}
                        <div className="flex flex-wrap gap-x-3 text-foreground-muted">
                          {k.email ? (
                            <a href={`mailto:${k.email}`} className="hover:text-accent hover:underline">
                              {k.email}
                            </a>
                          ) : null}
                          {k.telefoon ? (
                            <a href={`tel:${k.telefoon}`} className="hover:text-accent hover:underline">
                              {k.telefoon}
                            </a>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg text-primary">Dossiers ({dossiers.length})</h2>
                  {dossiers.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => triggerCsvDownload(bouwDossiersCsv(dossiers), 'smv-dossiers.csv')}
                    >
                      <DownloadSimple size={15} /> Exporteer CSV
                    </Button>
                  ) : null}
                </div>
                {dossiers.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen dossiers.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {dossiers.map((d) =>
                      archiveerId === d.dossier_id ? (
                        <li key={d.dossier_id}>
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm">
                            <span className="text-primary">Dossier archiveren? Het dossier wordt naar het archief verplaatst en kan later worden hersteld.</span>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button type="button" variant="ghost" size="sm" onClick={() => bevestigArchiveren(d.dossier_id)} disabled={archiveerBezig}>
                                {archiveerBezig ? 'Bezig...' : 'Ja, archiveren'}
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setArchiveerId(null)} disabled={archiveerBezig}>
                                Annuleren
                              </Button>
                            </div>
                          </div>
                        </li>
                      ) : (
                        <li key={d.dossier_id}>
                          <div className="flex items-stretch gap-2">
                            <Link
                              to={ROUTES.adminDossierDetail(d.dossier_id)}
                              className="flex flex-1 flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm hover:border-accent hover:bg-muted"
                            >
                              <span className="font-medium text-primary">{d.klanten?.naam || d.klanten?.bedrijfsnaam || 'Onbekende klant'}</span>
                              <span className="text-foreground-muted">{d.panden?.omschrijving || d.panden?.adres || 'Onbekend pand'}</span>
                              <span className={d.status === 'afgerond' ? 'text-accent' : 'text-foreground-muted'}>{d.status === 'afgerond' ? 'Afgerond' : 'Open'}</span>
                            </Link>
                            {magDossierArchiveren(d) ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setArchiveerId(d.dossier_id)}
                                aria-label="Dossier archiveren"
                                title="Dossier archiveren"
                              >
                                <Trash size={16} />
                              </Button>
                            ) : null}
                          </div>
                          {archiveerFoutId === d.dossier_id ? (
                            <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-error">
                              <WarningCircle size={13} weight="fill" />
                              Archiveren is niet gelukt. Probeer het opnieuw.
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
