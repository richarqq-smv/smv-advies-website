/**
 * Pure kostenlogica: vaste categorieën, regelberekening en validatie —
 * geen I/O (zie api.js). Zelfde kleine-vaste-lijst-conventie als
 * AFSPRAAK_TYPES (planning.js) en VERVOLGSTAP_OPTIES (commercieleKans.js).
 */
import { rond2 } from './offerte.js'

export const KOSTEN_CATEGORIEEN = [
  { id: 'kantoor', label: 'Kantoor' },
  { id: 'reiskosten', label: 'Reiskosten' },
  { id: 'software', label: 'Software' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'verzekering', label: 'Verzekering' },
  { id: 'opleiding', label: 'Opleiding' },
  { id: 'overig', label: 'Overig' },
]
export const KOSTEN_CATEGORIE_LABELS = Object.fromEntries(KOSTEN_CATEGORIEEN.map((c) => [c.id, c.label]))
const KOSTEN_CATEGORIE_IDS = new Set(KOSTEN_CATEGORIEEN.map((c) => c.id))

// Admin-UX-ronde (2026-10-09, UX-auditrapport §5): de drie daadwerkelijk
// bestaande Nederlandse btw-tarieven, plus "Anders" voor een bewust
// afwijkend percentage (bijv. 0% voor een kostenpost uit het buitenland
// met verlegde btw) — nooit een vrij invoerveld zonder enige keuze, dat
// was precies de foutgevoelige situatie die dit moest oplossen.
export const BTW_PERCENTAGE_OPTIES = [0, 9, 21]

// Een btw-percentage is per definitie 0-100 — ruimer dan de drie
// standaardtarieven (voor "Anders"), maar een harde bovengrens tegen een
// tikfout (bijv. "210" i.p.v. "21") die anders stilzwijgend in het
// BTW-overzicht en Resultaat terecht zou komen.
const BTW_PERCENTAGE_MAX = 100

/** Eindige, niet-negatieve numerieke waarde binnen 0-100 — gedeeld door het formulier (AdminKosten.jsx) én valideerKostenpost() hieronder, zodat beide nooit uit de pas kunnen lopen. */
export function isGeldigBtwPercentage(waarde) {
  if (typeof waarde === 'string' && waarde.trim() === '') return false
  if (waarde == null) return false
  const getal = Number(waarde)
  return Number.isFinite(getal) && getal >= 0 && getal <= BTW_PERCENTAGE_MAX
}

export const KOSTEN_STATUSSEN = [
  { id: 'open', label: 'Open' },
  { id: 'betaald', label: 'Betaald' },
]
export const KOSTEN_STATUS_LABELS = Object.fromEntries(KOSTEN_STATUSSEN.map((s) => [s.id, s.label]))

/** Zelfde formule als berekenFactuurRegel() in factuur.js, hier voor één kostenpost (geen "aantal", een kostenpost is altijd één bedrag). */
export function berekenKostenBedragen({ bedragExclBtw, btwPercentage }) {
  const btwBedrag = rond2((bedragExclBtw * btwPercentage) / 100)
  const totaalInclBtw = rond2(bedragExclBtw + btwBedrag)
  return { btwBedrag, totaalInclBtw }
}

function heeftWaarde(v) {
  return typeof v === 'string' ? v.trim() !== '' : v != null
}

/** Puur veld-voor-veld: een leeg object betekent geldig. */
export function valideerKostenpost({ leverancier, omschrijving, categorie, datum, bedragExclBtw, btwPercentage } = {}) {
  const fouten = {}
  if (!heeftWaarde(leverancier)) fouten.leverancier = 'Vul een leverancier in.'
  if (!heeftWaarde(omschrijving)) fouten.omschrijving = 'Vul een omschrijving in.'
  if (!KOSTEN_CATEGORIE_IDS.has(categorie)) fouten.categorie = 'Kies een geldige categorie.'
  if (!heeftWaarde(datum)) fouten.datum = 'Vul een datum in.'
  if (!(Number.isFinite(Number(bedragExclBtw)) && Number(bedragExclBtw) >= 0)) fouten.bedragExclBtw = 'Vul een geldig bedrag in.'
  if (!isGeldigBtwPercentage(btwPercentage)) fouten.btwPercentage = `Vul een geldig btw-percentage in (0 t/m ${BTW_PERCENTAGE_MAX}).`
  return fouten
}
