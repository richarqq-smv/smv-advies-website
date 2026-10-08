import { useEffect, useState } from 'react'
import { Trash, Plus, ArrowSquareOut } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { ROUTES } from '../../lib/routes'
import {
  listDossierSubsidies,
  addDossierSubsidie,
  updateDossierSubsidie,
  removeDossierSubsidie,
  listSubsidieMaatregelen,
  koppelSubsidieMaatregel,
  ontkoppelSubsidieMaatregel,
  listSubsidieDocumenten,
  koppelSubsidieDocument,
  ontkoppelSubsidieDocument,
} from '../../lib/klantOmgeving/api'
import { SUBSIDIE_STATUSSEN, sorteerSubsidies } from '../../lib/dossier/dossierSubsidie'
import { SubsidieCheck } from './SubsidieCheck'

const INPUT_CLASSNAME = 'w-full rounded-lg border border-border px-3 py-2 text-sm'
const SELECT_CLASSNAME = 'rounded-lg border border-border px-2 py-1.5 text-xs'

const LEEG_FORMULIER = { regelingNaam: '', verwachtBedrag: '', deadline: '' }

/**
 * Subsidiehulp Fase 2 (0035_dossier_subsidies.sql) — losstaand van
 * DossierTaken.jsx, dat de generieke workflow-actielijst blijft
 * (ongewijzigd). Dit component is de eigenlijke subsidie-administratie:
 * per subsidietraject een regeling/bedrag/status/deadline, plus welke
 * bestaande maatregelen (adviespunten) en documenten erbij horen.
 * `adviespunten`/`documenten` komen als prop binnen — dezelfde, al
 * dossiergebonden lijsten die DossierDetail.jsx al ophaalt (zelfde
 * patroon als de Fase 1-koppeling in DossierTaken.jsx) — geen eigen
 * fetch, geen nieuwe upload-/aanmaak-UI voor maatregelen of documenten.
 *
 * Notitie (dossier_subsidies.notitie) heeft hier bewust nog geen
 * bewerk-UI, dezelfde deferred status als dossier_taken.notitie elders
 * in dit project — de API ondersteunt het veld al voor een latere ronde.
 */
