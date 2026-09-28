import { test } from 'node:test'
import assert from 'node:assert/strict'
import { energieScanResultToSnapshot, isValidEnergieSnapshot, ENERGIE_SNAPSHOT_VERSIE } from './energieAdapter.js'

// Geen import van lib/energieScan/calculations.js hier: dat bestand
// importeert zelf `from './constants'` zonder extensie — prima voor
// Vite's bundler, maar onoplosbaar voor de kale Node-testrunner (`node
// --test`) zonder dat bestand te wijzigen, wat buiten scope valt (de
// bouwprompt verbiedt expliciet wijzigingen aan de bestaande
// berekeningslogica). Zelfde probleem, zelfde oplossing als
// mjopAdapter.test.js al koos: een lokale fixture die de daadwerkelijke
// vorm van berekenResultaat()'s resultaat exact naspiegelt, in plaats van
// de echte functie aan te roepen. lib/energieScan/* heeft zelf nog geen
// testbestand — die berekeningslogica zelf testen valt buiten deze
// opdracht (uitsluitend de adapter).

// Realistische, volledige invoer — dezelfde vorm als useEnergieScan's
// `values` na prepareCalculationInput() (numerieke oppervlakte/
// verbruiksvelden, ruwe enum-waarden voor de keuzevelden). Bevat bewust
// ook de contactvelden (naam/bedrijfsnaam/email/telefoon): die horen bij
// het echte `values`-object van de tool, en de tests hieronder bevestigen
// expliciet dat de adapter ze NIET overneemt.
function volledigeInvoer(overrides = {}) {
  return {
    pandtype: 'kantoor',
    bouwjaar: 'na2015',
    oppervlakte: 650,
    verdiepingen: '2',
    beglazing: 'hrpp',
    isolatie_gevel: 'goed',
    isolatie_dak: 'redelijk',
    isolatie_vloer: 'matig',
    verwarming: 'hybride_wp',
    gasverbruik: 12000,
    elekverbruik: 45000,
    energiekosten: 900,
    naam: 'Jan Jansen',
    bedrijfsnaam: 'Jansen Bedrijfspanden BV',
    email: 'jan@jansenbv.test',
    telefoon: '0612345678',
    ...overrides,
  }
}

// Exacte vorm van berekenResultaat()'s output (zie calculations.js) —
// realistische, representatieve waarden, geen live berekening (zie de
// importuitleg hierboven).
function resultFixture(overrides = {}) {
  return {
    score: 58,
    band: { min: 41, band: 3, status: 'Gemiddeld — ruimte voor verbetering', desc: 'Er is duidelijk winst te behalen.' },
    huidig: { gas: 9500, elek: 41200, bron: 'schatting' },
    maatregelen: [
      {
        naam: 'Dakisolatie',
        toelichting: 'Isoleer het dak.',
        besparingM3: 1200,
        investeringLaag: 8000,
        investeringHoog: 12000,
        relevant: true,
        besparingEuro: 1560,
        terugverdientijd: 6.4,
      },
      {
        naam: 'LED-verlichting + sensoren',
        toelichting: 'Vervang bestaande verlichting door LED.',
        besparingKwh: 6180,
        investeringLaag: 4550,
        investeringHoog: 7800,
        relevant: true,
        isElektrisch: true,
        besparingEuro: 1730.4,
        terugverdientijd: 3.57,
      },
    ],
    huidigeKosten: 24086,
    totaleBesparing: 3290.4,
    co2: 2146.8,
    ...overrides,
  }
}

function scan(valuesOverrides = {}, resultOverrides = {}) {
  return { values: volledigeInvoer(valuesOverrides), result: resultFixture(resultOverrides) }
}

// --- Adapter: volledigheid ---------------------------------------------

test('energieScanResultToSnapshot: volledige input geeft een correcte snapshot', () => {
  const { values, result } = scan()
  const snapshot = energieScanResultToSnapshot(values, result)

  assert.equal(snapshot.versie, ENERGIE_SNAPSHOT_VERSIE)
  assert.equal(typeof snapshot.uitgevoerd_op, 'string')
  assert.ok(!Number.isNaN(Date.parse(snapshot.uitgevoerd_op)))

  assert.equal(snapshot.invoer.pandtype, 'Kantoor')
  assert.equal(snapshot.invoer.bouwjaar, 'Na 2015')
  assert.equal(snapshot.invoer.oppervlakte, 650)
  assert.equal(snapshot.invoer.verdiepingen, '2')
  assert.equal(snapshot.invoer.beglazing, 'HR++')
  assert.equal(snapshot.invoer.isolatie_gevel, 'Goed')
  assert.equal(snapshot.invoer.isolatie_dak, 'Redelijk')
  assert.equal(snapshot.invoer.isolatie_vloer, 'Matig')
  assert.equal(snapshot.invoer.verwarming, 'Hybride warmtepomp')
  assert.equal(snapshot.invoer.gasverbruik, 12000)
  assert.equal(snapshot.invoer.elekverbruik, 45000)
  assert.equal(snapshot.invoer.energiekosten, 900)
})

