/**
 * De Energie Indicatie is een gratis eerste indruk, geen verduurzamingsadvies.
 * Deze tests borgen de grens tussen:
 *  - de interne berekening (ongewijzigd, gaat volledig naar SMV Advies), en
 *  - de publieke uitkomst (score, band, kostenbandbreedte, aandachtspunten).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { berekenResultaat } from './calculations.js'
import { aandachtspunten, bouwPubliekResultaat, energiekostenBandbreedte, MAX_AANDACHTSPUNTEN, WAT_DEZE_INDICATIE_NIET_WEET } from './publiekResultaat.js'
import { buildEmailParams, buildKlantEmailParams } from './emailParams.js'

const OUD_KANTOOR = {
  pandtype: 'kantoor',
  bouwjaar: 'voor1980',
  oppervlakte: 800,
  verdiepingen: '2',
  beglazing: 'dubbel',
  isolatie_gevel: 'matig',
  isolatie_dak: 'geen',
  isolatie_vloer: 'geen',
  verwarming: 'hr_ketel',
  gasverbruik: null,
  elekverbruik: null,
  energiekosten: null,
  naam: 'Test Persoon',
  bedrijfsnaam: 'Test BV',
  email: 'test@example.nl',
  telefoon: '0612345678',
}

const NIEUW_PAND = {
  ...OUD_KANTOOR,
  bouwjaar: 'na2015',
  beglazing: 'triple',
  isolatie_gevel: 'goed',
  isolatie_dak: 'goed',
  isolatie_vloer: 'goed',
  verwarming: 'volledige_wp',
}

// Velden die in de publieke uitkomst nooit mogen voorkomen.
const VERBODEN_SLEUTEL = /investering|besparing|terugverdien|co2|maatregel/i

function alleSleutels(waarde, pad = []) {
  if (Array.isArray(waarde)) return waarde.flatMap((v, i) => alleSleutels(v, [...pad, i]))
  if (waarde && typeof waarde === 'object') {
    return Object.entries(waarde).flatMap(([sleutel, v]) => [sleutel, ...alleSleutels(v, [...pad, sleutel])])
  }
  return []
}

// --- De interne berekening blijft ongewijzigd --------------------------------

test('score en band van de berekening blijven ongewijzigd (referentiepand)', () => {
  const resultaat = berekenResultaat(OUD_KANTOOR)
  assert.equal(resultaat.score, 24)
  assert.equal(resultaat.band.band, 4)
  assert.equal(resultaat.band.status, 'Nog veel potentieel')
})

test('de interne berekening bevat nog steeds de volledige maatregelen met bedragen', () => {
  const resultaat = berekenResultaat(OUD_KANTOOR)
  assert.equal(resultaat.maatregelen.length, 5)
  for (const m of resultaat.maatregelen) {
    assert.ok(m.besparingEuro > 0)
    assert.ok(m.investeringLaag > 0 && m.investeringHoog >= m.investeringLaag)
  }
  assert.ok(resultaat.totaleBesparing > 0)
})

// --- Publieke uitkomst --------------------------------------------------------

test('de publieke uitkomst bevat alleen score, band, kostenbandbreedte, herkomst en aandachtspunten', () => {
  const publiek = bouwPubliekResultaat(berekenResultaat(OUD_KANTOOR))
  assert.deepEqual(Object.keys(publiek).sort(), ['aandachtspunten', 'band', 'energiekosten', 'energiekostenBron', 'score'])
  assert.equal(publiek.score, 24)
  assert.equal(publiek.band.band, 4)
})

test('de publieke uitkomst bevat nergens maatregelen, investeringen, besparingen, terugverdientijden of CO2', () => {
  const publiek = bouwPubliekResultaat(berekenResultaat(OUD_KANTOOR))
  const verboden = alleSleutels(publiek).filter((sleutel) => typeof sleutel === 'string' && VERBODEN_SLEUTEL.test(sleutel))
  assert.deepEqual(verboden, [])
  assert.doesNotMatch(JSON.stringify(publiek.aandachtspunten), /€|\d/)
})

test('de kostenbandbreedte omvat de geschatte kosten en is afgerond', () => {
  const resultaat = berekenResultaat(OUD_KANTOOR)
  const { energiekosten } = bouwPubliekResultaat(resultaat)
  assert.ok(energiekosten.min < resultaat.huidigeKosten && resultaat.huidigeKosten < energiekosten.max)
  assert.equal(energiekosten.min % 1000, 0)
  assert.equal(energiekosten.max % 1000, 0)
})

test('kostenbandbreedte: stapgrootte schaalt mee, en zonder bruikbaar bedrag geen bandbreedte', () => {
  assert.deepEqual(energiekostenBandbreedte(3000), { min: 2500, max: 3500 })
  assert.deepEqual(energiekostenBandbreedte(10000), { min: 8500, max: 11500 })
  assert.equal(energiekostenBandbreedte(0), null)
  assert.equal(energiekostenBandbreedte(Number.NaN), null)
})

test('maximaal drie aandachtspunten, zonder rangnummers of bedragen', () => {
  const punten = bouwPubliekResultaat(berekenResultaat(OUD_KANTOOR)).aandachtspunten
  assert.equal(punten.length, MAX_AANDACHTSPUNTEN)
  assert.deepEqual(
    punten.map((p) => p.id),
    ['verwarming', 'dak', 'gevel'],
  )
  for (const punt of punten) {
    assert.deepEqual(Object.keys(punt).sort(), ['id', 'titel', 'toelichting'])
    assert.ok(punt.toelichting.length > 20)
  }
})

test('elke maatregel uit de berekening heeft een aandachtsgebied', () => {
  const namen = [
    'Dakisolatie',
    'Gevel- / spouwmuurisolatie',
    'HR++ of triple beglazing',
    'Vloerisolatie',
    'Overstap naar (volledige) warmtepomp',
    'LED-verlichting + sensoren',
  ]
  for (const naam of namen) {
    assert.equal(aandachtspunten([{ naam }]).length, 1, `geen aandachtsgebied voor "${naam}"`)
  }
})

test('een goed presterend pand levert weinig of geen aandachtspunten op, zonder te crashen', () => {
  const publiek = bouwPubliekResultaat(berekenResultaat(NIEUW_PAND))
  assert.equal(publiek.band.band, 1)
  assert.ok(publiek.aandachtspunten.length <= 1)
})

test('de publieke bandtekst verwijst niet naar maatregelen en belooft geen besparing, voor alle vijf banden', () => {
  const panden = [NIEUW_PAND, OUD_KANTOOR, { ...OUD_KANTOOR, isolatie_gevel: 'geen', beglazing: 'enkel', verwarming: 'oude_ketel' }]
  const banden = new Map()
  for (const pand of panden) {
    const publiek = bouwPubliekResultaat(berekenResultaat(pand))
    banden.set(publiek.band.band, publiek.band)
  }
  for (const nummer of [1, 2, 3, 4, 5]) {
    const band = bouwPubliekResultaat({ ...berekenResultaat(OUD_KANTOOR), band: { band: nummer, status: 'x', desc: 'De maatregelen hieronder' } }).band
    assert.doesNotMatch(band.desc, /hieronder|besparing/i, `band ${nummer}`)
  }
  assert.equal(banden.get(5)?.status, 'Veel energieverlies')
})

test('"Wat deze indicatie niet weet" noemt onderhoud, vervanging, MJOP, volgorde en wat kan wachten', () => {
  const tekst = WAT_DEZE_INDICATIE_NIET_WEET.join(' ')
  for (const onderwerp of ['onderhoud', 'vervangen', 'MJOP', 'technische staat', 'combineren', 'wachten', 'volgorde']) {
    assert.match(tekst, new RegExp(onderwerp))
  }
})

// --- E-mail: intern volledig, naar de klant alleen de publieke uitkomst -------

test('de interne leadmail naar SMV Advies bevat nog steeds de volledige maatregelen met bedragen', () => {
  const intern = buildEmailParams(OUD_KANTOOR, berekenResultaat(OUD_KANTOOR))
  assert.match(intern.maatregelen_intern, /€/)
  assert.match(intern.maatregelen_intern, /terugverdientijd/)
  assert.match(intern.totale_besparing, /€/)
})

test('de bevestigingsmail aan de klant bevat geen maatregelbedragen, totale besparing of CO2-besparing', () => {
  const klant = buildKlantEmailParams(OUD_KANTOOR, berekenResultaat(OUD_KANTOOR))
  assert.equal('maatregelen_intern' in klant, false)
  assert.doesNotMatch(klant.maatregelen, /€|terugverdientijd|\/jaar|m³|kWh/)
  assert.equal(klant.maatregelen, klant.maatregelen_klant)
  assert.doesNotMatch(klant.totale_besparing, /\d/)
  assert.doesNotMatch(klant.co2_besparing, /\d/)
  assert.match(klant.huidige_kosten, /€ .* – € .* per jaar \(indicatie\)/)
  assert.match(klant.maatregelen, /Wat deze indicatie niet weet/)
  // Veldnamen blijven gelijk aan de interne set (behalve het interne veld), zodat het EmailJS-template blijft werken.
  const intern = buildEmailParams(OUD_KANTOOR, berekenResultaat(OUD_KANTOOR))
  assert.deepEqual(Object.keys(klant).sort(), Object.keys(intern).filter((k) => k !== 'maatregelen_intern').concat('maatregelen').sort())
})