export function DossierSubsidies({ dossierId, magBeheren, adviespunten = [], documenten = [], pand = null, mjopSnapshot = null, energieSnapshot = null }) {
  const [laden, setLaden] = useState(true)
  const [subsidies, setSubsidies] = useState([])
  const [maatregelenPerSubsidie, setMaatregelenPerSubsidie] = useState({})
  const [documentenPerSubsidie, setDocumentenPerSubsidie] = useState({})
  const [nieuwFormulierOpen, setNieuwFormulierOpen] = useState(false)
  const [nieuweWaarde, setNieuweWaarde] = useState(LEEG_FORMULIER)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    listDossierSubsidies(dossierId)
      .then(async (rijen) => {
        if (!actief) return
        setSubsidies(rijen)
        const maatregelenEntries = await Promise.all(rijen.map((s) => listSubsidieMaatregelen(s.subsidie_id).then((v) => [s.subsidie_id, v])))
        const documentenEntries = await Promise.all(rijen.map((s) => listSubsidieDocumenten(s.subsidie_id).then((v) => [s.subsidie_id, v])))
        if (!actief) return
        setMaatregelenPerSubsidie(Object.fromEntries(maatregelenEntries))
        setDocumentenPerSubsidie(Object.fromEntries(documentenEntries))
      })
      .catch(() => {})
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [dossierId])

  if (!magBeheren) return null
  if (laden) return null

  const gesorteerd = sorteerSubsidies(subsidies)

  /** Zet een nieuw aangemaakte dossier_subsidies-rij in alle drie de bijbehorende states — gedeeld tussen het handmatige formulier hieronder en SubsidieCheck's "Toevoegen als subsidietraject"-actie, zodat er maar één opslagpad is. */
  function nieuweSubsidieToegevoegd(nieuw) {
    setSubsidies((v) => [...v, nieuw])
    setMaatregelenPerSubsidie((v) => ({ ...v, [nieuw.subsidie_id]: [] }))
    setDocumentenPerSubsidie((v) => ({ ...v, [nieuw.subsidie_id]: [] }))
  }

  async function voegToe() {
    if (!nieuweWaarde.regelingNaam.trim()) return setFout('Vul een regelingnaam in.')
    setFout(null)
    setBezig(true)
    try {
      const nieuw = await addDossierSubsidie(dossierId, {
        regelingNaam: nieuweWaarde.regelingNaam,
        verwachtBedrag: nieuweWaarde.verwachtBedrag ? Number(nieuweWaarde.verwachtBedrag) : null,
        deadline: nieuweWaarde.deadline || null,
      })
      nieuweSubsidieToegevoegd(nieuw)
      setNieuwFormulierOpen(false)
      setNieuweWaarde(LEEG_FORMULIER)
    } catch {
      setFout('Subsidie toevoegen is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  async function wijzigStatus(subsidieId, status) {
    setFout(null)
    try {
      const bijgewerkt = await updateDossierSubsidie(subsidieId, { status })
      setSubsidies((v) => v.map((s) => (s.subsidie_id === subsidieId ? bijgewerkt : s)))
    } catch {
      setFout('Status wijzigen is niet gelukt. Probeer het opnieuw.')
    }
  }

  async function wijzigBedrag(subsidieId, waarde) {
    setFout(null)
    try {
      const bijgewerkt = await updateDossierSubsidie(subsidieId, { verwachtBedrag: waarde === '' ? null : Number(waarde) })
      setSubsidies((v) => v.map((s) => (s.subsidie_id === subsidieId ? bijgewerkt : s)))
    } catch {
      setFout('Bedrag wijzigen is niet gelukt. Probeer het opnieuw.')
    }
  }

  async function wijzigDeadline(subsidieId, waarde) {
    setFout(null)
    try {
      const bijgewerkt = await updateDossierSubsidie(subsidieId, { deadline: waarde || null })
      setSubsidies((v) => v.map((s) => (s.subsidie_id === subsidieId ? bijgewerkt : s)))
    } catch {
      setFout('Deadline wijzigen is niet gelukt. Probeer het opnieuw.')
    }
  }

  async function verwijder(subsidieId) {
    setFout(null)
    try {
      await removeDossierSubsidie(subsidieId)
      setSubsidies((v) => v.filter((s) => s.subsidie_id !== subsidieId))
    } catch {
      setFout('Verwijderen is niet gelukt. Probeer het opnieuw.')
    }
  }

  async function koppelMaatregel(subsidieId, adviespuntId) {
    if (!adviespuntId) return
    setFout(null)
    try {
      const koppeling = await koppelSubsidieMaatregel(subsidieId, adviespuntId)
      const adviespunt = adviespunten.find((a) => a.adviespunt_id === adviespuntId)
      setMaatregelenPerSubsidie((v) => ({ ...v, [subsidieId]: [...(v[subsidieId] ?? []), { ...koppeling, adviespunten: adviespunt }] }))
    } catch {
      setFout('Maatregel koppelen is niet gelukt. Probeer het opnieuw.')
    }
  }

  async function ontkoppelMaatregel(subsidieId, koppelingId) {
    setFout(null)
    try {
      await ontkoppelSubsidieMaatregel(koppelingId)
      setMaatregelenPerSubsidie((v) => ({ ...v, [subsidieId]: (v[subsidieId] ?? []).filter((m) => m.id !== koppelingId) }))
    } catch {
      setFout('Maatregel ontkoppelen is niet gelukt. Probeer het opnieuw.')
    }
  }

  async function koppelDocument(subsidieId, documentId) {
    if (!documentId) return
    setFout(null)
    try {
      const koppeling = await koppelSubsidieDocument(subsidieId, documentId)
      const document = documenten.find((d) => d.document_id === documentId)
      setDocumentenPerSubsidie((v) => ({ ...v, [subsidieId]: [...(v[subsidieId] ?? []), { ...koppeling, documenten: document }] }))
    } catch {
      setFout('Document koppelen is niet gelukt. Probeer het opnieuw.')
    }
  }

  async function ontkoppelDocument(subsidieId, koppelingId) {
    setFout(null)
    try {
      await ontkoppelSubsidieDocument(koppelingId)
      setDocumentenPerSubsidie((v) => ({ ...v, [subsidieId]: (v[subsidieId] ?? []).filter((d) => d.id !== koppelingId) }))
    } catch {
      setFout('Document ontkoppelen is niet gelukt. Probeer het opnieuw.')
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Subsidie-administratie</p>
          <h3 className="text-xl text-primary">Subsidies</h3>
        </div>
        {/*
          UX-herontwerp (2026-10-08, Fase 5): de dossiergebonden subsidie-
          administratie hieronder (regeling/bedrag/status/deadline) en de
          losse RVO-referentielijst (/admin/subsidies, maandelijks
          gesynchroniseerd — zie AdminSubsidies.jsx) waren tot nu toe twee
          volledig gescheiden schermen. Deze link is de enige wijziging:
          vanuit een dossier direct naar die referentielijst kunnen
          doorklikken om te zoeken welke regeling relevant is, zonder de
          lijst zelf te dupliceren of hier bedragen/percentages/eligibility
          te verzinnen (die staan bewust niet in de RVO-brondata, zie
          AdminSubsidies.jsx).
        */}
        <Button as="link" to={ROUTES.adminSubsidies} variant="ghost" size="sm">
          Bekijk RVO-regelingen <ArrowSquareOut size={14} />
        </Button>
      </div>

      {gesorteerd.length === 0 ? <p className="text-sm text-foreground-muted">Nog geen subsidies vastgelegd.</p> : null}

      <ul className="flex flex-col gap-4">
        {gesorteerd.map((subsidie) => {
          const maatregelen = maatregelenPerSubsidie[subsidie.subsidie_id] ?? []
          const subsidieDocumenten = documentenPerSubsidie[subsidie.subsidie_id] ?? []
          const gekoppeldeAdviespuntIds = new Set(maatregelen.map((m) => m.adviespunt_id))
          const gekoppeldeDocumentIds = new Set(subsidieDocumenten.map((d) => d.document_id))
          const beschikbareAdviespunten = adviespunten.filter((a) => !gekoppeldeAdviespuntIds.has(a.adviespunt_id))
          const beschikbareDocumenten = documenten.filter((d) => !gekoppeldeDocumentIds.has(d.document_id))

          return (
            <li key={subsidie.subsidie_id} className="flex flex-col gap-3 rounded-lg border border-border p-3.5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 font-medium text-primary">{subsidie.regeling_naam}</p>
                <button
                  type="button"
                  onClick={() => verwijder(subsidie.subsidie_id)}
                  aria-label="Subsidie verwijderen"
                  className="shrink-0 rounded-md p-1.5 text-foreground-muted hover:bg-error-bg hover:text-error"
                >
                  <Trash size={15} />
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-xs text-foreground-muted">
                  Status
                  <select className={SELECT_CLASSNAME} value={subsidie.status} onChange={(e) => wijzigStatus(subsidie.subsidie_id, e.target.value)}>
                    {SUBSIDIE_STATUSSEN.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-foreground-muted">
                  Verwacht bedrag (€)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={INPUT_CLASSNAME}
                    value={subsidie.verwacht_bedrag ?? ''}
                    onChange={(e) => wijzigBedrag(subsidie.subsidie_id, e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-foreground-muted">
                  Deadline
                  <input
                    type="date"
                    className={INPUT_CLASSNAME}
                    value={subsidie.deadline ?? ''}
                    onChange={(e) => wijzigDeadline(subsidie.subsidie_id, e.target.value)}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2">
                <p className="text-xs font-medium text-foreground-muted">Maatregelen</p>
                {maatregelen.length === 0 ? <p className="text-xs text-foreground-muted">Geen maatregel gekoppeld</p> : null}
                <ul className="flex flex-col gap-1">
                  {maatregelen.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1 text-xs">
                      <span className="min-w-0 truncate">{m.adviespunten?.onderwerp ?? 'Onbekend adviespunt'}</span>
                      <button
                        type="button"
                        onClick={() => ontkoppelMaatregel(subsidie.subsidie_id, m.id)}
                        aria-label="Maatregel ontkoppelen"
                        className="shrink-0 rounded-md p-1 text-foreground-muted hover:bg-error-bg hover:text-error"
                      >
                        <Trash size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
                {beschikbareAdviespunten.length > 0 ? (
                  <select className={SELECT_CLASSNAME} value="" onChange={(e) => koppelMaatregel(subsidie.subsidie_id, e.target.value)}>
                    <option value="">Maatregel koppelen…</option>
                    {beschikbareAdviespunten.map((a) => (
                      <option key={a.adviespunt_id} value={a.adviespunt_id}>
                        {a.onderwerp}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2">
                <p className="text-xs font-medium text-foreground-muted">Documenten</p>
                {subsidieDocumenten.length === 0 ? <p className="text-xs text-foreground-muted">Geen document gekoppeld</p> : null}
                <ul className="flex flex-col gap-1">
                  {subsidieDocumenten.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1 text-xs">
                      <span className="min-w-0 truncate">{d.documenten?.bestandsnaam ?? 'Onbekend document'}</span>
                      <button
                        type="button"
                        onClick={() => ontkoppelDocument(subsidie.subsidie_id, d.id)}
                        aria-label="Document ontkoppelen"
                        className="shrink-0 rounded-md p-1 text-foreground-muted hover:bg-error-bg hover:text-error"
                      >
                        <Trash size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
                {beschikbareDocumenten.length > 0 ? (
                  <select className={SELECT_CLASSNAME} value="" onChange={(e) => koppelDocument(subsidie.subsidie_id, e.target.value)}>
                    <option value="">Document koppelen…</option>
                    {beschikbareDocumenten.map((d) => (
                      <option key={d.document_id} value={d.document_id}>
                        {d.bestandsnaam}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      {nieuwFormulierOpen ? (
        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-accent/30 bg-muted/40 p-3">
          <input
            className={INPUT_CLASSNAME}
            placeholder="Regeling (bv. ISDE, EIA)"
            value={nieuweWaarde.regelingNaam}
            onChange={(e) => setNieuweWaarde((v) => ({ ...v, regelingNaam: e.target.value }))}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="number"
              min="0"
              step="0.01"
              className={INPUT_CLASSNAME}
              placeholder="Verwacht bedrag (optioneel)"
              value={nieuweWaarde.verwachtBedrag}
              onChange={(e) => setNieuweWaarde((v) => ({ ...v, verwachtBedrag: e.target.value }))}
            />
            <input
              type="date"
              className={INPUT_CLASSNAME}
              value={nieuweWaarde.deadline}
              onChange={(e) => setNieuweWaarde((v) => ({ ...v, deadline: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={voegToe} disabled={bezig}>
              Opslaan
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setNieuwFormulierOpen(false)
                setNieuweWaarde(LEEG_FORMULIER)
                setFout(null)
              }}
            >
              Annuleren
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => setNieuwFormulierOpen(true)}>
          <Plus size={14} /> Subsidie toevoegen
        </Button>
      )}

      {fout ? (
        <p role="alert" className="mt-3 text-sm font-medium text-error">
          {fout}
        </p>
      ) : null}

      <SubsidieCheck
        dossierId={dossierId}
        pand={pand}
        mjopSnapshot={mjopSnapshot}
        energieSnapshot={energieSnapshot}
        subsidies={subsidies}
        magBeheren={magBeheren}
        onSubsidieToegevoegd={nieuweSubsidieToegevoegd}
      />
    </div>
  )
}