test('energieScanResultToSnapshot: alle relevante resultaten zijn aanwezig', () => {
  const { values, result } = scan()
  const snapshot = energieScanResultToSnapshot(values, result)

  assert.equal(snapshot.resultaat.score, result.score)
  assert.deepEqual(snapshot.resultaat.band, { band: result.band.band, status: result.band.status, desc: result.band.desc })
  assert.deepEqual(snapshot.resultaat.huidig, { gas: result.huidig.gas, elek: result.huidig.elek, bron: result.huidig.bron })
  assert.equal(snapshot.resultaat.huidigeKosten, result.huidigeKosten)
  assert.equal(snapshot.resultaat.totaleBesparing, result.totaleBesparing)
  assert.equal(snapshot.resultaat.co2, result.co2)
  assert.equal(snapshot.resultaat.maatregelen.length, result.maatregelen.length)
  assert.ok(snapshot.resultaat.maatregelen.length > 0)
})

test('energieScanResultToSnapshot: verdiepingen "3" wordt het label "3+", niet de ruwe waarde', () => {
  const { values, result } = scan({ verdiepingen: '3' })
  const snapshot = energieScanResultToSnapshot(values, result)
  assert.equal(snapshot.invoer.verdiepingen, '3+')
})

test('energieScanResultToSnapshot: niet-opgegeven verbruiksvelden blijven null, geen verzonnen 0', () => {
  const { values, result } = scan({ gasverbruik: null, elekverbruik: null, energiekosten: null })
  const snapshot = energieScanResultToSnapshot(values, result)
  assert.equal(snapshot.invoer.gasverbruik, null)
  assert.equal(snapshot.invoer.elekverbruik, null)
  assert.equal(snapshot.invoer.energiekosten, null)
  // De snapshot legt uitsluitend vast wát is opgegeven (hier: niets) —
  // los van `result.huidig.bron`, dat de calculatie-engine zelf al bepaalt
  // (zie bepaalHuidigVerbruik() in calculations.js) en dat de adapter
  // alleen doorgeeft, niet herinterpreteert.
  assert.equal(snapshot.resultaat.huidig.bron, result.huidig.bron)
})

test('energieScanResultToSnapshot: maatregelen bevatten geen "relevant"-vlag (geen informatiewaarde in de gefilterde lijst)', () => {
  const { values, result } = scan()
  const snapshot = energieScanResultToSnapshot(values, result)
  for (const maatregel of snapshot.resultaat.maatregelen) {
    assert.equal('relevant' in maatregel, false)
  }
})

test('energieScanResultToSnapshot: contactvelden (naam/bedrijfsnaam/email/telefoon) worden nooit meegenomen', () => {
  const { values, result } = scan()
  const snapshot = energieScanResultToSnapshot(values, result)
  const json = JSON.stringify(snapshot)

  assert.equal('naam' in snapshot.invoer, false)
  assert.equal('bedrijfsnaam' in snapshot.invoer, false)
  assert.equal('email' in snapshot.invoer, false)
  assert.equal('telefoon' in snapshot.invoer, false)
  assert.equal(json.includes('Jan Jansen'), false)
  assert.equal(json.includes('jan@jansenbv.test'), false)
  assert.equal(json.includes('0612345678'), false)
})

test('energieScanResultToSnapshot: geen functies of objectreferenties in de snapshot', () => {
  const { values, result } = scan()
  const snapshot = energieScanResultToSnapshot(values, result)

  assert.notEqual(snapshot.resultaat.maatregelen, result.maatregelen) // geen zelfde array-referentie
  const checkGeenFuncties = (waarde) => {
    if (typeof waarde === 'function') throw new Error('snapshot bevat een functie')
    if (Array.isArray(waarde)) waarde.forEach(checkGeenFuncties)
    else if (waarde && typeof waarde === 'object') Object.values(waarde).forEach(checkGeenFuncties)
  }
  assert.doesNotThrow(() => checkGeenFuncties(snapshot))
  // JSON.stringify laat functies stilzwijgend weg — een expliciete
  // JSON-roundtrip bevestigt dat er niets "verdwijnt" dat er niet al was.
  assert.deepEqual(JSON.parse(JSON.stringify(snapshot)), snapshot)
})

