import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PAND_SNAPSHOT_FIELDS } from './snapshot.js'
import {
  buildingToPandInput,
  createMjopSnapshotFromBuilding,
  buildingToContactInfo,
  mjopBuildingToDossierInput,
} from './mjopAdapter.js'

// Fixtures hieronder zijn letterlijk overgenomen uit de bestaande
// src/lib/mjop/testData.js / createEmptyBuilding()-vorm (velden en waarden
// geverifieerd tegen die bestanden). Ze worden hier lokaal herhaald in
// plaats van geïmporteerd, omdat lib/mjop/* onderling extensieloze imports
// gebruikt (`from './storage'`, `from './constants'`) — correct en bewust
// zo voor Vite's bundler-resolutie, maar onoplosbaar voor de kale
// Node-testrunner zonder die bestaande MJOP-bestanden te wijzigen, wat
// buiten scope van deze opdracht valt. Geen enkele waarde is verzonnen.
function emptyMjopBuilding() {
  return {
    id: 'test-mjop-id',
    name: '',
    location: '',
    constructionYear: null,
    buildingUse: null,
    floorArea: null,
    floors: null,
    occupants: null,
    notes: '',
    energy: { gasConsumption: null, electricityConsumption: null, energySource: null, heatingSystem: null, energyLabel: null },
    components: [],
    contact: { naam: '', email: '', telefoon: '' },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
}

// Overgenomen van buildTestpandA() in lib/mjop/testData.js.
function testpandA() {
  return {
    ...emptyMjopBuilding(),
    name: 'Testpand A (oud bedrijfspand)',
    location: 'Oud-Beijerland',
    constructionYear: 1987,
    buildingUse: 'bedrijfshal',
    floorArea: 650,
    floors: 1,
    notes: 'Testdata: pand met meerdere verouderde onderdelen.',
    energy: { gasConsumption: 18000, electricityConsumption: 32000, energySource: 'gas', heatingSystem: 'cv_ketel', energyLabel: 'F' },
    components: [
      {
        id: 'verwarming',
        typeId: 'verwarming',
        present: 'ja',
        customLabel: '',
        currentSituation: 'Gasgestookte cv-ketel uit 2006, nadert einde levensduur.',
        installationYear: 2006,
        expectedLifetime: 20,
        maintenanceYear: null,
        replacementYear: 2027,
        notes: '',
      },
      {
        id: 'dak',
        typeId: 'dak',
        present: 'ja',
        customLabel: '',
        currentSituation: 'Origineel dak, matig geïsoleerd.',
        installationYear: 1987,
        expectedLifetime: null,
        maintenanceYear: 2029,
        replacementYear: null,
        notes: '',
      },
    ],
  }
}

// Overgenomen van buildTestpandB() in lib/mjop/testData.js.
function testpandB() {
  return {
    ...emptyMjopBuilding(),
    name: 'Testpand B (modern pand)',
    location: 'Oud-Beijerland',
    constructionYear: 2019,
    buildingUse: 'kantoor',
    floorArea: 400,
    floors: 2,
    notes: 'Testdata: recent gebouwd/gerenoveerd pand.',
    energy: { gasConsumption: 4000, electricityConsumption: 9000, energySource: 'gas_elektrisch', heatingSystem: 'hybride', energyLabel: 'A' },
  }
}

// Overgenomen van buildTestpandC() in lib/mjop/testData.js.
function testpandC() {
  return {
    ...emptyMjopBuilding(),
    name: 'Testpand C (onvolledig)',
    location: '',
    constructionYear: 1995,
    buildingUse: null,
    floorArea: null,
    notes: 'Testdata: bewust onvolledig ingevuld.',
  }
}

test('een geldig bestaand MJOP-building wordt correct vertaald naar Pand-input', () => {
  const building = testpandA()
  const pandInput = buildingToPandInput(building)

  assert.equal(pandInput.omschrijving, 'Testpand A (oud bedrijfspand)')
  assert.equal(pandInput.plaats, 'Oud-Beijerland')
  assert.equal(pandInput.bouwjaar, 1987)
  assert.equal(pandInput.gebruikstype, 'bedrijfshal')
  assert.equal(pandInput.vloeroppervlak, 650)
  assert.equal(pandInput.bouwlagen, 1)
  assert.equal(pandInput.opmerkingen, 'Testdata: pand met meerdere verouderde onderdelen.')
  assert.equal(pandInput.ontstaanVia, 'mjop')
})

test('alle acht snapshot-relevante Pand-velden worden gemapt en sluiten aan op PAND_SNAPSHOT_FIELDS', () => {
  const building = testpandA()
  const pandInput = buildingToPandInput(building)

  for (const field of PAND_SNAPSHOT_FIELDS) {
    assert.ok(field in pandInput, `veld "${field}" ontbreekt in buildingToPandInput()`)
  }
  assert.equal(pandInput.bouwjaar, building.constructionYear)
  assert.equal(pandInput.gebruikstype, building.buildingUse)
  assert.equal(pandInput.vloeroppervlak, building.floorArea)
  assert.equal(pandInput.bouwlagen, building.floors)
  assert.equal(pandInput.gebruikers, building.occupants)
  assert.equal(pandInput.energielabel, building.energy.energyLabel)
})

test('bekende vocabulairetransformaties werken correct (gas_elektrisch → beide, cv_ketel → cv-ketel)', () => {
  const pandA = buildingToPandInput(testpandA())
  assert.equal(pandA.energiebron, 'gas') // 'gas' blijft 'gas'
  assert.equal(pandA.verwarmingssysteemType, 'cv-ketel') // 'cv_ketel' → 'cv-ketel'

  const pandB = buildingToPandInput(testpandB())
  assert.equal(pandB.energiebron, 'beide') // 'gas_elektrisch' → 'beide'
  assert.equal(pandB.verwarmingssysteemType, 'hybride') // ongewijzigd, bestaat al in Pand-vocabulaire
})

test('"onbekend" wordt correct naar null vertaald', () => {
  const building = { ...emptyMjopBuilding(), energy: { ...emptyMjopBuilding().energy, energySource: 'onbekend', heatingSystem: 'onbekend' } }
  const pandInput = buildingToPandInput(building)
  assert.equal(pandInput.energiebron, null)
  assert.equal(pandInput.verwarmingssysteemType, null)
})

test('ontbrekende/lege waarden worden niet verzonnen, ze blijven null of leeg', () => {
  const pandInput = buildingToPandInput(testpandC())
  assert.equal(pandInput.gebruikstype, null)
  assert.equal(pandInput.vloeroppervlak, null)
  assert.equal(pandInput.plaats, '')
  assert.equal(pandInput.energiebron, null)
  assert.equal(pandInput.verwarmingssysteemType, null)
  assert.equal(pandInput.energielabel, null)
})

test('MJOP components[] wordt niet per ongeluk onderdeel van het Pand-input-object', () => {
  const pandInput = buildingToPandInput(testpandA())
  assert.equal('components' in pandInput, false)
})

test('energieverbruik (gasConsumption/electricityConsumption) wordt niet per ongeluk onderdeel van het Pand-input-object', () => {
  const pandInput = buildingToPandInput(testpandA())
  assert.equal('gasConsumption' in pandInput, false)
  assert.equal('electricityConsumption' in pandInput, false)
  assert.equal('energy' in pandInput, false)
})

test('contactgegevens worden nooit automatisch een Klant', () => {
  const building = { ...testpandA(), contact: { naam: 'Fictieve Contactpersoon', email: 'smvadvies@gmail.com', telefoon: '0180-123456' } }
  const contactInfo = buildingToContactInfo(building)

  assert.deepEqual(contactInfo, { naam: 'Fictieve Contactpersoon', email: 'smvadvies@gmail.com', telefoon: '0180-123456' })
  assert.equal('klantId' in contactInfo, false)
  assert.equal('contactpersoonId' in contactInfo, false)
})

test('MJOP-snapshot bevat alleen de bedoelde ruwe invoer (components + energieverbruik)', () => {
  const building = testpandA()
  const snapshot = createMjopSnapshotFromBuilding(building)

  assert.deepEqual(Object.keys(snapshot).sort(), ['components', 'energy'])
  assert.equal(snapshot.components.length, building.components.length)
  assert.equal(snapshot.energy.gasConsumption, 18000)
  assert.equal(snapshot.energy.electricityConsumption, 32000)
  // ruwe componentvelden blijven onaangetast, geen berekende velden toegevoegd
  const verwarming = snapshot.components.find((c) => c.typeId === 'verwarming')
  assert.equal(verwarming.installationYear, 2006)
  assert.equal(verwarming.replacementYear, 2027)
  assert.equal('status' in verwarming, false)
  assert.equal('timeframe' in verwarming, false)
})

test('linking.js-resultaten worden niet opgeslagen als snapshot', () => {
  const snapshot = createMjopSnapshotFromBuilding(testpandA())
  const json = JSON.stringify(snapshot)
  // geen van de door lib/mjop/linking.js afgeleide statuswaarden komt voor
  assert.equal(json.includes('nu_onderzoeken'), false)
  assert.equal(json.includes('meenemen_bij_vervanging'), false)
  assert.equal(json.includes('later_beoordelen'), false)
  assert.equal(json.includes('geen_actie_nodig'), false)
  assert.equal(json.includes('onvoldoende_informatie'), false)
  assert.equal(json.includes('recommendations'), false)
})

test('dezelfde input levert dezelfde adapter-output op', () => {
  const building = testpandA()
  const eerste = mjopBuildingToDossierInput(building)
  const tweede = mjopBuildingToDossierInput(building)

  assert.deepEqual(eerste.pandInput, tweede.pandInput)
  assert.deepEqual(eerste.mjopSnapshot, tweede.mjopSnapshot)
  assert.deepEqual(eerste.contactInfo, tweede.contactInfo)
})

test('de adapter muteert het originele MJOP-building-object niet', () => {
  const building = testpandA()
  const kopieVoorAanroep = structuredClone(building)

  mjopBuildingToDossierInput(building)

  assert.deepEqual(building, kopieVoorAanroep)
})

test('belangrijke test: wijzig het origineel na de adapteraanroep — de eerder gemaakte output verandert niet', () => {
  const building = testpandA()
  const output = mjopBuildingToDossierInput(building)

  // Wijzig het origineel achteraf, inclusief geneste structuren.
  building.constructionYear = 1900
  building.buildingUse = 'winkel'
  building.components[0].installationYear = 1900
  building.energy.gasConsumption = 999999

  assert.equal(output.pandInput.bouwjaar, 1987)
  assert.equal(output.pandInput.gebruikstype, 'bedrijfshal')
  assert.notEqual(output.mjopSnapshot.components[0].installationYear, 1900)
  assert.equal(output.mjopSnapshot.energy.gasConsumption, 18000)

  // de snapshot is bovendien echt bevroren, geen toevallige onveranderlijkheid
  assert.throws(() => {
    output.mjopSnapshot.energy.gasConsumption = 1
  })
  assert.throws(() => {
    output.mjopSnapshot.components[0].installationYear = 1
  })
})

test('bestaande Dossier-snapshotlogica (PAND_SNAPSHOT_FIELDS) blijft onaangetast', () => {
  assert.deepEqual(PAND_SNAPSHOT_FIELDS, [
    'bouwjaar',
    'gebruikstype',
    'vloeroppervlak',
    'bouwlagen',
    'gebruikers',
    'energiebron',
    'verwarmingssysteemType',
    'energielabel',
  ])
})
