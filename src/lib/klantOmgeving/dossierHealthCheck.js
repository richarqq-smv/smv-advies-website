/**
 * Dossier Health Check (werkfase Fase 6 — SMV-audit-opvolging, 2026-09-28).
 *
 * Pure, I/O-vrije helper: zegt UITSLUITEND of de benodigde informatie/
 * administratie aanwezig is voor een Dossier — nooit of een advies
 * inhoudelijk goed is. Geen score, geen percentage, geen "100 punten":
 * drie feitelijke uitkomsten per categorie, `gereed` | `aandacht` |
 * `ontbreekt`, elk met een korte, feitelijke reden (geen waardeoordeel).
 *
 * Hergebruikt uitsluitend al bestaande data/velden — geen nieuwe
 * databasevelden, geen dubbele businesslogica: het aantal nog niet
 * overgenomen MJOP-/Energie-signalen (`openSignalenAantal`) wordt door de
 * aanroeper meegegeven (die heeft dat vaak al berekend via
 * lib/mjop/linking.js#buildInsights / lib/dossier/energieInsights.js
 * #buildEnergieInsights, zie DossierWerkruimte.jsx) — deze module rekent
 * dat zelf nooit opnieuw uit. `null`/`undefined` betekent "niet
 * geëvalueerd" (bijv. in een lichter overzicht dat niet elk dossier se
 * signalen herberekent), niet "geen open signalen".
 *
 * Sinds de Energie/MJOP/Advies-werkronde: elke categorie krijgt ook een
 * `actie` (`{ label, to }` of `{ label, href }`, of `null` als er niets
 * zinvols te doen valt) — zie bepaalActie() hieronder. Blijft feitelijk:
 * de actie is altijd "waar dit al bestaande scherm staat", nooit een
 * inhoudelijk advies ("doe dit eerst").
 */

import { ROUTES } from '../routes.js'
import { voegDossierContextToe } from './dossierNavigatie.js'

export const HEALTH_STATUS = {
  GEREED: 'gereed',
  AANDACHT: 'aandacht',
  ONTBREEKT: 'ontbreekt',
}

function veld(waarde) {
  return typeof waarde === 'string' ? waarde.trim() : waarde
}

function heeftWaarde(waarde) {
  const v = veld(waarde)
  return v !== null && v !== undefined && v !== ''
}

/**
 * KLANT: naam/bedrijfsnaam + minstens één bruikbare contactpersoon (naam +
 * e-mail of telefoon). Geëxporteerd (naast bouwDossierHealthCheck) zodat
 * accountActies.js dezelfde feitelijke controle kan hergebruiken voor de
 * "Acties voor u"-lijst op /account, zonder een tweede, licht afwijkende
 * kopie van deze regel te introduceren.
 */
export function controleerKlant({ klant, contactpersoon }) {
  if (!heeftWaarde(klant?.naam) && !heeftWaarde(klant?.bedrijfsnaam)) {
    return { status: HEALTH_STATUS.ONTBREEKT, reden: 'Geen klantnaam of bedrijfsnaam bekend.' }
  }
  if (!contactpersoon || !heeftWaarde(contactpersoon.naam)) {
    return { status: HEALTH_STATUS.AANDACHT, reden: 'Geen (primaire) contactpersoon bekend bij deze klant.' }
  }
  if (!heeftWaarde(contactpersoon.email) && !heeftWaarde(contactpersoon.telefoon)) {
    return { status: HEALTH_STATUS.AANDACHT, reden: 'Contactpersoon heeft geen e-mailadres of telefoonnummer.' }
  }
  return { status: HEALTH_STATUS.GEREED, reden: 'Klant- en contactgegevens compleet.' }
}

/** PAND: adres/postcode/plaats (kunnen bereiken) + gebruikstype (relevant voor advies). Geëxporteerd, zie controleerKlant hierboven. */
export function controleerPand({ pand }) {
  const adresVelden = [pand?.adres, pand?.postcode, pand?.plaats]
  const aantalIngevuld = adresVelden.filter(heeftWaarde).length
  if (aantalIngevuld === 0) {
    return { status: HEALTH_STATUS.ONTBREEKT, reden: 'Geen adresgegevens van het pand bekend.' }
  }
  if (aantalIngevuld < adresVelden.length || !heeftWaarde(pand?.gebruikstype)) {
    return { status: HEALTH_STATUS.AANDACHT, reden: 'Adres of gebruikstype van het pand nog niet compleet.' }
  }
  return { status: HEALTH_STATUS.GEREED, reden: 'Pandgegevens compleet.' }
}

