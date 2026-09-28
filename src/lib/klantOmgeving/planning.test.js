import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  valideerAfspraak,
  berekenWeekMaandag,
  berekenWeekdagen,
  formatPeriodeNl,
  formatDagPeriodeNl,
  bepaalUrenBereik,
  groepeerAfsprakenPerDag,
  datumNaarIso,
  telAfsprakenOpDag,
  vindEerstvolgendeAfspraak,
  berekenBlokPositie,
  AFSPRAAK_TYPES,
  AFSPRAAK_STATUSSEN,
} from './planning.js'

// --- valideerAfspraak --------------------------------------------------

function geldigeAfspraak(overrides = {}) {
  return { onderwerp: 'Kennismaking', datum: '2026-10-01', starttijd: '10:00', eindtijd: '11:00', type: 'kennismaking', ...overrides }
}

test('valideerAfspraak: volledige, geldige afspraak wordt geaccepteerd', () => {
  assert.deepEqual(valideerAfspraak(geldigeAfspraak()), {})
})

test('valideerAfspraak: ontbrekend onderwerp wordt geweigerd', () => {
  const fouten = valideerAfspraak(geldigeAfspraak({ onderwerp: '' }))
  assert.ok(fouten.onderwerp)
})

test('valideerAfspraak: ontbrekende/ongeldige datum wordt geweigerd', () => {
  assert.ok(valideerAfspraak(geldigeAfspraak({ datum: '' })).datum)
  assert.ok(valideerAfspraak(geldigeAfspraak({ datum: 'geen-datum' })).datum)
  assert.ok(valideerAfspraak(geldigeAfspraak({ datum: '2026-13-40' })).datum)
})

test('valideerAfspraak: ongeldig tijdformaat wordt geweigerd', () => {
  assert.ok(valideerAfspraak(geldigeAfspraak({ starttijd: '10u00' })).starttijd)
  assert.ok(valideerAfspraak(geldigeAfspraak({ eindtijd: '25:00' })).eindtijd)
})

test('valideerAfspraak: eindtijd vóór starttijd wordt geweigerd', () => {
  const fouten = valideerAfspraak(geldigeAfspraak({ starttijd: '11:00', eindtijd: '10:00' }))
  assert.ok(fouten.eindtijd)
})

test('valideerAfspraak: eindtijd gelijk aan starttijd wordt geweigerd (geen nul-duur-afspraak)', () => {
  const fouten = valideerAfspraak(geldigeAfspraak({ starttijd: '10:00', eindtijd: '10:00' }))
  assert.ok(fouten.eindtijd)
})

test('valideerAfspraak: ongeldig/onbekend type wordt geweigerd', () => {
  assert.ok(valideerAfspraak(geldigeAfspraak({ type: 'lunch' })).type)
  assert.ok(valideerAfspraak(geldigeAfspraak({ type: undefined })).type)
})

test('valideerAfspraak: elk vast type uit AFSPRAAK_TYPES wordt geaccepteerd', () => {
  for (const { id } of AFSPRAAK_TYPES) {
    assert.deepEqual(valideerAfspraak(geldigeAfspraak({ type: id })), {})
  }
})

test('valideerAfspraak: ontbrekende invoer crasht niet en levert fouten op', () => {
  const fouten = valideerAfspraak()
  assert.ok(fouten.onderwerp)
  assert.ok(fouten.datum)
  assert.ok(fouten.starttijd)
  assert.ok(fouten.eindtijd)
  assert.ok(fouten.type)
})

// --- vaste lijsten -------------------------------------------------------

test('AFSPRAAK_STATUSSEN bevat exact de drie verwachte statussen', () => {
  assert.deepEqual(
    AFSPRAAK_STATUSSEN.map((s) => s.id),
    ['gepland', 'afgerond', 'geannuleerd'],
  )
})

// --- weekberekening --------------------------------------------------------

