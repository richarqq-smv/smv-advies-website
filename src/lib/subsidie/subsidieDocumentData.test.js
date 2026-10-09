import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwSubsidieDocumentData } from './subsidieDocumentData.js'

const DOSSIER = {
  dossier_id: 'd-1',
  klanten: { bedrijfsnaam: 'Bakkerij De Korenbloem', naam: null },
  panden: { adres: 'Voorstraat 1', postcode: '3261 AB', plaats: 'Oud-Beijerland' },
}

test('correcte dossiergegevens: klantnaam/pandadres/dossierId komen uit dossier.klanten/panden', () => {
  const data = bouwSubsidieDocumentData({ dossier: DOSSIER, uitvoeringsjaar: 2026 })
  assert.equal(data.meta.klantnaam, 'Bakkerij De Korenbloem')
  assert.equal(data.meta.pandadres, 'Voorstraat 1, 3261 AB Oud-Beijerland')
  assert.equal(data.meta.dossierId, 'd-1')
  assert.equal(data.meta.uitvoeringsjaar, 2026)
})

test('zonder dossierbreed jaar en zonder maatregel-jaar: "Uitvoeringsjaar" staat in ontbrekendeVelden', () => {
  const data = bouwSubsidieDocumentData({ dossier: DOSSIER })
  assert.ok(data.ontbrekendeVelden.includes('Uitvoeringsjaar'))
})

test('dossierbreed jaar vult een maatregel zonder eigen jaar aan, zonder een al ingevuld maatregel-jaar te overschrijven', () => {
  const data = bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    specificatiesPerMaatregel: { dakisolatie: { uitvoeringsjaar: 2025, oppervlakteM2: 10, technischeWaarde: 1 } },
  })
  const dak = data.maatregelen.find((m) => m.maatregelKey === 'dakisolatie')
  const gevel = data.maatregelen.find((m) => m.maatregelKey === 'gevelisolatie')
  assert.equal(dak.specificatie.uitvoeringsjaar, 2025) // eigen jaar blijft behouden
  assert.equal(gevel.specificatie.uitvoeringsjaar, 2026) // dossierbreed jaar vult aan
})

test('correcte maatregelspecificaties: dak + gevel compleet -> beide "van toepassing" met eigen berekening', () => {
  const data = bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    specificatiesPerMaatregel: {
      dakisolatie: { oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
      gevelisolatie: { oppervlakteM2: 60, technischeWaarde: 3.5, meldcode: 'KA31000', isolatieBevestigd: 'ja' },
    },
  })
  const dak = data.maatregelen.find((m) => m.maatregelKey === 'dakisolatie')
  const gevel = data.maatregelen.find((m) => m.maatregelKey === 'gevelisolatie')
  assert.equal(dak.status, 'van_toepassing')
  assert.equal(gevel.status, 'van_toepassing')
  assert.equal(data.combinatie.combinatieVanToepassing, true)
  assert.equal(dak.berekening.tarief, 32.5)
  assert.equal(gevel.berekening.tarief, 40.5)
  assert.equal(data.combinatie.totaalBedrag, 120 * 32.5 + 60 * 40.5)
})

test('correcte bron: elke maatregel met een gevonden regel draagt de RVO-bron (label/url/gecontroleerdOp) mee, geen dubbele vermelding in `bronnen`', () => {
  const data = bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    specificatiesPerMaatregel: {
      dakisolatie: { oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
      gevelisolatie: { oppervlakteM2: 60, technischeWaarde: 3.5, meldcode: 'KA31000', isolatieBevestigd: 'ja' },
    },
  })
  // Dak+gevel delen dezelfde RVO-isolatiepagina (1 bron). De drie
  // apparaatmaatregelen EN ventilatie zijn in deze fixture nog volledig
  // onaangeraakt (geen eigen rij), maar het dossierbrede jaar maakt elke
  // apparaat-/ventilatiemaatregel toch "controle vereist" (nog onbekend
  // of hij wordt geïnstalleerd) — mét zijn eigen infopagina als bron
  // (warmtepomp + zonneboiler + ventilatie = 3 extra, niet 4, want beide
  // warmtepomp-varianten delen dezelfde RVO-warmtepomppagina). Totaal 1 + 3 = 4.
  assert.equal(data.bronnen.length, 4)
  data.bronnen.forEach((b) => {
    assert.match(b.url, /^https:\/\/www\.rvo\.nl\//)
    assert.ok(b.gecontroleerdOp)
    // Elke bron is nu ook gevalideerd op "niet in de toekomst" (opdracht §20).
    assert.equal(b.controle.geldig, true)
  })
})