/** ENERGIE: is er een (bevroren) Energie-indicatie-snapshot bij dit Dossier? Atomair — geen tussenstap mogelijk. Geëxporteerd, zie controleerKlant hierboven. */
export function controleerEnergie({ energieSnapshot }) {
  if (!energieSnapshot) {
    return { status: HEALTH_STATUS.ONTBREEKT, reden: 'Geen Energie-indicatie gekoppeld aan dit dossier.' }
  }
  return { status: HEALTH_STATUS.GEREED, reden: 'Energie-indicatie gekoppeld.' }
}

/** MJOP: is er een snapshot, en bevat die daadwerkelijk bouwdelen/installaties? Geëxporteerd, zie controleerKlant hierboven. */
export function controleerMjop({ mjopSnapshot }) {
  if (!mjopSnapshot) {
    return { status: HEALTH_STATUS.ONTBREEKT, reden: 'Geen MJOP gekoppeld aan dit dossier.' }
  }
  if (!Array.isArray(mjopSnapshot.components) || mjopSnapshot.components.length === 0) {
    return { status: HEALTH_STATUS.AANDACHT, reden: 'MJOP gekoppeld, maar bevat nog geen bouwdelen/installaties.' }
  }
  return { status: HEALTH_STATUS.GEREED, reden: 'MJOP gekoppeld met bouwdelen/installaties.' }
}

/**
 * ADVIES: zijn er adviespunten vastgelegd, en zijn er (voor zover bekend)
 * nog openstaande automatische signalen die nog geen adviespunt zijn
 * geworden? `openSignalenAantal` is optioneel (zie moduledoc) — bij
 * `null`/`undefined` wordt alleen op aanwezigheid van adviespunten
 * gecontroleerd.
 */
function controleerAdvies({ adviespunten = [], openSignalenAantal = null }) {
  if (adviespunten.length === 0) {
    return { status: HEALTH_STATUS.ONTBREEKT, reden: 'Nog geen adviespunten vastgelegd.' }
  }
  if (typeof openSignalenAantal === 'number' && openSignalenAantal > 0) {
    const woord = openSignalenAantal === 1 ? 'automatisch signaal' : 'automatische signalen'
    return {
      status: HEALTH_STATUS.AANDACHT,
      reden: `${openSignalenAantal} ${woord} nog niet beoordeeld.`,
    }
  }
  return { status: HEALTH_STATUS.GEREED, reden: 'Adviespunten vastgelegd.' }
}

/**
 * OPNAME: is er een locatiebezoek geregistreerd, en is minstens één
 * daarvan afgerond? Geëxporteerd, zie controleerKlant hierboven.
 * `opnames` is optioneel: dossierweergaves die dit (nog) niet laden geven
 * simpelweg `[]` mee — zelfde patroon als offertes/adviespunten.
 */
export function controleerOpname({ opnames = [] }) {
  if (opnames.length === 0) {
    return { status: HEALTH_STATUS.ONTBREEKT, reden: 'Nog geen opname (locatiebezoek) gestart.' }
  }
  if (!opnames.some((o) => o.status === 'afgerond')) {
    return { status: HEALTH_STATUS.AANDACHT, reden: 'Opname gestart, nog niet afgerond.' }
  }
  return { status: HEALTH_STATUS.GEREED, reden: 'Opname afgerond.' }
}

/**
 * SUBSIDIES: feitelijk — is er een subsidietraject vastgelegd, en is dat
 * traject afgerond (toegekend/afgewezen/verantwoord) of nog in
 * behandeling? Geen oordeel over de kans van slagen. Pakket-onafhankelijk
 * (pakketarchitectuurronde, 2026-10-08): subsidie-backenddata bestaat
 * voor elk dossier, dus deze functie kent zelf geen pakketbegrip — de
 * aanroeper beslist via `subsidiesZichtbaar` of de categorie überhaupt
 * meeweegt (zie bouwDossierHealthCheck hieronder). Geëxporteerd, zie
 * controleerKlant hierboven.
 */