test('berekenWeekMaandag: een woensdag geeft de maandag van dezelfde week', () => {
  const maandag = berekenWeekMaandag('2026-09-30') // woensdag
  assert.equal(maandag.getFullYear(), 2026)
  assert.equal(maandag.getMonth(), 8) // september (0-based)
  assert.equal(maandag.getDate(), 28)
})

test('berekenWeekMaandag: een zondag hoort nog bij de maandag ervóór (ISO-weekstart)', () => {
  const maandag = berekenWeekMaandag('2026-10-04') // zondag
  assert.equal(maandag.getDate(), 28)
  assert.equal(maandag.getMonth(), 8)
})

test('berekenWeekMaandag: een maandag levert zichzelf op', () => {
  const maandag = berekenWeekMaandag('2026-09-28')
  assert.equal(maandag.getDate(), 28)
})

test('berekenWeekdagen: levert exact 7 opeenvolgende dagen, maandag t/m zondag', () => {
  const dagen = berekenWeekdagen('2026-09-30')
  assert.deepEqual(dagen, ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
})

// --- periode-formattering --------------------------------------------------

test('formatPeriodeNl: zelfde maand', () => {
  assert.equal(formatPeriodeNl('2026-09-21', '2026-09-27'), '21 – 27 september 2026')
})

test('formatPeriodeNl: over een maandgrens heen', () => {
  assert.equal(formatPeriodeNl('2026-09-28', '2026-10-04'), '28 september – 4 oktober 2026')
})

test('formatPeriodeNl: over een jaargrens heen', () => {
  assert.equal(formatPeriodeNl('2026-12-28', '2027-01-03'), '28 december 2026 – 3 januari 2027')
})

test('formatDagPeriodeNl: geeft een volledig uitgeschreven dag terug', () => {
  const tekst = formatDagPeriodeNl('2026-09-28')
  assert.match(tekst, /28 september 2026/)
})

// --- urenbereik --------------------------------------------------------

test('bepaalUrenBereik: zonder afspraken de standaard 08–18', () => {
  const uren = bepaalUrenBereik([])
  assert.equal(uren[0], 8)
  assert.equal(uren.at(-1), 18)
})

test('bepaalUrenBereik: breidt uit voor een vroege afspraak', () => {
  const uren = bepaalUrenBereik([{ starttijd: '06:30', eindtijd: '07:30' }])
  assert.equal(uren[0], 6)
})

test('bepaalUrenBereik: breidt uit voor een late afspraak, rondt de eindtijd naar boven af', () => {
  const uren = bepaalUrenBereik([{ starttijd: '19:00', eindtijd: '20:30' }])
  assert.equal(uren.at(-1), 21)
})

test('bepaalUrenBereik: een afspraak binnen het standaardbereik verandert niets', () => {
  const uren = bepaalUrenBereik([{ starttijd: '10:00', eindtijd: '11:00' }])
  assert.equal(uren[0], 8)
  assert.equal(uren.at(-1), 18)
})

// --- groepering --------------------------------------------------------

test('groepeerAfsprakenPerDag: verdeelt afspraken over de juiste dag, gesorteerd op starttijd', () => {
  const afspraken = [
    { datum: '2026-09-29', starttijd: '14:00', onderwerp: 'B' },
    { datum: '2026-09-29', starttijd: '09:00', onderwerp: 'A' },
    { datum: '2026-09-30', starttijd: '10:00', onderwerp: 'C' },
  ]
  const perDag = groepeerAfsprakenPerDag(afspraken, ['2026-09-28', '2026-09-29', '2026-09-30'])
  assert.deepEqual(
    perDag['2026-09-29'].map((a) => a.onderwerp),
    ['A', 'B'],
  )
  assert.equal(perDag['2026-09-28'].length, 0)
  assert.equal(perDag['2026-09-30'][0].onderwerp, 'C')
})

test('groepeerAfsprakenPerDag: een afspraak buiten de meegegeven dagen wordt genegeerd, geen crash', () => {
  const perDag = groepeerAfsprakenPerDag([{ datum: '2099-01-01', starttijd: '10:00' }], ['2026-09-28'])
  assert.deepEqual(perDag, { '2026-09-28': [] })
})

// --- datumNaarIso --------------------------------------------------------

test('datumNaarIso: formateert een Date naar YYYY-MM-DD, zero-padded', () => {
  assert.equal(datumNaarIso(new Date(2026, 0, 5)), '2026-01-05')
  assert.equal(datumNaarIso(new Date(2026, 8, 28)), '2026-09-28')
})

// --- Dashboard-tellingen --------------------------------------------------

const VOORBEELD_AFSPRAKEN = [
  { datum: '2026-09-28', starttijd: '09:00', status: 'gepland' },
  { datum: '2026-09-28', starttijd: '14:00', status: 'geannuleerd' }, // telt niet mee
  { datum: '2026-09-28', starttijd: '11:00', status: 'gepland' },
  { datum: '2026-09-29', starttijd: '10:00', status: 'gepland' },
  { datum: '2026-09-20', starttijd: '10:00', status: 'gepland' }, // verleden, telt niet mee als "vandaag"
]

test('telAfsprakenOpDag: telt alleen geplande afspraken op precies die dag', () => {
  assert.equal(telAfsprakenOpDag(VOORBEELD_AFSPRAKEN, '2026-09-28'), 2)
})

test('telAfsprakenOpDag: geen afspraken op een lege dag', () => {
  assert.equal(telAfsprakenOpDag(VOORBEELD_AFSPRAKEN, '2026-12-25'), 0)
})

test('vindEerstvolgendeAfspraak: vindt de eerstvolgende geplande afspraak vanaf vandaag, op tijd gesorteerd', () => {
  const eerstvolgende = vindEerstvolgendeAfspraak(VOORBEELD_AFSPRAKEN, '2026-09-28')
  assert.equal(eerstvolgende.datum, '2026-09-28')
  assert.equal(eerstvolgende.starttijd, '09:00')
})

test('vindEerstvolgendeAfspraak: negeert geannuleerde/verleden afspraken', () => {
  const alleenGeannuleerdVandaag = [{ datum: '2026-09-28', starttijd: '09:00', status: 'geannuleerd' }, { datum: '2026-09-30', starttijd: '09:00', status: 'gepland' }]
  const eerstvolgende = vindEerstvolgendeAfspraak(alleenGeannuleerdVandaag, '2026-09-28')
  assert.equal(eerstvolgende.datum, '2026-09-30')
})

test('vindEerstvolgendeAfspraak: null zonder enige toekomstige geplande afspraak', () => {
  assert.equal(vindEerstvolgendeAfspraak([], '2026-09-28'), null)
  assert.equal(vindEerstvolgendeAfspraak([{ datum: '2026-09-01', starttijd: '09:00', status: 'gepland' }], '2026-09-28'), null)
})

// --- berekenBlokPositie --------------------------------------------------

test('berekenBlokPositie: een afspraak vanaf het gridbegin start op top 0', () => {
  const pos = berekenBlokPositie({ starttijd: '08:00', eindtijd: '09:00' }, 8, 48)
  assert.equal(pos.top, 0)
  assert.equal(pos.height, 48)
})

test('berekenBlokPositie: houdt rekening met minuten, niet alleen hele uren', () => {
  const pos = berekenBlokPositie({ starttijd: '08:30', eindtijd: '09:15' }, 8, 60)
  assert.equal(pos.top, 30) // half uur na 08:00, uurhoogte 60px
  assert.equal(pos.height, 45) // 45 minuten
})

test('berekenBlokPositie: een afspraak later dan het gridbegin krijgt een positieve top', () => {
  const pos = berekenBlokPositie({ starttijd: '11:00', eindtijd: '12:00' }, 8, 48)
  assert.equal(pos.top, 3 * 48)
})

test('berekenBlokPositie: een zeer korte afspraak blijft minimaal 20px hoog', () => {
  const pos = berekenBlokPositie({ starttijd: '10:00', eindtijd: '10:05' }, 8, 48)
  assert.equal(pos.height, 20)
})
