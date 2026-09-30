import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ClipboardText } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { ROUTES } from '../../lib/routes'
import { listOpnamesVoorDossier, createOpname } from '../../lib/klantOmgeving/api'
import { OPNAME_STATUS_LABELS } from '../../lib/klantOmgeving/opname'
import { formatDatumNl } from '../../lib/klantOmgeving/offerte'

const STATUS_BADGE = {
  concept: 'bg-muted text-foreground-muted',
  opgeslagen: 'bg-accent/10 text-accent',
  afgerond: 'bg-primary/10 text-primary',
}

/**
 * Opnames bij dit dossier (mobiele-opnameronde, 2026-09-30) — admin-only,
 * vervangt de vorige OpnamesPlaceholder nu de echte opnameflow bestaat.
 * Zelfde plek in de dossierpagina als het architectuurvoorstel: tussen de
 * bouwkundige analyse en de rapportage in (Opname levert de ruwe feiten,
 * de rapportage/bouwkundige analyse/adviespunten worden er los van
 * opgebouwd — zie eindrapport, geen automatische overname).
 *
 * "Eenvoudig starten/openen/voortzetten/afronden" (opdracht §3): starten =
 * de knop hieronder (createOpname + direct doornavigeren), openen/
 * voortzetten = op een rij in de lijst klikken, afronden gebeurt op de
 * opnamepagina zelf.
 */
export function OpnamesSectie({ dossierId }) {
  const navigate = useNavigate()
  const [laden, setLaden] = useState(true)
  const [opnames, setOpnames] = useState([])
  const [startBezig, setStartBezig] = useState(false)
  const [fout, setFout] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    listOpnamesVoorDossier(dossierId)
      .then((rows) => actief && setOpnames(rows))
      .catch(() => actief && setFout('Opnames konden niet worden geladen.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [dossierId])

  async function nieuweOpnameStarten() {
    setFout(null)
    setStartBezig(true)
    try {
      const opname = await createOpname(dossierId, { opnameDatum: new Date().toISOString().slice(0, 10) })
      navigate(ROUTES.adminOpname(dossierId, opname.opname_id))
    } catch {
      setFout('Nieuwe opname starten is niet gelukt. Probeer het opnieuw.')
      setStartBezig(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Opnames</p>
          <h3 className="text-xl text-primary">Locatiebezoeken</h3>
        </div>
        <Button type="button" size="sm" onClick={nieuweOpnameStarten} disabled={startBezig}>
          <Plus size={16} /> {startBezig ? 'Bezig...' : 'Nieuwe opname starten'}
        </Button>
      </div>
      {fout ? <p role="alert" className="mb-3 text-sm font-medium text-error">{fout}</p> : null}
      {laden ? (
        <p className="text-sm text-foreground-muted">Bezig met laden...</p>
      ) : opnames.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
          Nog geen opname voor dit dossier. Start een nieuwe opname om de checklist en het opnameformulier op locatie in te vullen.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {opnames.map((o) => (
            <li key={o.opname_id}>
              <Link
                to={ROUTES.adminOpname(dossierId, o.opname_id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm hover:border-accent hover:bg-muted"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium text-primary">
                  <ClipboardText size={16} className="shrink-0 text-foreground-muted" />
                  {o.opname_datum ? formatDatumNl(o.opname_datum) : 'Geen datum'}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[o.status] ?? 'bg-muted text-foreground-muted'}`}>
                  {OPNAME_STATUS_LABELS[o.status] ?? o.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
