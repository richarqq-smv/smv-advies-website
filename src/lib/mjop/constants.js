/**
 * Statische kennislaag voor de MJOP-tool: standaard bouwdelen/installaties
 * en mogelijke verduurzamingsmaatregelen, plus de koppeling daartussen.
 * Bewust een vaste, overzichtelijke set (V1) — geen aparte database nodig.
 */

export const COMPONENT_CATEGORIES = {
  bouwkundig: 'Bouwkundig',
  installatie: 'Installatie',
}

export const COMPONENT_TYPES = [
  { id: 'dak', category: 'bouwkundig', label: 'Dak' },
  { id: 'dakisolatie', category: 'bouwkundig', label: 'Dakisolatie' },
  { id: 'gevel', category: 'bouwkundig', label: 'Gevel' },
  { id: 'gevelisolatie', category: 'bouwkundig', label: 'Gevelisolatie' },
  { id: 'beglazing', category: 'bouwkundig', label: 'Ramen / beglazing' },
  { id: 'deuren', category: 'bouwkundig', label: 'Deuren' },
  { id: 'vloer', category: 'bouwkundig', label: 'Vloer / vloerisolatie' },
  { id: 'verwarming', category: 'installatie', label: 'Cv / verwarming' },
  { id: 'warmtapwater', category: 'installatie', label: 'Warmtapwater' },
  { id: 'koeling', category: 'installatie', label: 'Koeling' },
  { id: 'ventilatie', category: 'installatie', label: 'Ventilatie' },
  { id: 'verlichting', category: 'installatie', label: 'Verlichting' },
  { id: 'zonnepanelen', category: 'installatie', label: 'Zonnepanelen' },
  { id: 'anders', category: 'installatie', label: 'Anders, namelijk...' },
]

/** Zoekt de weergavetekst op voor een select-waarde; 'Niet bekend' als er niets is gekozen. */
export function optionLabel(options, value) {
  if (!value) return 'Niet bekend'
  return options.find((o) => o.value === value)?.label ?? value
}

export function getComponentTypeLabel(typeId, customLabel) {
  if (typeId === 'anders') return customLabel?.trim() || 'Anders'
  return COMPONENT_TYPES.find((t) => t.id === typeId)?.label ?? 'Onbekend onderdeel'
}

/**
 * De 12 standaardonderdelen (dus zonder "Anders, namelijk...") staan altijd
 * al klaar in stap 3/4, zodat een pand direct van boven naar beneden kan
 * worden langsgelopen in plaats van eerst onderdelen te moeten toevoegen.
 * "Anders" blijft een losse, door de gebruiker toegevoegde uitzondering.
 */
export const STANDARD_COMPONENT_TYPES = COMPONENT_TYPES.filter((t) => t.id !== 'anders')

/** Aanwezigheid van een bouwdeel/installatie in het pand. */
export const PRESENCE_OPTIONS = [
  { value: 'ja', label: 'Ja' },
  { value: 'nee', label: 'Nee' },
  { value: 'onbekend', label: 'Onbekend' },
]

/**
 * Mogelijke verduurzamingsmaatregelen. `linkedComponentTypes` bepaalt welke
 * maatregelen worden getoond zodra een gekoppeld bouwdeel/installatie een
 * onderhouds- of vervangingsmoment nadert (zie lib/mjop/linking.js) — dit is
 * de enige plek waar die relatie is vastgelegd.
 */