export function controleerSubsidies({ subsidies = [] }) {
  if (subsidies.length === 0) {
    return { status: HEALTH_STATUS.ONTBREEKT, reden: 'Nog geen subsidietraject vastgelegd.' }
  }
  const nogInBehandeling = subsidies.some((s) => s.status === 'voorbereiding' || s.status === 'ingediend')
  if (nogInBehandeling) {
    return { status: HEALTH_STATUS.AANDACHT, reden: 'Subsidietraject vastgelegd, nog in behandeling.' }
  }
  return { status: HEALTH_STATUS.GEREED, reden: 'Subsidietraject(en) afgerond (toegekend/afgewezen/verantwoord).' }
}

/**
 * OFFERTE: puur administratief (geen oordeel over acceptatie/afwijzing) —
 * is er een offerte, en is die al daadwerkelijk verstuurd (dus niet meer
 * hangend als concept)? `offertes` is optioneel: dossierweergaves die dit
 * (nog) niet laden geven simpelweg `[]` mee.
 */
function controleerOfferte({ offertes = [] }) {
  if (offertes.length === 0) {
    return { status: HEALTH_STATUS.ONTBREEKT, reden: 'Nog geen offerte opgesteld.' }
  }
  const alleenConcept = offertes.every((o) => o.status === 'concept')
  if (alleenConcept) {
    return { status: HEALTH_STATUS.AANDACHT, reden: 'Offerte staat nog op concept, nog niet verstuurd.' }
  }
  return { status: HEALTH_STATUS.GEREED, reden: 'Offerte is verstuurd of verder in het proces.' }
}

/**
 * Bepaalt de directe actie (indien zinvol) bij een niet-`gereed`-categorie
 * — uitsluitend navigatie naar al bestaande routes/schermen, nooit een
 * nieuw scherm. De bestemming is steeds waar die informatie in de
 * bestaande architectuur daadwerkelijk wordt beheerd:
 * - klant: Account.jsx, de bestaande hub voor bedrijfsgegevens (zelfde
 *   bestemming als de bestaande "rond eerst uw bedrijfsgegevens
 *   af"-meldingen in EnergieDossierKoppeling.jsx/MjopKlantKoppeling.jsx).
 * - pand: ook de MJOP-tool — Account.jsx's "Pand toevoegen"-formulier legt
 *   geen `gebruikstype` vast, dat gebeurt uitsluitend via de bestaande
 *   MJOP-koppeling (MjopKlantKoppeling.jsx → updatePand()).
 * - energie: de bestaande publieke Energie-indicatiepagina, met
 *   dossiercontext (zie voegDossierContextToe) zodat het resultaat direct
 *   aan dit Dossier gekoppeld kan worden (EnergieDossierKoppeling.jsx).
 * - mjop: de bestaande MJOP-tool.
 * - advies: geen actie — wordt al direct op dezelfde dossierpagina beheerd.
 * - offerte/opname/subsidies: al direct zichtbaar verderop op dezelfde
 *   dossierpagina, dus een anchor (`href`) in plaats van een
 *   routewijziging (`to`) — zelfde patroon voor alle drie.
 */
function bepaalActie(categorieKey, status, dossierId) {
  if (status === HEALTH_STATUS.GEREED) return null
  switch (categorieKey) {
    case 'klant':
      return { label: 'Klant aanvullen', to: voegDossierContextToe(ROUTES.account, dossierId) }
    case 'pand':
      return { label: 'Pand aanvullen', to: voegDossierContextToe(ROUTES.mjopTool, dossierId) }
    case 'opname':
      return { label: 'Opname starten/openen', href: '#opnames-sectie' }
    case 'energie':
      return { label: 'Energie-indicatie toevoegen', to: voegDossierContextToe(ROUTES.energieIndicatie, dossierId) }
    case 'mjop':
      return { label: 'MJOP koppelen', to: voegDossierContextToe(ROUTES.mjopTool, dossierId) }
    case 'subsidies':
      return { label: 'Subsidies bijhouden', href: '#subsidies-sectie' }
    case 'offerte':
      return { label: 'Offerte bekijken', href: '#offertes-sectie' }
    default:
      return null
  }
}

