/**
 * Validatie voor de MJOP-tool. Uitgangspunt: bijna niets is verplicht — een
 * leeg veld betekent "niet bekend", nooit een blokkade. Alleen duidelijk
 * ongeldige invoer (tekst in een jaartal, een vervangingsjaar vóór het
 * bouwjaar, negatieve waarden) wordt afgekeurd.
 */

const MIN_YEAR = 1800
const CURRENT_YEAR = new Date().getFullYear()
// Bouwjaar/plaatsingsjaar: een bestaand pand of onderdeel, dus hoogstens
// "net opgeleverd" — niet een willekeurig ver toekomstjaar zoals 2076.
const MAX_CONSTRUCTION_YEAR = CURRENT_YEAR + 1
// Verwacht onderhouds-/vervangingsjaar: dit zijn juist wél
// toekomstgerichte planningsvelden, met een redelijke MJOP-horizon.
const MAX_PLANNING_YEAR = CURRENT_YEAR + 30

export function parseYear(raw, { maxYear = MAX_CONSTRUCTION_YEAR } = {}) {
  if (raw === '' || raw === null || raw === undefined) return { value: null, error: null }
  const n = Number.parseInt(raw, 10)
  if (Number.isNaN(n) || String(n) !== String(raw).trim()) {
    return { value: null, error: 'Vul een geldig jaartal in, bijvoorbeeld 1987.' }
  }
  if (n < MIN_YEAR || n > maxYear) {
    return { value: null, error: `Vul een jaartal tussen ${MIN_YEAR} en ${maxYear} in.` }
  }
  return { value: n, error: null }
}

export function parsePositiveNumber(raw, { allowZero = false } = {}) {
  if (raw === '' || raw === null || raw === undefined) return { value: null, error: null }
  const n = Number.parseFloat(raw)
  if (Number.isNaN(n)) return { value: null, error: 'Vul een geldig getal in.' }
  if (allowZero ? n < 0 : n <= 0) return { value: null, error: 'Vul een positief getal in.' }
  return { value: n, error: null }
}

/** Validatie voor de algemene pandgegevens (stap 1). */
export function validateBuildingFields(values) {
  const errors = {}

  const constructionYear = parseYear(values.constructionYear)
  if (constructionYear.error) errors.constructionYear = constructionYear.error

  const floorArea = parsePositiveNumber(values.floorArea)
  if (floorArea.error) errors.floorArea = floorArea.error

  if (values.floors !== '' && values.floors !== null && values.floors !== undefined) {
    const floors = parsePositiveNumber(values.floors)
    if (floors.error) errors.floors = floors.error
  }

  if (values.occupants !== '' && values.occupants !== null && values.occupants !== undefined) {
    const occupants = parsePositiveNumber(values.occupants, { allowZero: true })
    if (occupants.error) errors.occupants = occupants.error
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}

/** Validatie voor de energiegegevens (stap 2) — alles optioneel. */
export function validateEnergyFields(values) {
  const errors = {}
  const gas = parsePositiveNumber(values.gasConsumption, { allowZero: true })
  if (gas.error) errors.gasConsumption = gas.error
  const elec = parsePositiveNumber(values.electricityConsumption, { allowZero: true })
  if (elec.error) errors.electricityConsumption = elec.error
  return { isValid: Object.keys(errors).length === 0, errors }
}

/**
 * Validatie voor één bouwdeel/installatie. De enige logische afhankelijkheid
 * die wordt afgedwongen: een vervangingsjaar kan niet vóór het plaatsingsjaar
 * liggen.
 */
export function validateComponentFields(values) {
  const errors = {}

  const installationYear = parseYear(values.installationYear)
  if (installationYear.error) errors.installationYear = installationYear.error

  const maintenanceYear = parseYear(values.maintenanceYear, { maxYear: MAX_PLANNING_YEAR })
  if (maintenanceYear.error) errors.maintenanceYear = maintenanceYear.error

  const replacementYear = parseYear(values.replacementYear, { maxYear: MAX_PLANNING_YEAR })
  if (replacementYear.error) errors.replacementYear = replacementYear.error

  const expectedLifetime = parsePositiveNumber(values.expectedLifetime)
  if (expectedLifetime.error) errors.expectedLifetime = expectedLifetime.error

  if (!errors.installationYear && !errors.replacementYear && installationYear.value && replacementYear.value) {
    if (replacementYear.value < installationYear.value) {
      errors.replacementYear = 'Het vervangingsjaar kan niet vóór het plaatsingsjaar liggen.'
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}
