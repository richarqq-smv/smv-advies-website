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
  if (!(Number(bedragExclBtw) >= 0)) fouten.bedragExclBtw = 'Vul een geldig bedrag in.'
  if (!(Number(btwPercentage) >= 0)) fouten.btwPercentage = 'Vul een geldig btw-percentage in.'
  return fouten
}
