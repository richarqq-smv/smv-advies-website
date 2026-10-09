import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Plus } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { AfspraakModal } from '../components/admin/AfspraakModal'
import { AdminTerugKnop } from '../components/admin/AdminTerugKnop'
import { adminListKlanten, listAfspraken } from '../lib/klantOmgeving/api'
import {
  berekenWeekdagen,
  formatPeriodeNl,
  formatDagPeriodeNl,
  bepaalUrenBereik,
  groepeerAfsprakenPerDag,
  berekenBlokPositie,
  datumNaarIso,
  AFSPRAAK_TYPE_LABELS,
} from '../lib/klantOmgeving/planning'

const UUR_HOOGTE = 56 // px

const STATUS_KLASSEN = {
  gepland: 'border-accent/40 bg-accent/10 text-primary',
  afgerond: 'border-border bg-muted text-foreground-muted',
  geannuleerd: 'border-dashed border-border bg-white text-foreground-muted line-through opacity-70',
}

const DAGNAMEN_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

function afspraakLabel(a) {
  const klant = a.klanten?.naam || a.klanten?.bedrijfsnaam
  return klant ? `${a.onderwerp} — ${klant}` : a.onderwerp
}

/**
 * Interne Planning v1 (/admin/planning, Admin-ronde 2026-09-28) — een
 * eenvoudige, rustige weekagenda; geen Google Calendar-integratie, alle
 * data blijft in planning_afspraken (0011_admin_planning.sql). Volledig
 * admin-only (RequireAdmin in App.jsx + admin-only RLS op de tabel zelf).
 *
 * `ankerIso` is de datum die de huidige weergave bepaalt: bij weekweergave
 * de week die deze datum bevat (berekenWeekdagen), bij dagweergave exact
 * deze dag. Vandaag/vorige/volgende verschuiven uitsluitend deze ene
 * waarde — de rest (periode-tekst, welke dagen getoond worden, welk
 * datumbereik opgehaald wordt) volgt daar puur uit af.
 */
