/**
 * Puur, I/O-vrije logica voor de "Klaar voor klantgesprek"-weergave
 * (werkfase Fase 7 — SMV-audit-opvolging, 2026-09-28). Geen nieuwe
 * database-entiteit: leunt volledig op al bestaande dossier-/adviespunt-/
 * offertevelden. Twee dingen die hier écht nieuw zijn (bestonden nog
 * nergens): een feitelijke "volgende stap"-afleiding, en het herkennen
 * van adviespunten met status 'onvoldoende_informatie' als "vragen om te
 * stellen" — beide zijn directe, ondubbelzinnige lezingen van bestaande
 * velden, geen nieuwe heuristiek of aanname.
 */

/**
 * Adviespunten met `advies_status === 'onvoldoende_informatie'` zijn per
 * definitie punten waarover meer moet worden gevraagd — dat IS de
 * betekenis van die status (zie lib/mjop/constants.js STATUSES), hier
 * alleen hergroepeerd als "te stellen vragen" voor het gesprek zelf.
 */
export function vindVragenOmTeStellen(adviespunten = []) {
  return adviespunten.filter((a) => a.advies_status === 'onvoldoende_informatie')
}

/**
 * Adviespunten met een ingevulde herbeoordeling — vrije tekst
 * (`herbeoordelen_bij`) en/of het structurele datumveld (`herbeoordelen_datum`,
 * werkfase Fase 9). Beide zijn onafhankelijk optioneel, dus een item met
 * alleen een datum (geen tekst) of alleen tekst (geen datum) telt allebei mee.
 */
export function vindHerbeoordelingen(adviespunten = []) {
  return adviespunten.filter((a) => (a.herbeoordelen_bij && a.herbeoordelen_bij.trim() !== '') || a.herbeoordelen_datum)
}

/**
 * Bepaalt de feitelijke volgende stap in het proces Lead → ... → Offerte,
 * uitsluitend uit bestaande statusvelden — nooit een prioritering of
 * commerciële inschatting (zie "belangrijkste principes" van de
 * werkopdracht: de software structureert en signaleert, de adviseur
 * beslist). Precies één van een vaste, eindige lijst tekstuele uitkomsten.
 */
export function bepaalVolgendeActie({ dossierStatus, openSignalenAantal = 0, aantalAdviespunten = 0, laatsteOfferte = null, vandaag = new Date().toISOString().slice(0, 10) }) {
  if (openSignalenAantal > 0) {
    const woord = openSignalenAantal === 1 ? 'automatisch signaal' : 'automatische signalen'
    return `${openSignalenAantal} ${woord} beoordelen en omzetten in adviespunten.`
  }
  if (dossierStatus === 'open' && aantalAdviespunten === 0) {
    return 'Advies opstellen.'
  }
  if (dossierStatus === 'open') {
    return 'Advies bespreken met de klant en eventueel het dossier afronden.'
  }
  // dossierStatus === 'afgerond' vanaf hier
  if (!laatsteOfferte) {
    return 'Offerte opstellen.'
  }
  if (laatsteOfferte.status === 'concept') {
    return 'Offerte versturen.'
  }
  if (laatsteOfferte.status === 'verstuurd') {
    return laatsteOfferte.geldig_tot < vandaag ? 'Offerte is verlopen — klant benaderen voor een vervolgstap.' : 'Offerte opvolgen.'
  }
  return 'Geen directe actie — offerte is afgehandeld.'
}
