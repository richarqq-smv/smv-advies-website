/**
 * Pure planning-logica (Admin Planning v1, 2026-09-28) — vaste
 * types/statussen, validatie en datum/periode-berekeningen voor de
 * interne agenda (/admin/planning). Geen I/O — api.js doet de
 * Supabase-aanroepen (listAfspraken/createAfspraak/updateAfspraak/
 * verwijderAfspraak). Zelfde scheiding als lib/klantOmgeving/offerte.js.
 */

export const AFSPRAAK_TYPES = [
  { id: 'kennismaking', label: 'Kennismaking' },
  { id: 'bedrijfsbezoek', label: 'Bedrijfsbezoek' },
  { id: 'adviesgesprek', label: 'Adviesgesprek' },
  { id: 'offertebespreking', label: 'Offertebespreking' },
  { id: 'overleg', label: 'Overleg' },
  { id: 'herbeoordeling', label: 'Herbeoordeling' },
  { id: 'overig', label: 'Overig' },
  // Enige type dat de klant zelf kan aanmaken (via boek_telefonische_afspraak(),
  // migratie 0032) — alle andere types hierboven blijven uitsluitend door
  // admin aan te maken, precies zoals vóór deze uitbreiding.
  { id: 'telefonisch_adviesgesprek', label: 'Telefonisch adviesgesprek' },
]
export const AFSPRAAK_TYPE_LABELS = Object.fromEntries(AFSPRAAK_TYPES.map((t) => [t.id, t.label]))
const AFSPRAAK_TYPE_IDS = new Set(AFSPRAAK_TYPES.map((t) => t.id))

export const AFSPRAAK_STATUSSEN = [
  { id: 'gepland', label: 'Gepland' },
  { id: 'afgerond', label: 'Afgerond' },
  { id: 'geannuleerd', label: 'Geannuleerd' },
]
export const AFSPRAAK_STATUS_LABELS = Object.fromEntries(AFSPRAAK_STATUSSEN.map((s) => [s.id, s.label]))

// Standaard tijdlijn — de planning breidt dit zelf uit voor een afspraak
// buiten dit bereik (zie bepaalUrenBereik), dus dit is geen harde grens.
export const STANDAARD_START_UUR = 8
export const STANDAARD_EIND_UUR = 18

const TIJD_PATROON = /^([01]\d|2[0-3]):[0-5]\d$/
const DATUM_PATROON = /^\d{4}-\d{2}-\d{2}$/

function heeftWaarde(v) {
  return typeof v === 'string' ? v.trim() !== '' : v != null
}

/**
 * Valideert de velden van een afspraak. Puur veld-voor-veld (zelfde vorm
 * als klantValidatie.js): een leeg object betekent geldig. Vergelijkt
 * start-/eindtijd als "HH:MM"-strings — dat is exact gelijk aan numerieke
 * tijdvergelijking zodra het patroon is afgedwongen (zero-padded 24u),
 * dezelfde regel als de database se eindtijd_na_starttijd-constraint
 * (0011_admin_planning.sql).
 */
export function valideerAfspraak({ onderwerp, datum, starttijd, eindtijd, type } = {}) {
  const fouten = {}

  if (!heeftWaarde(onderwerp)) {
    fouten.onderwerp = 'Vul een onderwerp in.'
  }
  if (!heeftWaarde(datum) || !DATUM_PATROON.test(datum) || Number.isNaN(new Date(datum).getTime())) {
    fouten.datum = 'Vul een geldige datum in.'
  }
  if (!TIJD_PATROON.test(starttijd ?? '')) {
    fouten.starttijd = 'Vul een geldige starttijd in (uu:mm).'
  }
  if (!TIJD_PATROON.test(eindtijd ?? '')) {
    fouten.eindtijd = 'Vul een geldige eindtijd in (uu:mm).'
  }
  if (!fouten.starttijd && !fouten.eindtijd && eindtijd <= starttijd) {
    fouten.eindtijd = 'Eindtijd moet na de starttijd liggen.'
  }
  if (!AFSPRAAK_TYPE_IDS.has(type)) {
    fouten.type = 'Kies een geldig type afspraak.'
  }

  return fouten
}

/**
 * Formateert een Date-object naar "YYYY-MM-DD" (lokale datum). Puur: deze
 * functie roept zelf nooit `new Date()`/`Date.now()` aan — de aanroeper
 * (een component) geeft altijd een concreet Date-object mee, ook als dat
 * "vandaag" is. Publiek zodat componenten (Admin.jsx/AdminPlanning.jsx)
 * dezelfde conversie gebruiken voor "vandaag" als deze module intern voor
 * weekberekeningen.
 */
