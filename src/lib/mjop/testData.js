/**
 * Interne testdata voor ontwikkel-/testdoeleinden (opdracht sectie 42).
 * Wordt uitsluitend gebruikt via een knop die alleen zichtbaar is in
 * `import.meta.env.DEV` (zie BuildingManager.jsx) — verschijnt nooit in de
 * productiebuild en dus nooit op de publieke site. Geen echte klantcase.
 *
 * Bouwt verder op de 12 standaardonderdelen die createEmptyBuilding() al
 * meegeeft: `withComponents` past alleen de genoemde onderdelen aan (en zet
 * ze op `present: 'ja'`), de rest blijft op de standaard "onbekend" staan,
 * zoals een echt half ingevuld pand er ook uit zou zien.
 */
import { createEmptyBuilding } from './storage'

function withComponents(building, patches) {
  return {
    ...building,
    components: building.components.map((c) => {
      const patch = patches[c.typeId]
      return patch ? { ...c, present: 'ja', ...patch } : c
    }),
  }
}

function notPresent(building, typeIds) {
  return {
    ...building,
    components: building.components.map((c) => (typeIds.includes(c.typeId) ? { ...c, present: 'nee' } : c)),
  }
}

/** Testpand A: oud pand, veel bekende vervangingsjaren, verwacht meerdere koppelingen. */
export function buildTestpandA() {
  let b = createEmptyBuilding()
  b = {
    ...b,
    name: 'Testpand A (oud bedrijfspand)',
    location: 'Oud-Beijerland',
    constructionYear: 1987,
    buildingUse: 'bedrijfshal',
    floorArea: 650,
    floors: 1,
    notes: 'Testdata: pand met meerdere verouderde onderdelen.',
    energy: { gasConsumption: 18000, electricityConsumption: 32000, energySource: 'gas', heatingSystem: 'cv_ketel', energyLabel: 'F' },
  }
  b = withComponents(b, {
    verwarming: { currentSituation: 'Gasgestookte cv-ketel uit 2006, nadert einde levensduur.', installationYear: 2006, expectedLifetime: 20, replacementYear: 2027 },
    dak: { currentSituation: 'Origineel dak, matig geïsoleerd.', installationYear: 1987, maintenanceYear: 2029 },
    dakisolatie: { currentSituation: 'Beperkte isolatie, nooit vervangen.', installationYear: 1987 },
    beglazing: { currentSituation: 'Enkel glas in een deel van het pand.', installationYear: 1987, replacementYear: 2028 },
    verlichting: { currentSituation: 'TL-verlichting, deels onbekend of al vervangen.', installationYear: null },
  })
  return b
}

/** Testpand B: relatief modern pand, verwacht weinig directe acties. */
export function buildTestpandB() {
  let b = createEmptyBuilding()
  const thisYear = new Date().getFullYear()
  b = {
    ...b,
    name: 'Testpand B (modern pand)',
    location: 'Oud-Beijerland',
    constructionYear: 2019,
    buildingUse: 'kantoor',
    floorArea: 400,
    floors: 2,
    notes: 'Testdata: recent gebouwd/gerenoveerd pand.',
    energy: { gasConsumption: 4000, electricityConsumption: 9000, energySource: 'gas_elektrisch', heatingSystem: 'hybride', energyLabel: 'A' },
  }
  b = withComponents(b, {
    verwarming: { currentSituation: 'Hybride warmtepomp, recent geplaatst.', installationYear: thisYear - 2 },
    dak: { currentSituation: 'Recent dak, onderdeel van de bouw in 2019.', installationYear: 2019 },
    dakisolatie: { currentSituation: 'Goed geïsoleerd, onderdeel van de bouw.', installationYear: 2019 },
    beglazing: { currentSituation: 'Triple glas, recent geplaatst.', installationYear: thisYear - 1 },
    verlichting: { currentSituation: 'LED-verlichting, recent aangebracht.', installationYear: thisYear - 1 },
    zonnepanelen: { currentSituation: 'Zonnepanelen aanwezig op het dak.', installationYear: thisYear - 2 },
  })
  b = notPresent(b, ['koeling'])
  return b
}

/** Testpand C: onvolledig ingevuld, verwacht vooral "onvoldoende informatie". */
export function buildTestpandC() {
  let b = createEmptyBuilding()
  b = {
    ...b,
    name: 'Testpand C (onvolledig)',
    location: '',
    constructionYear: 1995,
    buildingUse: null,
    floorArea: null,
    notes: 'Testdata: bewust onvolledig ingevuld.',
  }
  b = withComponents(b, {
    verwarming: { currentSituation: 'Cv is oud, precieze leeftijd onbekend.' },
  })
  return b
}
