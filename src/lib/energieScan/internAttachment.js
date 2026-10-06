/**
 * Bouwt de JSON-bijlage voor de interne leadmail (EMAILJS_TEMPLATE_LEAD,
 * zie useEnergieScan.js) — een downloadbare, machineleesbare kopie van
 * exact dezelfde invoer en het volledige resultaat die de mail zelf al
 * als platte tekst bevat (buildEmailParams()/buildInterneLeadParams()).
 * Puur intern archief-/koppelmateriaal voor SMV: geen publieke
 * download-UI leest dit bestand, de klant krijgt het nooit te zien (zie
 * ResultsView.jsx — alleen print/PDF en "Opnieuw invullen").
 *
 * Losstaand van emailParams.js/calculations.js (geen import ervan): dit
 * bestand neemt `values` en het al berekende `result` gewoon aan zoals
 * ze zijn, dus geen afhankelijkheid van calculations.js' extensieloze
 * `./constants`-import die de kale Node-testrunner niet kan laden (zelfde
 * bekende beperking als emailAudiences.js hierover al meldt).
 */
export const ENERGIE_INDICATIE_JSON_FORMAT_VERSION = 1

/** Naam van het attachment-veld zoals dat in het EmailJS-dashboard op EMAILJS_TEMPLATE_LEAD moet worden ingesteld (zie eindrapport/EmailJS-configuratie). */
export const ENERGIE_INDICATIE_JSON_ATTACHMENT_FIELD = 'energie_indicatie_json'

/**
 * Het volledige, machineleesbare rapport — versie + tijdstip zodat een
 * later formaat niet met een oudere bijlage verward kan worden,
 * contactgegevens + alle ruwe invoerwaarden (voor eventuele latere,
 * betrouwbare koppeling aan een klantprofiel/dossier — zelfde
 * identificerende velden als elders in dit project, bv. e-mailadres), en
 * het volledige berekende resultaat zoals berekenResultaat() dat
 * teruggeeft (geen bedrag/maatregel weggelaten, in tegenstelling tot de
 * publieke weergave — dit is uitsluitend intern).
 */
export function buildInterneJsonPayload(values, result) {
  return {
    formatVersion: ENERGIE_INDICATIE_JSON_FORMAT_VERSION,
    gegenereerdOp: new Date().toISOString(),
    contact: {
      naam: values.naam,
      bedrijfsnaam: values.bedrijfsnaam,
      email: values.email,
      telefoon: values.telefoon,
    },
    invoer: {
      pandtype: values.pandtype,
      bouwjaar: values.bouwjaar,
      oppervlakte: values.oppervlakte,
      verdiepingen: values.verdiepingen,
      beglazing: values.beglazing,
      isolatie_gevel: values.isolatie_gevel,
      isolatie_dak: values.isolatie_dak,
      isolatie_vloer: values.isolatie_vloer,
      verwarming: values.verwarming,
      gasverbruik: values.gasverbruik,
      elekverbruik: values.elekverbruik,
      energiekosten: values.energiekosten,
    },
    resultaat: result,
  }
}

/** Maakt een los bestandsnaamdeel veilig: alleen a-z/0-9/koppelteken, geen diakrieten, nooit leeg. */
function veiligBestandsnaamdeel(tekst) {
  const schoon = String(tekst ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return schoon || 'onbekend'
}

/** bv. "energie-indicatie-jansen-bv-2026-10-06.json" — nooit afhankelijk van onvertrouwde tekens in bedrijfsnaam/naam. */
export function buildInterneJsonBestandsnaam(values, datum = new Date()) {
  const bedrijf = veiligBestandsnaamdeel(values.bedrijfsnaam || values.naam)
  const datumDeel = datum.toISOString().slice(0, 10)
  return `energie-indicatie-${bedrijf}-${datumDeel}.json`
}
