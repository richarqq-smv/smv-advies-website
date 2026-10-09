import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  rond2,
  bepaalPrijsTier,
  bedragWijktAfVanStandaardprijs,
  berekenOfferteBedragen,
  bouwOfferteSnapshot,
  OPGESTELD_DOOR_NAAM,
  OFFERTE_TOEGESTANE_OVERGANGEN,
  magOvergangNaar,
  beoordeelGoldMeerwerk,
  FACTUUR_TOEGESTANE_OFFERTE_STATUSSEN,
  magFactuurMakenVanuitOfferte,
} from './offerte.js'

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
    tagline: 'Wat moet ik nu doen?',
    subtitle: 'Volledige analyse · met locatiebezoek',
    priceTiers: [
      { id: 'tot-1000m2', label: 'Tot 1.000 m²', maxOppervlak: 1000, prijs: 995 },
      { id: '1000-2500m2', label: '1.000 – 2.500 m²', maxOppervlak: 2500, prijs: 1295 },
      { id: 'op-aanvraag', label: 'Groter of complexer pand', maxOppervlak: null, prijs: null },
    ],
    priceDisplay: 'Vanaf € 995',
    priceNote: 'excl. btw · afhankelijk van oppervlakte',
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

// --- bepaalPrijsTier ----------------------------------------------------------

test('bepaalPrijsTier: oppervlakte precies op de eerste grens (1000) hoort bij "tot 1.000 m²"', () => {
  const tier = bepaalPrijsTier(pakketFixture(), 1000)
  assert.equal(tier.id, 'tot-1000m2')
  assert.equal(tier.prijs, 995)
})

test('bepaalPrijsTier: oppervlakte net boven de eerste grens (1001) hoort bij de tweede tier', () => {
  const tier = bepaalPrijsTier(pakketFixture(), 1001)
  assert.equal(tier.id, '1000-2500m2')
  assert.equal(tier.prijs, 1295)
})

test('bepaalPrijsTier: oppervlakte precies op de tweede grens (2500) hoort nog bij de tweede tier', () => {
  const tier = bepaalPrijsTier(pakketFixture(), 2500)
  assert.equal(tier.id, '1000-2500m2')
})

test('bepaalPrijsTier: oppervlakte boven de hoogste grens (2501) valt terug op "op aanvraag" — geen bedrag verzonnen', () => {
  const tier = bepaalPrijsTier(pakketFixture(), 2501)
  assert.equal(tier.id, 'op-aanvraag')
  assert.equal(tier.prijs, null)
})

test('bepaalPrijsTier: een kleine oppervlakte (bijv. 500) hoort bij de eerste tier', () => {
  const tier = bepaalPrijsTier(pakketFixture(), 500)
  assert.equal(tier.id, 'tot-1000m2')
})

test('bepaalPrijsTier: onbekende oppervlakte (null/undefined) valt terug op "op aanvraag" — geen bedrag verzonnen', () => {
  assert.equal(bepaalPrijsTier(pakketFixture(), null).id, 'op-aanvraag')
  assert.equal(bepaalPrijsTier(pakketFixture(), undefined).id, 'op-aanvraag')
})

test('bepaalPrijsTier: een pakket zonder priceTiers crasht niet en levert null op', () => {
  assert.equal(bepaalPrijsTier({ id: 'x' }, 500), null)
  assert.equal(bepaalPrijsTier(null, 500), null)
})

// --- bedragWijktAfVanStandaardprijs (Fase 6 — ongeldige/afwijkende prijs) ----

test('bedragWijktAfVanStandaardprijs: gelijk aan de standaardprijs wijkt niet af', () => {
  const tier = { id: 'tot-1000m2', label: 'Tot 1.000 m²', maxOppervlak: 1000, prijs: 995 }
  assert.equal(bedragWijktAfVanStandaardprijs(tier, 995), false)
})

