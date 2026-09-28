import { useEffect, useState } from 'react'
import { Trash, WarningCircle, X } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { ROUTES } from '../../lib/routes'
import { listDossiersVoorKlant, createAfspraak, updateAfspraak, verwijderAfspraak } from '../../lib/klantOmgeving/api'
import { AFSPRAAK_TYPES, AFSPRAAK_STATUSSEN, valideerAfspraak } from '../../lib/klantOmgeving/planning'
import { formatDatumNl } from '../../lib/klantOmgeving/offerte'

const SELECT_CLASSNAME =
  'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'

function leegFormulier(defaultDatum) {
  return { onderwerp: '', datum: defaultDatum ?? '', starttijd: '', eindtijd: '', type: 'kennismaking', klantId: '', dossierId: '', notitie: '', status: 'gepland' }
}

function afspraakNaarFormulier(afspraak) {
  return {
    onderwerp: afspraak.onderwerp,
    datum: afspraak.datum,
    starttijd: afspraak.starttijd.slice(0, 5),
    eindtijd: afspraak.eindtijd.slice(0, 5),
    type: afspraak.type,
    klantId: afspraak.klant_id ?? '',
    dossierId: afspraak.dossier_id ?? '',
    notitie: afspraak.notitie ?? '',
    status: afspraak.status,
  }
}

/**
 * Aanmaken/bekijken/bewerken/verwijderen van één afspraak (Admin Planning
 * v1, 2026-09-28) — één component voor alle vier, om dubbele
 * formulierlogica te voorkomen: zonder `afspraak`-prop begint de modal in
 * bewerkmodus met een leeg formulier (nieuwe afspraak); mét `afspraak`
 * begint hij in "bekijken", met een "Bewerken"-knop.
 *
 * Klant/dossier zijn optioneel (interne afspraken zonder koppeling) — bij
 * een gekozen klant wordt de dossierlijst opnieuw opgehaald en beperkt tot
 * diens eigen dossiers (listDossiersVoorKlant, dezelfde functie als de
 * klantomgeving al gebruikt; als admin geeft RLS gewoon de dossiers van de
 * gekozen klant terug — geen nieuwe query nodig). Gearchiveerde dossiers
 * worden hier lokaal uit de keuzelijst gefilterd (niet in de gedeelde
 * functie zelf, dat zou Account.jsx/EnergieDossierKoppeling.jsx mee
 * veranderen) — een afspraak plannen op een dossier dat net uit het
 * actieve overzicht is gehaald, is zelden de bedoeling.
 */
