import { useEffect, useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import { listDossierSubsidies, listDossierTaken } from '../../lib/klantOmgeving/api'
import { sorteerSubsidies, subsidieStatusLabel } from '../../lib/dossier/dossierSubsidie'
import { TAAK_STATUSSEN } from '../../lib/dossier/dossierTaken'
import { euro, formatDatumNl } from '../../lib/klantOmgeving/offerte'

function taakStatusLabel(status) {
  return TAAK_STATUSSEN.find((s) => s.value === status)?.label ?? status ?? ''
}

/**
 * Implementatieronde 2026-10-12, punt 2: read-only klantweergave van de
 * subsidiebegeleiding, voor Gold-klanten (zie de pakket-gate in
 * DossierDetail.jsx). Toont uitsluitend wat de admin al in
 * DossierSubsidies.jsx/AdminSubsidieBegeleiding.jsx heeft vastgelegd —
 * geen enkele bewerk-, toevoeg- of koppelactie, geen eigen datamodel.
 *
 * Bewust GEEN hergebruik van DossierSubsidies.jsx/SubsidieCheck.jsx zelf:
 * die roepen ook admin-only bronnen aan (dossier_subsidie_specificaties,
 * de RVO-referentielijst) die hier niet bij horen — "eigen gegevens van
 * de klant lezen" is hier beperkt tot wat 0047_subsidie_klant_gold_inzicht.sql
 * daadwerkelijk klant-leesbaar heeft gemaakt: dossier_subsidies en de
 * subsidie-taken (categorie 'subsidie') van dit ene dossier.
 */
export function DossierSubsidiesKlantWeergave({ dossierId }) {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [subsidies, setSubsidies] = useState([])
  const [taken, setTaken] = useState([])

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    Promise.all([listDossierSubsidies(dossierId), listDossierTaken(dossierId)])
      .then(([subsidieRijen, takenRijen]) => {
        if (!actief) return
        setSubsidies(subsidieRijen)
        setTaken(takenRijen.filter((t) => t.categorie === 'subsidie'))
      })
      .catch(() => actief && setFout('Subsidiegegevens konden niet worden geladen.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [dossierId])

  if (laden) return <p className="text-sm text-foreground-muted">Bezig met laden...</p>
  if (fout) {
    return (
      <p role="alert" className="text-sm font-medium text-error">
        {fout}
      </p>
    )
  }

  const gesorteerd = sorteerSubsidies(subsidies)

  if (gesorteerd.length === 0 && taken.length === 0) {
    return <p className="text-sm text-foreground-muted">Nog geen subsidiebegeleiding vastgelegd voor dit dossier.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      {gesorteerd.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {gesorteerd.map((subsidie) => (
            <li key={subsidie.subsidie_id} className="rounded-lg border border-border p-3.5 text-sm">
              <p className="font-medium text-primary">{subsidie.regeling_naam}</p>
              <dl className="mt-2 grid gap-1.5 text-xs text-foreground-muted sm:grid-cols-3">
                <div>
                  <dt className="inline">Status: </dt>
                  <dd className="inline font-medium text-primary">{subsidieStatusLabel(subsidie.status)}</dd>
                </div>
                <div>
                  <dt className="inline">Verwacht bedrag: </dt>
                  <dd className="inline font-medium text-primary">{subsidie.verwacht_bedrag != null ? euro(subsidie.verwacht_bedrag) : '—'}</dd>
                </div>
                <div>
                  <dt className="inline">Deadline: </dt>
                  <dd className="inline font-medium text-primary">{subsidie.deadline ? formatDatumNl(subsidie.deadline) : '—'}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      ) : null}

      {taken.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium text-foreground-muted">Stappen</p>
          <ul className="flex flex-col gap-1.5">
            {taken.map((taak) => (
              <li key={taak.taak_id} className="flex items-start gap-2 text-sm">
                {taak.status === 'afgerond' ? (
                  <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-accent" />
                ) : (
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-border" aria-hidden="true" />
                )}
                <span className="min-w-0">
                  {taak.omschrijving}{' '}
                  <span className="text-xs text-foreground-muted">({taakStatusLabel(taak.status)})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
