/**
 * Bouwt de machineleesbare JSON-kopie voor de interne leadmail
 * (EMAILJS_TEMPLATE_LEAD, zie useEnergieScan.js) — exact dezelfde invoer
 * en het volledige resultaat die de mail zelf al als platte tekst bevat
 * (buildEmailParams()/buildInterneLeadParams()), hier als los
 * merge-veld in de mail zelf (géén losse bijlage: EmailJS' dynamische
 * attachments zitten achter een betaald abonnement, zie
 * ENERGIE_INDICATIE_JSON_PARAM hieronder). Puur intern archiefmateriaal
 * voor SMV: geen publieke UI toont dit, de klant krijgt dit nooit te
 * zien (zie ResultsView.jsx — alleen print/PDF en "Opnieuw invullen").
 *
 * Losstaand van emailParams.js/calculations.js (geen import ervan): dit
 * bestand neemt `values` en het al berekende `result` gewoon aan zoals
 * ze zijn, dus geen afhankelijkheid van calculations.js' extensieloze
 * `./constants`-import die de kale Node-testrunner niet kan laden (zelfde
 * bekende beperking als emailAudiences.js hierover al meldt).
 */
export const ENERGIE_INDICATIE_JSON_FORMAT_VERSION = 1

/** Merge-veldnaam in EMAILJS_TEMPLATE_LEAD — moet exact zo in de template-HTML als {{energie_indicatie_json}} staan. */
export const ENERGIE_INDICATIE_JSON_PARAM = 'energie_indicatie_json'

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
