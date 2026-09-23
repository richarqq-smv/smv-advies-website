/**
 * Interne testdata voor ontwikkel-/testdoeleinden (opdracht sectie 42).
 * Wordt uitsluitend gebruikt via een knop die alleen zichtbaar is in
 * `import.meta.env.DEV` (zie BuildingManager.jsx) — verschijnt nooit in de
 * productiebuild en dus nooit op de publieke site. Geen echte klantcase.
 */
import { createEmptyBuilding, createEmptyComponent } from './storage'

function comp(typeId, fields) {
  return { ...createEmptyComponent(typeId), ...fields }
}

/** Testpand A: oud pand, veel bekende vervangingsjaren, verwacht meerdere koppelingen. */
export function buildTestpandA() {
  const b = createEmptyBuilding()
  return {
    ...b,
    name: 'Testpand A (oud bedrijfspand)',
    location: 'Oud-Beijerland',
    constructionYear: 1978,
    buildingUse: 'bedrijfshal',
    floorArea: 650,
    floors: 1,
    notes: 'Testdata: pand met meerdere verouderde onderdelen.',
    energy: { gasConsumption: 18000, electricityConsumption: 32000, energySource: 'gas', heatingSystem: 'cv_ketel', energyLabel: 'F' },
    components: [
      comp('verwarming', { currentSituation: 'Cv-ketel uit 2006, nadert einde levensduur.', installationYear: 2006, expectedLifetime: 20, replacementYear: 2027 }),
      comp('dak', { currentSituation: 'Origineel dak, matig geïsoleerd.', installationYear: 1978, maintenanceYear: 2029 }),
      comp('beglazing', { currentSituation: 'Enkel glas in een deel van het pand.', installationYear: 1978, replacementYear: 2028 }),
      comp('verlichting', { currentSituation: 'TL-verlichting, nog niet vervangen.', installationYear: 1995 }),
    ],
  }
}

/** Testpand B: relatief modern pand, verwacht weinig directe acties. */
export function buildTestpandB() {
  const b = createEmptyBuilding()
  const thisYear = new Date().getFullYear()
  return {
    ...b,
    name: 'Testpand B (modern pand)',
    location: 'Oud-Beijerland',
    constructionYear: 2019,
    buildingUse: 'kantoor',
    floorArea: 400,
    floors: 2,
    notes: 'Testdata: recent gebouwd/gerenoveerd pand.',
    energy: { gasConsumption: 4000, electricityConsumption: 9000, energySource: 'gas_elektrisch', heatingSystem: 'hybride', energyLabel: 'A' },
    components: [
      comp('verwarming', { currentSituation: 'Hybride warmtepomp, recent geplaatst.', installationYear: thisYear - 2 }),
      comp('verlichting', { currentSituation: 'LED-verlichting, recent aangebracht.', installationYear: thisYear - 1 }),
      comp('zonnepanelen', { currentSituation: 'Zonnepanelen aanwezig op het dak.', installationYear: thisYear - 2 }),
    ],
  }
}

/** Testpand C: onvolledig ingevuld, verwacht vooral "onvoldoende informatie". */
export function buildTestpandC() {
  const b = createEmptyBuilding()
  return {
    ...b,
    name: 'Testpand C (onvolledig)',
    location: '',
    constructionYear: null,
    buildingUse: null,
    floorArea: null,
    notes: 'Testdata: bewust onvolledig ingevuld.',
    energy: { gasConsumption: null, electricityConsumption: null, energySource: null, heatingSystem: null, energyLabel: null },
    components: [
      comp('verwarming', { currentSituation: 'Cv is oud, precieze leeftijd onbekend.' }),
      comp('dak', { currentSituation: '' }),
    ],
  }
}
