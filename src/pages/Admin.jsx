import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { UitloggenKnop } from '../components/auth/UitloggenKnop'
import { ROUTES } from '../lib/routes'
import { adminListKlanten, adminListDossiers, adminImporteerKlant, listPandenVoorKlant, openOfHergebruikDossier } from '../lib/klantOmgeving/api'
import { loadAllKlanten, loadAllPanden, loadAllDossiers, loadAllKlantPandRelaties } from '../lib/dossier'

/**
 * Adminoverzicht — uitsluitend bereikbaar voor een echte admin (RequireAdmin
 * in App.jsx; de echte grens is RLS: elke query hieronder gebruikt
 * dezelfde SELECT's als de klantomgeving, die vanzelf alles teruggeven
 * omdat elke policy ook `is_admin()` toestaat).
 *
 * Bevat ook de eenmalige import van lokale (localStorage) demo-/testdata
 * — zie DATABASE_ARCHITECTURE.md, "Lokale-data-migratie": bewust
 * admin-only, want die klanten hebben nooit een eigen account (geen
 * account_id om aan te koppelen), en alleen een admin mag rechtstreeks
 * (buiten registreer_klant/maak_pand_en_koppel om) een Klant/Pand aanmaken.
 *
 * Een adviesdossier openen is werk van SMV (migration 0006): per klant zijn
 * hier de panden zichtbaar, met een "Dossier openen"-actie voor panden
 * zonder open dossier. Een dossier mét MJOP-momentopname opent de adviseur
 * vanuit de MJOP-tool (MjopKlantKoppeling).
 */
export default function Admin() {
  const navigate = useNavigate()
  const [laden, setLaden] = useState(true)
  const [klanten, setKlanten] = useState([])
  const [dossiers, setDossiers] = useState([])
  const [zoekterm, setZoekterm] = useState('')

  const [lokaleKlanten, setLokaleKlanten] = useState([])
  const [importBezig, setImportBezig] = useState(null) // klantId die momenteel importeert, of null
  const [importFout, setImportFout] = useState(null)
  const [geimporteerd, setGeimporteerd] = useState(new Set())

  const [uitgeklapteKlantId, setUitgeklapteKlantId] = useState(null)
  const [pandenPerKlant, setPandenPerKlant] = useState({})
  const [dossierBezig, setDossierBezig] = useState(null) // pand_id waarvoor een dossier wordt geopend
  const [dossierFout, setDossierFout] = useState(null)

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

  async function toonPanden(klantId) {
    setDossierFout(null)
    if (uitgeklapteKlantId === klantId) return setUitgeklapteKlantId(null)
    setUitgeklapteKlantId(klantId)
    if (pandenPerKlant[klantId]) return
    try {
      const lijst = await listPandenVoorKlant(klantId)
      setPandenPerKlant((v) => ({ ...v, [klantId]: lijst ?? [] }))
    } catch {
      setDossierFout('De panden van deze klant konden niet worden geladen.')
    }
  }

  async function openDossier(klantId, pand) {
    setDossierFout(null)
    setDossierBezig(pand.pand_id)
    try {
      const { dossier } = await openOfHergebruikDossier({ klantId, pandId: pand.pand_id, pand })
      navigate(ROUTES.dossier(dossier.dossier_id))
    } catch {
      setDossierFout('Het dossier kon niet worden geopend. Probeer het opnieuw.')
      setDossierBezig(null)
    }
  }

  const gefilterdeKlanten = klanten.filter((k) => {
    const q = zoekterm.trim().toLowerCase()
    if (!q) return true
    return [k.naam, k.bedrijfsnaam, k.email].some((v) => (v ?? '').toLowerCase().includes(q))
  })

  return (
    <>
      <Seo title="Beheer" description="Overzicht van klanten, panden en adviesdossiers." noindex />
      <PageHero eyebrow="Beheer" title="Klanten en dossiers" description="Overzicht van alle klanten, panden en adviesdossiers." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <div className="mb-4 flex justify-end">
            <UitloggenKnop />
          </div>
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
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-primary">{k.naam || k.bedrijfsnaam || 'Naamloze klant'}</p>
                            {k.email ? <p className="text-foreground-muted">{k.email}</p> : null}
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => toonPanden(k.klant_id)}>
                            {uitgeklapteKlantId === k.klant_id ? 'Panden verbergen' : 'Panden en dossiers'}
                          </Button>
                        </div>
                        {uitgeklapteKlantId === k.klant_id ? (
                          <div className="mt-3 border-t border-border pt-3">
                            {dossierFout ? <p role="alert" className="mb-2 text-sm font-medium text-error">{dossierFout}</p> : null}
                            {!pandenPerKlant[k.klant_id] ? (
                              <p className="text-foreground-muted">Bezig met laden...</p>
                            ) : pandenPerKlant[k.klant_id].length === 0 ? (
                              <p className="text-foreground-muted">Deze klant heeft nog geen panden.</p>
                            ) : (
                              <ul className="flex flex-col gap-2">
                                {pandenPerKlant[k.klant_id].map((pand) => {
                                  const pandDossiers = dossiers.filter((d) => d.klant_id === k.klant_id && d.pand_id === pand.pand_id)
                                  const heeftOpenDossier = pandDossiers.some((d) => d.status === 'open')
                                  return (
                                    <li key={pand.pand_id} className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="text-primary">{pand.omschrijving || pand.adres || 'Naamloos pand'}</span>
                                      <span className="flex flex-wrap items-center gap-3">
                                        {pandDossiers.map((d) => (
                                          <Link key={d.dossier_id} to={ROUTES.dossier(d.dossier_id)} className="font-medium text-accent hover:underline">
                                            Dossier {d.status === 'afgerond' ? '(afgerond)' : '(open)'}
                                          </Link>
                                        ))}
                                        {!heeftOpenDossier ? (
                                          <Button type="button" variant="outline" size="sm" onClick={() => openDossier(k.klant_id, pand)} disabled={dossierBezig === pand.pand_id}>
                                            {dossierBezig === pand.pand_id ? 'Bezig...' : 'Dossier openen'}
                                          </Button>
                                        ) : null}
                                      </span>
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h2 className="mb-3 text-lg text-primary">Dossiers ({dossiers.length})</h2>
                {dossiers.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen dossiers.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {dossiers.map((d) => (
                      <li key={d.dossier_id}>
                        <Link to={ROUTES.dossier(d.dossier_id)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm hover:border-accent hover:bg-muted">
                          <span className="font-medium text-primary">{d.klanten?.naam || d.klanten?.bedrijfsnaam || 'Onbekende klant'}</span>
                          <span className="text-foreground-muted">{d.panden?.omschrijving || d.panden?.adres || 'Onbekend pand'}</span>
                          <span className={d.status === 'afgerond' ? 'text-accent' : 'text-foreground-muted'}>{d.status === 'afgerond' ? 'Afgerond' : 'Open'}</span>
                        </Link>
                      </li>
                    ))}
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