test('energieScanResultToSnapshot: versie is aanwezig en een getal', () => {
  const { values, result } = scan()
  const snapshot = energieScanResultToSnapshot(values, result)
  assert.equal(typeof snapshot.versie, 'number')
  assert.equal(snapshot.versie, 1)
})

// --- Snapshot-isolatie ---------------------------------------------------

test('snapshot-isolatie: wijzigen van de originele values/result ná het bouwen raakt de snapshot niet', () => {
  const { values, result } = scan()
  const snapshot = energieScanResultToSnapshot(values, result)

  values.pandtype = 'winkel'
  values.oppervlakte = 99999
  result.score = 0
  result.maatregelen[0].naam = 'GEWIJZIGD'
  result.maatregelen[0].besparingEuro = 999999

  assert.equal(snapshot.invoer.pandtype, 'Kantoor')
  assert.equal(snapshot.invoer.oppervlakte, 650)
  assert.notEqual(snapshot.resultaat.score, 0)
  assert.notEqual(snapshot.resultaat.maatregelen[0].naam, 'GEWIJZIGD')
  assert.notEqual(snapshot.resultaat.maatregelen[0].besparingEuro, 999999)
})

test('snapshot-isolatie: twee snapshots van dezelfde input delen geen maatregelen-objecten', () => {
  const { values, result } = scan()
  const eerste = energieScanResultToSnapshot(values, result)
  const tweede = energieScanResultToSnapshot(values, result)

  // `uitgevoerd_op` komt bij elke aanroep uit een eigen `new Date()` — dat
  // is precies bedoeld (elke opslag krijgt zijn eigen, echte tijdstip), maar
  // maakt een letterlijke deepEqual van de twee volledige snapshots
  // intrinsiek flaky: twee aanroepen vlak na elkaar kunnen toevallig een
  // milliseconde-grens overschrijden. Vergelijk daarom de rest van de
  // snapshot inhoudelijk, en toets `uitgevoerd_op` losstaand op vorm.
  const { uitgevoerd_op: eersteTijdstip, ...eersteRest } = eerste
  const { uitgevoerd_op: tweedeTijdstip, ...tweedeRest } = tweede
  assert.deepEqual(eersteRest, tweedeRest) // inhoudelijk identiek, op het tijdstip na
  assert.match(eersteTijdstip, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  assert.match(tweedeTijdstip, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  assert.notEqual(eerste.resultaat.maatregelen, tweede.resultaat.maatregelen) // nooit dezelfde array
  eerste.resultaat.maatregelen[0].naam = 'GEWIJZIGD IN EERSTE'
  assert.notEqual(tweede.resultaat.maatregelen[0].naam, 'GEWIJZIGD IN EERSTE')
})

// --- isValidEnergieSnapshot (Fase 2, saveEnergieSnapshot()'s structurele check) ---

test('isValidEnergieSnapshot: een echte, door de adapter gebouwde snapshot is geldig', () => {
  const { values, result } = scan()
  const snapshot = energieScanResultToSnapshot(values, result)
  assert.equal(isValidEnergieSnapshot(snapshot), true)
})

test('isValidEnergieSnapshot: null/undefined/geen object is ongeldig', () => {
  assert.equal(isValidEnergieSnapshot(null), false)
  assert.equal(isValidEnergieSnapshot(undefined), false)
  assert.equal(isValidEnergieSnapshot('geen object'), false)
  assert.equal(isValidEnergieSnapshot(42), false)
})

test('isValidEnergieSnapshot: ontbrekende versie/invoer/resultaat is ongeldig', () => {
  const { values, result } = scan()
  const snapshot = energieScanResultToSnapshot(values, result)

  const { versie: _v, ...zonderVersie } = snapshot
  assert.equal(isValidEnergieSnapshot(zonderVersie), false)

  const { invoer: _i, ...zonderInvoer } = snapshot
  assert.equal(isValidEnergieSnapshot(zonderInvoer), false)

  const { resultaat: _r, ...zonderResultaat } = snapshot
  assert.equal(isValidEnergieSnapshot(zonderResultaat), false)
})