export default function AdminPlanning() {
  const [weergave, setWeergave] = useState('week') // 'week' | 'dag'
  const [ankerIso, setAnkerIso] = useState(() => datumNaarIso(new Date()))
  const [afspraken, setAfspraken] = useState([])
  const [klanten, setKlanten] = useState([])
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [modalState, setModalState] = useState(undefined) // undefined = dicht, null = nieuw, {...} = bekijken/bewerken

  const dagen = useMemo(() => (weergave === 'week' ? berekenWeekdagen(ankerIso) : [ankerIso]), [weergave, ankerIso])

  useEffect(() => {
    adminListKlanten()
      .then(setKlanten)
      .catch(() => setKlanten([]))
  }, [])

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    listAfspraken({ vanaf: dagen[0], tot: dagen.at(-1) })
      .then((rows) => actief && setAfspraken(rows))
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [dagen])

  const perDag = useMemo(() => groepeerAfsprakenPerDag(afspraken, dagen), [afspraken, dagen])
  const uren = useMemo(() => bepaalUrenBereik(afspraken), [afspraken])
  const vandaag = datumNaarIso(new Date())

  function verschuif(dagenAantal) {
    const d = new Date(ankerIso)
    d.setDate(d.getDate() + dagenAantal)
    setAnkerIso(datumNaarIso(d))
  }

  function opgeslagen() {
    setModalState(undefined)
    // Eenvoudiger en betrouwbaarder dan de nieuwe/gewijzigde rij lokaal in
    // te passen (die kan van dag veranderd zijn, of nu buiten het huidige
    // bereik vallen) — dit is een licht overzicht, een extra rondje ophalen
    // is hier geen probleem.
    listAfspraken({ vanaf: dagen[0], tot: dagen.at(-1) })
      .then(setAfspraken)
      .catch(() => {})
  }

  function verwijderd(afspraakId) {
    setModalState(undefined)
    setAfspraken((rows) => rows.filter((a) => a.afspraak_id !== afspraakId))
  }

  const periodeTekst = weergave === 'week' ? formatPeriodeNl(dagen[0], dagen.at(-1)) : formatDagPeriodeNl(ankerIso)

  return (
    <>
      <Seo title="Planning" description="Interne agenda: afspraken, bezoeken en gesprekken." noindex />
      <PageHero eyebrow="Beheer" title="Planning" description="Afspraken, bezoeken en gesprekken." />
      <Section tone="white" noTopPadding>
        <Container wide>
          <AdminTerugKnop />
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => verschuif(weergave === 'week' ? -7 : -1)} aria-label="Vorige periode">
                <ArrowLeft size={16} />
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setAnkerIso(vandaag)}>
                Vandaag
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => verschuif(weergave === 'week' ? 7 : 1)} aria-label="Volgende periode">
                <ArrowRight size={16} />
              </Button>
              <span className="ml-2 text-sm font-medium text-primary capitalize">{periodeTekst}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setWeergave('dag')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${weergave === 'dag' ? 'bg-primary text-white' : 'text-foreground-muted'}`}
                >
                  Dag
                </button>
                <button
                  type="button"
                  onClick={() => setWeergave('week')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${weergave === 'week' ? 'bg-primary text-white' : 'text-foreground-muted'}`}
                >
                  Week
                </button>
              </div>
              <Button type="button" size="sm" onClick={() => setModalState(null)}>
                <Plus size={16} /> Nieuwe afspraak
              </Button>
            </div>
          </div>

          {fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : (
            <div className="overflow-x-auto">
              <div className={`grid ${weergave === 'week' ? 'min-w-[820px]' : 'min-w-[420px]'}`} style={{ gridTemplateColumns: `56px repeat(${dagen.length}, minmax(0, 1fr))` }}>
                <div />
                {dagen.map((dag, i) => {
                  const d = new Date(dag)
                  const isVandaag = dag === vandaag
                  return (
                    <div key={dag} className={`border-b border-border px-2 pb-2 text-center text-sm ${isVandaag ? 'text-accent' : 'text-primary'}`}>
                      {weergave === 'week' ? <span className="block text-xs text-foreground-muted uppercase">{DAGNAMEN_KORT[i]}</span> : null}
                      <span className={`font-medium ${isVandaag ? 'text-accent' : ''}`}>{d.getDate()}</span>
                    </div>
                  )
                })}

                <div style={{ height: uren.length * UUR_HOOGTE }}>
                  {uren.map((u) => (
                    <div key={u} style={{ height: UUR_HOOGTE }} className="pr-2 text-right text-xs text-foreground-muted">
                      {String(u).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {dagen.map((dag) => (
                  <div key={dag} className="relative border-l border-border" style={{ height: uren.length * UUR_HOOGTE }}>
                    <div className="absolute inset-0 flex flex-col">
                      {uren.map((u) => (
                        <div key={u} style={{ height: UUR_HOOGTE }} className="border-t border-border" />
                      ))}
                    </div>
                    {perDag[dag].map((a) => {
                      const { top, height } = berekenBlokPositie(a, uren[0], UUR_HOOGTE)
                      return (
                        <button
                          key={a.afspraak_id}
                          type="button"
                          onClick={() => setModalState(a)}
                          style={{ top, height }}
                          className={`absolute inset-x-0.5 overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-xs leading-tight ${STATUS_KLASSEN[a.status] ?? STATUS_KLASSEN.gepland}`}
                          title={`${afspraakLabel(a)} · ${AFSPRAAK_TYPE_LABELS[a.type] ?? a.type}`}
                        >
                          <span className="block font-medium">{a.starttijd.slice(0, 5)}</span>
                          <span className="block truncate">{afspraakLabel(a)}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Container>
      </Section>

      {modalState !== undefined ? (
        <AfspraakModal
          afspraak={modalState}
          klanten={klanten}
          defaultDatum={weergave === 'dag' ? ankerIso : dagen[0]}
          onClose={() => setModalState(undefined)}
          onOpgeslagen={opgeslagen}
          onVerwijderd={verwijderd}
        />
      ) : null}
    </>
  )
}
