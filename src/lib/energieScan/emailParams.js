import { LABELS } from './fieldOptions.js'
import { euro, euroRange, jaren } from './calculations.js'
import { bouwPubliekResultaat, WAT_DEZE_INDICATIE_NIET_WEET } from './publiekResultaat.js'
import { COMPANY } from '../../data/company.js'

/**
 * Ported 1-op-1 uit de originele energie-indicatietool
 * (SMV_Advies_Energietool_index3.html — formatMaatregelRegel /
 * buildMaatregelenTekstIntern / buildMaatregelenTekstKlant /
 * buildEmailParams). Zelfde merge-fieldnamen, zodat de bestaande
 * EmailJS-templates (EMAILJS_TEMPLATE_LEAD / _CONFIRM) ongewijzigd
 * kunnen blijven.
 */
function formatMaatregelRegel(m, i, kort) {
  const investeringTekst = kort
    ? `investering vanaf ${euro(m.investeringLaag)}`
    : `investering ${euroRange(m.investeringLaag, m.investeringHoog)}`
  const besparingUnitsTekst = m.isElektrisch
    ? `${Math.round(m.besparingKwh).toLocaleString('nl-NL')} kWh/jaar`
    : `${Math.round(m.besparingM3).toLocaleString('nl-NL')} m³ gas/jaar`
  // Volledige maatregelregel (toelichting, investering, terugverdientijd,
  // besparing in m³/kWh en euro/jaar). Wordt alleen nog gebruikt in de
  // interne leadmail naar SMV Advies — de bezoeker ziet deze bedragen niet
  // meer (zie publiekResultaat.js en buildKlantEmailParams hieronder).
  return (
    `${i + 1}. ${m.naam} — besparing ca. ${euro(m.besparingEuro)}/jaar (${besparingUnitsTekst}), ` +
    `${investeringTekst}, terugverdientijd ${jaren(m.terugverdientijd)}\n   ${m.toelichting}`
  )
}

// Volledige lijst — voor de interne leadmail naar SMV Advies zelf.
function buildMaatregelenTekstIntern(maatregelen) {
  return maatregelen.map((m, i) => formatMaatregelRegel(m, i, false)).join('\n')
}

// Top 3 + teaser over de rest — voor de automatische bevestigingsmail aan de lead.
function buildMaatregelenTekstKlant(maatregelen) {
  const top3 = maatregelen.slice(0, 3)
  const rest = maatregelen.slice(3)

  let tekst = top3.map((m, i) => formatMaatregelRegel(m, i, true)).join('\n')

  if (rest.length > 0) {
    const restBesparing = rest.reduce((sum, m) => sum + m.besparingEuro, 0)
    tekst +=
      `\n\nDit zijn de ${top3.length} grootste kansen uit jouw scan. Er ligg` +
      (rest.length === 1 ? 't nog 1 andere verbetermaatregel' : `en nog ${rest.length} andere verbetermaatregelen`) +
      ` klaar, goed voor samen nog eens zo'n ${euro(restBesparing)} aan jaarlijkse besparing.` +
      `\n\nBenieuwd wat dat concreet voor jouw pand betekent? Stuur ons een mail — we denken graag vrijblijvend met je mee.`
  }

  return tekst
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
    maatregelen_klant: buildMaatregelenTekstKlant(result.maatregelen),
    ingevuld_op: new Date().toLocaleString('nl-NL'),
  }
}

function aandachtspuntenTekst(publiek) {
  if (publiek.aandachtspunten.length === 0) {
    return 'Op basis van uw invoer springen er geen duidelijke aandachtspunten uit. Dat zegt nog niets over onderhoud of het juiste investeringsmoment.'
  }
  return publiek.aandachtspunten.map((p) => `- ${p.titel}: ${p.toelichting}`).join('\n')
}

/**
 * Merge-velden voor de automatische bevestigingsmail aan de bezoeker. Zelfde
 * veldnamen als buildEmailParams() (het EmailJS-template blijft dus werken),
 * maar met uitsluitend de publieke uitkomst van de Energie Indicatie (zie
 * publiekResultaat.js): geen maatregelen met investering, besparing of
 * terugverdientijd, geen totale besparing en geen CO2-besparing. De interne
 * leadmail naar SMV Advies gebruikt nog steeds buildEmailParams() met de
 * volledige berekening.
 */
export function buildKlantEmailParams(values, result) {
  const publiek = bouwPubliekResultaat(result)
  const { maatregelen_intern: _intern, ...basis } = buildEmailParams(values, result)
  const maatregelenTekst =
    `Belangrijkste aandachtspunten:\n${aandachtspuntenTekst(publiek)}\n\n` +
    `Wat deze indicatie niet weet:\n${WAT_DEZE_INDICATIE_NIET_WEET.map((regel) => `- ${regel}`).join('\n')}\n\n` +
    `Wilt u weten welke maatregelen voor uw pand logisch zijn, en welke voorlopig kunnen wachten? Bespreek uw resultaat met SMV Advies — beantwoord deze e-mail of bel ${COMPANY.phone}.`

  return {
    ...basis,
    status: publiek.band.status,
    huidige_kosten: publiek.energiekosten ? `${euroRange(publiek.energiekosten.min, publiek.energiekosten.max)} per jaar (indicatie)` : 'Niet te bepalen',
    totale_besparing: 'Bespreken we graag met u in een adviesgesprek',
    co2_besparing: 'Bespreken we graag met u in een adviesgesprek',
    maatregelen: maatregelenTekst,
    maatregelen_klant: maatregelenTekst,
  }
}