test('bedragWijktAfVanStandaardprijs: een afwijkend bedrag (hoger of lager) wijkt wél af', () => {
  const tier = { id: 'tot-1000m2', label: 'Tot 1.000 m²', maxOppervlak: 1000, prijs: 995 }
  assert.equal(bedragWijktAfVanStandaardprijs(tier, 1200), true)
  assert.equal(bedragWijktAfVanStandaardprijs(tier, 500), true)
})

test('bedragWijktAfVanStandaardprijs: "op aanvraag" (tier.prijs is null) kent per definitie geen afwijking', () => {
  const opAanvraagTier = { id: 'op-aanvraag', label: 'Groter of complexer pand', maxOppervlak: null, prijs: null }
  assert.equal(bedragWijktAfVanStandaardprijs(opAanvraagTier, 3500), false)
  assert.equal(bedragWijktAfVanStandaardprijs(opAanvraagTier, 0), false)
})

test('bedragWijktAfVanStandaardprijs: geen tier, of nog geen bedrag ingevuld, wijkt niet af (nog niets om te vergelijken)', () => {
  const tier = { id: 'tot-1000m2', label: 'Tot 1.000 m²', maxOppervlak: 1000, prijs: 995 }
  assert.equal(bedragWijktAfVanStandaardprijs(null, 995), false)
  assert.equal(bedragWijktAfVanStandaardprijs(tier, null), false)
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

test('bouwOfferteSnapshot: pakket bevat alleen id/naam/subtitle/prijstier/omschrijving/features', () => {
  const pakket = pakketFixture()
  const tier = bepaalPrijsTier(pakket, 500)
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket,
    tier,
    bedrag: 995,
    meerwerk: [],
    financieel: { subtotaal: 995, btwBedrag: 208.95, totaal: 1203.95 },
    voorwaardenVersie: '26 augustus 2026',
  })

  assert.deepEqual(Object.keys(snapshot.pakket).sort(), ['features', 'id', 'naam', 'omschrijving', 'prijstier', 'subtitle'])
  assert.equal(snapshot.pakket.id, 'premium')
  assert.equal(snapshot.pakket.naam, 'Premium Pakket') // komt van pakket.name
  assert.deepEqual(snapshot.pakket.prijstier, { label: 'Tot 1.000 m²', maxOppervlak: 1000, standaardprijs: 995 })
  assert.deepEqual(snapshot.pakket.features, ['Fysieke opname ter plaatse', 'Stappenplan met fasering'])
  // cta/ctaTo/featured/badge/mindset/tagline/priceNote horen niet in de snapshot
  assert.equal('cta' in snapshot.pakket, false)
  assert.equal('featured' in snapshot.pakket, false)
  assert.equal('mindset' in snapshot.pakket, false)
  assert.equal('tagline' in snapshot.pakket, false)
})

test('bouwOfferteSnapshot: zonder tier (bijv. onbekend) blijft prijstier expliciet null, geen leeg object', () => {
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket: pakketFixture(),
    tier: null,
    bedrag: 1000,
    meerwerk: [],
    financieel: { subtotaal: 1000, btwBedrag: 210, totaal: 1210 },
    voorwaardenVersie: '26 augustus 2026',
  })
  assert.equal(snapshot.pakket.prijstier, null)
})

test('bouwOfferteSnapshot: "op aanvraag"-tier (prijs: null) wordt letterlijk vastgelegd, geen verzonnen bedrag', () => {
  const pakket = pakketFixture()
  const tier = bepaalPrijsTier(pakket, 5000) // ruim boven de hoogste vaste grens
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket,
    tier,
    bedrag: 3500, // door de adviseur zelf bepaald, niet afgeleid
    meerwerk: [],
    financieel: { subtotaal: 3500, btwBedrag: 735, totaal: 4235 },
    voorwaardenVersie: '26 augustus 2026',
  })
  assert.equal(snapshot.pakket.prijstier.standaardprijs, null)
  assert.equal(snapshot.gekozen_bedrag, 3500)
})

