import { useEffect, useState } from 'react'
import { Phone, CalendarCheck, WarningCircle, SpinnerGap } from '@phosphor-icons/react'
import { TextField } from '../ui/TextField'
import { getBeschikbareMomenten, getMijnTelefonischeAfspraak, boekTelefonischeAfspraak } from '../../lib/klantOmgeving/api'
import { datumNaarIso, formatDagPeriodeNl } from '../../lib/klantOmgeving/planning'
import { isZakelijkPand } from '../../lib/klantOmgeving/afspraakBeschikbaarheid'

/**
 * Klantgerichte afspraakplanner (werkfase 2026-10-05) — "Telefonisch
 * adviesgesprek" op de Dossier-detailpagina. Uitsluitend zichtbaar voor
 * een zakelijk pand (zie `isZakelijkPand`, UI-gemak — de echte grens is
 * de zakelijke controle in `boek_telefonische_afspraak()`, migratie
 * 0032_telefonische_afspraak_planner.sql).
 *
 * Alle drie databaseaanroepen (beschikbare momenten, eigen afspraak,
 * boeken) lopen via de drie SECURITY DEFINER-RPC's in api.js — dit
 * component bevat zelf geen autorisatielogica en krijgt nooit meer dan de
 * veilige, geminimaliseerde velden terug (geen interne blokkade-reden,
 * geen andere klant/dossier).
 */
export function TelefonischeAfspraakSectie({ dossierId, gebruikstype }) {
  const [laden, setLaden] = useState(true)
  const [afspraak, setAfspraak] = useState(null)
  const [datum, setDatum] = useState('')
  const [momenten, setMomenten] = useState([])
  const [ladenMomenten, setLadenMomenten] = useState(false)
  const [boekStatus, setBoekStatus] = useState('idle') // 'idle' | 'bezig' | 'fout'
  const [foutmelding, setFoutmelding] = useState(null)

  useEffect(() => {
    let actief = true
    getMijnTelefonischeAfspraak(dossierId)
      .then((a) => actief && setAfspraak(a))
      .catch(() => actief && setAfspraak(null))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [dossierId])

  useEffect(() => {
    if (!datum) {
      setMomenten([])
      return
    }
    let actief = true
    setLadenMomenten(true)
    getBeschikbareMomenten(datum)
      .then((lijst) => actief && setMomenten(lijst))
      .catch(() => actief && setMomenten([]))
      .finally(() => actief && setLadenMomenten(false))
    return () => {
      actief = false
    }
  }, [datum])

  async function kiesMoment(starttijd) {
    setBoekStatus('bezig')
    setFoutmelding(null)
    try {
      const nieuweAfspraak = await boekTelefonischeAfspraak(dossierId, datum, starttijd)
      setAfspraak(nieuweAfspraak)
      setBoekStatus('idle')
    } catch (err) {
      setBoekStatus('fout')
      setFoutmelding(err.message || 'Boeken is niet gelukt. Probeer het opnieuw.')
      // Beschikbaarheid is mogelijk net veranderd (zie §11/§Concurrency) — opnieuw ophalen.
      getBeschikbareMomenten(datum).then(setMomenten).catch(() => {})
    }
  }

  if (!isZakelijkPand(gebruikstype)) return null
  if (laden) return null

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="flex items-center gap-2.5">
        <Phone size={20} weight="fill" className="text-accent" />
        <h3 className="text-lg text-primary">Telefonisch adviesgesprek</h3>
      </div>

      {afspraak ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg bg-muted px-4 py-3.5">
          <CalendarCheck size={20} weight="fill" className="mt-0.5 shrink-0 text-accent" />
          <div className="text-sm">
            <p className="font-semibold text-primary">
              {afspraak.status === 'afgerond' ? 'Uw telefonische afspraak' : 'Uw afspraak is bevestigd'}
            </p>
            <p className="mt-1 text-foreground-muted">{formatDagPeriodeNl(afspraak.datum)}</p>
            <p className="text-foreground-muted">
              {afspraak.starttijd.slice(0, 5)}–{afspraak.eindtijd.slice(0, 5)} · Telefonisch · ca. 20-30 minuten over uw
              bedrijfspand
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-foreground-muted">
            Een gesprek van ongeveer 20-30 minuten over uw bedrijfspand en de uitkomsten van uw MJOP. Kies hieronder een
            moment dat u uitkomt.
          </p>

          <div className="max-w-xs">
            <TextField
              id="afspraak-datum"
              label="Datum"
              type="date"
              min={datumNaarIso(new Date())}
              value={datum}
              onChange={setDatum}
            />
          </div>

          {datum ? (
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Kies een moment</p>
              {ladenMomenten ? (
                <p className="flex items-center gap-1.5 text-sm text-foreground-muted">
                  <SpinnerGap size={15} weight="bold" className="animate-spin motion-reduce:animate-none" />
                  Beschikbaarheid laden...
                </p>
              ) : momenten.length === 0 ? (
                <p className="text-sm text-foreground-muted">Geen momenten beschikbaar op deze dag. Kies een andere datum.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {momenten.map((tijd) => (
                    <button
                      key={tijd}
                      type="button"
                      disabled={boekStatus === 'bezig'}
                      onClick={() => kiesMoment(tijd)}
                      className="min-h-11 min-w-16 rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm font-medium text-primary transition-colors duration-200 ease-default hover:border-accent hover:bg-accent/5 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {tijd}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {foutmelding ? (
            <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
              <WarningCircle size={15} weight="fill" />
              {foutmelding}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
