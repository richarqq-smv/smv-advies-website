import { useEffect, useState } from 'react'
import { Trash, Plus } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { listDossierTaken, addDossierTaak, addDossierTakenBulk, updateDossierTaak, removeDossierTaak } from '../../lib/klantOmgeving/api'
import { bouwStandaardTaken, groepeerTakenPerCategorie, TAAK_STATUSSEN } from '../../lib/dossier/dossierTaken'

const CATEGORIE_LABELS = { subsidie: 'Subsidiebegeleiding', oplevering: 'Opleveringchecklist' }

const INPUT_CLASSNAME = 'w-full rounded-lg border border-border px-3 py-2 text-sm'
const SELECT_CLASSNAME = 'rounded-lg border border-border px-2 py-1.5 text-xs'

const LEEG_FORMULIER = { omschrijving: '', verantwoordelijke: '', deadline: '' }

/**
 * Generieke dossier-taakstructuur (productworkflow-analyseronde,
 * 0026_dossier_taken.sql) — één component voor zowel subsidiebegeleiding
 * als opleveringchecklist (`categorie`), zodat een toekomstige derde
 * categorie geen nieuw component nodig heeft. Admin-only (RLS dekt dit
 * al; magBeheren verbergt alleen bedieningselementen die voor een klant
 * toch altijd zouden falen, zelfde patroon als CommercieleKansSectie.jsx).
 *
 * "Vul standaard checklist" (bouwStandaardTaken()) is een eenmalige,
 * expliciete actie — nooit automatisch bij het kiezen van Gold — en is
 * pas zichtbaar zolang de categorie nog leeg is, zodat er nooit
 * per ongeluk een tweede complete set naast een al bewerkte set ontstaat.
 *
 * Subsidiehulp Fase 1: `adviespunten`/`documenten` zijn de al door
 * DossierDetail.jsx opgehaalde, al dossiergebonden lijsten (listAdviespunten/
 * getDocumentenVoorDossier) — hier alleen doorgegeven om te koppelen aan
 * dossier_taken.adviespunt_id/document_id. Geen eigen fetch, geen nieuwe
 * upload-/aanmaak-UI: uitsluitend bestaande data selecteerbaar maken.
 */
