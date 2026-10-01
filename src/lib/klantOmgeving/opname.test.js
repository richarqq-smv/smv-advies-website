import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  OPNAME_CHECKLIST_ITEMS,
  OPNAME_ONDERDELEN,
  OPNAME_ONDERDEEL_CODES,
  onderdeelLabel,
  magOpnameBewerken,
  berekenChecklistVoortgang,
  groepeerChecklistPerFase,
  telWaarnemingenPerOnderdeel,
  groepeerWaarnemingenPerOnderdeel,
  waarnemingHeeftInhoud,
  waarnemingSamenvatting,
} from './opname.js'

test('OPNAME_CHECKLIST_ITEMS: precies 38 items, exact de brondocument-telling per fase (5+8+8+5+7+5)', () => {
  assert.equal(OPNAME_CHECKLIST_ITEMS.length, 38)
  const perFase = OPNAME_CHECKLIST_ITEMS.reduce((acc, i) => {
    acc[i.fase] = (acc[i.fase] ?? 0) + 1
    return acc
  }, {})
  assert.deepEqual(perFase, { voorbereiding: 5, bouwkundig: 8, installaties: 8, verbruik: 5, fotos: 7, afronding: 5 })
})

test('OPNAME_CHECKLIST_ITEMS: alle item_codes uniek', () => {
  const codes = OPNAME_CHECKLIST_ITEMS.map((i) => i.item_code)
  assert.equal(new Set(codes).size, codes.length)
})

test('OPNAME_ONDERDELEN: precies de 17 onderdelen uit het opnameformulier, in de originele volgorde', () => {
  assert.deepEqual(
    OPNAME_ONDERDEEL_CODES,
    ['dak', 'gevel', 'vloer', 'glas', 'kozijnen', 'deuren', 'isolatie', 'kierdichting', 'cv', 'warmtepomp', 'warmtapwater', 'ventilatie', 'verlichting', 'zonnepanelen', 'meterkast', 'overig', 'verbruik'],
  )
  assert.equal(OPNAME_ONDERDELEN.length, 17)
})

test('onderdeelLabel: geeft de exacte label uit het formulier terug, onbekende code geeft de code zelf terug (nooit een crash)', () => {
  assert.equal(onderdeelLabel('cv'), 'CV / verwarming')
  assert.equal(onderdeelLabel('isolatie'), 'Isolatie (algemeen)')
  assert.equal(onderdeelLabel('overig'), 'Overige installaties')
  assert.equal(onderdeelLabel('onbekend'), 'onbekend')
})

test('magOpnameBewerken: alleen false bij status afgerond', () => {
  assert.equal(magOpnameBewerken({ status: 'concept' }), true)
  assert.equal(magOpnameBewerken({ status: 'opgeslagen' }), true)
  assert.equal(magOpnameBewerken({ status: 'afgerond' }), false)
  assert.equal(magOpnameBewerken(null), false)
})

test('berekenChecklistVoortgang: leeg (geen rijen) geeft 0/38, niet compleet, alle 38 ontbrekend', () => {
  const v = berekenChecklistVoortgang([])
  assert.equal(v.totaal, 38)
  assert.equal(v.afgevinkt, 0)
  assert.equal(v.compleet, false)
  assert.equal(v.ontbrekend.length, 38)
})

test('berekenChecklistVoortgang: alle 38 afgevinkt geeft compleet true, 0 ontbrekend', () => {
  const rows = OPNAME_CHECKLIST_ITEMS.map((i) => ({ item_code: i.item_code, afgevinkt: true }))
  const v = berekenChecklistVoortgang(rows)
  assert.equal(v.afgevinkt, 38)
  assert.equal(v.compleet, true)
  assert.deepEqual(v.ontbrekend, [])
})

test('berekenChecklistVoortgang: 37 van de 38 afgevinkt (afronding_5 mist) geeft compleet false, precies dat ene item in ontbrekend', () => {
  const rows = OPNAME_CHECKLIST_ITEMS.filter((i) => i.item_code !== 'afronding_5').map((i) => ({ item_code: i.item_code, afgevinkt: true }))
  const v = berekenChecklistVoortgang(rows)
  assert.equal(v.afgevinkt, 37)
  assert.equal(v.compleet, false)
  assert.equal(v.ontbrekend.length, 1)
  assert.equal(v.ontbrekend[0].item_code, 'afronding_5')
})

