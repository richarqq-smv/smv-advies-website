import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildEnergieInsights } from './energieInsights.js'

// Realistische snapshot, exacte vorm van energieScanResultToSnapshot()
// (zie energieAdapter.js) — hier lokaal nagebouwd i.p.v. de adapter aan te
// roepen, om deze tests uitsluitend te richten op buildEnergieInsights()
// zelf.
function snapshotMetMaatregelen(overrides = {}) {
  return {
    versie: 1,
    uitgevoerd_op: '2026-09-20T10:15:00.000Z',
    invoer: { pandtype: 'Kantoor', oppervlakte: 500 },
    resultaat: {
      score: 34,
      band: { band: 4, status: 'Nog veel potentieel', desc: 'Er lekt op meerdere plekken energie weg.' },
      huidig: { gas: 9500, elek: 41200, bron: 'opgave' },
      huidigeKosten: 23806,
      totaleBesparing: 3550.4,
      co2: 2503.2,
      maatregelen: [
        {
          naam: 'Dakisolatie',
          toelichting: 'Isoleer het dak.',
          besparingM3: 1400,
          besparingKwh: null,
          isElektrisch: false,
          investeringLaag: 9000,
          investeringHoog: 14000,
          besparingEuro: 1820,
          terugverdientijd: 6.3,
        },
        {
          naam: 'LED-verlichting + sensoren',
          toelichting: 'Vervang bestaande verlichting door LED.',
          besparingM3: null,
          besparingKwh: 6180,
          isElektrisch: true,
          investeringLaag: 4550,
          investeringHoog: 7800,
          besparingEuro: 1730.4,
          terugverdientijd: 3.57,
        },
      ],
    },
    ...overrides,
  }
}

// --- 1. null snapshot → geen signalen ---------------------------------------

test('buildEnergieInsights: null/undefined snapshot levert een lege array op, geen crash', () => {
  assert.deepEqual(buildEnergieInsights(null), [])
  assert.deepEqual(buildEnergieInsights(undefined), [])
})

// --- 2. geldige snapshot → verwachte kandidaat-signalen ---------------------

test('buildEnergieInsights: geldige snapshot levert één signaal per opgeslagen maatregel op', () => {
  const insights = buildEnergieInsights(snapshotMetMaatregelen())
  assert.equal(insights.length, 2)
  assert.deepEqual(
    insights.map((i) => i.energieMaatregelId),
    ['Dakisolatie', 'LED-verlichting + sensoren'],
  )
})

// --- 3. expliciete Energie-herkomst ------------------------------------------

test('buildEnergieInsights: elk signaal heeft herkomst "energie"', () => {
  const insights = buildEnergieInsights(snapshotMetMaatregelen())
  assert.ok(insights.length > 0)
  for (const insight of insights) assert.equal(insight.herkomst, 'energie')
})

// --- 4. geen definitieve adviesstatus ----------------------------------------

test('buildEnergieInsights: geen enkel signaal bevat een adviesstatus-veld', () => {
  const insights = buildEnergieInsights(snapshotMetMaatregelen())
  for (const insight of insights) {
    assert.equal('status' in insight, false)
    assert.equal('adviesStatus' in insight, false)
  }
})

// --- 5. bron-snapshot blijft onveranderd -------------------------------------

test('buildEnergieInsights: de bron-snapshot wordt niet gemuteerd', () => {
  const snapshot = snapshotMetMaatregelen()
  const kopieVooraf = JSON.parse(JSON.stringify(snapshot))
  buildEnergieInsights(snapshot)
  assert.deepEqual(snapshot, kopieVooraf)
})

// --- 6. geen live objectreferenties -------------------------------------------

test('buildEnergieInsights: signalen zijn nieuwe objecten, geen referentie naar de maatregel uit de snapshot', () => {
  const snapshot = snapshotMetMaatregelen()
  const insights = buildEnergieInsights(snapshot)
  assert.notEqual(insights[0], snapshot.resultaat.maatregelen[0])
  // Wijzig de bron-maatregel ná het bouwen van de signalen.
  snapshot.resultaat.maatregelen[0].besparingEuro = 999999
  assert.notEqual(insights[0].besparingEuro, 999999)
})

// --- 7. stabiele signalen bij herhaalde aanroep ------------------------------

test('buildEnergieInsights: dezelfde snapshot levert bij herhaling inhoudelijk identieke signalen op', () => {
  const snapshot = snapshotMetMaatregelen()
  const eerste = buildEnergieInsights(snapshot)
  const tweede = buildEnergieInsights(snapshot)
  assert.deepEqual(eerste, tweede)
  assert.deepEqual(
    eerste.map((i) => i.energieMaatregelId),
    tweede.map((i) => i.energieMaatregelId),
  )
})

