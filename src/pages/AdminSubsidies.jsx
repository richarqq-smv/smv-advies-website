import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowSquareOut, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { AdminTerugKnop } from '../components/admin/AdminTerugKnop'
import { ROUTES } from '../lib/routes'
import {
  adminListRvoSubsidieIndex,
  adminGetRvoSyncStatus,
  listSubsidieDeadlines,
  createSubsidieDeadline,
  deactiveerSubsidieDeadline,
  adminListAlleDossierSubsidies,
  verstuurSubsidieDeadlineMelding,
} from '../lib/klantOmgeving/api'
import { bouwGeraakteDossiers, controleIsVerouderd, laatsteControleDatum } from '../lib/klantOmgeving/subsidieDeadlineMatching'
import { formatDatumNl } from '../lib/klantOmgeving/offerte'

const REGELINGEN = ['EIA', 'MIA', 'Vamil', 'ISDE']
const LEEG_FORMULIER = { regeling: 'EIA', deadlineDatum: '', budgetStatus: '', bronNotitie: '' }

const RVO_BASIS_URL = 'https://www.rvo.nl'

function formatSyncDatum(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * RVO-subsidie-naslag (/admin/subsidies, onderzoeksronde 2026-10-07) —
 * puur-lezende weergave van rvo_subsidie_index, een maandelijks (1e van
 * de maand, 03:00 UTC) automatisch gesynchroniseerde referentielijst
 * van actuele RVO-subsidie/financieringspagina's. Bron:
 * rvo.nl/api/v1/opendata/subsidies — exact de brondata achter RVO's
 * eigen "Subsidie- en financieringswijzer".
 *
 * Bewust GEEN percentages/bedragen (die staan niet in de brondata, zie
 * de syncstatusmelding hieronder) — dit is een doorzoekbare vindplaats
 * met directe link naar de officiële RVO-pagina, geen rekentool.
 *
 * De syncstatus (laatste rij uit rvo_sync_log) staat altijd bovenaan
 * zichtbaar — ook bij een mislukte sync, zodat nooit stil voorbijgaat
 * dat de lijst mogelijk verouderd is. Een mislukte sync raakt de lijst
 * zelf nooit aan (zie rvo_sync_vervang_index in de migratie): de laatst
 * bekende goede data blijft gewoon zichtbaar.
 */
export default function AdminSubsidies() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [items, setItems] = useState([])
  const [syncStatus, setSyncStatus] = useState(null)
  const [zoekterm, setZoekterm] = useState('')

  // Fase 7 (#7, projectplan "Klantwaarde-uitbreidingen") — los van de
  // RVO-referentielijst hierboven, zie subsidieDeadlineMatching.js.
  const [deadlines, setDeadlines] = useState([])
  const [dossierSubsidies, setDossierSubsidies] = useState([])
  const [formulierOpen, setFormulierOpen] = useState(false)
  const [formulier, setFormulier] = useState(LEEG_FORMULIER)
  const [opslaanBezig, setOpslaanBezig] = useState(false)
  const [opslaanFout, setOpslaanFout] = useState(null)
  const [uitzettenBezig, setUitzettenBezig] = useState(null) // id van de deadline die wordt uitgezet
  const [verzendBezig, setVerzendBezig] = useState(null) // "<deadlineId>:<dossierId>" van de melding die wordt verstuurd
  const [verzendStatus, setVerzendStatus] = useState({}) // { "<deadlineId>:<dossierId>": 'verzonden' | 'fout' }

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    Promise.all([adminListRvoSubsidieIndex(), adminGetRvoSyncStatus(), listSubsidieDeadlines(), adminListAlleDossierSubsidies()])
      .then(([rows, status, deadlineRows, dossierSubsidieRows]) => {
        if (!actief) return
        setItems(rows)
        setSyncStatus(status)
        setDeadlines(deadlineRows)
        setDossierSubsidies(dossierSubsidieRows)
      })
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [])

  async function deadlineOpslaan(e) {
    e.preventDefault()
    setOpslaanFout(null)
    if (!formulier.bronNotitie.trim()) {
      setOpslaanFout('Vul een bron/toelichting in — zonder bron wordt een deadline nooit vastgelegd.')
      return
    }
    if (!formulier.deadlineDatum && !formulier.budgetStatus.trim()) {
      setOpslaanFout('Vul minimaal een deadline of een budgetstatus in.')
      return
    }
    setOpslaanBezig(true)
    try {
      const nieuw = await createSubsidieDeadline({
        regeling: formulier.regeling,
        deadlineDatum: formulier.deadlineDatum || null,
        budgetStatus: formulier.budgetStatus.trim() || null,
        bronNotitie: formulier.bronNotitie.trim(),
      })
      setDeadlines((v) => [nieuw, ...v])
      setFormulier(LEEG_FORMULIER)
      setFormulierOpen(false)
    } catch {
      setOpslaanFout('Opslaan is niet gelukt. Probeer het opnieuw.')
    } finally {
      setOpslaanBezig(false)
    }
  }

  async function deadlineUitzetten(id) {
    setUitzettenBezig(id)
    try {
      const bijgewerkt = await deactiveerSubsidieDeadline(id)
      setDeadlines((v) => v.map((d) => (d.id === id ? bijgewerkt : d)))
    } catch {
      // Geen aparte foutmelding-state hier — de rij blijft gewoon actief zichtbaar, de admin kan het opnieuw proberen.
    } finally {
      setUitzettenBezig(null)
    }
  }

  async function meldingVersturen(deadline, geraaktDossier) {
    const sleutel = `${deadline.id}:${geraaktDossier.dossier_id}`
    setVerzendBezig(sleutel)
    try {
      await verstuurSubsidieDeadlineMelding({
        dossierId: geraaktDossier.dossier_id,
        regeling: deadline.regeling,
        deadlineDatum: deadline.deadline_datum,
        budgetStatus: deadline.budget_status,
      })
      setVerzendStatus((v) => ({ ...v, [sleutel]: 'verzonden' }))
    } catch {
      setVerzendStatus((v) => ({ ...v, [sleutel]: 'fout' }))
    } finally {
      setVerzendBezig(null)
    }
  }

  const gefilterdeItems = items.filter((item) => {
    const q = zoekterm.trim().toLowerCase()
    if (!q) return true
    const velden = [item.titel, item.intro, ...(item.sectoren ?? []), ...(item.doelgroepen ?? []), ...(item.tags ?? [])]
    return velden.some((v) => (v ?? '').toString().toLowerCase().includes(q))
  })

  return (
    <>
      <Seo title="Subsidies" description="Referentielijst van actuele RVO-subsidie- en financieringspagina's." noindex />
      <PageHero
        eyebrow="Beheer"
        title="Subsidies"
        description="Maandelijks gesynchroniseerde referentielijst van actuele RVO-subsidiepagina's — vindplaats en link naar de officiële regeling, geen percentages of bedragen (die staan alleen op de RVO-pagina zelf)."
      />
      <Section tone="white" noTopPadding>
        <Container wide>
          <AdminTerugKnop />

          {/*
            Fase 7 (#7, projectplan "Klantwaarde-uitbreidingen"): subsidie-
            deadline-signalering. Volledig los van de RVO-referentielijst
            hieronder — elke rij hier is een door jou bevestigd feit (zie
            0056_subsidie_deadlines.sql), nooit automatisch ingevuld.
          */}
          {!laden ? (
            <div className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg text-primary">Subsidie-deadlines &amp; budgetstatus</h2>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Bevestigde deadlines/budgetstatus per regeling — alleen wat u hier zelf vastlegt, nooit automatisch ingevuld.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setFormulierOpen((v) => !v)}>
                  {formulierOpen ? 'Annuleren' : 'Deadline toevoegen'}
                </Button>
              </div>

              {controleIsVerouderd(laatsteControleDatum(deadlines)) ? (
                <p className="mb-4 flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-primary">
                  <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" />
                  {laatsteControleDatum(deadlines)
                    ? `Voor het laatst gecontroleerd op ${formatDatumNl(laatsteControleDatum(deadlines)?.slice(0, 10))} — tijd voor een nieuwe controle van ISDE/EIA/MIA/Vamil.`
                    : 'Nog nooit gecontroleerd — tijd voor een eerste controle van ISDE/EIA/MIA/Vamil.'}
                </p>
              ) : null}

              {formulierOpen ? (
                <form onSubmit={deadlineOpslaan} className="mb-5 flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="deadline-regeling" className="mb-2 block text-sm font-medium text-primary">
                        Regeling
                      </label>
                      <select
                        id="deadline-regeling"
                        value={formulier.regeling}
                        onChange={(e) => setFormulier((v) => ({ ...v, regeling: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-white px-3.5 py-3 text-base text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                      >
                        {REGELINGEN.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="deadline-datum" className="mb-2 block text-sm font-medium text-primary">
                        Deadline (optioneel)
                      </label>
                      <input
                        id="deadline-datum"
                        type="date"
                        value={formulier.deadlineDatum}
                        onChange={(e) => setFormulier((v) => ({ ...v, deadlineDatum: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-white px-3.5 py-3 text-base text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="deadline-budget" className="mb-2 block text-sm font-medium text-primary">
                      Budgetstatus (optioneel)
                    </label>
                    <input
                      id="deadline-budget"
                      type="text"
                      placeholder="Bijv. Budget 2026 nog beschikbaar"
                      value={formulier.budgetStatus}
                      onChange={(e) => setFormulier((v) => ({ ...v, budgetStatus: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-white px-3.5 py-3 text-base text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="deadline-bron" className="mb-2 block text-sm font-medium text-primary">
                      Bron / toelichting <span className="text-accent">*</span>
                    </label>
                    <input
                      id="deadline-bron"
                      type="text"
                      required
                      placeholder="Bijv. rvo.nl, gecontroleerd op 19-10-2026"
                      value={formulier.bronNotitie}
                      onChange={(e) => setFormulier((v) => ({ ...v, bronNotitie: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-white px-3.5 py-3 text-base text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                    />
                  </div>
                  {opslaanFout ? (
                    <p role="alert" className="text-sm font-medium text-error">
                      {opslaanFout}
                    </p>
                  ) : null}
                  <div>
                    <Button type="submit" size="sm" disabled={opslaanBezig}>
                      {opslaanBezig ? 'Bezig...' : 'Deadline bevestigen en vastleggen'}
                    </Button>
                  </div>
                </form>
              ) : null}

              {deadlines.filter((d) => d.actief).length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
                  Nog geen bevestigde deadlines/budgetstatus vastgelegd.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {deadlines
                    .filter((d) => d.actief)
                    .map((deadline) => {
                      const geraakteDossiers = bouwGeraakteDossiers(deadline, dossierSubsidies)
                      return (
                        <li key={deadline.id} className="rounded-lg border border-border bg-white p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-primary">{deadline.regeling}</p>
                              {deadline.deadline_datum ? (
                                <p className="mt-0.5 text-sm text-foreground-muted">Deadline: {formatDatumNl(deadline.deadline_datum)}</p>
                              ) : null}
                              {deadline.budget_status ? <p className="mt-0.5 text-sm text-foreground-muted">{deadline.budget_status}</p> : null}
                              <p className="mt-1 text-xs text-foreground-muted">
                                Bron: {deadline.bron_notitie} — vastgelegd op {formatDatumNl(deadline.gecontroleerd_op?.slice(0, 10))}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deadlineUitzetten(deadline.id)}
                              disabled={uitzettenBezig === deadline.id}
                            >
                              {uitzettenBezig === deadline.id ? 'Bezig...' : 'Uitzetten'}
                            </Button>
                          </div>

                          {geraakteDossiers.length > 0 ? (
                            <div className="mt-3 border-t border-border pt-3">
                              <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-foreground-muted uppercase">
                                Mogelijk geraakte dossiers ({geraakteDossiers.length})
                              </p>
                              <ul className="flex flex-col gap-2">
                                {geraakteDossiers.map((ds) => {
                                  const sleutel = `${deadline.id}:${ds.dossier_id}`
                                  const status = verzendStatus[sleutel]
                                  return (
                                    <li key={ds.subsidie_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                                      <Link to={ROUTES.dossier(ds.dossier_id)} className="min-w-0 truncate text-primary hover:underline">
                                        {ds.dossiers?.klanten?.naam || ds.dossiers?.klanten?.bedrijfsnaam || 'Onbekende klant'} —{' '}
                                        {ds.dossiers?.panden?.omschrijving || ds.dossiers?.panden?.adres || 'Onbekend pand'}
                                      </Link>
                                      {status === 'verzonden' ? (
                                        <span className="shrink-0 text-xs font-medium text-accent">Melding verstuurd</span>
                                      ) : (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => meldingVersturen(deadline, ds)}
                                          disabled={verzendBezig === sleutel}
                                        >
                                          {verzendBezig === sleutel ? 'Bezig...' : 'Stuur melding'}
                                        </Button>
                                      )}
                                      {status === 'fout' ? <span className="w-full text-xs font-medium text-error">Versturen is niet gelukt.</span> : null}
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          ) : (
                            <p className="mt-3 border-t border-border pt-3 text-xs text-foreground-muted">Geen dossiers met een lopend subsidietraject voor deze regeling.</p>
                          )}
                        </li>
                      )
                    })}
                </ul>
              )}
            </div>
          ) : null}

          {!laden && syncStatus ? (
            <div
              className={`mb-6 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${
                syncStatus.status === 'success' ? 'border-border bg-muted/40 text-foreground-muted' : 'border-error-bg bg-error-bg text-error'
              }`}
            >
              {syncStatus.status === 'success' ? (
                <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" />
              ) : (
                <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
              )}
              <span className="min-w-0 break-words">
                {syncStatus.status === 'success' ? (
                  <>
                    Laatst gesynchroniseerd op {formatSyncDatum(syncStatus.gestart_op)} — {syncStatus.aantal_items} item(s).
                  </>
                ) : (
                  <>
                    Laatste synchronisatie ({formatSyncDatum(syncStatus.gestart_op)}) is mislukt: {syncStatus.foutmelding}. De lijst hieronder toont de
                    laatst bekende goede data.
                  </>
                )}
              </span>
            </div>
          ) : null}

          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
              Nog geen data gesynchroniseerd.
            </p>
          ) : (
            <>
              <input
                type="search"
                placeholder="Zoek op titel, sector of doelgroep"
                value={zoekterm}
                onChange={(e) => setZoekterm(e.target.value)}
                className="mb-4 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
              />
              {gefilterdeItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Geen items gevonden.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {gefilterdeItems.map((item) => (
                    <li key={item.id} className="rounded-lg border border-border bg-white px-4 py-3 text-sm">
                      <a
                        href={item.url ? `${RVO_BASIS_URL}${item.url}` : RVO_BASIS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start justify-between gap-2 font-medium text-primary hover:text-accent hover:underline"
                      >
                        <span className="min-w-0 break-words">{item.titel}</span>
                        <ArrowSquareOut size={15} className="mt-0.5 shrink-0 text-foreground-muted" />
                      </a>
                      {item.intro ? <p className="mt-1.5 line-clamp-2 text-xs text-foreground-muted">{item.intro}</p> : null}
                      {(item.sectoren?.length ?? 0) > 0 || (item.doelgroepen?.length ?? 0) > 0 ? (
                        <p className="mt-2 text-xs text-foreground-muted">{[...(item.sectoren ?? []), ...(item.doelgroepen ?? [])].join(' · ')}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  )
}