export function datumNaarIso(d) {
  const jaar = d.getFullYear()
  const maand = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${jaar}-${maand}-${dag}`
}

/** De maandag (lokale datum, ISO-weekstart) van de week die `datum` bevat. */
export function berekenWeekMaandag(datum) {
  const d = new Date(datum)
  d.setHours(0, 0, 0, 0)
  const dag = d.getDay() // 0 = zondag ... 6 = zaterdag
  const offset = dag === 0 ? -6 : 1 - dag
  d.setDate(d.getDate() + offset)
  return d
}

/** De 7 dagen (maandag t/m zondag) van de week die `datum` bevat, als "YYYY-MM-DD"-strings. */
export function berekenWeekdagen(datum) {
  const maandag = berekenWeekMaandag(datum)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(maandag)
    d.setDate(d.getDate() + i)
    return datumNaarIso(d)
  })
}

/** Formateert een periode als "21 – 27 september 2026" (of over maand-/jaargrens heen leesbaar uitgeschreven). */
export function formatPeriodeNl(maandagIso, zondagIso) {
  const maandag = new Date(maandagIso)
  const zondag = new Date(zondagIso)
  const maandNaam = (d) => d.toLocaleDateString('nl-NL', { month: 'long' })
  const zelfdeJaar = maandag.getFullYear() === zondag.getFullYear()
  const zelfdeMaand = zelfdeJaar && maandag.getMonth() === zondag.getMonth()

  if (zelfdeMaand) {
    return `${maandag.getDate()} – ${zondag.getDate()} ${maandNaam(zondag)} ${zondag.getFullYear()}`
  }
  if (zelfdeJaar) {
    return `${maandag.getDate()} ${maandNaam(maandag)} – ${zondag.getDate()} ${maandNaam(zondag)} ${zondag.getFullYear()}`
  }
  return `${maandag.getDate()} ${maandNaam(maandag)} ${maandag.getFullYear()} – ${zondag.getDate()} ${maandNaam(zondag)} ${zondag.getFullYear()}`
}

/** Formateert één dag als "maandag 21 september 2026" (dagweergave-header). */
export function formatDagPeriodeNl(datumIso) {
  return new Date(datumIso).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Bepaalt welke hele uren de tijdlijn moet tonen: de standaard 08:00–18:00,
 * uitgebreid met elk uur waarin een meegegeven afspraak buiten dat bereik
 * valt — "de planning moet ook buiten normale kantooruren kunnen werken".
 * Nooit een harde grens: een afspraak om 06:30 of tot 20:00 verschuift het
 * getoonde bereik mee, in plaats van onzichtbaar te blijven.
 */
export function bepaalUrenBereik(afspraken = [], standaardStart = STANDAARD_START_UUR, standaardEind = STANDAARD_EIND_UUR) {
  let start = standaardStart
  let eind = standaardEind
  for (const a of afspraken) {
    const startUur = Number(a.starttijd?.slice(0, 2))
    const eindUurRuw = a.eindtijd?.slice(0, 2)
    const eindMinuut = a.eindtijd?.slice(3, 5)
    const eindUur = Number(eindUurRuw) + (eindMinuut && eindMinuut !== '00' ? 1 : 0)
    if (Number.isFinite(startUur) && startUur < start) start = startUur
    if (Number.isFinite(eindUur) && eindUur > eind) eind = eindUur
  }
  return Array.from({ length: eind - start + 1 }, (_, i) => start + i)
}

/** Groepeert een lijst afspraken per dag (`datum`-veld), elke dag intern gesorteerd op starttijd. `dagen` is een array "YYYY-MM-DD"-strings. */
export function groepeerAfsprakenPerDag(afspraken = [], dagen = []) {
  const perDag = Object.fromEntries(dagen.map((d) => [d, []]))
  for (const a of afspraken) {
    if (perDag[a.datum]) perDag[a.datum].push(a)
  }
  for (const dag of dagen) {
    perDag[dag].sort((a, b) => a.starttijd.localeCompare(b.starttijd))
  }
  return perDag
}

// --- Admin Dashboard: compacte planning-tellingen -----------------------
//
// Uitsluitend een telling/eerstvolgend item — geen score, geen "drukke
// dag"-beoordeling. `vandaagIso` wordt altijd meegegeven (nooit hier
// bepaald) zodat deze functies puur en deterministisch getest kunnen
// worden, zie datumNaarIso hierboven.

/** Aantal geplande (niet geannuleerde/afgeronde) afspraken op precies `vandaagIso`. */
export function telAfsprakenOpDag(afspraken = [], vandaagIso) {
  return afspraken.filter((a) => a.datum === vandaagIso && a.status === 'gepland').length
}

/** De eerstvolgende geplande afspraak vanaf (en met) `vandaagIso`, of `null` als die er niet is. */
export function vindEerstvolgendeAfspraak(afspraken = [], vandaagIso) {
  const kandidaten = afspraken
    .filter((a) => a.status === 'gepland' && a.datum >= vandaagIso)
    .sort((a, b) => (a.datum + a.starttijd).localeCompare(b.datum + b.starttijd))
  return kandidaten[0] ?? null
}

/**
 * Berekent de verticale positie/hoogte (in px) van een afspraakblok binnen
 * de tijdlijn van AdminPlanning.jsx, gegeven het eerste getoonde uur en de
 * hoogte per uur. Puur pixel-rekenwerk, los van React — hier apart
 * getest zodat een off-by-one in de agenda-positionering niet pas
 * visueel opvalt. Nooit lager dan 20px: ook een kort blok (bijv. 15
 * minuten) blijft zichtbaar en klikbaar.
 */
export function berekenBlokPositie(afspraak, startUur, uurHoogtePx) {
  const [startH, startM] = afspraak.starttijd.split(':').map(Number)
  const [eindH, eindM] = afspraak.eindtijd.split(':').map(Number)
  const startMinutenVanafGrid = (startH - startUur) * 60 + startM
  const duurMinuten = eindH * 60 + eindM - (startH * 60 + startM)
  return {
    top: (startMinutenVanafGrid / 60) * uurHoogtePx,
    height: Math.max((duurMinuten / 60) * uurHoogtePx, 20),
  }
}