test('correcte datum: datumGegenereerd is een leesbare, niet-lege Nederlandse datum', () => {
  const data = bouwSubsidieDocumentData({ dossier: DOSSIER, datum: '2026-10-15' })
  assert.equal(data.meta.datumGegenereerd, '15 oktober 2026')
})

test('ontbrekende gegevens worden per maatregel opgeteld in ontbrekendeVelden, zonder duplicaten', () => {
  // specificatiesPerMaatregel bevat alle 9 "normale" ondersteunde
  // maatregelen (6 isolatie incl. glas + 3 apparaat) — elk een eigen
  // "Meldcode (<maatregel>)"-vermelding. Ventilatie telt apart (zie
  // volgende assert): die gebruikt een eigen, niet-geparametriseerde
  // "Meldcode (ventilatie)"-string vanuit subsidieVentilatieEligibility.js.
  const data = bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    specificatiesPerMaatregel: {
      dakisolatie: {},
      gevelisolatie: {},
      vloerisolatie: {},
      bodemisolatie: {},
      glasHrpp: {},
      glasTriple: {},
      warmtepomp_hybride: {},
      warmtepomp_elektrisch: {},
      zonneboiler: {},
    },
  })
  const aantalMeldcode = data.ontbrekendeVelden.filter((v) => v.startsWith('Meldcode (')).length
  assert.equal(aantalMeldcode, 10) // 9 hierboven + "Meldcode (ventilatie)" (altijd aanwezig zodra een jaar bekend is)
})

test('opnameReferentie: dak-waarnemingen komen puur ter referentie mee, zonder ze als subsidie-input te interpreteren', () => {
  const data = bouwSubsidieDocumentData({
    dossier: DOSSIER,
    waarnemingen: [{ onderdeel: 'dak', huidige_situatie: 'Dak wordt vervangen', maatvoering: '120 m²', mogelijke_maatregel: 'Isolatie toevoegen' }],
  })
  const dak = data.maatregelen.find((m) => m.maatregelKey === 'dakisolatie')
  assert.equal(dak.opnameReferentie.length, 1)
  assert.equal(dak.opnameReferentie[0].maatvoering, '120 m²')
  // De referentie staat los van specificatie — geen automatische vertaling naar oppervlakteM2.
  assert.equal(dak.specificatie, null)
})

// --- Regionale sectie (opdracht §12/13) ---

test('regionaal: postcode/plaats bekend -> "lokale subsidiecontrole vereist", nooit "geen subsidie"', () => {
  const data = bouwSubsidieDocumentData({ dossier: DOSSIER })
  assert.equal(data.regionaal.locatieBekend, true)
  assert.match(data.regionaal.boodschap, /Lokale subsidiecontrole vereist/)
  assert.equal(/geen subsidie/i.test(data.regionaal.boodschap), false)
})

test('regionaal: postcode/plaats onbekend -> "niet te bepalen", geen gok', () => {
  const data = bouwSubsidieDocumentData({ dossier: { dossier_id: 'd-2', klanten: {}, panden: {} } })
  assert.equal(data.regionaal.locatieBekend, false)
  assert.match(data.regionaal.boodschap, /niet te bepalen/)
})

// --- Actielijst (opdracht §15) ---

test('actielijst: geen relevante maatregelen -> lege actielijst, geen vaste standaardlijst', () => {
  const data = bouwSubsidieDocumentData({ dossier: DOSSIER })
  assert.deepEqual(data.actielijst, [])
})

test('actielijst: dak compleet (van toepassing) -> bevat een stap om de aanvraag in te dienen via de bron, en altijd de bewijsstukken-stap', () => {
  const data = bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    specificatiesPerMaatregel: { dakisolatie: { oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' } },
  })
  assert.ok(data.actielijst.some((s) => s.includes('offerte, factuur, betaalbewijs')))
  assert.ok(data.actielijst.some((s) => s.includes('Dien de aanvraag in via')))
  assert.ok(data.actielijst.some((s) => s.includes('Bewaar de aanvraagbevestiging')))
})

test('actielijst: meldcode ontbreekt -> bevat een concrete stap om de meldcode op te vragen, genoemd met de juiste maatregel', () => {
  const data = bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    specificatiesPerMaatregel: { dakisolatie: { oppervlakteM2: 120, technischeWaarde: 3.5, isolatieBevestigd: 'ja' } },
  })
  assert.ok(data.actielijst.some((s) => s.includes('meldcode') && s.includes('Dakisolatie')))
})

