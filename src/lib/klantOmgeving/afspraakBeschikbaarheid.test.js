import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  berekenBeschikbareStarttijden,
  tijdNaarMinuten,
  minutenNaarTijd,
  valideerPlannerDatum,
  valideerPlannerStarttijd,
  berekenEindtijd,
  isZakelijkPand,
  AFSPRAAK_DUUR_MINUTEN,
  STARTINTERVAL_MINUTEN,
  PLANNER_START_UUR,
  PLANNER_EIND_UUR,
} from './afspraakBeschikbaarheid.js'

// --- tijdNaarMinuten / minutenNaarTijd ----------------------------------

test('tijdNaarMinuten/minutenNaarTijd: rondtrip klopt voor diverse tijden', () => {
  assert.equal(tijdNaarMinuten('00:00'), 0)
  assert.equal(tijdNaarMinuten('08:00'), 480)
  assert.equal(tijdNaarMinuten('14:20'), 860)
  assert.equal(minutenNaarTijd(480), '08:00')
  assert.equal(minutenNaarTijd(860), '14:20')
  assert.equal(minutenNaarTijd(5), '00:05')
})

// --- berekenBeschikbareStarttijden --------------------------------------

test('berekenBeschikbareStarttijden: volledig vrij venster geeft 10-minutenstappen, laatste start = eind - 30min', () => {
  // Isoleer het venster door het hele plannervenster "bezet" te maken
  // behalve 14:00-15:00, zodat alleen dat deelvenster wordt getest.
  const bezet = [
    { starttijd: '08:00', eindtijd: '14:00' },
    { starttijd: '15:00', eindtijd: '18:00' },
  ]
  const resultaat = berekenBeschikbareStarttijden(bezet)
  assert.deepEqual(resultaat, ['14:00', '14:10', '14:20', '14:30'])
})

test('berekenBeschikbareStarttijden: 20 minuten vrije ruimte is niet genoeg voor een slot', () => {
  const bezet = [
    { starttijd: '08:00', eindtijd: '14:00' },
    { starttijd: '14:20', eindtijd: '18:00' },
  ]
  const resultaat = berekenBeschikbareStarttijden(bezet)
  // 14:00 zou 14:00-14:30 vergen, maar 14:20-18:00 is bezet -> conflict.
  assert.ok(!resultaat.includes('14:00'))
})

test('berekenBeschikbareStarttijden: starttijd exact aan het einde van een blokkade is toegestaan (half-open interval)', () => {
  const bezet = [
    { starttijd: '08:00', eindtijd: '14:00' },
    { starttijd: '14:30', eindtijd: '18:00' },
  ]
  const resultaat = berekenBeschikbareStarttijden(bezet)
  // 14:00-14:30 raakt exact aan 14:30-18:00 zonder overlap -> wel toegestaan.
  assert.ok(resultaat.includes('14:00'))
  assert.ok(!resultaat.includes('14:10'))
})

test('berekenBeschikbareStarttijden: starttijd die een blokkade overlapt wordt geweigerd', () => {
  const bezet = [
    { starttijd: '08:00', eindtijd: '14:25' },
    { starttijd: '15:00', eindtijd: '18:00' },
  ]
  const resultaat = berekenBeschikbareStarttijden(bezet)
  // 14:00-14:30 overlapt met de blokkade tot 14:25.
  assert.ok(!resultaat.includes('14:00'))
  assert.ok(!resultaat.includes('14:10'))
  assert.ok(!resultaat.includes('14:20'))
  // 14:30-15:00 overlapt niet meer.
  assert.ok(resultaat.includes('14:30'))
})

test('berekenBeschikbareStarttijden: een bestaande afspraak blokkeert net als een interne blokkade (type-agnostisch)', () => {
  const bezet = [
    { starttijd: '08:00', eindtijd: '14:00' },
    { starttijd: '14:00', eindtijd: '14:30' }, // "gewone" afspraak, geen blokkade
    { starttijd: '14:30', eindtijd: '18:00' },
  ]
  const resultaat = berekenBeschikbareStarttijden(bezet)
  assert.deepEqual(resultaat, [])
})

test('berekenBeschikbareStarttijden: 10-minuteninterval klopt over het hele plannervenster', () => {
  const resultaat = berekenBeschikbareStarttijden([])
  for (let i = 1; i < resultaat.length; i++) {
    assert.equal(tijdNaarMinuten(resultaat[i]) - tijdNaarMinuten(resultaat[i - 1]), STARTINTERVAL_MINUTEN)
  }
})

