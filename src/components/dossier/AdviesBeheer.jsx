import { useMemo, useState } from 'react'
import { CheckCircle, WarningCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { STATUSES } from '../../lib/mjop/constants'
import { buildInsights } from '../../lib/mjop/linking'
import {
  isDossierOpen,
  createAdviespunt,
  createSignaalBevroren,
  addAdviespunt,
  updateAdviespunt,
  removeAdviespunt,
  completeDossier,
  saveDossier,
} from '../../lib/dossier'

/**
 * Eerste functionele UI van de advieslaag: adviespunten bekijken, een
 * automatisch MJOP-signaal bewust overnemen, handmatig advies toevoegen,
 * aanpassen en verwijderen — zolang het Dossier open is. Een afgerond
 * Dossier wordt read-only getoond (ontwerpdocument "De advieslaag van SMV
 * Advies", hoofdstuk 7/10).
 *
 * Bewust géén nieuwe design system-laag: hergebruikt de bestaande Button en
 * dezelfde inline Tailwind-stijl als KlantDossierFlow.jsx/TextField.jsx.
 */

// adviesStatus start leeg: een handmatig adviespunt is een bewuste
// inhoudelijke keuze van Richard, dus mag een vergeten dropdown nooit
// stilzwijgend de meest urgente status ("nu_onderzoeken", de eerste key in
// STATUSES) opleveren. Bij het overnemen van een MJOP-signaal wordt dit
// veld altijd expliciet gevuld met de signaalstatus (zie startVanuitSignaal
// hieronder) — dat pad blijft ongewijzigd.
const LEEG_FORMULIER = { onderwerp: '', adviesStatus: '', toelichting: '', herbeoordelenBij: '' }
const STATUS_KEYS = Object.keys(STATUSES)

function AdviesStatusBadge({ status }) {
  const info = STATUSES[status]
  if (!info) return null
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
      {info.label}
    </span>
  )
}

function HerkomstBadge({ herkomst }) {
  return herkomst === 'automatisch' ? (
    <span className="inline-flex items-center rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-foreground-muted">
      Automatisch signaal
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Advies van Richard</span>
  )
}

function KandidaatItem({ insight, onKies }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border px-4 py-3">
      <div>
        <p className="text-sm font-medium text-primary">{insight.componentLabel}</p>
        <p className="text-xs text-foreground-muted">
          {insight.statusLabel}
          {insight.relevantYear ? ` — ${insight.relevantYear}` : ''}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onKies(insight)}>
        Als adviespunt toevoegen
      </Button>
    </li>
  )
}

function Veld({ id, label, verplicht, kind }) {
  return (
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-primary">
      {label}
      {verplicht ? <span className="ml-1 text-accent">*</span> : null}
      {kind === 'optioneel' ? <span className="ml-1 font-normal text-foreground-muted">(optioneel)</span> : null}
    </label>
  )
}

