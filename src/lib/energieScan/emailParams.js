import { LABELS } from './fieldOptions'
import { euro, euroRange, jaren } from './calculations'
import { buildPubliekeMaatregelenTekst } from './publiekeWeergave'

/**
 * Ported 1-op-1 uit de originele energie-indicatietool
 * (SMV_Advies_Energietool_index3.html — formatMaatregelRegel /
 * buildMaatregelenTekstIntern / buildEmailParams). Zelfde merge-fieldnamen,
 * zodat de bestaande EmailJS-templates (EMAILJS_TEMPLATE_LEAD / _CONFIRM)
 * ongewijzigd kunnen blijven.
 */
function formatMaatregelRegel(m, i) {
  const besparingUnitsTekst = m.isElektrisch
    ? `${Math.round(m.besparingKwh).toLocaleString('nl-NL')} kWh/jaar`
    : `${Math.round(m.besparingM3).toLocaleString('nl-NL')} m³ gas/jaar`
  return (
    `${i + 1}. ${m.naam} — besparing ca. ${euro(m.besparingEuro)}/jaar (${besparingUnitsTekst}), ` +
    `investering ${euroRange(m.investeringLaag, m.investeringHoog)}, terugverdientijd ${jaren(m.terugverdientijd)}\n   ${m.toelichting}`
  )
}

// Volledige lijst, inclusief bedragen — uitsluitend voor de interne
// leadmail naar SMV Advies zelf (EMAILJS_TEMPLATE_LEAD). Fase 6 laat dit
// bewust ongewijzigd: SMV mag intern de volledige berekening blijven zien.
function buildMaatregelenTekstIntern(maatregelen) {
  return maatregelen.map((m, i) => formatMaatregelRegel(m, i)).join('\n')
}

export function buildEmailParams(values, result) {
  return {
    lead_naam: values.naam,
    lead_email: values.email,
    lead_telefoon: values.telefoon,
    lead_bedrijf: values.bedrijfsnaam,
    pand_type: LABELS.pandtype[values.pandtype] || values.pandtype,
    bouwjaar: LABELS.bouwjaar[values.bouwjaar] || values.bouwjaar,
    oppervlakte: `${values.oppervlakte} m²`,
    // Was voorheen de ruwe waarde (bijv. "3"), terwijl de tool zelf "3+"
    // toont (VERDIEPINGEN_OPTIONS) — de mail liet dus de "+" weg die de
    // gebruiker tijdens het invullen wél zag.
    verdiepingen: LABELS.verdiepingen[values.verdiepingen] || values.verdiepingen,
    beglazing: LABELS.beglazing[values.beglazing] || values.beglazing,
    isolatie_gevel: LABELS.isolatie[values.isolatie_gevel] || values.isolatie_gevel,
    isolatie_dak: LABELS.isolatie[values.isolatie_dak] || values.isolatie_dak,
    isolatie_vloer: LABELS.isolatie[values.isolatie_vloer] || values.isolatie_vloer,
    verwarming: LABELS.verwarming[values.verwarming] || values.verwarming,
    gasverbruik: values.gasverbruik ? `${values.gasverbruik} m³ (opgegeven)` : 'Niet opgegeven (geschat)',
    elekverbruik: values.elekverbruik ? `${values.elekverbruik} kWh (opgegeven)` : 'Niet opgegeven (geschat)',
    energiekosten: values.energiekosten ? `${euro(values.energiekosten)} / mnd (opgegeven)` : 'Niet opgegeven',
    status: result.band.status,
    score: result.score,
    huidige_kosten: euro(result.huidigeKosten),
    totale_besparing: euro(result.totaleBesparing),
    co2_besparing: `${Math.round(result.co2).toLocaleString('nl-NL')} kg / jaar`,
    maatregelen_intern: buildMaatregelenTekstIntern(result.maatregelen),
    // Publieke variant (Fase 6): geen bedragen, zelfde beperking als de
    // publieke resultaatweergave (zie useEnergieScan.js, dat de overige
    // klant-gerichte velden — huidige_kosten/totale_besparing/co2_besparing
    // — voor de bevestigingsmail apart overschrijft).
    maatregelen_klant: buildPubliekeMaatregelenTekst(result.maatregelen),
    ingevuld_op: new Date().toLocaleString('nl-NL'),
  }
}
