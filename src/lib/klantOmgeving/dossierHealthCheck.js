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
 */

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

/** KLANT: naam/bedrijfsnaam + minstens één bruikbare contactpersoon (naam + e-mail of telefoon). */
function controleerKlant({ klant, contactpersoon }) {
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

/** PAND: adres/postcode/plaats (kunnen bereiken) + gebruikstype (relevant voor advies). */
function controleerPand({ pand }) {
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

/** ENERGIE: is er een (bevroren) Energie-indicatie-snapshot bij dit Dossier? Atomair — geen tussenstap mogelijk. */
function controleerEnergie({ energieSnapshot }) {
  if (!energieSnapshot) {
    return { status: HEALTH_STATUS.ONTBREEKT, reden: 'Geen Energie-indicatie gekoppeld aan dit dossier.' }
  }
  return { status: HEALTH_STATUS.GEREED, reden: 'Energie-indicatie gekoppeld.' }
}

/** MJOP: is er een snapshot, en bevat die daadwerkelijk bouwdelen/installaties? */
function controleerMjop({ mjopSnapshot }) {
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
 * Bouwt de volledige Health Check: één resultaat per categorie
 * (KLANT/PAND/ENERGIE/MJOP/ADVIES/OFFERTE), in die vaste volgorde, plus een
 * `algemeen`-samenvatting die uitsluitend de aanwezige statussen telt —
 * nooit een score. `algemeen` is `ontbreekt` zodra minstens één categorie
 * `ontbreekt` is, anders `aandacht` zodra minstens één categorie
 * `aandacht` is, anders `gereed`.
 */
export function bouwDossierHealthCheck({ klant, contactpersoon, pand, energieSnapshot, mjopSnapshot, adviespunten = [], offertes = [], openSignalenAantal = null }) {
  const categorieen = {
    klant: controleerKlant({ klant, contactpersoon }),
    pand: controleerPand({ pand }),
    energie: controleerEnergie({ energieSnapshot }),
    mjop: controleerMjop({ mjopSnapshot }),
    advies: controleerAdvies({ adviespunten, openSignalenAantal }),
    offerte: controleerOfferte({ offertes }),
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
  energie: 'Energie',
  mjop: 'MJOP',
  advies: 'Advies',
  offerte: 'Offerte',
}