function AdviesFormulier({ idPrefix = 'advies', waarde, onWijzig, onOpslaan, onAnnuleer, bezig, fout }) {
  const inputClass =
    'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-accent/30 bg-muted/40 p-4">
      <div>
        <Veld id={`${idPrefix}-onderwerp`} label="Onderwerp" verplicht />
        <input
          id={`${idPrefix}-onderwerp`}
          type="text"
          value={waarde.onderwerp}
          onChange={(e) => onWijzig({ ...waarde, onderwerp: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <Veld id={`${idPrefix}-status`} label="Status" verplicht />
        <select
          id={`${idPrefix}-status`}
          value={waarde.adviesStatus}
          onChange={(e) => onWijzig({ ...waarde, adviesStatus: e.target.value })}
          className={inputClass}
        >
          {waarde.adviesStatus === '' ? <option value="">Kies een status</option> : null}
          {STATUS_KEYS.map((key) => (
            <option key={key} value={key}>
              {STATUSES[key].label}
            </option>
          ))}
        </select>
        {waarde.adviesStatus ? <p className="mt-1 text-xs text-foreground-muted">{STATUSES[waarde.adviesStatus].description}</p> : null}
      </div>
      <div>
        <Veld id={`${idPrefix}-toelichting`} label="Toelichting" verplicht />
        <textarea
          id={`${idPrefix}-toelichting`}
          rows={3}
          value={waarde.toelichting}
          onChange={(e) => onWijzig({ ...waarde, toelichting: e.target.value })}
          placeholder="Dit is het eigenlijke advies — ook bij 'geen actie nodig' of 'onvoldoende informatie'."
          className={inputClass}
        />
      </div>
      <div>
        <Veld id={`${idPrefix}-herbeoordelen`} label="Wanneer opnieuw beoordelen?" kind="optioneel" />
        <input
          id={`${idPrefix}-herbeoordelen`}
          type="text"
          value={waarde.herbeoordelenBij}
          onChange={(e) => onWijzig({ ...waarde, herbeoordelenBij: e.target.value })}
          placeholder="Bijv. bij vervanging van de cv-ketel, over twee jaar"
          className={inputClass}
        />
      </div>
      {fout ? (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
          <WarningCircle size={15} weight="fill" />
          {fout}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="button" size="sm" onClick={onOpslaan} disabled={bezig}>
          {bezig ? <SpinnerGap size={16} className="animate-spin" /> : null}
          Opslaan
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onAnnuleer} disabled={bezig}>
          Annuleren
        </Button>
      </div>
    </div>
  )
}

export function AdviesBeheer({ dossier: initieelDossier, building }) {
  const [dossier, setDossier] = useState(initieelDossier)
  const [nieuwBron, setNieuwBron] = useState(null) // 'handmatig' | insight-object
  const [nieuwWaarde, setNieuwWaarde] = useState(LEEG_FORMULIER)
  const [bewerkId, setBewerkId] = useState(null)
  const [bewerkWaarde, setBewerkWaarde] = useState(LEEG_FORMULIER)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  const open = isDossierOpen(dossier)
  const insights = useMemo(() => (building ? buildInsights(building) : []), [building])

  function opslaanDossier(volgende) {
    if (!saveDossier(volgende)) throw new Error('opslaan mislukt')
    setDossier(volgende)
  }

  function startHandmatig() {
    setNieuwBron('handmatig')
    setNieuwWaarde(LEEG_FORMULIER)
    setFout(null)
  }

  function startVanuitSignaal(insight) {
    setNieuwBron(insight)
    setNieuwWaarde({ onderwerp: insight.componentLabel, adviesStatus: insight.status, toelichting: '', herbeoordelenBij: '' })
    setFout(null)
  }

  function annuleerNieuw() {
    setNieuwBron(null)
    setFout(null)
  }

  function bevestigNieuw() {
    setFout(null)
    if (!nieuwWaarde.onderwerp.trim()) {
      setFout('Vul een onderwerp in.')
      return
    }
    if (!nieuwWaarde.adviesStatus) {
      setFout('Kies een status.')
      return
    }
    if (!nieuwWaarde.toelichting.trim()) {
      setFout('Vul een toelichting in.')
      return
    }
    setBezig(true)
    try {
      const isSignaal = nieuwBron && nieuwBron !== 'handmatig'
      const signaalBevroren = isSignaal ? createSignaalBevroren(nieuwBron) : null
      const adviespunt = createAdviespunt({
        onderwerp: nieuwWaarde.onderwerp,
        herkomst: isSignaal ? 'automatisch' : 'handmatig',
        adviesStatus: nieuwWaarde.adviesStatus,
        toelichting: nieuwWaarde.toelichting,
        herbeoordelenBij: nieuwWaarde.herbeoordelenBij,
        signaalBevroren,
      })
      opslaanDossier(addAdviespunt(dossier, adviespunt))
      setNieuwBron(null)
    } catch {
      setFout('Opslaan is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  function startBewerken(advies) {
    setBewerkId(advies.adviespuntId)
    setBewerkWaarde({
      onderwerp: advies.onderwerp,
      adviesStatus: advies.adviesStatus,
      toelichting: advies.toelichting,
      herbeoordelenBij: advies.herbeoordelenBij ?? '',
    })
    setFout(null)
  }

  function annuleerBewerken() {
    setBewerkId(null)
    setFout(null)
  }

  function bevestigBewerken() {
    setFout(null)
    if (!bewerkWaarde.onderwerp.trim() || !bewerkWaarde.toelichting.trim()) {
      setFout('Onderwerp en toelichting zijn verplicht.')
      return
    }
    setBezig(true)
    try {
      opslaanDossier(
        updateAdviespunt(dossier, bewerkId, {
          onderwerp: bewerkWaarde.onderwerp.trim(),
          adviesStatus: bewerkWaarde.adviesStatus,
          toelichting: bewerkWaarde.toelichting.trim(),
          herbeoordelenBij: bewerkWaarde.herbeoordelenBij.trim() || null,
        }),
      )
      setBewerkId(null)
    } catch {
      setFout('Wijzigen is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  function verwijder(adviespuntId) {
    setFout(null)
    try {
      opslaanDossier(removeAdviespunt(dossier, adviespuntId))
    } catch {
      setFout('Verwijderen is niet gelukt. Probeer het opnieuw.')
    }
  }

  function afronden() {
    setFout(null)
    setBezig(true)
    try {
      opslaanDossier(completeDossier(dossier))
    } catch {
      setFout('Afronden is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  // Signalen die al als adviespunt zijn overgenomen, worden niet nogmaals
  // als kandidaat getoond.
  const gebruikteComponentIds = new Set(dossier.adviespunten.filter((a) => a.signaalBevroren).map((a) => a.signaalBevroren.componentId))
  const kandidaten = insights.filter((i) => !gebruikteComponentIds.has(i.componentId))
  // Zuiver visuele groepering (geen nieuwe status, geen nieuwe datalaag):
  // bij veel bouwdelen met onbekende aanwezigheid/leeftijd komen anders
  // meerdere losse "Onvoldoende informatie"-regels achter elkaar te staan.
  // Elk signaal blijft afzonderlijk zichtbaar en te kiezen.
  const kandidatenMetSignaal = kandidaten.filter((i) => i.status !== 'onvoldoende_informatie')
  const kandidatenOnbekend = kandidaten.filter((i) => i.status === 'onvoldoende_informatie')

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Adviesdossier</p>
          <h3 className="text-xl text-primary">Advies</h3>
        </div>
        {!open ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <CheckCircle size={14} weight="fill" /> Afgerond
          </span>
        ) : null}
      </div>
      <p className="-mt-4 text-sm text-foreground-muted">
        {open
          ? 'Leg hier vast wat u met de klant bespreekt — ook "geen actie nodig" of "later opnieuw beoordelen" zijn volwaardige uitkomsten.'
          : 'Dit dossier is afgerond. Het advies hieronder is definitief vastgelegd en kan niet meer worden gewijzigd.'}
      </p>

      {dossier.adviespunten.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
          Nog geen adviespunten vastgelegd.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {dossier.adviespunten.map((advies) =>
            bewerkId === advies.adviespuntId ? (
              <li key={advies.adviespuntId}>
                <AdviesFormulier
                  idPrefix={`bewerk-${advies.adviespuntId}`}
                  waarde={bewerkWaarde}
                  onWijzig={setBewerkWaarde}
                  onOpslaan={bevestigBewerken}
                  onAnnuleer={annuleerBewerken}
                  bezig={bezig}
                  fout={fout}
                />
              </li>
            ) : (
              <li key={advies.adviespuntId} className="rounded-lg border border-border p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-primary">{advies.onderwerp}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <HerkomstBadge herkomst={advies.herkomst} />
                    <AdviesStatusBadge status={advies.adviesStatus} />
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground-muted">{advies.toelichting}</p>
                {advies.herbeoordelenBij ? <p className="mt-2 text-xs text-foreground-muted">Opnieuw beoordelen: {advies.herbeoordelenBij}</p> : null}
                {advies.signaalBevroren ? (
                  <p className="mt-2 text-xs text-foreground-muted">
                    Oorspronkelijk MJOP-signaal: {advies.signaalBevroren.statusLabel}
                    {advies.signaalBevroren.relevantYear ? ` (${advies.signaalBevroren.relevantYear})` : ''}
                  </p>
                ) : null}
                {open ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button type="button" variant="ghost" size="sm" onClick={() => startBewerken(advies)}>
                      Aanpassen
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => verwijder(advies.adviespuntId)}>
                      Verwijderen
                    </Button>
                  </div>
                ) : null}
              </li>
            ),
          )}
        </ul>
      )}

      {open ? (
        <div className="flex flex-col gap-4 border-t border-border pt-6">
          {kandidatenMetSignaal.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Automatisch beschikbare signalen uit MJOP</p>
              <ul className="flex flex-col gap-2">
                {kandidatenMetSignaal.map((insight) => (
                  <KandidaatItem key={insight.componentId} insight={insight} onKies={startVanuitSignaal} />
                ))}
              </ul>
            </div>
          ) : null}

          {kandidatenOnbekend.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Aanvullende informatie nodig</p>
              <ul className="flex flex-col gap-2">
                {kandidatenOnbekend.map((insight) => (
                  <KandidaatItem key={insight.componentId} insight={insight} onKies={startVanuitSignaal} />
                ))}
              </ul>
            </div>
          ) : null}

          {nieuwBron ? (
            <AdviesFormulier idPrefix="nieuw" waarde={nieuwWaarde} onWijzig={setNieuwWaarde} onOpslaan={bevestigNieuw} onAnnuleer={annuleerNieuw} bezig={bezig} fout={fout} />
          ) : (
            <div>
              <Button type="button" variant="outline" size="sm" onClick={startHandmatig}>
                Handmatig adviespunt toevoegen
              </Button>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <Button type="button" variant="secondary" size="sm" onClick={afronden} disabled={bezig}>
              {bezig ? <SpinnerGap size={16} className="animate-spin" /> : null}
              Dossier afronden
            </Button>
            <p className="mt-2 text-xs text-foreground-muted">Na afronden staat het advies vast en kan het niet meer worden gewijzigd.</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