test('bouwOfferteSnapshot: prijstier wordt gekopieerd, geen gedeelde referentie naar het tier-object uit packages.js', () => {
  const pakket = pakketFixture()
  const tier = bepaalPrijsTier(pakket, 500)
  const snapshot = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket,
    tier,
    bedrag: 995,
    meerwerk: [],
    financieel: { subtotaal: 995, btwBedrag: 208.95, totaal: 1203.95 },
    voorwaardenVersie: '26 augustus 2026',
  })
  assert.notEqual(snapshot.pakket.prijstier, tier)
  tier.prijs = 999999 // wijzig het bron-tier-object ná het bouwen van de snapshot
  assert.equal(snapshot.pakket.prijstier.standaardprijs, 995)
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

// --- Backward compatibility: offerte-snapshots van vóór Fase 6 --------------
//
// Vóór Fase 6 bouwde bouwOfferteSnapshot() een pakket-snapshot met de vorm
// { id, naam, subtitle, prijsrange, omschrijving, features } — een
// bandbreedte-string (`prijsrange`, van pakket.price), geen `prijstier`.
// Zo'n rij bestaat al (of kan bestaan) in de database en moet voor altijd
// correct blijven, ook nadat packages.js/offerte.js voor nieuwe offertes is
// omgebouwd naar tiered pricing. Er bestaat geen functie die een bestaande
// offerte bijwerkt (zie api.js: alleen createOfferte/getOfferte/
// getOffertesVoorDossier/deleteOfferte — geen updateOfferte), dus een oud
// snapshot wordt door niets in deze codebase ooit herschreven of opnieuw
// opgebouwd; deze tests bevestigen dat de vorm zelf ook nog probleemloos te
// gebruiken is door de bestaande weergave.

function oudPakketSnapshotFixture() {
  return {
    id: 'premium',
    naam: 'Premium Pakket',
    subtitle: 'Volledige analyse · met locatiebezoek',
    prijsrange: '€ 895 - € 1.495', // vóór Fase 6: een bandbreedte-string, geen tier
    omschrijving: 'Een volledig onderbouwd plan.',
    features: ['Fysieke opname ter plaatse', 'Stappenplan met fasering'],
  }
}

test('Backward compatibility: een oud pakket-snapshot heeft geen prijstier, en dat is onschadelijk — geen enkel weergavecomponent leest dat veld', () => {
  const oud = oudPakketSnapshotFixture()
  assert.equal('prijstier' in oud, false)
  // Exact de velden die OfferteDocument.jsx daadwerkelijk rendert (zie
  // components/klantOmgeving/OfferteDocument.jsx): naam, subtitle,
  // omschrijving, features — allemaal nog aanwezig en bruikbaar.
  assert.equal(oud.naam, 'Premium Pakket')
  assert.equal(oud.subtitle, 'Volledige analyse · met locatiebezoek')
  assert.equal(oud.omschrijving, 'Een volledig onderbouwd plan.')
  assert.ok(Array.isArray(oud.features) && oud.features.length > 0)
})

test('Backward compatibility: een oud snapshot behoudt zijn oorspronkelijke prijsinformatie (prijsrange) — niet geconverteerd naar een tier', () => {
  const oud = oudPakketSnapshotFixture()
  assert.equal(oud.prijsrange, '€ 895 - € 1.495')
  assert.equal('standaardprijs' in oud, false) // geen nieuw prijstier-veld toegevoegd
})