// --- 8. maatregelen correct als bron gebruikt --------------------------------

test('buildEnergieInsights: bedragen/termijn komen exact overeen met de opgeslagen maatregel', () => {
  const insights = buildEnergieInsights(snapshotMetMaatregelen())
  const dak = insights.find((i) => i.energieMaatregelId === 'Dakisolatie')
  assert.equal(dak.besparingEuro, 1820)
  assert.equal(dak.investeringLaag, 9000)
  assert.equal(dak.investeringHoog, 14000)
  assert.equal(dak.terugverdientijd, 6.3)
  assert.equal(dak.uitgevoerdOp, '2026-09-20T10:15:00.000Z')
  assert.match(dak.reden, /Dakisolatie/)
  assert.match(dak.reden, /1\.820/) // euro()-notatie, geen herberekening
})

// --- 9. ontbrekende optionele data crasht niet -------------------------------

test('buildEnergieInsights: maatregel zonder investerings-/besparingsvelden crasht niet', () => {
  const snapshot = snapshotMetMaatregelen({
    resultaat: {
      maatregelen: [{ naam: 'Onvolledige maatregel', toelichting: null, besparingEuro: null, investeringLaag: null, investeringHoog: null, terugverdientijd: null }],
    },
  })
  const insights = buildEnergieInsights(snapshot)
  assert.equal(insights.length, 1)
  assert.equal(insights[0].besparingEuro, null)
  assert.equal(insights[0].investeringLaag, null)
  assert.ok(insights[0].reden.length > 0)
})

test('buildEnergieInsights: ontbrekende maatregelenlijst, ontbrekend resultaat en ontbrekend uitgevoerd_op crashen niet', () => {
  assert.deepEqual(buildEnergieInsights({}), [])
  assert.deepEqual(buildEnergieInsights({ resultaat: {} }), [])
  assert.deepEqual(buildEnergieInsights({ resultaat: { maatregelen: 'geen-array' } }), [])
  const insights = buildEnergieInsights({ resultaat: { maatregelen: [{ naam: 'X' }] } }) // geen uitgevoerd_op
  assert.equal(insights.length, 1)
  assert.equal(insights[0].uitgevoerdOp, null)
})

test('buildEnergieInsights: een maatregel zonder naam wordt overgeslagen, geen "Onbekend"-signaal verzonnen', () => {
  const snapshot = snapshotMetMaatregelen({ resultaat: { maatregelen: [{ naam: '' }, { besparingEuro: 100 }, null] } })
  assert.deepEqual(buildEnergieInsights(snapshot), [])
})

// --- 10. MJOP-signalen en Energie-signalen blijven naast elkaar bestaan -----
//
// Geen import van lib/mjop/linking.js hier: dat bestand importeert zelf
// `from './constants'` zonder extensie, onoplosbaar voor de kale
// Node-testrunner (zelfde probleem als elders in deze testmap). In plaats
// daarvan een fictieve MJOP-insight, in dezelfde vorm als
// adviespunt.test.js al gebruikt — voldoende om de daadwerkelijke
// dedup-/combinatielogica te testen die DossierWerkruimte.jsx gebruikt
// (filteren op `herkomst`), zonder de MJOP-berekening zelf opnieuw te
// hoeven aanroepen.
function fictieveMjopInsight(overrides = {}) {
  return { componentId: 'verwarming', componentLabel: 'Cv / verwarming', status: 'nu_onderzoeken', statusLabel: 'Nu onderzoeken', relevantYear: 2026, ...overrides }
}

test('MJOP- en Energie-signalen blijven onderscheidbaar en beïnvloeden elkaar niet wanneer ze samen worden verwerkt', () => {
  const mjopInsights = [fictieveMjopInsight()]
  const energieInsights = buildEnergieInsights(snapshotMetMaatregelen())

  // Zelfde soort gecombineerde lijst als DossierWerkruimte.jsx voor de
  // dedup-berekening zou kunnen samenstellen — hier alleen om aan te tonen
  // dat filteren op herkomst de twee bronnen correct scheidt.
  const alles = [...mjopInsights, ...energieInsights]
  const energieDeel = alles.filter((i) => i.herkomst === 'energie')
  const mjopDeel = alles.filter((i) => i.herkomst !== 'energie')

  assert.equal(energieDeel.length, energieInsights.length)
  assert.equal(mjopDeel.length, mjopInsights.length)
  assert.equal(mjopDeel[0].componentId, 'verwarming') // MJOP-insight ongewijzigd
  assert.ok(energieDeel.every((i) => i.energieMaatregelId)) // Energie-insights ongewijzigd, eigen identiteit intact
})