export function DossierTaken({ dossierId, pakketId, magBeheren, adviespunten = [], documenten = [] }) {
  const [laden, setLaden] = useState(true)
  const [taken, setTaken] = useState([])
  const [nieuwFormulier, setNieuwFormulier] = useState(null) // null | categorie
  const [nieuweWaarde, setNieuweWaarde] = useState(LEEG_FORMULIER)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    listDossierTaken(dossierId)
      .then((rijen) => actief && setTaken(rijen))
      .catch(() => {})
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [dossierId])

  if (!magBeheren) return null
  if (laden) return null

  const groepen = groepeerTakenPerCategorie(taken)

  async function vulStandaard(categorie) {
    setFout(null)
    setBezig(true)
    try {
      const nieuw = await addDossierTakenBulk(dossierId, bouwStandaardTaken(categorie))
      setTaken((v) => [...v, ...nieuw])
    } catch {
      setFout('Standaardchecklist toevoegen is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  async function voegToe(categorie) {
    if (!nieuweWaarde.omschrijving.trim()) return setFout('Vul een omschrijving in.')
    setFout(null)
    setBezig(true)
    try {
      const volgorde = groepen[categorie].length
      const nieuw = await addDossierTaak(dossierId, { categorie, omschrijving: nieuweWaarde.omschrijving, verantwoordelijke: nieuweWaarde.verantwoordelijke, deadline: nieuweWaarde.deadline || null, volgorde })
      setTaken((v) => [...v, nieuw])
      setNieuwFormulier(null)
      setNieuweWaarde(LEEG_FORMULIER)
    } catch {
      setFout('Taak toevoegen is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  async function wijzigStatus(taakId, status) {
    setFout(null)
    try {
      const bijgewerkt = await updateDossierTaak(taakId, { status })
      setTaken((v) => v.map((t) => (t.taak_id === taakId ? bijgewerkt : t)))
    } catch {
      setFout('Status wijzigen is niet gelukt. Probeer het opnieuw.')
    }
  }

  async function wijzigAdviespunt(taakId, adviespuntId) {
    setFout(null)
    try {
      const bijgewerkt = await updateDossierTaak(taakId, { adviespuntId })
      setTaken((v) => v.map((t) => (t.taak_id === taakId ? bijgewerkt : t)))
    } catch {
      setFout('Maatregel koppelen is niet gelukt. Probeer het opnieuw.')
    }
  }

  async function wijzigDocument(taakId, documentId) {
    setFout(null)
    try {
      const bijgewerkt = await updateDossierTaak(taakId, { documentId })
      setTaken((v) => v.map((t) => (t.taak_id === taakId ? bijgewerkt : t)))
    } catch {
      setFout('Document koppelen is niet gelukt. Probeer het opnieuw.')
    }
  }

  async function verwijder(taakId) {
    setFout(null)
    try {
      await removeDossierTaak(taakId)
      setTaken((v) => v.filter((t) => t.taak_id !== taakId))
    } catch {
      setFout('Verwijderen is niet gelukt. Probeer het opnieuw.')
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Voortgang</p>
      <h3 className="mb-4 text-xl text-primary">Subsidiebegeleiding &amp; oplevering</h3>

      <div className="flex flex-col gap-6">
        {Object.keys(CATEGORIE_LABELS).map((categorie) => (
          <div key={categorie}>
            <p className="mb-2 text-sm font-semibold text-primary">{CATEGORIE_LABELS[categorie]}</p>

            {groepen[categorie].length === 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-foreground-muted">Nog geen taken.</p>
                {pakketId === 'gold' ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => vulStandaard(categorie)} disabled={bezig}>
                    Vul standaard Gold-checklist
                  </Button>
                ) : null}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {groepen[categorie].map((taak) => (
                  <li key={taak.taak_id} className="flex flex-col gap-2 rounded-lg border border-border px-3.5 py-2.5 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-primary">{taak.omschrijving}</p>
                        {taak.verantwoordelijke || taak.deadline ? (
                          <p className="text-xs text-foreground-muted">
                            {taak.verantwoordelijke ?? ''}
                            {taak.verantwoordelijke && taak.deadline ? ' · ' : ''}
                            {taak.deadline ? `Deadline ${new Date(taak.deadline).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <select className={SELECT_CLASSNAME} value={taak.status} onChange={(e) => wijzigStatus(taak.taak_id, e.target.value)}>
                          {TAAK_STATUSSEN.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <button type="button" onClick={() => verwijder(taak.taak_id)} aria-label="Taak verwijderen" className="rounded-md p-1.5 text-foreground-muted hover:bg-error-bg hover:text-error">
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 border-t border-border/60 pt-2 sm:flex-row sm:flex-wrap sm:gap-3">
                      <label className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-foreground-muted">
                        <span className="shrink-0">Maatregel:</span>
                        <select
                          className={`${SELECT_CLASSNAME} min-w-0 flex-1`}
                          value={taak.adviespunt_id ?? ''}
                          onChange={(e) => wijzigAdviespunt(taak.taak_id, e.target.value || null)}
                        >
                          <option value="">Geen maatregel gekoppeld</option>
                          {adviespunten.map((a) => (
                            <option key={a.adviespunt_id} value={a.adviespunt_id}>
                              {a.onderwerp}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-foreground-muted">
                        <span className="shrink-0">Document:</span>
                        <select
                          className={`${SELECT_CLASSNAME} min-w-0 flex-1`}
                          value={taak.document_id ?? ''}
                          onChange={(e) => wijzigDocument(taak.taak_id, e.target.value || null)}
                        >
                          <option value="">Geen document gekoppeld</option>
                          {documenten.map((d) => (
                            <option key={d.document_id} value={d.document_id}>
                              {d.bestandsnaam}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {nieuwFormulier === categorie ? (
              <div className="mt-3 flex flex-col gap-2 rounded-lg border border-accent/30 bg-muted/40 p-3">
                <input className={INPUT_CLASSNAME} placeholder="Omschrijving" value={nieuweWaarde.omschrijving} onChange={(e) => setNieuweWaarde((v) => ({ ...v, omschrijving: e.target.value }))} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className={INPUT_CLASSNAME} placeholder="Verantwoordelijke (optioneel)" value={nieuweWaarde.verantwoordelijke} onChange={(e) => setNieuweWaarde((v) => ({ ...v, verantwoordelijke: e.target.value }))} />
                  <input type="date" className={INPUT_CLASSNAME} value={nieuweWaarde.deadline} onChange={(e) => setNieuweWaarde((v) => ({ ...v, deadline: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => voegToe(categorie)} disabled={bezig}>
                    Opslaan
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setNieuwFormulier(null); setNieuweWaarde(LEEG_FORMULIER); setFout(null) }}>
                    Annuleren
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => { setNieuwFormulier(categorie); setNieuweWaarde(LEEG_FORMULIER) }}>
                <Plus size={14} /> Taak toevoegen
              </Button>
            )}
          </div>
        ))}
      </div>

      {fout ? (
        <p role="alert" className="mt-3 text-sm font-medium text-error">
          {fout}
        </p>
      ) : null}
    </div>
  )
}
