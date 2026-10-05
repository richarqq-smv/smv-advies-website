/**
 * Pure beschikbaarheidslogica voor de klantgerichte afspraakplanner
 * (telefonisch adviesgesprek, werkfase 2026-10-05). Losstaand van
 * planning.js: dat bestand is specifiek Admin Planning v1 (weekgrid-
 * presentatie, bestaande afspraken tónen) en kent geen enkel concept van
 * "vrije tijd berekenen" — dat is precies wat hier wél gebeurt, voor een
 * heel ander publiek (de klant, niet de admin).
 *
 * Rekent uitsluitend met "HH:MM"-strings als minuten-sinds-middernacht —
 * nooit met `Date`/tijdzones. Dat is bewust: de database slaat
 * starttijd/eindtijd al op als kale `time` (geen tz), en deze module moet
 * exact dezelfde lokale wandklok-waarden gebruiken. Geen Date-rekenwerk
 * betekent ook geen zomertijd-randgevallen (DST kan nooit een slot laten
 * verdubbelen of verdwijnen, want er wordt nergens een Date-object met
 * een offset gebouwd).
 */

/** Vaste afspraakduur (minuten) — een telefonisch adviesgesprek reserveert altijd een vol blok van 30 minuten, ongeacht de werkelijke gespreksduur (ca. 20-30 min, zie UX-copy). */
export const AFSPRAAK_DUUR_MINUTEN = 30

/** Stapgrootte (minuten) waarin startmomenten worden aangeboden — bewuste UX-keuze, geen bewezen conversie-optimum (zie onderzoeksrapport). */
export const STARTINTERVAL_MINUTEN = 10

// Harde grens voor klantboekingen. Er bestaat vóór deze ronde geen harde
// businessregel (STANDAARD_START_UUR/STANDAARD_EIND_UUR in planning.js
// zijn uitsluitend een presentatie-default voor de adminweekgrid, geen
// afgedwongen grens). Voor klant-zelfboeking moet die grens er wél zijn —
// dit is de minimaal complexe, expliciet gedocumenteerde keuze: dezelfde
// 08:00-18:00 als de bestaande presentatie-default, nu alleen ook echt
// afgedwongen in de beschikbaarheidsberekening (en, aan de serverkant, in
// de boekings-RPC's eigen check — zie migratie 0032).
export const PLANNER_START_UUR = 8
export const PLANNER_EIND_UUR = 18

// Zakelijke pandtype-allowlist — exact dezelfde lijst als in
// boek_telefonische_afspraak() (migratie 0032_telefonische_afspraak_planner.sql,
// waar die lijst de daadwerkelijke, server-side afgedwongen autorisatie is).
// Deze kopie is uitsluitend voor de klant-UI (de CTA/planner niet eens tonen
// voor een niet-zakelijk pand) — een UI-gemak, geen beveiliging. Bij een
// wijziging van de ene lijst moet de andere mee veranderen.
export const ZAKELIJKE_GEBRUIKSTYPES = [
  'kantoor', 'bedrijfshal', 'winkel', 'horeca', 'praktijk', 'gemengd', 'anders',
  'magazijn', 'werkplaats', 'overig',
]

/** Is dit pandtype zakelijk volgens de bestaande, gesloten waardenlijst (MJOP-tool + energie-indicatietool samen)? */
export function isZakelijkPand(gebruikstype) {
  return ZAKELIJKE_GEBRUIKSTYPES.includes(gebruikstype)
}

const TIJD_PATROON = /^([01]\d|2[0-3]):[0-5]\d$/

/** "HH:MM" -> minuten sinds middernacht. */
export function tijdNaarMinuten(tijd) {
  const [u, m] = tijd.split(':').map(Number)
  return u * 60 + m
}