// --- Ventilatie: harde combinatie-voorwaarde met isolatie (opdracht, uitbreidingsronde) ---

test('ventilatie: zonder enige subsidiabele isolatiemaatregel in het dossier -> gedowngraded naar "controle vereist", ook als ventilatie zelf volledig is ingevuld', () => {
  const data = bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    specificatiesPerMaatregel: {
      ventilatie: { isolatieBevestigd: 'ja', meldcode: 'KA31506' },
    },
  })
  const ventilatie = data.maatregelen.find((m) => m.maatregelKey === 'ventilatie')
  assert.equal(ventilatie.status, 'controle_vereist')
  assert.match(ventilatie.redenen[0], /combinatie/)
  assert.equal(ventilatie.berekening, null)
})

test('ventilatie: MET een subsidiabele isolatiemaatregel (dak compleet) in het dossier -> blijft "van toepassing" en telt mee in het totaal', () => {
  const data = bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    specificatiesPerMaatregel: {
      dakisolatie: { oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
      ventilatie: { isolatieBevestigd: 'ja', meldcode: 'KA31506' },
    },
  })
  const ventilatie = data.maatregelen.find((m) => m.maatregelKey === 'ventilatie')
  assert.equal(ventilatie.status, 'van_toepassing')
  assert.equal(ventilatie.berekening.berekenbaar, true)
  assert.equal(ventilatie.berekening.bedrag, 400)
  assert.equal(data.combinatie.totaalBerekenbaar, true)
  assert.ok(data.combinatie.totaalBedrag > 400) // dak + ventilatie samen
})

test('ventilatie: niet aangeraakt (geen eigen rij) telt niet mee in het totaalbedrag, ook al zou hij theoretisch subsidiabel zijn', () => {
  const data = bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    specificatiesPerMaatregel: {
      dakisolatie: { oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
    },
  })
  // Ventilatie is hier niet aangeraakt, dus niet in combinatieInvoer — het totaal is puur dak.
  assert.equal(data.combinatie.totaalBedrag, 120 * 16.25) // enkel tarief: combinatieAantal telt alleen aangeraakte maatregelen
})

test('geen dossier/pand/klant (lege input) crasht niet en levert lege, geen-gok-velden', () => {
  const data = bouwSubsidieDocumentData({})
  assert.equal(data.meta.klantnaam, null)
  assert.equal(data.meta.pandadres, null)
  // 6 isolatiemaatregelen (incl. 2 glas) + 3 apparaatmaatregelen + ventilatie.
  assert.equal(data.maatregelen.length, 10)
  data.maatregelen.forEach((m) => assert.equal(m.status, 'niet_voldoende_gegevens'))
  assert.equal(data.regionaal.locatieBekend, false)
  assert.deepEqual(data.fiscaleRegelingen, [])
})

// --- EIA/MIA/Vamil (2026-10-09) ---

test('fiscaleRegelingen is zonder mjop/energie-insights een lege array, nooit een gok', () => {
  const data = bouwSubsidieDocumentData({ dossier: DOSSIER })
  assert.deepEqual(data.fiscaleRegelingen, [])
})

test('fiscaleRegelingen blijft volledig gescheiden van maatregelen/combinatie — geen vermenging van ISDE en fiscale regelingen in één totaal', () => {
  const data = bouwSubsidieDocumentData({
    dossier: { ...DOSSIER, panden: { ...DOSSIER.panden, gebruikstype: 'horeca' } },
    mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Dakisolatie vervangen' }] }],
  })
  assert.ok(data.fiscaleRegelingen.length > 0)
  data.fiscaleRegelingen.forEach((r) => {
    assert.equal(data.maatregelen.some((m) => m.maatregelKey === r.bedrijfsmiddel.id), false)
  })
  assert.equal('fiscaleRegelingen' in data.combinatie, false)
})

test('fiscaleRegelingen respecteert de pandtype-grens: een niet-zakelijk pand geeft niet_van_toepassing', () => {
  const data = bouwSubsidieDocumentData({
    dossier: { ...DOSSIER, panden: { ...DOSSIER.panden, gebruikstype: 'woning' } },
    mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Dakisolatie vervangen' }] }],
  })
  assert.ok(data.fiscaleRegelingen.length > 0)
  data.fiscaleRegelingen.forEach((r) => assert.equal(r.status, 'niet_van_toepassing'))
})
