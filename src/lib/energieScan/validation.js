const STEP1_OPTION_FIELDS = [
  { id: 'pandtype', label: 'Type pand' },
  { id: 'bouwjaar', label: 'Bouwjaar' },
  { id: 'verdiepingen', label: 'Aantal verdiepingen' },
]

const STEP2_OPTION_FIELDS = [
  { id: 'beglazing', label: 'Beglazing' },
  { id: 'isolatie_gevel', label: 'Isolatie gevel' },
  { id: 'isolatie_dak', label: 'Isolatie dak' },
  { id: 'isolatie_vloer', label: 'Isolatie vloer' },
  { id: 'verwarming', label: 'Verwarmingssysteem' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// All four checks below are required before a result is ever shown,
// matching the original Base44 tool's own behavior. The FAQ and privacy
// text (src/data/faqs.js, src/data/legalContent.js) describe this
// requirement explicitly — the tool's behavior is leading.
const STEP4_CHECKS = [
  { id: 'naam', label: 'Naam', test: (v) => v.length > 0, msg: 'Vul uw naam in.' },
  { id: 'bedrijfsnaam', label: 'Bedrijfsnaam', test: (v) => v.length > 0, msg: 'Vul uw bedrijfsnaam in.' },
  { id: 'email', label: 'E-mailadres', test: (v) => EMAIL_RE.test(v), msg: 'Vul een geldig e-mailadres in.' },
  {
    id: 'telefoon',
    label: 'Telefoonnummer',
    test: (v) => v.replace(/[^0-9]/g, '').length >= 8,
    msg: 'Vul een geldig telefoonnummer in.',
  },
]

function validateOptionFields(values, fields) {
  const errors = {}
  const missing = []
  fields.forEach((f) => {
    if (!values[f.id]) {
      errors[f.id] = 'Kies een optie om verder te gaan.'
      missing.push(f.label)
    }
  })
  return { errors, missing }
}

/** Builds the single summarizing toast message for a set of missing labels. */
export function buildMissingToast(missing, singleTemplate, multipleMessage) {
  if (missing.length === 1) return singleTemplate.replace('%s', missing[0])
  if (missing.length > 1) return multipleMessage
  return null
}

export function validateStep1(values) {
  const { errors, missing } = validateOptionFields(values, STEP1_OPTION_FIELDS)

  const opp = Number.parseFloat(values.oppervlakte)
  if (!opp || opp <= 0) {
    errors.oppervlakte = 'Vul een geldige oppervlakte in (in m²).'
    missing.push('Gebruiksoppervlakte')
  }

  return {
    isValid: missing.length === 0,
    errors,
    toast: buildMissingToast(missing, "Vul '%s' in om verder te gaan.", 'Vul de gemarkeerde velden in om verder te gaan.'),
  }
}

export function validateStep2(values) {
  const { errors, missing } = validateOptionFields(values, STEP2_OPTION_FIELDS)
  return {
    isValid: missing.length === 0,
    errors,
    toast: buildMissingToast(
      missing,
      "Kies een optie bij '%s'.",
      'Vul de gemarkeerde velden in — kies "Weet ik niet" als u het niet zeker weet.',
    ),
  }
}

/** Step 3 is entirely optional — nothing ever blocks continuing. */
export function validateStep3() {
  return { isValid: true, errors: {}, toast: null }
}

export function validateStep4(values) {
  const errors = {}
  const missing = []

  STEP4_CHECKS.forEach((c) => {
    const value = (values[c.id] ?? '').trim()
    if (!c.test(value)) {
      errors[c.id] = c.msg
      missing.push(c.label)
    }
  })

  return {
    isValid: missing.length === 0,
    errors,
    toast: buildMissingToast(
      missing,
      "Vul '%s' goed in om uw rapport te ontvangen.",
      'Vul de gemarkeerde velden in om uw rapport te ontvangen.',
    ),
  }
}

/** Parses step-3's free-number fields to the null-or-positive-number shape the calculator expects. */
export function readStep3Numbers(values) {
  const toPositiveOrNull = (raw) => {
    const n = Number.parseFloat(raw)
    return !Number.isNaN(n) && n > 0 ? n : null
  }
  return {
    gasverbruik: toPositiveOrNull(values.gasverbruik),
    elekverbruik: toPositiveOrNull(values.elekverbruik),
    energiekosten: toPositiveOrNull(values.energiekosten),
  }
}

/** Converts the raw (string) form values into the numeric shape the calculation engine expects. */
export function prepareCalculationInput(values) {
  return {
    ...values,
    oppervlakte: Number.parseFloat(values.oppervlakte),
    ...readStep3Numbers(values),
  }
}