/** Minuten sinds middernacht -> "HH:MM" (altijd zero-padded, 24-uursnotatie). */
export function minutenNaarTijd(minuten) {
  const u = Math.floor(minuten / 60)
  const m = minuten % 60
  return `${String(u).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Overlapt [startA, eindA) met [startB, eindB)? Half-open intervallen —
 * zie opdracht §20: 14:00-14:30 en 14:30-15:00 mogen direct naast elkaar
 * bestaan (geen overlap), maar 14:00-14:30 en 14:20-14:50 niet.
 */
function overlapt(startA, eindA, startB, eindB) {
  return startA < eindB && eindA > startB
}

/**
 * Berekent alle beschikbare starttijden op één dag, gegeven de reeds
 * bezette blokken (type-agnostisch: een interne blokkade en een reeds
 * geboekt telefonisch adviesgesprek tellen allebei gewoon als bezet —
 * zie opdracht §7).
 *
 * @param {{starttijd: string, eindtijd: string}[]} bezetteBlokken - "HH:MM"-paren, willekeurige volgorde/overlap toegestaan.
 * @param {{ huidigeTijdMinuten?: number|null }} opties - `huidigeTijdMinuten`:
 *   optioneel, minuten-sinds-middernacht van "nu" — ALLEEN meegeven door de
 *   aanroeper wanneer `datum` vandaag is, om al verstreken starttijden eruit
 *   te filteren. Deze functie roept zelf nooit `Date.now()` aan (zelfde
 *   pure-functieconventie als `datumNaarIso` in planning.js) — zonder deze
 *   parameter (of `null`) worden alle starttijden binnen het plannervenster
 *   beoordeeld, ook al zijn ze voor "vandaag" inmiddels verstreken.
 * @returns {string[]} oplopend gesorteerde lijst "HH:MM"-starttijden, elk met een volledig vrij 30-minutenblok.
 */
export function berekenBeschikbareStarttijden(bezetteBlokken = [], { huidigeTijdMinuten = null } = {}) {
  const bezet = bezetteBlokken.map((b) => ({ start: tijdNaarMinuten(b.starttijd), eind: tijdNaarMinuten(b.eindtijd) }))

  const vensterStart = PLANNER_START_UUR * 60
  const laatsteMogelijkeStart = PLANNER_EIND_UUR * 60 - AFSPRAAK_DUUR_MINUTEN

  const resultaat = []
  for (let start = vensterStart; start <= laatsteMogelijkeStart; start += STARTINTERVAL_MINUTEN) {
    if (huidigeTijdMinuten != null && start < huidigeTijdMinuten) continue
    const eind = start + AFSPRAAK_DUUR_MINUTEN
    const heeftConflict = bezet.some((b) => overlapt(start, eind, b.start, b.eind))
    if (!heeftConflict) resultaat.push(minutenNaarTijd(start))
  }
  return resultaat
}

/** Valideert of een gekozen datum een geldige, toekomstige (of vandaag, vanaf `vandaagIso`) ISO-datum is. Puur — `vandaagIso` wordt altijd meegegeven, nooit hier bepaald. */
export function valideerPlannerDatum(datumIso, vandaagIso) {
  const DATUM_PATROON = /^\d{4}-\d{2}-\d{2}$/
  if (!DATUM_PATROON.test(datumIso ?? '') || Number.isNaN(new Date(datumIso).getTime())) return false
  return datumIso >= vandaagIso
}

/** Valideert of `starttijd` een geldig "HH:MM"-patroon heeft binnen het plannervenster. Gebruikt serverzijdig (RPC) en clientzijdig voor dezelfde, consistente check. */
export function valideerPlannerStarttijd(starttijd) {
  if (!TIJD_PATROON.test(starttijd ?? '')) return false
  const minuten = tijdNaarMinuten(starttijd)
  return minuten >= PLANNER_START_UUR * 60 && minuten <= PLANNER_EIND_UUR * 60 - AFSPRAAK_DUUR_MINUTEN
}

/** Berekent de eindtijd ("HH:MM") voor een gekozen starttijd — altijd exact AFSPRAAK_DUUR_MINUTEN later. */
export function berekenEindtijd(starttijd) {
  return minutenNaarTijd(tijdNaarMinuten(starttijd) + AFSPRAAK_DUUR_MINUTEN)
}
