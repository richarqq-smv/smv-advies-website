import { MEASURES, STATUSES, getComponentTypeLabel } from './constants'

/**
 * Centrale regellogica: bepaalt op basis van ingevoerde jaartallen wanneer
 * een bouwdeel/installatie relevant wordt, en koppelt dat aan mogelijke
 * verduurzamingsmaatregelen. Bewust hier verzameld (niet verspreid over
 * componenten, zie opdracht sectie 34) en volledig regelgebaseerd: geen AI,
 * geen schatting die niet direct uit ingevoerde data volgt.
 *
 * Drempels zijn bewust ruim en uitlegbaar, niet "hard" bedoeld als
 * technische waarheid:
 * - SHORT_TERM_YEARS: binnen dit aantal jaar is er directe aanleiding om
 *   iets te onderzoeken.
 * - MEDIUM_TERM_YEARS: binnen dit aantal jaar is er een te verwachten
 *   moment, maar nog geen directe actie.
 * - RECENT_INSTALL_YEARS: een onderdeel dat korter geleden is geplaatst dan
 *   dit aantal jaar, en waarvoor geen vervangings-/onderhoudsjaar is
 *   opgegeven, wordt als "geen actie nodig" beschouwd in plaats van
 *   "onvoldoende informatie" — er is dan wel een indicatie (recent
 *   geplaatst), alleen geen concreet toekomstig moment.
 */
const SHORT_TERM_YEARS = 1
const MEDIUM_TERM_YEARS = 5
const RECENT_INSTALL_YEARS = 5

function currentYear() {
  return new Date().getFullYear()
}

/**
 * Het jaar waarin dit onderdeel relevant wordt, afgeleid uit expliciet
 * ingevoerde gegevens. Nooit een schatting op basis van "hoe oud iets
 * meestal wordt" — alleen wat de gebruiker zelf heeft opgegeven.
 */
export function deriveRelevantYear(component) {
  if (component.replacementYear) return { year: component.replacementYear, basis: 'vervangingsjaar' }
  if (component.maintenanceYear) return { year: component.maintenanceYear, basis: 'onderhoudsjaar' }
  if (component.installationYear && component.expectedLifetime) {
    return { year: component.installationYear + component.expectedLifetime, basis: 'levensduur' }
  }
  return { year: null, basis: null }
}

/** Bepaalt de status van één bouwdeel/installatie. Zie STATUSES in constants.js. */
export function deriveComponentStatus(component, year = currentYear()) {
  const { year: relevantYear, basis } = deriveRelevantYear(component)

  if (relevantYear == null) {
    if (component.installationYear && year - component.installationYear <= RECENT_INSTALL_YEARS) {
      return { status: 'geen_actie_nodig', relevantYear: null, basis: null }
    }
    return { status: 'onvoldoende_informatie', relevantYear: null, basis: null }
  }

  const delta = relevantYear - year
  if (delta <= SHORT_TERM_YEARS) return { status: 'nu_onderzoeken', relevantYear, basis }
  if (delta <= MEDIUM_TERM_YEARS) return { status: 'meenemen_bij_vervanging', relevantYear, basis }
  return { status: 'later_beoordelen', relevantYear, basis }
}

/** Vertaalt een afgeleide status + jaartal naar het tijdsgebonden bucket uit sectie 19. */
export function deriveTimeframe(status, relevantYear, year = currentYear()) {
  if (status === 'onvoldoende_informatie') return 'onbekend'
  if (status === 'geen_actie_nodig') return 'later'
  if (relevantYear == null) return 'onbekend'
  const delta = relevantYear - year
  if (delta <= SHORT_TERM_YEARS) return 'nu'
  if (delta <= MEDIUM_TERM_YEARS - 3) return 'kort'
  if (delta <= MEDIUM_TERM_YEARS) return 'vervanging'
  return 'later'
}

function findMeasuresFor(typeId) {
  return MEASURES.filter((m) => m.linkedComponentTypes.includes(typeId))
}

/**
 * Voorzichtige, niet-opdringerige formulering van het adviesmoment — nooit
 * "plaats in jaar X maatregel Y", altijd "dit kan een logisch moment zijn
 * om te onderzoeken" (zie opdracht sectie 4 en 16).
 */
