/**
 * Pure weergavehelpers voor EnergieSnapshot.jsx (Energie-indicatie Fase 3)
 * — losstaand van dat component zodat ze onder de kale Node-testrunner
 * (`node --test`, geen JSX-ondersteuning) testbaar zijn, zelfde scheiding
 * als lib/klantOmgeving/offerte.js (rekenlogica) vs. OfferteEditor.jsx
 * (rendering). Geen van deze functies berekent iets inhoudelijks — ze
 * formatteren uitsluitend een al opgeslagen snapshotwaarde, of leveren een
 * nette "Niet ingevuld"-fallback. Geen import van
 * lib/energieScan/calculations.js's berekenResultaat()/
 * prepareCalculationInput() — dat zou een historische snapshot opnieuw
 * laten afhangen van de actuele rekenlogica, precies wat Fase 3 verbiedt.
 */

export const NIET_INGEVULD = 'Niet ingevuld'

/** Formatteert een reeds opgeslagen getal met NL-duizendtalnotatie en optionele eenheid — geen herberekening, puur weergave. */
export function formatGetal(n, eenheid = '') {
  if (n == null || n === '') return null
  const nummer = typeof n === 'number' ? n : Number(n)
  const tekst = Number.isFinite(nummer) ? nummer.toLocaleString('nl-NL') : String(n)
  return eenheid ? `${tekst} ${eenheid}` : tekst
}

/** dd-mm-jjjj uu:mm van snapshot.uitgevoerd_op — de enige toegestane databron voor het uitvoeringsmoment (nooit dossier.created_at). */
export function formatUitgevoerdOp(waarde) {
  if (!waarde) return 'Onbekend moment'
  const datum = new Date(waarde)
  if (Number.isNaN(datum.getTime())) return 'Onbekend moment'
  return datum.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * De fysieke besparingshoeveelheid van één opgeslagen maatregel
 * (snapshot.resultaat.maatregelen[i]) — leest uitsluitend de al
 * opgeslagen besparingM3/besparingKwh/isElektrisch-velden, bepaalt nooit
 * opnieuw welke maatregel relevant is (dat deed berekenMaatregelen() al,
 * eenmalig, op het moment van meten).
 */
export function besparingHoeveelheidTekst(maatregel) {
  if (!maatregel) return null
  return maatregel.isElektrisch ? formatGetal(maatregel.besparingKwh, 'kWh / jaar') : formatGetal(maatregel.besparingM3, 'm³ gas / jaar')
}
