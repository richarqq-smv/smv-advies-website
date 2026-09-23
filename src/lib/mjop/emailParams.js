import { MJOP_RECIPIENT_EMAIL } from '../emailjs'
import {
  BUILDING_USE_OPTIONS,
  ENERGY_SOURCE_OPTIONS,
  HEATING_SYSTEM_OPTIONS,
  ENERGY_LABEL_OPTIONS,
  STATUSES,
  getComponentTypeLabel,
  optionLabel as labelFor,
} from './constants'
import { groupByStatus, buildTimeline, buildAdviesSummary } from './linking'

const ONBEKEND = 'Niet bekend'

function line(label, value) {
  return `${label}: ${value}`
}

function buildPandTekst(building) {
  return [
    line('Naam / omschrijving', building.name || ONBEKEND),
    line('Plaats', building.location || ONBEKEND),
    line('Bouwjaar', building.constructionYear ?? ONBEKEND),
    line('Gebruikstype', labelFor(BUILDING_USE_OPTIONS, building.buildingUse)),
    line('Bruto vloeroppervlak', building.floorArea ? `${building.floorArea} m²` : ONBEKEND),
    line('Aantal verdiepingen', building.floors ?? ONBEKEND),
    line('Aantal gebruikers', building.occupants ?? ONBEKEND),
    line('Opmerkingen', building.notes || '-'),
  ].join('\n')
}

function buildEnergieTekst(energy) {
  return [
    line('Gasverbruik per jaar', energy.gasConsumption != null ? `${energy.gasConsumption} m³` : ONBEKEND),
    line('Elektriciteitsverbruik per jaar', energy.electricityConsumption != null ? `${energy.electricityConsumption} kWh` : ONBEKEND),
    line('Energiebron', labelFor(ENERGY_SOURCE_OPTIONS, energy.energySource)),
    line('Verwarmingssysteem', labelFor(HEATING_SYSTEM_OPTIONS, energy.heatingSystem)),
    line('Energielabel', labelFor(ENERGY_LABEL_OPTIONS, energy.energyLabel)),
  ].join('\n')
}

const PRESENCE_TEKST = { ja: 'aanwezig', nee: 'niet aanwezig', onbekend: 'aanwezigheid onbekend' }

/** Volledige inventaris van alle bouwdelen/installaties, inclusief de niet-aanwezige. */
function buildHuidigeSituatieTekst(components) {
  return components
    .map((c) => {
      const naam = getComponentTypeLabel(c.typeId, c.customLabel)
      const aanwezig = PRESENCE_TEKST[c.present] ?? PRESENCE_TEKST.onbekend
      if (c.present === 'nee') return `- ${naam}: ${aanwezig}`
      const situatie = c.currentSituation?.trim() || 'geen omschrijving opgegeven'
      const jaar = c.installationYear ? `, plaatsings-/bouwjaar ${c.installationYear}` : ''
      return `- ${naam}: ${aanwezig}. Situatie: ${situatie}${jaar}.`
    })
    .join('\n')
}

/** Alleen de onderdelen die daadwerkelijk aanwezig zijn (insights) — onderhoud/vervanging per onderdeel. */
function buildOnderhoudTekst(insights) {
  if (insights.length === 0) return 'Geen aanwezige bouwdelen of installaties opgegeven.'
  return insights
    .map((i) => `- ${i.componentLabel}: ${i.statusLabel}${i.relevantYear ? ` (verwacht rond ${i.relevantYear})` : ''}.`)
    .join('\n')
}

function buildVerduurzamingTekst(insights) {
  const groups = groupByStatus(insights)
  const order = ['nu_onderzoeken', 'meenemen_bij_vervanging', 'later_beoordelen', 'geen_actie_nodig', 'onvoldoende_informatie']
  return order
    .filter((status) => groups[status].length > 0)
    .map((status) => {
      const items = groups[status]
        .map((i) => {
          const maatregelen = i.recommendations.map((r) => r.measureName).filter(Boolean).join(', ')
          return `  - ${i.componentLabel}${maatregelen ? ` (${maatregelen})` : ''}`
        })
        .join('\n')
      return `${STATUSES[status].label}:\n${items}`
    })
    .join('\n\n')
}

function buildPlanningTekst(insights) {
  const { years, unknown } = buildTimeline(insights)
  const yearLines = years.map(({ year, items }) => `${year}: ${items.map((i) => i.componentLabel).join(', ')}`)
  const unknownLine = unknown.length > 0 ? `Nog onbekend: ${unknown.map((i) => i.componentLabel).join(', ')}` : null
  return [...yearLines, unknownLine].filter(Boolean).join('\n') || 'Nog geen concrete momenten bekend.'
}

/**
 * Bouwt de platte set merge-velden voor de EmailJS MJOP-template (zie
 * EMAILJS_TEMPLATE_MJOP in lib/emailjs.js). Dezelfde bron (`building` +
 * `insights`) als stap 7 zelf laat zien — de e-mail is dus geen aparte
 * berekening, alleen een andere weergave van hetzelfde afgeleide overzicht.
 */
export function buildMjopEmailParams(building, insights) {
  const summary = buildAdviesSummary(insights)
  return {
    to_email: MJOP_RECIPIENT_EMAIL,
    subject: 'Nieuwe MJOP-analyse via SMV Advies',
    verzonden_op: new Date().toLocaleString('nl-NL'),
    pand_tekst: buildPandTekst(building),
    energie_tekst: buildEnergieTekst(building.energy),
    huidige_situatie_tekst: buildHuidigeSituatieTekst(building.components),
    onderhoud_tekst: buildOnderhoudTekst(insights),
    verduurzaming_tekst: buildVerduurzamingTekst(insights),
    planning_tekst: buildPlanningTekst(insights),
    adviesoverzicht_tekst: summary.join('\n\n'),
    contact_naam: building.contact?.naam?.trim() || 'Niet opgegeven',
    contact_email: building.contact?.email?.trim() || 'Niet opgegeven',
    contact_telefoon: building.contact?.telefoon?.trim() || 'Niet opgegeven',
  }
}