test('berekenBeschikbareStarttijden: laatst mogelijke starttijd is PLANNER_EIND_UUR - 30 minuten', () => {
  const resultaat = berekenBeschikbareStarttijden([])
  const laatste = resultaat[resultaat.length - 1]
  assert.equal(laatste, minutenNaarTijd(PLANNER_EIND_UUR * 60 - AFSPRAAK_DUUR_MINUTEN))
  assert.equal(laatste, '17:30')
  assert.equal(resultaat[0], minutenNaarTijd(PLANNER_START_UUR * 60))
})

test('berekenBeschikbareStarttijden: leeg zonder bezette blokken geeft het volledige venster', () => {
  const resultaat = berekenBeschikbareStarttijden()
  assert.equal(resultaat[0], '08:00')
  assert.equal(resultaat[resultaat.length - 1], '17:30')
})

test('berekenBeschikbareStarttijden: huidigeTijdMinuten filtert reeds verstreken starttijden (alleen voor "vandaag")', () => {
  const resultaat = berekenBeschikbareStarttijden([], { huidigeTijdMinuten: tijdNaarMinuten('14:05') })
  assert.ok(!resultaat.includes('14:00'))
  assert.ok(resultaat.includes('14:10'))
})

test('berekenBeschikbareStarttijden: meerdere overlappende blokkades worden correct gecombineerd', () => {
  const bezet = [
    { starttijd: '08:00', eindtijd: '12:00' },
    { starttijd: '11:00', eindtijd: '14:00' }, // overlapt met de vorige
    { starttijd: '16:00', eindtijd: '18:00' },
  ]
  const resultaat = berekenBeschikbareStarttijden(bezet)
  assert.deepEqual(resultaat, ['14:00', '14:10', '14:20', '14:30', '14:40', '14:50', '15:00', '15:10', '15:20', '15:30'])
})

// --- valideerPlannerDatum ------------------------------------------------

test('valideerPlannerDatum: vandaag en toekomstige datums zijn geldig, verleden niet', () => {
  assert.equal(valideerPlannerDatum('2026-10-10', '2026-10-05'), true)
  assert.equal(valideerPlannerDatum('2026-10-05', '2026-10-05'), true)
  assert.equal(valideerPlannerDatum('2026-10-01', '2026-10-05'), false)
})

test('valideerPlannerDatum: ongeldig formaat wordt geweigerd', () => {
  assert.equal(valideerPlannerDatum('geen-datum', '2026-10-05'), false)
  assert.equal(valideerPlannerDatum('', '2026-10-05'), false)
  assert.equal(valideerPlannerDatum(undefined, '2026-10-05'), false)
})

// --- valideerPlannerStarttijd --------------------------------------------

test('valideerPlannerStarttijd: tijden binnen het plannervenster zijn geldig', () => {
  assert.equal(valideerPlannerStarttijd('08:00'), true)
  assert.equal(valideerPlannerStarttijd('17:30'), true)
  assert.equal(valideerPlannerStarttijd('14:20'), true)
})

test('valideerPlannerStarttijd: tijden buiten het venster of met ongeldig formaat worden geweigerd', () => {
  assert.equal(valideerPlannerStarttijd('07:50'), false)
  assert.equal(valideerPlannerStarttijd('17:40'), false) // zou tot 18:10 lopen
  assert.equal(valideerPlannerStarttijd('18:00'), false)
  assert.equal(valideerPlannerStarttijd('niet-een-tijd'), false)
  assert.equal(valideerPlannerStarttijd(undefined), false)
})

// --- berekenEindtijd -------------------------------------------------------

test('berekenEindtijd: telt altijd AFSPRAAK_DUUR_MINUTEN (30) op bij de starttijd', () => {
  assert.equal(berekenEindtijd('14:20'), '14:50')
  assert.equal(berekenEindtijd('08:00'), '08:30')
  assert.equal(berekenEindtijd('17:30'), '18:00')
})

// --- isZakelijkPand --------------------------------------------------------

test('isZakelijkPand: alle bestaande zakelijke pandtypes (MJOP + energie-indicatie) worden herkend', () => {
  for (const type of ['kantoor', 'bedrijfshal', 'winkel', 'horeca', 'praktijk', 'gemengd', 'anders', 'magazijn', 'werkplaats', 'overig']) {
    assert.equal(isZakelijkPand(type), true, `${type} hoort zakelijk te zijn`)
  }
})

test('isZakelijkPand: een niet-zakelijk/onbekend pandtype wordt geweigerd', () => {
  assert.equal(isZakelijkPand('woning'), false)
  assert.equal(isZakelijkPand('appartement'), false)
  assert.equal(isZakelijkPand(null), false)
  assert.equal(isZakelijkPand(undefined), false)
  assert.equal(isZakelijkPand(''), false)
})
