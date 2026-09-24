/**
 * MJOP → Dossier-adapter: vertaalt een bestaande MJOP-building (zoals
 * gedefinieerd in src/lib/mjop/storage.js) naar de vorm die het
 * Dossier-domein nodig heeft, zonder dat pand.js/dossier.js/snapshot.js
 * ooit iets van MJOP's veldnamen of vocabulaire hoeven te weten. Puur
 * functioneel: geen state, geen I/O, geen aanroep naar MJOP- of
 * dossier-storage. Zie het goedgekeurde ontwerp "MJOP naar Dossier",
 * hoofdstuk 3 (mapping), 4 (wat niet in Pand hoort) en 8 (adapterlaag).
 *
 * Bewust geen createPand()/createDossier() hier: die genereren bij elke
 * aanroep een nieuwe UUID en nieuwe timestamps, wat dezelfde input een
 * andere output zou geven. Het daadwerkelijk aanmaken/persisteren van een
 * Pand of Dossier is een beslissing voor een latere, expliciete stap (de
 * "Opslaan in dossier"-actie), niet voor deze vertaalstap — deze module
 * levert alleen de input daarvoor.
 */

/**
 * Normaliseert MJOP's energiebron-vocabulaire (ENERGY_SOURCE_OPTIONS in
 * lib/mjop/constants.js) naar Pand's vocabulaire. 'onbekend' en een lege
 * waarde worden `null`, nooit een verzonnen categorie.
 */
function mapEnergiebron(energySource) {
  if (!energySource || energySource === 'onbekend') return null
  if (energySource === 'gas_elektrisch') return 'beide'
  return energySource
}

/**
 * Normaliseert MJOP's verwarmingssysteem-vocabulaire (HEATING_SYSTEM_OPTIONS
 * in lib/mjop/constants.js) naar Pand's spelling (koppelteken i.p.v.
 * underscore). 'onbekend' en een lege waarde worden `null`.
 */
function mapVerwarmingssysteemType(heatingSystem) {
  if (!heatingSystem || heatingSystem === 'onbekend') return null
  if (heatingSystem === 'cv_ketel') return 'cv-ketel'
  return heatingSystem
}

/**
 * Vertaalt een MJOP-building naar de invoer voor createPand() (zie
 * lib/dossier/pand.js). Retourneert een plain object, geen Pand-instantie.
 * MJOP kent geen adres/postcode, dus die blijven ongemoeid op createPand()'s
 * eigen standaardwaarden.
 */
export function buildingToPandInput(building) {
  const energy = building.energy ?? {}
  return {
    omschrijving: building.name ?? '',
    plaats: building.location ?? '',
    bouwjaar: building.constructionYear ?? null,
    gebruikstype: building.buildingUse ?? null,
    vloeroppervlak: building.floorArea ?? null,
    bouwlagen: building.floors ?? null,
    gebruikers: building.occupants ?? null,
    energiebron: mapEnergiebron(energy.energySource),
    verwarmingssysteemType: mapVerwarmingssysteemType(energy.heatingSystem),
    energielabel: energy.energyLabel ?? null,
    opmerkingen: building.notes ?? '',
    ontstaanVia: 'mjop',
  }
}

function deepFreeze(value) {
  if (Array.isArray(value)) {
    value.forEach(deepFreeze)
    return Object.freeze(value)
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    return Object.freeze(value)
  }
  return value
}

/**
 * Bouwt de MJOP-momentopname: een bevroren, onafhankelijke kopie van de
 * ruwe MJOP-invoer die nodig is om het MJOP-gedeelte van een dossiermoment
 * te reconstrueren. Bevat uitsluitend wat de gebruiker zelf heeft
 * ingevoerd (de bouwdelen/installaties zoals opgeslagen, en het
 * energieverbruik van dat moment) — nooit de afgeleide resultaten uit
 * lib/mjop/linking.js (status, tijdsbucket, aanbevelingen). Die blijven,
 * precies zoals linking.js zelf al documenteert bij buildInsights(),
 * altijd herberekend uit deze invoer, nooit een opgeslagen uitkomst.
 * `structuredClone` geeft een volledig onafhankelijke kopie: een latere
 * wijziging aan `building` kan deze snapshot niet meer raken.
 */
export function createMjopSnapshotFromBuilding(building) {
  const energy = building.energy ?? {}
  const snapshot = {
    components: structuredClone(building.components ?? []),
    energy: {
      gasConsumption: energy.gasConsumption ?? null,
      electricityConsumption: energy.electricityConsumption ?? null,
    },
  }
  return deepFreeze(snapshot)
}

/**
 * Contactgegevens uit MJOP, als losse, expliciet benoemde data — nooit als
 * Klant-entiteit. Een MJOP-gebruiker die contactgegevens invult, is niet
 * automatisch een Klant in het dossiermodel; die koppeling is een bewuste,
 * latere stap (zie het goedgekeurde ontwerp, open beslispunt 2). Deze
 * functie roept dus nergens createKlant() aan en genereert geen klantId.
 */
export function buildingToContactInfo(building) {
  const contact = building.contact ?? {}
  return {
    naam: contact.naam ?? '',
    email: contact.email ?? '',
    telefoon: contact.telefoon ?? '',
  }
}

/**
 * Hoofdtransformatie: MJOP-building → dossier-integratie-invoer. Bundelt
 * de drie vertalingen hierboven zonder er zelf iets aan toe te voegen —
 * geen Pand, Dossier of Klant wordt hier daadwerkelijk aangemaakt.
 */
export function mjopBuildingToDossierInput(building) {
  return {
    pandInput: buildingToPandInput(building),
    mjopSnapshot: createMjopSnapshotFromBuilding(building),
    contactInfo: buildingToContactInfo(building),
  }
}
