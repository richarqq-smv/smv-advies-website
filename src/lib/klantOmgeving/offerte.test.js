import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rond2, parsePrijsRange, berekenOfferteBedragen, bouwOfferteSnapshot, OPGESTELD_DOOR_NAAM } from './offerte.js'

// Lokale, minimale fixtures — bewust geen import van src/data/packages.js:
// bouwOfferteSnapshot() en berekenOfferteBedragen() zijn pure functies die
// een pakket/meerwerk-object van elke aanroeper accepteren (zie offerte.js),
// dus deze tests moeten niet afhangen van de precieze huidige inhoud van
// packages.js. Zelfde aanpak als mjopAdapter.test.js, dat ook eigen
// fixtures gebruikt in plaats van lib/mjop/testData.js te importeren.
function meerwerkregel({ omschrijving = 'Extra werk', aantal = 1, eenheidsprijs = 100 } = {}) {
  return { omschrijving, aantal, eenheidsprijs, totaal: rond2(aantal * eenheidsprijs) }
}

// Bevat bewust ook velden die NIET in een snapshot horen (id's, timestamps,
// account-koppelingen) — zie de "geen interne velden gelekt"-tests
// hieronder, zelfde opzet als mjopAdapter.test.js's leak-detectiontests.
function klantFixture() {
  return {
    klant_id: 'klant-uuid-12345',
    naam: 'Jan Jansen',
    bedrijfsnaam: 'Jansen Bedrijfspanden BV',
    email: 'jan@jansenbv.test',
    telefoon: '0612345678',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  }
}

function contactpersoonFixture() {
  return {
    contactpersoon_id: 'contactpersoon-uuid-67890',
    klant_id: 'klant-uuid-12345',
    account_id: 'account-uuid-abcde',
    naam: 'Petra Petersen',
    rol: 'Directeur',
    email: 'petra@jansenbv.test',
    telefoon: '0687654321',
  }
}