/**
 * Bouwt de volledige Health Check: één resultaat per categorie
 * (KLANT/PAND/ENERGIE/MJOP/ADVIES/OFFERTE), in die vaste volgorde, plus een
 * `algemeen`-samenvatting die uitsluitend de aanwezige statussen telt —
 * nooit een score. `algemeen` is `ontbreekt` zodra minstens één categorie
 * `ontbreekt` is, anders `aandacht` zodra minstens één categorie
 * `aandacht` is, anders `gereed`.
 *
 * `dossierId` (optioneel) is uitsluitend nodig om de `actie`-link van elke
 * categorie te kunnen bouwen (zie bepaalActie) — zonder `dossierId` krijgt
 * elke niet-gereed-categorie nog steeds een actie, alleen dan zonder
 * dossiercontext-querystring.
 *
 * `opnames`/`subsidies` (optioneel, zie controleerOpname/controleerSubsidies
 * hierboven). Subsidie-backenddata (dossier_subsidies, admin-only RLS,
 * zie 0035_dossier_subsidies.sql) bestaat en is administratief bruikbaar
 * voor ÉLK pakket — pakket bepaalt nooit of de data/categorie bestaat,
 * alleen wie hem mag zien (pakketarchitectuurronde, 2026-10-08: "pakket ≠
 * datamodel"). Daarom bepaalt de AANROEPER via `subsidiesZichtbaar` of de
 * categorie wordt opgenomen: in de admin altijd (ongeacht pakket, zie
 * DossierDetail.jsx), voor een klant alleen als het pakket dat
 * commercieel omvat. Dit bestand kent zelf geen specifieke pakketnaam meer.
 */
export function bouwDossierHealthCheck({
  klant,
  contactpersoon,
  pand,
  energieSnapshot,
  mjopSnapshot,
  adviespunten = [],
  offertes = [],
  opnames = [],
  subsidies = [],
  subsidiesZichtbaar = false,
  openSignalenAantal = null,
  dossierId = null,
}) {
  const categorieen = {
    klant: controleerKlant({ klant, contactpersoon }),
    pand: controleerPand({ pand }),
    opname: controleerOpname({ opnames }),
    energie: controleerEnergie({ energieSnapshot }),
    mjop: controleerMjop({ mjopSnapshot }),
    ...(subsidiesZichtbaar ? { subsidies: controleerSubsidies({ subsidies }) } : {}),
    advies: controleerAdvies({ adviespunten, openSignalenAantal }),
    offerte: controleerOfferte({ offertes }),
  }

  for (const [key, resultaat] of Object.entries(categorieen)) {
    resultaat.actie = bepaalActie(key, resultaat.status, dossierId)
  }

  const statussen = Object.values(categorieen).map((c) => c.status)
  const algemeen = statussen.includes(HEALTH_STATUS.ONTBREEKT)
    ? HEALTH_STATUS.ONTBREEKT
    : statussen.includes(HEALTH_STATUS.AANDACHT)
      ? HEALTH_STATUS.AANDACHT
      : HEALTH_STATUS.GEREED

  return { categorieen, algemeen }
}

/** Vast label per categorie, voor UI-weergave — één plek, geen losse strings her en der. */
export const HEALTH_CATEGORIE_LABELS = {
  klant: 'Klant',
  pand: 'Pand',
  opname: 'Opname',
  energie: 'Energie',
  mjop: 'MJOP',
  subsidies: 'Subsidies',
  advies: 'Advies',
  offerte: 'Offerte',
}

/**
 * UX-herontwerp (2026-10-08) — vertaalt bouwDossierHealthCheck()'s feitelijke
 * categorieën naar de herkenbare adviesworkflow-volgorde uit de opdracht
 * (Klant/Pand → Opname → MJOP → Energie → Subsidies → Advies → Rapport →
 * Afronden) en wijst precies ÉÉN concrete volgende stap aan. Zelf geen
 * nieuwe feitelijke controle: "Klant"+"Pand" worden hier samengevoegd tot
 * één "Gegevens"-stap (het slechtste van de twee statussen, met de
 * bijbehorende actie) — puur een presentatiekeuze, de twee onderliggende
 * categorieën blijven in `categorieen` zelf ongewijzigd beschikbaar voor de
 * gedetailleerde Health Check-weergave.
 *
 * "Rapport" en "Afronden" hebben geen eigen feitelijke categorie (er is
 * geen opgeslagen "rapport gegenereerd"-vlag in de database, zie
 * AdviesrapportGenerator.jsx — het rapport is een puur client-side .docx-
 * export zonder server-side status) — vandaar nooit een verzonnen
 * `gereed`/`ontbreekt` voor Rapport, alleen een vervolgactie zodra alles
 * ervoor gereed is. "Afronden" gebruikt wél een echte, bestaande status:
 * `dossier.status === 'afgerond'`.
 */