test('berekenChecklistVoortgang: een rij met afgevinkt=false telt niet mee als afgevinkt', () => {
  const v = berekenChecklistVoortgang([{ item_code: 'voorbereiding_1', afgevinkt: false }])
  assert.equal(v.afgevinkt, 0)
  assert.equal(v.ontbrekend.some((i) => i.item_code === 'voorbereiding_1'), true)
})

test('groepeerChecklistPerFase: 6 fasen, elke fase-items array heeft de juiste lengte en gemengde afvinkstatus', () => {
  const groepen = groepeerChecklistPerFase([{ item_code: 'bouwkundig_2', afgevinkt: true }])
  assert.equal(groepen.length, 6)
  const bouwkundig = groepen.find((g) => g.fase === 'bouwkundig')
  assert.equal(bouwkundig.items.length, 8)
  assert.equal(bouwkundig.items.find((i) => i.item_code === 'bouwkundig_2').afgevinkt, true)
  assert.equal(bouwkundig.items.find((i) => i.item_code === 'bouwkundig_1').afgevinkt, false)
})

test('telWaarnemingenPerOnderdeel: telt correct per onderdeel, onbekende/lege input geeft 0 voor alle 17', () => {
  const telling = telWaarnemingenPerOnderdeel([{ onderdeel: 'dak' }, { onderdeel: 'dak' }, { onderdeel: 'gevel' }])
  assert.equal(telling.dak, 2)
  assert.equal(telling.gevel, 1)
  assert.equal(telling.vloer, 0)
  assert.equal(Object.keys(telling).length, 17)
  assert.deepEqual(Object.values(telWaarnemingenPerOnderdeel(undefined)), new Array(17).fill(0))
})

test('groepeerWaarnemingenPerOnderdeel: groepeert en sorteert op created_at binnen een onderdeel, negeert onbekend onderdeel', () => {
  const waarnemingen = [
    { onderdeel: 'dak', created_at: '2026-09-30T10:00:00Z', huidige_situatie: 'tweede' },
    { onderdeel: 'dak', created_at: '2026-09-30T09:00:00Z', huidige_situatie: 'eerste' },
    { onderdeel: 'onbekend_onderdeel', created_at: '2026-09-30T08:00:00Z' },
  ]
  const groepen = groepeerWaarnemingenPerOnderdeel(waarnemingen)
  assert.equal(groepen.dak.length, 2)
  assert.equal(groepen.dak[0].huidige_situatie, 'eerste')
  assert.equal(groepen.dak[1].huidige_situatie, 'tweede')
  assert.equal(groepen.onbekend_onderdeel, undefined)
})

test('waarnemingHeeftInhoud: false voor een volledig lege waarneming (nieuw aangemaakt), true zodra één veld iets bevat', () => {
  assert.equal(waarnemingHeeftInhoud({}), false)
  assert.equal(waarnemingHeeftInhoud({ huidige_situatie: '', beoordeling: null }), false)
  assert.equal(waarnemingHeeftInhoud({ huidige_situatie: '   ' }), false)
  assert.equal(waarnemingHeeftInhoud({ huidige_situatie: 'Pannendak, redelijke staat' }), true)
  assert.equal(waarnemingHeeftInhoud({ opmerkingen: 'alleen een opmerking' }), true)
})

test('waarnemingSamenvatting: toont huidige_situatie, valt terug op beoordeling, dan op een duidelijke lege-staat-tekst', () => {
  assert.equal(waarnemingSamenvatting({ huidige_situatie: 'Pannendak', beoordeling: 'Redelijk' }), 'Pannendak')
  assert.equal(waarnemingSamenvatting({ huidige_situatie: '', beoordeling: 'Redelijk' }), 'Redelijk')
  assert.equal(waarnemingSamenvatting({}), 'Nog niets ingevuld')
  assert.equal(waarnemingSamenvatting({ huidige_situatie: '   ' }), 'Nog niets ingevuld')
})