function pandFixture() {
  return {
    pand_id: 'pand-uuid-11111',
    omschrijving: 'Bedrijfspand Noord',
    adres: 'Industrieweg 1',
    postcode: '3262AB',
    plaats: 'Oud-Beijerland',
    gebruikstype: 'kantoor',
    bouwjaar: 2005,
    vloeroppervlak: 500,
    bouwlagen: 2,
    ontstaan_via: 'mjop',
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

function pakketFixture(overrides = {}) {
  return {
    id: 'premium',
    name: 'Premium Pakket',
    mindset: 'Beslissen',
    subtitle: 'Volledige analyse · met locatiebezoek',
    price: '€ 895 - € 1.495',
    priceNote: 'excl. btw · indicatieve bandbreedte',
    description: 'Een volledig onderbouwd plan.',
    features: ['Fysieke opname ter plaatse', 'Stappenplan met fasering'],
    cta: 'Premium advies aanvragen',
    ctaTo: '/contact',
    featured: true,
    badge: 'Aanbevolen',
    ...overrides,
  }
}

// --- berekenOfferteBedragen -------------------------------------------------

test('berekenOfferteBedragen: bedrag zonder meerwerk', () => {
  const { subtotaal, btwBedrag, totaal } = berekenOfferteBedragen({ bedrag: 1000, meerwerk: [] })
  assert.equal(subtotaal, 1000)
  assert.equal(btwBedrag, 210)
  assert.equal(totaal, 1210)
})

test('berekenOfferteBedragen: één meerwerkregel wordt bij het bedrag opgeteld', () => {
  const meerwerk = [meerwerkregel({ aantal: 1, eenheidsprijs: 150 })]
  const { subtotaal, totaal } = berekenOfferteBedragen({ bedrag: 1000, meerwerk })
  assert.equal(subtotaal, 1150)
  assert.equal(totaal, rond2(1150 * 1.21))
})

test('berekenOfferteBedragen: meerdere meerwerkregels worden allemaal meegeteld', () => {
  const meerwerk = [
    meerwerkregel({ aantal: 1, eenheidsprijs: 100 }),
    meerwerkregel({ aantal: 1, eenheidsprijs: 200 }),
    meerwerkregel({ aantal: 1, eenheidsprijs: 50 }),
  ]
  const { subtotaal } = berekenOfferteBedragen({ bedrag: 1000, meerwerk })
  assert.equal(subtotaal, 1350)
})

test('berekenOfferteBedragen: een meerwerkregel met aantal > 1 telt met het volledige regeltotaal mee', () => {
  // Zelfde aanpak als OfferteEditor.jsx: het regeltotaal (aantal *
  // eenheidsprijs) wordt vooraf berekend en meegegeven — berekenOfferteBedragen
  // rekent zelf nooit aantal * eenheidsprijs uit, het telt alleen `.totaal` op.
  const meerwerk = [meerwerkregel({ aantal: 3, eenheidsprijs: 75 })] // 3 * 75 = 225
  const { subtotaal } = berekenOfferteBedragen({ bedrag: 500, meerwerk })
  assert.equal(subtotaal, 725)
})

test('berekenOfferteBedragen: subtotaal is exact bedrag + som(meerwerk), niets anders', () => {
  const meerwerk = [meerwerkregel({ aantal: 2, eenheidsprijs: 60 }), meerwerkregel({ aantal: 1, eenheidsprijs: 40 })]
  const { subtotaal } = berekenOfferteBedragen({ bedrag: 300, meerwerk })
  assert.equal(subtotaal, 300 + 120 + 40)
})

test('berekenOfferteBedragen: btw is exact het opgegeven percentage over het subtotaal', () => {
  const a = berekenOfferteBedragen({ bedrag: 1000, meerwerk: [], btwPercentage: 21 })
  assert.equal(a.btwBedrag, 210)

  const b = berekenOfferteBedragen({ bedrag: 1000, meerwerk: [], btwPercentage: 9 })
  assert.equal(b.btwBedrag, 90)
})

test('berekenOfferteBedragen: totaal is exact subtotaal + btw', () => {
  const meerwerk = [meerwerkregel({ aantal: 1, eenheidsprijs: 250 })]
  const { subtotaal, btwBedrag, totaal } = berekenOfferteBedragen({ bedrag: 1000, meerwerk })
  assert.equal(totaal, rond2(subtotaal + btwBedrag))
})

test('berekenOfferteBedragen: centafronding voorkomt drijvendekommafouten', () => {
  // 19.99 + 0.01 zou zonder rond2() als 20.000000000000004 kunnen uitkomen.
  const meerwerk = [meerwerkregel({ aantal: 1, eenheidsprijs: 0.01 })]
  const { subtotaal } = berekenOfferteBedragen({ bedrag: 19.99, meerwerk })
  assert.equal(subtotaal, 20)

  // 100.01 * 1.21 = 121.0121 → rondt af op centen, niet op de derde decimaal.
  const { btwBedrag, totaal } = berekenOfferteBedragen({ bedrag: 100.01, meerwerk: [] })
  assert.equal(btwBedrag, 21.0)
  assert.equal(totaal, 121.01)
})

// --- parsePrijsRange ---------------------------------------------------------

test('parsePrijsRange: Basis Pakket ("€ 495 - € 795")', () => {
  const range = parsePrijsRange('€ 495 - € 795')
  assert.deepEqual(range, { min: 495, max: 795 })
})

test('parsePrijsRange: Premium Pakket ("€ 895 - € 1.495") — duizendtal-punt wordt verwijderd', () => {
  const range = parsePrijsRange('€ 895 - € 1.495')
  assert.deepEqual(range, { min: 895, max: 1495 })
})

test('parsePrijsRange: Gold Pakket ("€ 1.495 - € 2.495")', () => {
  const range = parsePrijsRange('€ 1.495 - € 2.495')
  assert.deepEqual(range, { min: 1495, max: 2495 })
})

test('parsePrijsRange: minimum is het eerste, laagste bedrag in de tekst', () => {
  assert.equal(parsePrijsRange('€ 1.495 - € 2.495').min, 1495)
})

test('parsePrijsRange: maximum is het tweede, hoogste bedrag in de tekst', () => {
  assert.equal(parsePrijsRange('€ 1.495 - € 2.495').max, 2495)
})

test('parsePrijsRange: een bedrag binnen de range wordt als zodanig herkend (inclusief de grenzen zelf)', () => {
  const { min, max } = parsePrijsRange('€ 895 - € 1.495')
  const binnenRange = (bedrag) => bedrag >= min && bedrag <= max
  assert.equal(binnenRange(1000), true)
  assert.equal(binnenRange(min), true)
  assert.equal(binnenRange(max), true)
})

test('parsePrijsRange: een bedrag buiten de range wordt als zodanig herkend', () => {
  const { min, max } = parsePrijsRange('€ 895 - € 1.495')
  const binnenRange = (bedrag) => bedrag >= min && bedrag <= max
  assert.equal(binnenRange(min - 1), false)
  assert.equal(binnenRange(max + 1), false)
  assert.equal(binnenRange(3000), false)
})

test('parsePrijsRange: lege of ontbrekende tekst crasht niet en levert null-min/max op', () => {
  assert.deepEqual(parsePrijsRange(''), { min: null, max: null })
  assert.deepEqual(parsePrijsRange(undefined), { min: null, max: null })
})

// --- bouwOfferteSnapshot -----------------------------------------------------

test('bouwOfferteSnapshot: klant bevat alleen naam/bedrijfsnaam/email/telefoon', () => {
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket: pakketFixture(),
    bedrag: 1000,
    meerwerk: [],
    financieel: { subtotaal: 1000, btwBedrag: 210, totaal: 1210 },
    voorwaardenVersie: '26 augustus 2026',
  })

  assert.deepEqual(Object.keys(snapshot.klant).sort(), ['bedrijfsnaam', 'email', 'naam', 'telefoon'])
  assert.equal(snapshot.klant.naam, 'Jan Jansen')
  assert.equal(snapshot.klant.bedrijfsnaam, 'Jansen Bedrijfspanden BV')
  assert.equal(snapshot.klant.email, 'jan@jansenbv.test')
  assert.equal(snapshot.klant.telefoon, '0612345678')
})

