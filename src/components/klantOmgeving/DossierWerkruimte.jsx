import { useMemo, useState } from 'react'
import { CheckCircle, WarningCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { STATUSES } from '../../lib/mjop/constants'
import { buildInsights } from '../../lib/mjop/linking'
import { createSignaalBevroren, createEnergieSignaalBevroren } from '../../lib/dossier/adviespunt'
import { buildEnergieInsights } from '../../lib/dossier/energieInsights'
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

// investeringLaag/investeringHoog/besparingEuro/terugverdientijdJaren/prioriteit
// (Adviesrapport-ronde, 0024_adviespunten_financiele_indicatie.sql): altijd
// optioneel — voeden uitsluitend de maatregelentabel in een gegenereerd
// adviesrapport, nooit verplicht voor "geen actie nodig"/"onvoldoende
// informatie". Als tekst-strings in formulierstate (net als de rest van dit
// formulier), pas bij opslaan omgezet naar getal-of-null.
const LEEG_FORMULIER = {
  onderwerp: '',
  adviesStatus: '',
  toelichting: '',
  herbeoordelenBij: '',
  herbeoordelenDatum: '',
  investeringLaag: '',
  investeringHoog: '',
  besparingEuro: '',
  terugverdientijdJaren: '',
  prioriteit: '',
}

/** Lege string -> null, anders Number(...) — voor de vijf optionele financiële formuliervelden bij opslaan. */
function getalOfNull(waarde) {
  if (waarde === '' || waarde === null || waarde === undefined) return null
  const n = Number(waarde)
  return Number.isFinite(n) ? n : null
}
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
      <div className="grid gap-4 sm:grid-cols-2">
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
        <div>
          <Veld id={`${idPrefix}-herbeoordelen-datum`} label="Herbeoordelingsdatum" kind="optioneel" />
          <input
            id={`${idPrefix}-herbeoordelen-datum`}
            type="date"
            value={waarde.herbeoordelenDatum}
            onChange={(e) => onWijzig({ ...waarde, herbeoordelenDatum: e.target.value })}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-foreground-muted">
            Alleen invullen als er een concrete datum bekend is — de tekst hiernaast blijft de toelichting, ook zonder datum.
          </p>
        </div>
      </div>
      <div className="border-t border-border pt-4">
        <p className="mb-3 text-sm font-medium text-primary">
          Financiële indicatie <span className="font-normal text-foreground-muted">(optioneel — voor de maatregelentabel in een adviesrapport)</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Veld id={`${idPrefix}-investering-laag`} label="Investering vanaf (€, excl. btw)" kind="optioneel" />
            <input
              id={`${idPrefix}-investering-laag`}
              type="number"
              min="0"
              value={waarde.investeringLaag}
              onChange={(e) => onWijzig({ ...waarde, investeringLaag: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <Veld id={`${idPrefix}-investering-hoog`} label="Investering tot (€, excl. btw)" kind="optioneel" />
            <input
              id={`${idPrefix}-investering-hoog`}
              type="number"
              min="0"
              value={waarde.investeringHoog}
              onChange={(e) => onWijzig({ ...waarde, investeringHoog: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <Veld id={`${idPrefix}-besparing`} label="Besparing per jaar (€)" kind="optioneel" />
            <input
              id={`${idPrefix}-besparing`}
              type="number"
              min="0"
              value={waarde.besparingEuro}
              onChange={(e) => onWijzig({ ...waarde, besparingEuro: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <Veld id={`${idPrefix}-terugverdientijd`} label="Terugverdientijd (jaar)" kind="optioneel" />
            <input
              id={`${idPrefix}-terugverdientijd`}
              type="number"
              min="0"
              step="0.5"
              value={waarde.terugverdientijdJaren}
              onChange={(e) => onWijzig({ ...waarde, terugverdientijdJaren: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <Veld id={`${idPrefix}-prioriteit`} label="Prioriteit" kind="optioneel" />
            <select id={`${idPrefix}-prioriteit`} value={waarde.prioriteit} onChange={(e) => onWijzig({ ...waarde, prioriteit: e.target.value })} className={inputClass}>
              <option value="">Geen</option>
              <option value="1">1 — hoog</option>
              <option value="2">2 — gemiddeld</option>
              <option value="3">3 — laag</option>
            </select>
          </div>
        </div>
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

// Zelfde visuele opzet als KandidaatItem hierboven, voor een Energie-insight
// (lib/dossier/energieInsights.js) — een eigen component omdat de velden
// niet overeenkomen (onderwerp/reden i.p.v. componentLabel/statusLabel/
// relevantYear), bewust geen hergebruik van KandidaatItem om het bestaande
// MJOP-pad op geen enkele manier te hoeven aanraken.
function EnergieKandidaatItem({ insight, onKies }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border px-4 py-3">
      <div>
        <p className="text-sm font-medium text-primary">{insight.onderwerp}</p>
        <p className="text-xs text-foreground-muted">{insight.reden}</p>
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

export function DossierWerkruimte({
  dossier: initieelDossier,
  adviespunten: initieleAdviespunten,
  mjopSnapshot = null,
  energieSnapshot = null,
  onDossierChange,
  magBewerken = true,
  // Security-hardeningsronde (2026-09-28): apart van magBewerken (dat
  // uitsluitend "is dit dossier open" betekent) — magBeheren bepaalt of
  // deze sessie een adviespunt mag toevoegen/aanpassen/verwijderen of het
  // dossier mag afronden. Default false (veiligste kant): alleen
  // DossierDetail.jsx zet dit expliciet op isAdmin. RLS (adviespunten_
  // insert/update/delete, 0020_account_security_hardening.sql) weigert een
  // niet-admin sowieso al — dit verbergt alleen bedieningselementen die
  // voor een klant toch altijd zouden falen, zelfde patroon als
  // OffertesHistorie.jsx se magBeheren.
  magBeheren = false,
}) {
  const [dossier, setDossier] = useState(initieelDossier)
  const [adviespunten, setAdviespunten] = useState(initieleAdviespunten)
  const [nieuwBron, setNieuwBron] = useState(null) // null | 'handmatig' | insight-object
  const [nieuwWaarde, setNieuwWaarde] = useState(LEEG_FORMULIER)
  const [bewerkId, setBewerkId] = useState(null)
  const [bewerkWaarde, setBewerkWaarde] = useState(LEEG_FORMULIER)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  const open = dossier.status === 'open' && magBewerken

  // Altijd berekend uit de bevroren mjopSnapshot van dít Dossier, nooit uit
  // de actuele MJOP-building (zie de moduledoc hierboven). buildInsights()
  // verwacht een object met een `components`-array — exact de vorm van
  // mjopSnapshot zelf (zie createMjopSnapshotFromBuilding in mjopAdapter.js).
  const insights = useMemo(() => (mjopSnapshot?.components ? buildInsights(mjopSnapshot) : []), [mjopSnapshot])
  const gebruikteComponentIds = new Set(adviespunten.filter((a) => a.signaal_bevroren).map((a) => a.signaal_bevroren.componentId))
  const kandidaten = insights.filter((i) => !gebruikteComponentIds.has(i.componentId))
  const kandidatenMetSignaal = kandidaten.filter((i) => i.status !== 'onvoldoende_informatie')
  const kandidatenOnbekend = kandidaten.filter((i) => i.status === 'onvoldoende_informatie')

  // Zelfde opzet als hierboven, voor Energie-indicatie (Fase 4): altijd
  // berekend uit de bevroren energieSnapshot van dít Dossier (zie
  // lib/dossier/energieInsights.js) — nooit uit een live herberekening.
  // Eigen dedup-set, want een Energie-signaal heeft geen componentId: de
  // maatregelnaam zelf (energieMaatregelId) is hier de stabiele identiteit.
  const energieInsights = useMemo(() => buildEnergieInsights(energieSnapshot), [energieSnapshot])
  const gebruikteEnergieIds = new Set(
    adviespunten.filter((a) => a.signaal_bevroren?.herkomst === 'energie').map((a) => a.signaal_bevroren.energieMaatregelId),
  )
  const energieKandidaten = energieInsights.filter((i) => !gebruikteEnergieIds.has(i.energieMaatregelId))

  function startHandmatig() {
    setNieuwBron('handmatig')
    setNieuwWaarde(LEEG_FORMULIER)
    setFout(null)
  }

  function startVanuitSignaal(insight) {
    setNieuwBron(insight)
    // Geen investering/besparing vooringevuld: een MJOP-signaal bevat die
    // data niet (zie lib/mjop/linking.js) — alleen status/jaartal.
    setNieuwWaarde({ ...LEEG_FORMULIER, onderwerp: insight.componentLabel, adviesStatus: insight.status })
    setFout(null)
  }

  // Bewust géén vooringevulde adviesStatus (in tegenstelling tot
  // startVanuitSignaal hierboven voor MJOP): een Energie-kandidaat heeft
  // zelf geen adviesstatus (zie energieInsights.js) — Richard kiest die
  // hier altijd zelf, precies zoals bij een handmatig adviespunt.
  // investeringLaag/investeringHoog/besparingEuro/terugverdientijdJaren WEL
  // vooringevuld: die bedragen staan al, bevroren, in de Energie-snapshot
  // (buildEnergieInsights()) — hier alleen overnemen, nooit herberekenen.
  // De adviseur ziet en kan ze altijd nog aanpassen vóór opslaan.
  function startVanuitEnergieSignaal(insight) {
    setNieuwBron(insight)
    setNieuwWaarde({
      ...LEEG_FORMULIER,
      onderwerp: insight.onderwerp,
      investeringLaag: insight.investeringLaag ?? '',
      investeringHoog: insight.investeringHoog ?? '',
      besparingEuro: insight.besparingEuro ?? '',
      terugverdientijdJaren: insight.terugverdientijd ?? '',
    })
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
      const isEnergieSignaal = isSignaal && nieuwBron.herkomst === 'energie'
      const nieuw = await addAdviespunt(dossier.dossier_id, {
        onderwerp: nieuwWaarde.onderwerp,
        herkomst: isSignaal ? 'automatisch' : 'handmatig',
        adviesStatus: nieuwWaarde.adviesStatus,
        toelichting: nieuwWaarde.toelichting,
        herbeoordelenBij: nieuwWaarde.herbeoordelenBij,
        herbeoordelenDatum: nieuwWaarde.herbeoordelenDatum,
        signaalBevroren: isSignaal ? (isEnergieSignaal ? createEnergieSignaalBevroren(nieuwBron) : createSignaalBevroren(nieuwBron)) : null,
        investeringLaag: getalOfNull(nieuwWaarde.investeringLaag),
        investeringHoog: getalOfNull(nieuwWaarde.investeringHoog),
        besparingEuro: getalOfNull(nieuwWaarde.besparingEuro),
        terugverdientijdJaren: getalOfNull(nieuwWaarde.terugverdientijdJaren),
        prioriteit: getalOfNull(nieuwWaarde.prioriteit),
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
      herbeoordelenDatum: advies.herbeoordelen_datum ?? '',
      investeringLaag: advies.investering_laag ?? '',
      investeringHoog: advies.investering_hoog ?? '',
      besparingEuro: advies.besparing_euro ?? '',
      terugverdientijdJaren: advies.terugverdientijd_jaren ?? '',
      prioriteit: advies.prioriteit ?? '',
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
        herbeoordelenDatum: bewerkWaarde.herbeoordelenDatum,
        investeringLaag: getalOfNull(bewerkWaarde.investeringLaag),
        investeringHoog: getalOfNull(bewerkWaarde.investeringHoog),
        besparingEuro: getalOfNull(bewerkWaarde.besparingEuro),
        terugverdientijdJaren: getalOfNull(bewerkWaarde.terugverdientijdJaren),
        prioriteit: getalOfNull(bewerkWaarde.prioriteit),
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
        {!open ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <CheckCircle size={14} weight="fill" /> Afgerond
          </span>
        ) : null}
      </div>
      <p className="-mt-4 text-sm text-foreground-muted">
        {open
          ? magBeheren
            ? 'Leg hier vast wat u met de klant bespreekt — ook "geen actie nodig" of "later opnieuw beoordelen" zijn volwaardige uitkomsten.'
            : 'Hier verschijnt het advies zodra SMV dit voor dit dossier heeft vastgelegd.'
          : 'Dit dossier is afgerond. Het advies hieronder is definitief vastgelegd en kan niet meer worden gewijzigd.'}
      </p>

      {adviespunten.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
          {magBeheren ? 'Nog geen adviespunten vastgelegd.' : 'Er is voor dit dossier nog geen definitief advies beschikbaar.'}
        </p>
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
                    herbeoordelenDatum: advies.herbeoordelen_datum,
                    signaalBevroren: advies.signaal_bevroren,
                    investeringLaag: advies.investering_laag,
                    investeringHoog: advies.investering_hoog,
                    besparingEuro: advies.besparing_euro,
                    terugverdientijdJaren: advies.terugverdientijd_jaren,
                    prioriteit: advies.prioriteit,
                  }}
                  actions={
                    open && magBeheren ? (
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

      {open && magBeheren ? (
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

          {energieKandidaten.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Automatisch beschikbare signalen uit Energie-indicatie</p>
              <ul className="flex flex-col gap-2">
                {energieKandidaten.map((insight) => (
                  <EnergieKandidaatItem key={insight.energieMaatregelId} insight={insight} onKies={startVanuitEnergieSignaal} />
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
      ) : (
        <Resultaat adviespunten={adviespunten} />
      )}
    </div>
  )
}

export { AdviesStatusBadge, HerkomstBadge }