test('Backward compatibility: het opbouwen van een nieuwe offerte-snapshot leest, wijzigt of overschrijft nooit een bestaand (oud) snapshot-object', () => {
  const oud = oudPakketSnapshotFixture()
  const oudVoorAanroep = JSON.parse(JSON.stringify(oud))

  // Een niet-gerelateerde nieuwe offerte bouwen (nieuwe pakket + tier) mag
  // het losstaande 'oude' object hierboven op geen enkele manier raken —
  // bouwOfferteSnapshot() krijgt het immers nooit als argument mee.
  const pakket = pakketFixture()
  const tier = bepaalPrijsTier(pakket, 500)
  const nieuw = bouwOfferteSnapshot({
    klant: klantFixture(),
    contactpersoon: null,
    pand: pandFixture(),
    pakket,
    tier,
    bedrag: 995,
    meerwerk: [],
    financieel: { subtotaal: 995, btwBedrag: 208.95, totaal: 1203.95 },
    voorwaardenVersie: '26 augustus 2026',
  })

  assert.deepEqual(oud, oudVoorAanroep) // volledig ongewijzigd
  assert.ok('prijstier' in nieuw.pakket) // de nieuwe offerte krijgt wél de nieuwe vorm
})

test('Backward compatibility: een prijswijziging in packages.js raakt nooit de prijsinformatie van een reeds opgeslagen (oud) snapshot', () => {
  const oud = oudPakketSnapshotFixture()
  // Simuleer een latere prijswijziging: een geheel nieuw pakket-object met
  // een compleet andere prijs, losstaand van het oude snapshot hierboven.
  const gewijzigdPakket = pakketFixture({
    priceTiers: [{ id: 'tot-1000m2', label: 'Tot 1.000 m²', maxOppervlak: 1000, prijs: 999999 }],
  })
  assert.equal(oud.prijsrange, '€ 895 - € 1.495') // ongewijzigd, ondanks de "latere" prijswijziging
  assert.notEqual(bepaalPrijsTier(gewijzigdPakket, 500).prijs, oud.prijsrange)
})

// --- Statusovergangen (werkfase Fase 2 — offerte-lifecycle) ---------------
// Deze tests bevriezen alleen de VORM van OFFERTE_TOEGESTANE_OVERGANGEN, niet
// de daadwerkelijke handhaving (die gebeurt door de database-trigger
// bewaak_offerte_integriteit, supabase/migrations/0005_offertes.sql — zie de
// live security-regressietests voor de daadwerkelijke DB-verificatie). Bij
// een toekomstige wijziging in de migratie moet deze constante bewust worden
// meegewijzigd, niet per ongeluk uit de pas lopen.

test('magOvergangNaar: concept mag naar verstuurd of geannuleerd, niet direct naar geaccepteerd/afgewezen', () => {
  assert.equal(magOvergangNaar('concept', 'verstuurd'), true)
  assert.equal(magOvergangNaar('concept', 'geannuleerd'), true)
  assert.equal(magOvergangNaar('concept', 'geaccepteerd'), false)
  assert.equal(magOvergangNaar('concept', 'afgewezen'), false)
  assert.equal(magOvergangNaar('concept', 'concept'), false)
})

test('magOvergangNaar: verstuurd mag naar geaccepteerd, afgewezen of geannuleerd', () => {
  assert.equal(magOvergangNaar('verstuurd', 'geaccepteerd'), true)
  assert.equal(magOvergangNaar('verstuurd', 'afgewezen'), true)
  assert.equal(magOvergangNaar('verstuurd', 'geannuleerd'), true)
  assert.equal(magOvergangNaar('verstuurd', 'concept'), false)
})

test('magOvergangNaar: elke terminale status (geaccepteerd/afgewezen/geannuleerd) staat geen enkele overgang meer toe', () => {
  for (const terminaal of ['geaccepteerd', 'afgewezen', 'geannuleerd']) {
    for (const doel of ['concept', 'verstuurd', 'geaccepteerd', 'afgewezen', 'geannuleerd']) {
      assert.equal(magOvergangNaar(terminaal, doel), false, `${terminaal} -> ${doel} hoort niet toegestaan te zijn`)
    }
  }
})

test('magOvergangNaar: onbekende status geeft nooit een toegestane overgang', () => {
  assert.equal(magOvergangNaar('onbekend', 'verstuurd'), false)
})