test('bouwOfferteSnapshot: contactpersoon bevat alleen naam/rol/email/telefoon', () => {
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: contactpersoonFixture(),
    pand: pandFixture(),
    pakket: pakketFixture(),
    bedrag: 1000,
    meerwerk: [],
    financieel: { subtotaal: 1000, btwBedrag: 210, totaal: 1210 },
    voorwaardenVersie: '26 augustus 2026',
  })

  assert.deepEqual(Object.keys(snapshot.contactpersoon).sort(), ['email', 'naam', 'rol', 'telefoon'])
  assert.equal(snapshot.contactpersoon.naam, 'Petra Petersen')
  assert.equal(snapshot.contactpersoon.rol, 'Directeur')
})

test('bouwOfferteSnapshot: contactpersoon null blijft null, geen leeg object', () => {
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket: pakketFixture(),
    bedrag: 1000,
    meerwerk: [],
    financieel: { subtotaal: 1000, btwBedrag: 210, totaal: 1210 },
    voorwaardenVersie: '26 augustus 2026',
  })
  assert.equal(snapshot.contactpersoon, null)
})

test('bouwOfferteSnapshot: pand bevat alleen de zeven bedoelde velden', () => {
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket: pakketFixture(),
    bedrag: 1000,
    meerwerk: [],
    financieel: { subtotaal: 1000, btwBedrag: 210, totaal: 1210 },
    voorwaardenVersie: '26 augustus 2026',
  })

  assert.deepEqual(Object.keys(snapshot.pand).sort(), [
    'adres',
    'bouwjaar',
    'gebruikstype',
    'omschrijving',
    'plaats',
    'postcode',
    'vloeroppervlak',
  ])
  assert.equal(snapshot.pand.adres, 'Industrieweg 1')
  assert.equal(snapshot.pand.plaats, 'Oud-Beijerland')
})

test('bouwOfferteSnapshot: pakket bevat alleen id/naam/subtitle/prijsrange/omschrijving/features', () => {
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket: pakketFixture(),
    bedrag: 1000,
    meerwerk: [],
    financieel: { subtotaal: 1000, btwBedrag: 210, totaal: 1210 },
    voorwaardenVersie: '26 augustus 2026',
  })

  assert.deepEqual(Object.keys(snapshot.pakket).sort(), ['features', 'id', 'naam', 'omschrijving', 'prijsrange', 'subtitle'])
  assert.equal(snapshot.pakket.id, 'premium')
  assert.equal(snapshot.pakket.naam, 'Premium Pakket') // komt van pakket.name
  assert.equal(snapshot.pakket.prijsrange, '€ 895 - € 1.495') // komt van pakket.price
  assert.deepEqual(snapshot.pakket.features, ['Fysieke opname ter plaatse', 'Stappenplan met fasering'])
  // cta/ctaTo/featured/badge/mindset/priceNote horen niet in de snapshot
  assert.equal('cta' in snapshot.pakket, false)
  assert.equal('featured' in snapshot.pakket, false)
  assert.equal('mindset' in snapshot.pakket, false)
})

test('bouwOfferteSnapshot: meerwerk wordt letterlijk overgenomen', () => {
  const meerwerk = [meerwerkregel({ omschrijving: 'Extra locatiebezoek', aantal: 2, eenheidsprijs: 150 })]
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket: pakketFixture(),
    bedrag: 1000,
    meerwerk,
    financieel: { subtotaal: 1300, btwBedrag: 273, totaal: 1573 },
    voorwaardenVersie: '26 augustus 2026',
  })
  assert.deepEqual(snapshot.meerwerk, meerwerk)
})