export const MEASURES = [
  {
    id: 'dakisolatie',
    name: 'Dakisolatie',
    category: 'Isolatie',
    linkedComponentTypes: ['dak', 'dakisolatie'],
    description: 'Isoleren van het dak om warmteverlies te beperken.',
  },
  {
    id: 'gevelisolatie',
    name: 'Gevelisolatie',
    category: 'Isolatie',
    linkedComponentTypes: ['gevel', 'gevelisolatie'],
    description: 'Isoleren van de gevel om warmteverlies te beperken.',
  },
  {
    id: 'vloerisolatie',
    name: 'Vloerisolatie',
    category: 'Isolatie',
    linkedComponentTypes: ['vloer'],
    description: 'Isoleren van de vloer om warmteverlies te beperken.',
  },
  {
    id: 'hr-glas',
    name: 'HR++ of triple glas',
    category: 'Isolatie',
    linkedComponentTypes: ['beglazing'],
    description: 'Vervangen van beglazing door beter isolerend glas.',
  },
  {
    id: 'zonnepanelen',
    name: 'Zonnepanelen',
    category: 'Opwekking',
    linkedComponentTypes: ['zonnepanelen', 'dak'],
    description: 'Opwekken van elektriciteit op het dak van het pand.',
  },
  {
    id: 'led-verlichting',
    name: 'LED-verlichting',
    category: 'Installaties',
    linkedComponentTypes: ['verlichting'],
    description: 'Vervangen van bestaande verlichting door LED, eventueel met aanwezigheidsdetectie.',
  },
  {
    id: 'efficientere-verwarming',
    name: 'Efficiëntere verwarming',
    category: 'Installaties',
    linkedComponentTypes: ['verwarming'],
    description: 'Een efficiëntere verwarmingsinstallatie of betere regeling van de bestaande installatie.',
  },
  {
    id: 'warmtepomp',
    name: 'Warmtepomp of andere verwarmingsoplossing',
    category: 'Installaties',
    linkedComponentTypes: ['verwarming', 'warmtapwater'],
    description: 'Onderzoeken of een warmtepomp of hybride oplossing passend is voor dit pand.',
  },
  {
    id: 'ventilatieverbetering',
    name: 'Ventilatieverbetering',
    category: 'Installaties',
    linkedComponentTypes: ['ventilatie'],
    description: 'Verbeteren van ventilatie, bijvoorbeeld met warmteterugwinning of CO2-sturing.',
  },
  {
    id: 'koeling-optimaliseren',
    name: 'Koeling optimaliseren',
    category: 'Installaties',
    linkedComponentTypes: ['koeling'],
    description: 'Optimaliseren of vervangen van de koelinstallatie.',
  },
  {
    id: 'warmtapwater-verbeteren',
    name: 'Warmtapwater verbeteren',
    category: 'Installaties',
    linkedComponentTypes: ['warmtapwater'],
    description: 'Verbeteren van de opwekking of isolatie van warmtapwater.',
  },
]

/**
 * Statussen per bouwdeel/installatie. Worden afgeleid uit ingevoerde
 * jaartallen (zie linking.js) — geen vrije invoer, om te voorkomen dat een
 * status als losse, willekeurige claim wordt ingevoerd zonder onderbouwing.
 */
export const STATUSES = {
  nu_onderzoeken: {
    label: 'Nu onderzoeken',
    description: 'Er is op korte termijn reden om dit nader te bekijken.',
  },
  meenemen_bij_vervanging: {
    label: 'Meenemen bij vervanging',
    description: 'Relevant zodra dit onderdeel toch wordt vervangen of gerenoveerd.',
  },
  later_beoordelen: {
    label: 'Later opnieuw beoordelen',
    description: 'Nog geen directe aanleiding, later opnieuw bekijken.',
  },
  geen_actie_nodig: {
    label: 'Geen actie nodig',
    description: 'Op basis van de ingevoerde gegevens is er momenteel geen duidelijke aanleiding voor actie.',
  },
  onvoldoende_informatie: {
    label: 'Onvoldoende informatie',
    description: 'Er is te weinig informatie om een zinvolle beoordeling te maken.',
  },
}

/** Tijdsgebonden prioriteringsgroepen voor het adviesoverzicht (sectie 19). */
export const TIMEFRAMES = [
  { id: 'nu', label: 'Nu' },
  { id: 'kort', label: 'Binnen 1-2 jaar' },
  { id: 'vervanging', label: 'Bij volgende vervanging' },
  { id: 'later', label: 'Later' },
  { id: 'onbekend', label: 'Nog onbekend' },
]

export const BUILDING_USE_OPTIONS = [
  { value: 'kantoor', label: 'Kantoor' },
  { value: 'bedrijfshal', label: 'Bedrijfshal / loods' },
  { value: 'winkel', label: 'Winkel' },
  { value: 'horeca', label: 'Horeca' },
  { value: 'praktijk', label: 'Praktijkruimte' },
  { value: 'gemengd', label: 'Gemengd gebruik' },
  { value: 'anders', label: 'Anders' },
]

export const ENERGY_SOURCE_OPTIONS = [
  { value: 'gas', label: 'Aardgas' },
  { value: 'elektrisch', label: 'Elektrisch' },
  { value: 'gas_elektrisch', label: 'Gas en elektrisch' },
  { value: 'anders', label: 'Anders' },
  { value: 'onbekend', label: 'Niet bekend' },
]

export const HEATING_SYSTEM_OPTIONS = [
  { value: 'cv_ketel', label: 'Cv-ketel' },
  { value: 'warmtepomp', label: 'Warmtepomp' },
  { value: 'hybride', label: 'Hybride (cv-ketel + warmtepomp)' },
  { value: 'stadswarmte', label: 'Stadswarmte' },
  { value: 'anders', label: 'Anders' },
  { value: 'onbekend', label: 'Niet bekend' },
]

export const ENERGY_LABEL_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'G', label: 'G' },
  { value: 'onbekend', label: 'Niet bekend' },
]