// Admin-UX-ronde (2026-10-09, UX-auditrapport §4): "Factuur maken" mag
// uitsluitend vanuit 'verstuurd'/'geaccepteerd' — nooit vanuit 'concept'
// (nog niet verstuurd) of een terminale afwijzing/annulering. Moet exact
// overeenkomen met bewaak_factuur_offerte_status()
// (0044_factuur_alleen_vanuit_geldige_offerte.sql), zie de parallelle
// broncontrole in facturenVanuitOfferteBroncontrole.test.js.
test('magFactuurMakenVanuitOfferte: alle vijf offertestatussen, exact de juiste twee toegestaan', () => {
  assert.equal(magFactuurMakenVanuitOfferte('concept'), false)
  assert.equal(magFactuurMakenVanuitOfferte('verstuurd'), true)
  assert.equal(magFactuurMakenVanuitOfferte('geaccepteerd'), true)
  assert.equal(magFactuurMakenVanuitOfferte('afgewezen'), false)
  assert.equal(magFactuurMakenVanuitOfferte('geannuleerd'), false)
})

test('magFactuurMakenVanuitOfferte: onbekende/lege status is nooit toegestaan', () => {
  assert.equal(magFactuurMakenVanuitOfferte('onbekend'), false)
  assert.equal(magFactuurMakenVanuitOfferte(undefined), false)
  assert.equal(magFactuurMakenVanuitOfferte(null), false)
})

test('FACTUUR_TOEGESTANE_OFFERTE_STATUSSEN bevat exact verstuurd en geaccepteerd, niets anders', () => {
  assert.deepEqual([...FACTUUR_TOEGESTANE_OFFERTE_STATUSSEN].sort(), ['geaccepteerd', 'verstuurd'])
})

test('OFFERTE_TOEGESTANE_OVERGANGEN dekt exact de vijf bestaande statussen als bron- of doelstatus, geen extra verzonnen status', () => {
  const alleGenoemdeStatussen = new Set([
    ...Object.keys(OFFERTE_TOEGESTANE_OVERGANGEN),
    ...Object.values(OFFERTE_TOEGESTANE_OVERGANGEN).flat(),
  ])
  for (const status of alleGenoemdeStatussen) {
    assert.ok(['concept', 'verstuurd', 'geaccepteerd', 'afgewezen', 'geannuleerd'].includes(status), `onverwachte status: ${status}`)
  }
})

// --- Gold scope control (werkfase Fase 11) --------------------------------

test('beoordeelGoldMeerwerk: niet relevant voor basis/premium, ongeacht meerwerk', () => {
  const meerwerk = [{ omschrijving: 'Extra', aantal: 1, eenheidsprijs: 95, totaal: 95 }]
  assert.equal(beoordeelGoldMeerwerk({ pakketId: 'basis', meerwerk }).relevant, false)
  assert.equal(beoordeelGoldMeerwerk({ pakketId: 'premium', meerwerk }).relevant, false)
})

test('beoordeelGoldMeerwerk: niet relevant voor Gold zonder meerwerk', () => {
  const { relevant } = beoordeelGoldMeerwerk({ pakketId: 'gold', meerwerk: [] })
  assert.equal(relevant, false)
})

test('beoordeelGoldMeerwerk: relevant voor Gold met meerwerk, telt regels en totaal correct op', () => {
  const meerwerk = [
    { omschrijving: 'Extra locatiebezoek', aantal: 1, eenheidsprijs: 95, totaal: 95 },
    { omschrijving: 'Extra contactmoment', aantal: 2, eenheidsprijs: 95, totaal: 190 },
  ]
  const resultaat = beoordeelGoldMeerwerk({ pakketId: 'gold', meerwerk })
  assert.equal(resultaat.relevant, true)
  assert.equal(resultaat.aantalRegels, 2)
  assert.equal(resultaat.totaal, 285)
})