const VOLGENDE_STAP_VOLGORDE = [
  { key: 'gegevens', categorieKeys: ['klant', 'pand'], label: 'Gegevens' },
  { key: 'opname', categorieKeys: ['opname'], label: 'Opname' },
  { key: 'mjop', categorieKeys: ['mjop'], label: 'MJOP' },
  { key: 'energie', categorieKeys: ['energie'], label: 'Energie' },
  { key: 'subsidies', categorieKeys: ['subsidies'], label: 'Subsidies' },
  { key: 'advies', categorieKeys: ['advies'], label: 'Advies' },
]

/** Slechtste status van een lijst statussen (ontbreekt > aandacht > gereed) — voor de "Gegevens"-samenvoeging hierboven. */
function slechtsteStatus(statussen) {
  if (statussen.includes(HEALTH_STATUS.ONTBREEKT)) return HEALTH_STATUS.ONTBREEKT
  if (statussen.includes(HEALTH_STATUS.AANDACHT)) return HEALTH_STATUS.AANDACHT
  return HEALTH_STATUS.GEREED
}

/**
 * Bouwt de genummerde workflow-stappen voor de voortgangsweergave
 * (DossierHealthCheck.jsx) — alleen stappen waarvan de onderliggende
 * categorie(ën) daadwerkelijk in `categorieen` voorkomen (zodat
 * "Subsidies" bijvoorbeeld niet verschijnt bij een Basis/Premium-dossier,
 * zie bouwDossierHealthCheck hierboven), plus altijd "Rapport" en
 * "Afronden" aan het einde.
 */
export function bouwWorkflowStappen({ categorieen, dossierStatus }) {
  const stappen = VOLGENDE_STAP_VOLGORDE.filter((stap) => stap.categorieKeys.every((k) => categorieen[k]))
    .map((stap) => {
      const relevanteCategorieen = stap.categorieKeys.map((k) => categorieen[k])
      const status = slechtsteStatus(relevanteCategorieen.map((c) => c.status))
      const metActie = relevanteCategorieen.find((c) => c.status !== HEALTH_STATUS.GEREED)
      return { key: stap.key, label: stap.label, status, actie: metActie?.actie ?? null }
    })

  const allesGereed = stappen.every((s) => s.status === HEALTH_STATUS.GEREED)
  stappen.push({
    key: 'rapport',
    label: 'Rapport',
    status: null, // bewust geen gereed/ontbreekt — zie moduledoc hierboven
    actie: allesGereed ? { label: 'Rapport maken', href: '#rapport-sectie' } : null,
  })
  stappen.push({
    key: 'afronden',
    label: 'Afronden',
    status: dossierStatus === 'afgerond' ? HEALTH_STATUS.GEREED : null,
    actie: dossierStatus === 'afgerond' ? null : { label: 'Dossier afronden', href: '#advies-sectie' },
  })
  return stappen
}

/**
 * Bepaalt de ÉÉN meest relevante volgende stap voor de prominente banner
 * boven aan de dossierpagina (DossierVolgendeStap.jsx) — de eerste stap in
 * de workflowvolgorde die nog niet `gereed` is. Is alles gereed, dan wijst
 * de banner naar het rapport (of, als het dossier al is afgerond, naar
 * niets meer — er is dan geen volgende stap).
 */
export function bepaalVolgendeStap({ categorieen, dossierStatus }) {
  if (dossierStatus === 'afgerond') {
    return { titel: 'Dossier is afgerond', toelichting: 'Het advies ligt vast en kan niet meer worden gewijzigd.', actie: null }
  }
  const stappen = bouwWorkflowStappen({ categorieen, dossierStatus })
  const eersteOpenStap = stappen.find((s) => s.status !== null && s.status !== HEALTH_STATUS.GEREED)
  if (eersteOpenStap) {
    return { titel: `Volgende stap: ${eersteOpenStap.label}`, toelichting: null, actie: eersteOpenStap.actie }
  }
  return {
    titel: 'Alles compleet — rapport kan worden opgesteld',
    toelichting: null,
    actie: { label: 'Rapport maken', href: '#rapport-sectie' },
  }
}