function buildReason({ status, componentLabel, relevantYear, measureName }) {
  const onderdeel = componentLabel.toLowerCase()

  if (status === 'onvoldoende_informatie') {
    return `Het onderhouds- of vervangingsmoment van ${onderdeel} is nog niet bekend. Dit kan tijdens een adviesgesprek nader worden bepaald.`
  }
  if (status === 'geen_actie_nodig') {
    return `Op basis van de ingevoerde gegevens is er momenteel geen directe aanleiding voor een nieuwe investering bij ${onderdeel}.`
  }
  if (status === 'nu_onderzoeken') {
    return measureName
      ? `${componentLabel} nadert naar verwachting (${relevantYear}) een onderhouds- of vervangingsmoment. Dit kan een goed moment zijn om ${measureName} te onderzoeken.`
      : `${componentLabel} nadert naar verwachting (${relevantYear}) een onderhouds- of vervangingsmoment. Dit kan aanleiding zijn om de situatie nader te bekijken.`
  }
  if (status === 'meenemen_bij_vervanging') {
    return measureName
      ? `Voor ${onderdeel} wordt rond ${relevantYear} een onderhouds- of vervangingsmoment verwacht. Dat kan een logisch moment zijn om ${measureName} mee te nemen.`
      : `Voor ${onderdeel} wordt rond ${relevantYear} een onderhouds- of vervangingsmoment verwacht.`
  }
  // later_beoordelen
  return measureName
    ? `Voor ${onderdeel} wordt op langere termijn (${relevantYear}) een moment verwacht. Nog geen directe actie, maar het is nuttig om dit later opnieuw te bekijken samen met ${measureName}.`
    : `Voor ${onderdeel} wordt op langere termijn (${relevantYear}) een moment verwacht. Nog geen directe actie nodig.`
}

/**
 * Bouwt voor één bouwdeel/installatie de volledige set afgeleide gegevens:
 * status, tijdsbucket, gekoppelde maatregelen en de bijbehorende
 * toelichtingstekst(en). Puur afgeleid — wordt nooit opgeslagen, altijd
 * opnieuw berekend uit de ingevoerde componentgegevens.
 */
export function deriveComponentInsight(component, year = currentYear()) {
  const { status, relevantYear, basis } = deriveComponentStatus(component, year)
  const timeframe = deriveTimeframe(status, relevantYear, year)
  const componentLabel = getComponentTypeLabel(component.typeId, component.customLabel)
  const measures = findMeasuresFor(component.typeId)
  const showMeasures = status === 'nu_onderzoeken' || status === 'meenemen_bij_vervanging' || status === 'later_beoordelen'

  const relevantMeasures = showMeasures ? measures : []
  const reasons = relevantMeasures.length
    ? relevantMeasures.map((m) => ({
        measureId: m.id,
        measureName: m.name,
        reason: buildReason({ status, componentLabel, relevantYear, measureName: m.name }),
      }))
    : [{ measureId: null, measureName: null, reason: buildReason({ status, componentLabel, relevantYear, measureName: null }) }]

  return {
    componentId: component.id,
    componentLabel,
    status,
    statusLabel: STATUSES[status].label,
    statusDescription: STATUSES[status].description,
    relevantYear,
    basis,
    timeframe,
    recommendations: reasons,
  }
}

/** Bouwt de volledige lijst afgeleide inzichten voor alle bouwdelen van een pand. */
export function buildInsights(building, year = currentYear()) {
  return (building.components ?? []).map((c) => deriveComponentInsight(c, year))
}

/**
 * Groepeert insights per tijdsbucket (sectie 19) voor het adviesoverzicht.
 * Behoudt de volgorde uit TIMEFRAMES.
 */
export function groupByTimeframe(insights) {
  const groups = { nu: [], kort: [], vervanging: [], later: [], onbekend: [] }
  insights.forEach((insight) => {
    groups[insight.timeframe]?.push(insight)
  })
  return groups
}

/**
 * Bouwt een chronologische tijdlijn (jaar -> items) uit de afgeleide
 * insights. Componenten zonder bekend jaar komen in een aparte
 * "nog onbekend"-groep terecht in plaats van een verzonnen jaartal.
 */
export function buildTimeline(insights) {
  const byYear = new Map()
  const unknown = []

  insights.forEach((insight) => {
    if (insight.relevantYear == null) {
      if (insight.status !== 'geen_actie_nodig') unknown.push(insight)
      return
    }
    if (!byYear.has(insight.relevantYear)) byYear.set(insight.relevantYear, [])
    byYear.get(insight.relevantYear).push(insight)
  })

  const years = Array.from(byYear.keys()).sort((a, b) => a - b)
  return {
    years: years.map((year) => ({ year, items: byYear.get(year) })),
    unknown,
  }
}
