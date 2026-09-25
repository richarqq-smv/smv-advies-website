import { useMemo, useState } from 'react'
import { CheckCircle, WarningCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { STATUSES } from '../../lib/mjop/constants'
import { buildInsights } from '../../lib/mjop/linking'
import { createSignaalBevroren } from '../../lib/dossier/adviespunt'
import { groepeerAdviespunten } from '../../lib/dossier/adviesresultaat'
import { AdviesStatusBadge, HerkomstBadge, AdviespuntKaart } from '../dossier/AdviesBeheer'
import { addAdviespunt, updateAdviespunt, removeAdviespunt, completeDossier } from '../../lib/klantOmgeving/api'

/**
 * Supabase-backed equivalent van components/dossier/AdviesBeheer.jsx +
 * AdviesResultaat.jsx, voor de echte klantomgeving (/dossier/:id) en het
 * adminoverzicht. Zelfde UX, zelfde vijf statussen, zelfde
 * herkomst/signaalBevroren-onderscheid — hergebruikt bewust dezelfde
 * badges/kaart-component en groepeerfunctie, alleen de persistentie is
 * anders: elke mutatie is een gerichte insert/update/delete op de
 * `adviespunten`-tabel (niet één "hele Dossier opslaan"-aanroep, zoals
 * bij de localStorage-versie, want adviespunten is hier een eigen tabel).
 *
 * MJOP-signaalkandidaten (`mjopSnapshot`, optioneel): exact dezelfde
 * regellogica als AdviesBeheer.jsx, hergebruikt (buildInsights uit
 * lib/mjop/linking.js, createSignaalBevroren uit lib/dossier/adviespunt.js
 * — beide pure functies, geen wijziging nodig). Cruciaal: de kandidaten
 * worden altijd berekend uit `mjopSnapshot.components` — de BEVROREN
 * momentopname die bij het openen van dit Dossier is vastgelegd, nooit uit
 * de actuele/live MJOP-building. Wijzigt de klant later iets in de
 * MJOP-tool, dan verandert dat dus nooit met terugwerkende kracht welke
 * signalen dit Dossier toont, en al helemaal niet die van een afgerond
 * Dossier (dat sowieso niet meer beschrijfbaar is — zie de dossiers/
 * adviespunten-integriteitstriggers in 0001_init.sql).
 */

const LEEG_FORMULIER = { onderwerp: '', adviesStatus: '', toelichting: '', herbeoordelenBij: '' }
const STATUS_KEYS = Object.keys(STATUSES)

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
        <input id={`${idPrefix}-onderwerp`} type="text" value={waarde.onderwerp} onChange={(e) => onWijzig({ ...waarde, onderwerp: e.target.value })} className={inputClass} />
      </div>
      <div>
        <Veld id={`${idPrefix}-status`} label="Status" verplicht />
        <select id={`${idPrefix}-status`} value={waarde.adviesStatus} onChange={(e) => onWijzig({ ...waarde, adviesStatus: e.target.value })} className={inputClass}>
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

/** Resultaatweergave (groepering per status) — alleen getoond bij een afgerond Dossier of desgewenst ernaast. */
function Resultaat({ adviespunten }) {
  const { groepen, totaal } = groepeerAdviespunten(adviespunten.map((a) => ({ ...a, adviesStatus: a.advies_status, adviespuntId: a.adviespunt_id })))
  if (totaal === 0) return null
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6">
      <div className="flex flex-wrap gap-2" role="list" aria-label="Aantal adviespunten per status">
        {groepen.map((groep) => (
          <span
            key={groep.status}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${groep.aantal > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground-muted'}`}
          >
            {groep.label}
            <span className="font-mono">{groep.aantal}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// `magBewerken` staat standaard uit: alleen de adviseur (admin) krijgt
// bewerkrechten, expliciet meegegeven door DossierDetail — zie
// lib/klantOmgeving/rechten.js en migration 0006.
export function DossierWerkruimte({ dossier: initieelDossier, adviespunten: initieleAdviespunten, mjopSnapshot = null, onDossierChange, magBewerken = false }) {
  const [dossier, setDossier] = useState(initieelDossier)
  const [adviespunten, setAdviespunten] = useState(initieleAdviespunten)
  const [nieuwBron, setNieuwBron] = useState(null) // null | 'handmatig' | insight-object
  const [nieuwWaarde, setNieuwWaarde] = useState(LEEG_FORMULIER)
  const [bewerkId, setBewerkId] = useState(null)
  const [bewerkWaarde, setBewerkWaarde] = useState(LEEG_FORMULIER)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  const afgerond = dossier.status === 'afgerond'
  const open = !afgerond && magBewerken

  // Altijd berekend uit de bevroren mjopSnapshot van dít Dossier, nooit uit
  // de actuele MJOP-building (zie de moduledoc hierboven). buildInsights()
  // verwacht een object met een `components`-array — exact de vorm van
  // mjopSnapshot zelf (zie createMjopSnapshotFromBuilding in mjopAdapter.js).
  const insights = useMemo(() => (mjopSnapshot?.components ? buildInsights(mjopSnapshot) : []), [mjopSnapshot])
  const gebruikteComponentIds = new Set(adviespunten.filter((a) => a.signaal_bevroren).map((a) => a.signaal_bevroren.componentId))
  const kandidaten = insights.filter((i) => !gebruikteComponentIds.has(i.componentId))
  const kandidatenMetSignaal = kandidaten.filter((i) => i.status !== 'onvoldoende_informatie')
  const kandidatenOnbekend = kandidaten.filter((i) => i.status === 'onvoldoende_informatie')

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

  async function bevestigNieuw() {
    setFout(null)
    if (!nieuwWaarde.onderwerp.trim()) return setFout('Vul een onderwerp in.')
    if (!nieuwWaarde.adviesStatus) return setFout('Kies een status.')
    if (!nieuwWaarde.toelichting.trim()) return setFout('Vul een toelichting in.')
    setBezig(true)
    try {
      const isSignaal = nieuwBron && nieuwBron !== 'handmatig'
      const nieuw = await addAdviespunt(dossier.dossier_id, {
        onderwerp: nieuwWaarde.onderwerp,
        herkomst: isSignaal ? 'automatisch' : 'handmatig',
        adviesStatus: nieuwWaarde.adviesStatus,
        toelichting: nieuwWaarde.toelichting,
        herbeoordelenBij: nieuwWaarde.herbeoordelenBij,
        signaalBevroren: isSignaal ? createSignaalBevroren(nieuwBron) : null,
      })
      setAdviespunten((v) => [...v, nieuw])
      setNieuwBron(null)
    } catch {
      setFout('Opslaan is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  function startBewerken(advies) {
    setBewerkId(advies.adviespunt_id)
    setBewerkWaarde({
      onderwerp: advies.onderwerp,
      adviesStatus: advies.advies_status,
      toelichting: advies.toelichting,
      herbeoordelenBij: advies.herbeoordelen_bij ?? '',
    })
    setFout(null)
  }

  function annuleerBewerken() {
    setBewerkId(null)
    setFout(null)
  }

  async function bevestigBewerken() {
    setFout(null)
    if (!bewerkWaarde.onderwerp.trim() || !bewerkWaarde.toelichting.trim()) return setFout('Onderwerp en toelichting zijn verplicht.')
    setBezig(true)
    try {
      const bijgewerkt = await updateAdviespunt(bewerkId, {
        onderwerp: bewerkWaarde.onderwerp,
        adviesStatus: bewerkWaarde.adviesStatus,
        toelichting: bewerkWaarde.toelichting,
        herbeoordelenBij: bewerkWaarde.herbeoordelenBij,
      })
      setAdviespunten((v) => v.map((a) => (a.adviespunt_id === bijgewerkt.adviespunt_id ? bijgewerkt : a)))
      setBewerkId(null)
    } catch {
      setFout('Wijzigen is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  async function verwijder(adviespuntId) {
    setFout(null)
    try {
      await removeAdviespunt(adviespuntId)
      setAdviespunten((v) => v.filter((a) => a.adviespunt_id !== adviespuntId))
    } catch {
      setFout('Verwijderen is niet gelukt. Probeer het opnieuw.')
    }
  }

  async function afronden() {
    setFout(null)
    setBezig(true)
    try {
      const bijgewerkt = await completeDossier(dossier.dossier_id)
      setDossier(bijgewerkt)
      onDossierChange?.(bijgewerkt)
    } catch {
      setFout('Afronden is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Adviesdossier</p>
          <h3 className="text-xl text-primary">Advies</h3>
        </div>
        {afgerond ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <CheckCircle size={14} weight="fill" /> Afgerond
          </span>
        ) : null}
      </div>
      <p className="-mt-4 text-sm text-foreground-muted">
        {open
          ? 'Leg hier vast wat u met de klant bespreekt — ook "geen actie nodig" of "later opnieuw beoordelen" zijn volwaardige uitkomsten.'
          : afgerond
            ? 'Dit dossier is afgerond. Het advies hieronder is definitief vastgelegd en kan niet meer worden gewijzigd.'
            : 'SMV Advies werkt aan het advies voor dit pand. Zodra het advies is afgerond, ziet u hier de uitkomst.'}
      </p>

      {adviespunten.length === 0 ? (
        open || afgerond ? (
          <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen adviespunten vastgelegd.</p>
        ) : null
      ) : (
        <ul className="flex flex-col gap-3">
          {adviespunten.map((advies) =>
            bewerkId === advies.adviespunt_id ? (
              <li key={advies.adviespunt_id}>
                <AdviesFormulier idPrefix={`bewerk-${advies.adviespunt_id}`} waarde={bewerkWaarde} onWijzig={setBewerkWaarde} onOpslaan={bevestigBewerken} onAnnuleer={annuleerBewerken} bezig={bezig} fout={fout} />
              </li>
            ) : (
              <li key={advies.adviespunt_id}>
                <AdviespuntKaart
                  advies={{
                    onderwerp: advies.onderwerp,
                    herkomst: advies.herkomst,
                    adviesStatus: advies.advies_status,
                    toelichting: advies.toelichting,
                    herbeoordelenBij: advies.herbeoordelen_bij,
                    signaalBevroren: advies.signaal_bevroren,
                  }}
                  actions={
                    open ? (
                      <>
                        <Button type="button" variant="ghost" size="sm" onClick={() => startBewerken(advies)}>
                          Aanpassen
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => verwijder(advies.adviespunt_id)}>
                          Verwijderen
                        </Button>
                      </>
                    ) : null
                  }
                />
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
      ) : afgerond ? (
        <Resultaat adviespunten={adviespunten} />
      ) : null}
    </div>
  )
}

export { AdviesStatusBadge, HerkomstBadge }