export function AfspraakModal({ afspraak, klanten, defaultDatum, onClose, onOpgeslagen, onVerwijderd }) {
  const [modus, setModus] = useState(afspraak ? 'bekijken' : 'bewerken')
  const [form, setForm] = useState(afspraak ? afspraakNaarFormulier(afspraak) : leegFormulier(defaultDatum))
  const [fouten, setFouten] = useState({})
  const [bezig, setBezig] = useState(false)
  const [opslaanFout, setOpslaanFout] = useState(null)

  const [dossiersVoorKlant, setDossiersVoorKlant] = useState([])

  const [verwijderBevestiging, setVerwijderBevestiging] = useState(false)
  const [verwijderBezig, setVerwijderBezig] = useState(false)
  const [verwijderFout, setVerwijderFout] = useState(false)

  useEffect(() => {
    function opEscape(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', opEscape)
    return () => document.removeEventListener('keydown', opEscape)
  }, [onClose])

  useEffect(() => {
    let actief = true
    if (!form.klantId) {
      setDossiersVoorKlant([])
      return
    }
    listDossiersVoorKlant(form.klantId)
      .then((rows) => actief && setDossiersVoorKlant(rows.filter((d) => !d.gearchiveerd_op)))
      .catch(() => actief && setDossiersVoorKlant([]))
    return () => {
      actief = false
    }
  }, [form.klantId])

  function wijzigKlant(klantId) {
    // Een dossier hoort altijd bij precies één klant — bij het wisselen van
    // klant is een eerder gekozen dossier per definitie niet meer geldig.
    setForm((s) => ({ ...s, klantId, dossierId: '' }))
  }

  async function opslaan(e) {
    e.preventDefault()
    const veldFouten = valideerAfspraak(form)
    setFouten(veldFouten)
    if (Object.keys(veldFouten).length > 0) return

    setBezig(true)
    setOpslaanFout(null)
    try {
      const payload = {
        onderwerp: form.onderwerp,
        type: form.type,
        datum: form.datum,
        starttijd: form.starttijd,
        eindtijd: form.eindtijd,
        klantId: form.klantId || null,
        dossierId: form.dossierId || null,
        notitie: form.notitie,
      }
      const opgeslagen = afspraak ? await updateAfspraak(afspraak.afspraak_id, { ...payload, status: form.status }) : await createAfspraak(payload)
      onOpgeslagen(opgeslagen)
    } catch {
      setOpslaanFout('Opslaan is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  async function bevestigVerwijderen() {
    setVerwijderBezig(true)
    setVerwijderFout(false)
    try {
      await verwijderAfspraak(afspraak.afspraak_id)
      onVerwijderd(afspraak.afspraak_id)
    } catch {
      setVerwijderFout(true)
      setVerwijderBezig(false)
    }
  }

  const titel = afspraak ? (modus === 'bewerken' ? 'Afspraak bewerken' : 'Afspraak') : 'Nieuwe afspraak'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titel}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg text-primary">{titel}</h2>
          <button type="button" onClick={onClose} aria-label="Sluiten" className="text-foreground-muted hover:text-primary">
            <X size={20} />
          </button>
        </div>

        {modus === 'bekijken' ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-base font-medium text-primary">{afspraak.onderwerp}</p>
              <p className="mt-1 text-sm text-foreground-muted">
                {formatDatumNl(afspraak.datum)} · {afspraak.starttijd.slice(0, 5)}–{afspraak.eindtijd.slice(0, 5)}
              </p>
              <p className="mt-1 text-sm text-foreground-muted">
                {AFSPRAAK_TYPES.find((t) => t.id === afspraak.type)?.label ?? afspraak.type} ·{' '}
                {AFSPRAAK_STATUSSEN.find((s) => s.id === afspraak.status)?.label ?? afspraak.status}
              </p>
              {afspraak.klanten ? (
                <p className="mt-1 text-sm text-foreground-muted">Klant: {afspraak.klanten.naam || afspraak.klanten.bedrijfsnaam}</p>
              ) : null}
              {afspraak.notitie ? <p className="mt-3 text-sm whitespace-pre-wrap text-foreground-muted">{afspraak.notitie}</p> : null}
            </div>

            {afspraak.dossier_id ? (
              <div>
                <Button as="link" to={ROUTES.dossier(afspraak.dossier_id)} variant="outline" size="sm">
                  Open dossier
                </Button>
              </div>
            ) : null}

            {verwijderBevestiging ? (
              <div className="rounded-lg border border-error/40 bg-error-bg p-4">
                <p className="text-sm font-medium text-primary">Afspraak verwijderen? Dit kan niet ongedaan worden gemaakt.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={bevestigVerwijderen} disabled={verwijderBezig}>
                    {verwijderBezig ? 'Bezig...' : 'Ja, verwijderen'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderBevestiging(false)} disabled={verwijderBezig}>
                    Annuleren
                  </Button>
                </div>
                {verwijderFout ? (
                  <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-error">
                    <WarningCircle size={13} weight="fill" />
                    Verwijderen is niet gelukt. Probeer het opnieuw.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setModus('bewerken')}>
                  Bewerken
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderBevestiging(true)}>
                  <Trash size={15} /> Verwijderen
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={opslaan} className="flex flex-col gap-4">
            <TextField id="afspraak-onderwerp" label="Onderwerp" required value={form.onderwerp} onChange={(v) => setForm((s) => ({ ...s, onderwerp: v }))} error={fouten.onderwerp} />

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <label htmlFor="afspraak-datum" className="mb-2 block text-sm font-medium text-primary">
                  Datum<span className="ml-1 text-accent">*</span>
                </label>
                <input id="afspraak-datum" type="date" value={form.datum} onChange={(e) => setForm((s) => ({ ...s, datum: e.target.value }))} className={SELECT_CLASSNAME} />
                {fouten.datum ? <p className="mt-1.5 text-xs font-medium text-error">{fouten.datum}</p> : null}
              </div>
              <div>
                <label htmlFor="afspraak-start" className="mb-2 block text-sm font-medium text-primary">
                  Start<span className="ml-1 text-accent">*</span>
                </label>
                <input id="afspraak-start" type="time" value={form.starttijd} onChange={(e) => setForm((s) => ({ ...s, starttijd: e.target.value }))} className={SELECT_CLASSNAME} />
                {fouten.starttijd ? <p className="mt-1.5 text-xs font-medium text-error">{fouten.starttijd}</p> : null}
              </div>
              <div>
                <label htmlFor="afspraak-einde" className="mb-2 block text-sm font-medium text-primary">
                  Einde<span className="ml-1 text-accent">*</span>
                </label>
                <input id="afspraak-einde" type="time" value={form.eindtijd} onChange={(e) => setForm((s) => ({ ...s, eindtijd: e.target.value }))} className={SELECT_CLASSNAME} />
                {fouten.eindtijd ? <p className="mt-1.5 text-xs font-medium text-error">{fouten.eindtijd}</p> : null}
              </div>
            </div>

            <div>
              <label htmlFor="afspraak-type" className="mb-2 block text-sm font-medium text-primary">
                Type
              </label>
              <select id="afspraak-type" value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} className={SELECT_CLASSNAME}>
                {AFSPRAAK_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {afspraak ? (
              <div>
                <label htmlFor="afspraak-status" className="mb-2 block text-sm font-medium text-primary">
                  Status
                </label>
                <select id="afspraak-status" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} className={SELECT_CLASSNAME}>
                  {AFSPRAAK_STATUSSEN.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="afspraak-klant" className="mb-2 block text-sm font-medium text-primary">
                  Klant <span className="font-normal text-foreground-muted">(optioneel)</span>
                </label>
                <select id="afspraak-klant" value={form.klantId} onChange={(e) => wijzigKlant(e.target.value)} className={SELECT_CLASSNAME}>
                  <option value="">Geen klant — interne afspraak</option>
                  {klanten.map((k) => (
                    <option key={k.klant_id} value={k.klant_id}>
                      {k.naam || k.bedrijfsnaam || 'Naamloze klant'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="afspraak-dossier" className="mb-2 block text-sm font-medium text-primary">
                  Dossier <span className="font-normal text-foreground-muted">(optioneel)</span>
                </label>
                <select
                  id="afspraak-dossier"
                  value={form.dossierId}
                  onChange={(e) => setForm((s) => ({ ...s, dossierId: e.target.value }))}
                  disabled={!form.klantId}
                  className={SELECT_CLASSNAME}
                >
                  <option value="">Geen dossier</option>
                  {dossiersVoorKlant.map((d) => (
                    <option key={d.dossier_id} value={d.dossier_id}>
                      {d.panden?.omschrijving || d.panden?.adres || 'Naamloos pand'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="afspraak-notitie" className="mb-2 block text-sm font-medium text-primary">
                Notitie <span className="font-normal text-foreground-muted">(optioneel)</span>
              </label>
              <textarea
                id="afspraak-notitie"
                rows={3}
                value={form.notitie}
                onChange={(e) => setForm((s) => ({ ...s, notitie: e.target.value }))}
                className={SELECT_CLASSNAME}
              />
            </div>

            {fouten.type ? <p className="text-xs font-medium text-error">{fouten.type}</p> : null}
            {opslaanFout ? (
              <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
                <WarningCircle size={15} weight="fill" />
                {opslaanFout}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button type="submit" size="sm" disabled={bezig}>
                {bezig ? 'Bezig...' : 'Opslaan'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={afspraak ? () => setModus('bekijken') : onClose} disabled={bezig}>
                Annuleren
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
