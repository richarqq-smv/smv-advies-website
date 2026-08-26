/**
 * Single source of truth for every choice field in the energy scan.
 * Both the option-grid UI and the label lookups (used in the results
 * summary) read from these lists, so labels can never drift out of sync
 * with the values the calculation engine expects.
 */

export const PANDTYPE_OPTIONS = [
  { value: 'kantoor', label: 'Kantoor' },
  { value: 'magazijn', label: 'Magazijn / loods' },
  { value: 'winkel', label: 'Winkel' },
  { value: 'werkplaats', label: 'Werkplaats' },
  { value: 'overig', label: 'Overig' },
]

export const BOUWJAAR_OPTIONS = [
  { value: 'voor1980', label: 'Voor 1980' },
  { value: '1980-1995', label: '1980 – 1995' },
  { value: '1995-2005', label: '1995 – 2005' },
  { value: '2005-2015', label: '2005 – 2015' },
  { value: 'na2015', label: 'Na 2015' },
]

export const VERDIEPINGEN_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3+' },
]

export const BEGLAZING_OPTIONS = [
  { value: 'enkel', label: 'Enkel glas' },
  { value: 'dubbel', label: 'Dubbel glas' },
  { value: 'hr', label: 'HR-glas' },
  { value: 'hrpp', label: 'HR++' },
  { value: 'triple', label: 'Triple glas' },
  { value: 'onbekend', label: 'Weet ik niet' },
]

export const ISOLATIE_OPTIONS = [
  { value: 'geen', label: 'Geen' },
  { value: 'matig', label: 'Matig' },
  { value: 'redelijk', label: 'Redelijk' },
  { value: 'goed', label: 'Goed' },
  { value: 'onbekend', label: 'Weet ik niet' },
]

export const VERWARMING_OPTIONS = [
  { value: 'oude_ketel', label: 'Oude ketel' },
  { value: 'hr_ketel', label: 'HR-ketel (gas)' },
  { value: 'hybride_wp', label: 'Hybride warmtepomp' },
  { value: 'volledige_wp', label: 'Volledige warmtepomp' },
  { value: 'stadsverwarming', label: 'Stadsverwarming' },
  { value: 'overig', label: 'Overig' },
]

function labelLookup(options) {
  return Object.fromEntries(options.map((o) => [o.value, o.label]))
}

/** value -> label lookups, derived from the option lists above. */
export const LABELS = {
  pandtype: labelLookup(PANDTYPE_OPTIONS),
  bouwjaar: labelLookup(BOUWJAAR_OPTIONS),
  beglazing: labelLookup(BEGLAZING_OPTIONS),
  isolatie: labelLookup(ISOLATIE_OPTIONS),
  verwarming: labelLookup(VERWARMING_OPTIONS),
}