test('bouwOfferteSnapshot: financiële gegevens worden letterlijk overgenomen', () => {
  const financieel = { subtotaal: 1300, btwBedrag: 273, totaal: 1573, btw_percentage: 21 }
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket: pakketFixture(),
    bedrag: 1000,
    meerwerk: [],
    financieel,
    voorwaardenVersie: '26 augustus 2026',
  })
  assert.deepEqual(snapshot.financieel, financieel)
  assert.equal(snapshot.gekozen_bedrag, 1000)
})

test('bouwOfferteSnapshot: voorwaardenversie wordt exact zoals meegegeven vastgelegd', () => {
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket: pakketFixture(),
    bedrag: 1000,
    meerwerk: [],
    financieel: { subtotaal: 1000, btwBedrag: 210, totaal: 1210 },
    voorwaardenVersie: '26 augustus 2026',
  })
  assert.deepEqual(snapshot.voorwaarden, { versie: '26 augustus 2026' })
})

test('bouwOfferteSnapshot: opsteller is altijd de vaste OPGESTELD_DOOR_NAAM', () => {
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket: pakketFixture(),
    bedrag: 1000,
    meerwerk: [],
    financieel: { subtotaal: 1000, btwBedrag: 210, totaal: 1210 },
    voorwaardenVersie: '26 augustus 2026',
  })
  assert.deepEqual(snapshot.opgesteld_door, { naam: OPGESTELD_DOOR_NAAM })
  assert.equal(OPGESTELD_DOOR_NAAM, 'Richard Schipper')
})

test('bouwOfferteSnapshot: geen interne id\'s of timestamps lekken in de serialized snapshot', () => {
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: contactpersoonFixture(),
    pand: pandFixture(),
    pakket: pakketFixture(),
    bedrag: 1000,
    meerwerk: [],
    financieel: { subtotaal: 1000, btwBedrag: 210, totaal: 1210 },
    voorwaardenVersie: '26 augustus 2026',
  })
  const json = JSON.stringify(snapshot)

  // uuid's/koppelvelden van klant, contactpersoon en pand mogen nergens voorkomen
  assert.equal(json.includes('klant-uuid-12345'), false)
  assert.equal(json.includes('contactpersoon-uuid-67890'), false)
  assert.equal(json.includes('account-uuid-abcde'), false)
  assert.equal(json.includes('pand-uuid-11111'), false)
  assert.equal(json.includes('created_at'), false)
  assert.equal(json.includes('updated_at'), false)
  assert.equal(json.includes('ontstaan_via'), false)
  // pakket-marketingvelden die niet in een offerte horen
  assert.equal(json.includes('Aanbevolen'), false) // badge
  assert.equal(json.includes('Beslissen'), false) // mindset
})

test('bouwOfferteSnapshot: klant/pand/pakket-objecten worden gekopieerd, niet als referentie doorgegeven', () => {
  const klant = klantFixture()
  const pand = pandFixture()
  const snapshot = bouwOfferteSnapshot({
    klant,
    contactpersoon: null,
    pand,
    pakket: pakketFixture(),
    bedrag: 1000,
    meerwerk: [],
    financieel: { subtotaal: 1000, btwBedrag: 210, totaal: 1210 },
    voorwaardenVersie: '26 augustus 2026',
  })

  // Wijzig de bronobjecten ná het bouwen van de snapshot.
  klant.naam = 'GEWIJZIGD'
  pand.adres = 'GEWIJZIGD'

  assert.equal(snapshot.klant.naam, 'Jan Jansen')
  assert.equal(snapshot.pand.adres, 'Industrieweg 1')
})

test('bouwOfferteSnapshot: pakket.features wordt gekopieerd, geen gedeelde referentie naar packages.js', () => {
  const pakket = pakketFixture()
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket,
    bedrag: 1000,
    meerwerk: [],
    financieel: { subtotaal: 1000, btwBedrag: 210, totaal: 1210 },
    voorwaardenVersie: '26 augustus 2026',
  })

  assert.notEqual(snapshot.pakket.features, pakket.features) // geen zelfde array-referentie
  // Wijzig de bron-features (bijv. een latere packages.js-aanpassing) ná het bouwen van de snapshot.
  pakket.features.push('LATER TOEGEVOEGDE FEATURE')
  pakket.features[0] = 'GEWIJZIGD'

  assert.equal(snapshot.pakket.features.includes('LATER TOEGEVOEGDE FEATURE'), false)
  assert.equal(snapshot.pakket.features[0], 'Fysieke opname ter plaatse')
})
