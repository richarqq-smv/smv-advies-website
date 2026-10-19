import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bouwAdviesrapportData,
  bouwSamenvatting,
  bouwPrioriteitenSamenvatting,
  bouwEnergieKostenOverzicht,
  bouwRoadmapRegels,
  PAKKET_RAPPORT_LABELS,
} from './adviesrapport.js'

function dossierFixture(overrides = {}) {
  return {
    klanten: { naam: 'Jan Jansen', bedrijfsnaam: 'Jansen BV' },
    contactpersonen: { naam: 'Jan Jansen', email: 'jan@jansenbv.test' },
    panden: { omschrijving: 'Hoofdkantoor', adres: 'Teststraat 1', postcode: '1234 AB', plaats: 'Amersfoort' },
    ...overrides,
  }
}

function adviespuntFixture(overrides = {}) {
  return {
    adviespunt_id: 'a1',
    onderwerp: 'Dakisolatie',
    herkomst: 'handmatig',
    advies_status: 'nu_onderzoeken',
    toelichting: 'Isolatie bekijken',
    investering_laag: 5000,
    investering_hoog: 7000,
    besparing_euro: 800,
    terugverdientijd_jaren: 6.5,
    prioriteit: 1,
    ...overrides,
  }
}

test('bouwAdviesrapportData: klantnaam gaat uit van bedrijfsnaam, pandadres combineert adres/postcode/plaats', () => {
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [adviespuntFixture()], pakketId: 'premium', adviseurNaam: 'Richard' })
  assert.equal(data.meta.klantnaam, 'Jansen BV')
  assert.equal(data.meta.pandadres, 'Teststraat 1, 1234 AB Amersfoort')
  assert.equal(data.meta.pakket, PAKKET_RAPPORT_LABELS.premium)
  assert.equal(data.meta.adviseur, 'Richard')
})

test('bouwAdviesrapportData: klantnaam valt terug op persoonsnaam/contactpersoon als bedrijfsnaam ontbreekt', () => {
  const dossier = dossierFixture({ klanten: { naam: 'Piet Pietersen', bedrijfsnaam: null } })
  const data = bouwAdviesrapportData({ dossier, adviespunten: [], pakketId: 'basis' })
  assert.equal(data.meta.klantnaam, 'Piet Pietersen')
})

test('bouwAdviesrapportData: maatregelen worden gesorteerd op prioriteit, dan op terugverdientijd', () => {
  const adviespunten = [
    adviespuntFixture({ adviespunt_id: 'a1', onderwerp: 'Ledverlichting', prioriteit: 2, terugverdientijd_jaren: 3 }),
    adviespuntFixture({ adviespunt_id: 'a2', onderwerp: 'Dakisolatie', prioriteit: 1, terugverdientijd_jaren: 8 }),
    adviespuntFixture({ adviespunt_id: 'a3', onderwerp: 'Zonnepanelen', prioriteit: 1, terugverdientijd_jaren: 5 }),
  ]
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten, pakketId: 'gold' })
  assert.deepEqual(
    data.maatregelen.map((m) => m.onderwerp),
    ['Zonnepanelen', 'Dakisolatie', 'Ledverlichting'],
  )
  assert.equal(data.maatregelen[0].nummer, 1)
  assert.equal(data.maatregelen[2].nummer, 3)
})

test('bouwAdviesrapportData: adviespunten zonder prioriteit komen achteraan, nooit een crash', () => {
  const adviespunten = [
    adviespuntFixture({ adviespunt_id: 'a1', onderwerp: 'Zonder prioriteit', prioriteit: null, terugverdientijd_jaren: null }),
    adviespuntFixture({ adviespunt_id: 'a2', onderwerp: 'Met prioriteit', prioriteit: 1 }),
  ]
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten, pakketId: 'basis' })
  assert.deepEqual(
    data.maatregelen.map((m) => m.onderwerp),
    ['Met prioriteit', 'Zonder prioriteit'],
  )
})

test('bouwAdviesrapportData: investeringsbandbreedte wordt alleen als bereik getoond als laag/hoog verschillen', () => {
  const gelijk = bouwAdviesrapportData({
    dossier: dossierFixture(),
    adviespunten: [adviespuntFixture({ investering_laag: 5000, investering_hoog: 5000 })],
    pakketId: 'basis',
  })
  assert.equal(gelijk.maatregelen[0].investering, '€ 5.000')

  const bereik = bouwAdviesrapportData({
    dossier: dossierFixture(),
    adviespunten: [adviespuntFixture({ investering_laag: 5000, investering_hoog: 7000 })],
    pakketId: 'basis',
  })
  assert.equal(bereik.maatregelen[0].investering, '€ 5.000 – € 7.000')
})

test('bouwAdviesrapportData: ontbrekende financiële velden worden expliciet gemarkeerd, nooit verzonnen', () => {
  const adviespunten = [adviespuntFixture({ investering_laag: null, investering_hoog: null, besparing_euro: null, terugverdientijd_jaren: null, prioriteit: null })]
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten, pakketId: 'basis' })
  assert.equal(data.maatregelen[0].investering, null)
  assert.equal(data.maatregelen[0].besparing, null)
  assert.ok(data.ontbrekendeVelden.includes('maatregel 1: investering'))
  assert.ok(data.ontbrekendeVelden.includes('maatregel 1: besparing'))
  assert.ok(data.ontbrekendeVelden.includes('maatregel 1: terugverdientijd'))
  assert.ok(data.ontbrekendeVelden.includes('maatregel 1: prioriteit'))
})

test('bouwAdviesrapportData: lege adviespunten-lijst levert lege maatregelenlijst en gemarkeerde ontbrekende data, geen crash', () => {
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'gold' })
  assert.deepEqual(data.maatregelen, [])
  assert.ok(data.ontbrekendeVelden.includes('adviespunten'))
  assert.equal(data.samenvatting[0], 'Voor dit dossier is nog geen definitief advies vastgelegd.')
})

test('bouwAdviesrapportData: ontbrekende klant/pand/adviseur-gegevens worden gemarkeerd', () => {
  const dossier = { klanten: null, contactpersonen: null, panden: null }
  const data = bouwAdviesrapportData({ dossier, adviespunten: [], pakketId: 'basis' })
  assert.equal(data.meta.klantnaam, null)
  assert.equal(data.meta.pandadres, null)
  assert.ok(data.ontbrekendeVelden.includes('klantnaam'))
  assert.ok(data.ontbrekendeVelden.includes('pandadres'))
  assert.ok(data.ontbrekendeVelden.includes('adviseur'))
})

test('bouwAdviesrapportData: onbekend pakketId levert geen pakketlabel (geen verzonnen tekst)', () => {
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'onbekend' })
  assert.equal(data.meta.pakket, null)
})

test('bouwAdviesrapportData: datum valt terug op vandaag als geen datum is opgegeven, geeft geldig NL-formaat', () => {
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'basis' })
  assert.match(data.meta.datumRapport, /^\d{2}-\d{2}-\d{4}$/)
})

// --- Bedrijfsgegevens uit factuur_instellingen (Administratie Instellingen) --

test('bouwAdviesrapportData: bedrijfsgegevens komen uit instellingen (factuur_instellingen), adres combineert adres/postcode/plaats', () => {
  const instellingen = { bedrijfsnaam: 'SMV Advies', adres: 'Frans Halsstraat 28', postcode: '3262 HG', plaats: 'Oud-Beijerland', telefoon: '06 22 71 33 83', email: 'info@smv-advies.nl' }
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'basis', instellingen })
  assert.equal(data.meta.bedrijfsnaam, 'SMV Advies')
  assert.equal(data.meta.bedrijfsadres, 'Frans Halsstraat 28, 3262 HG Oud-Beijerland')
  assert.equal(data.meta.bedrijfsTelefoon, '06 22 71 33 83')
  assert.equal(data.meta.bedrijfsEmail, 'info@smv-advies.nl')
})

test('bouwAdviesrapportData: financieel-administratieve velden (KvK/btw-id/IBAN/betalingsvoorwaarden) komen niet in de rapportdata terecht', () => {
  const instellingen = {
    bedrijfsnaam: 'SMV Advies',
    adres: 'Frans Halsstraat 28',
    postcode: '3262 HG',
    plaats: 'Oud-Beijerland',
    telefoon: '06 22 71 33 83',
    email: 'info@smv-advies.nl',
    kvk_nummer: '12345678',
    btw_id: 'NL123456789B01',
    iban: 'NL91ABNA0417164300',
    betalingsvoorwaarden: 'Binnen 14 dagen.',
  }
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'basis', instellingen })
  const waarden = Object.values(data.meta)
  assert.equal(waarden.includes('12345678'), false)
  assert.equal(waarden.includes('NL123456789B01'), false)
  assert.equal(waarden.includes('NL91ABNA0417164300'), false)
  assert.equal(waarden.includes('Binnen 14 dagen.'), false)
})

test('bouwAdviesrapportData: ontbrekende instellingen laat bedrijfsgegevensvelden gewoon leeg (null), geen crash', () => {
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'basis' })
  assert.equal(data.meta.bedrijfsnaam, null)
  assert.equal(data.meta.bedrijfsadres, null)
  assert.equal(data.meta.bedrijfsTelefoon, null)
  assert.equal(data.meta.bedrijfsEmail, null)
})

test('bouwAdviesrapportData: lange/realistische bedrijfsgegevens komen ongewijzigd (niet afgekapt) in de rapportdata terecht', () => {
  const instellingen = {
    bedrijfsnaam: 'SMV Advies Bouwkundig Energieadvies & Projectbegeleiding Nederland B.V.',
    adres: 'Langestraat-Noordzijde 128-B, Bedrijvenpark De Hoeksche Verbinding',
    postcode: '3262 HG',
    plaats: 'Oud-Beijerland-aan-de-Maas',
    telefoon: '06 22 71 33 83 / 088 123 45 67 (bereikbaar ma-vr 08:00-18:00)',
    email: 'administratie.en.facturatie.lange.testwaarde@smv-advies.nl',
  }
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'basis', instellingen })
  assert.equal(data.meta.bedrijfsnaam, instellingen.bedrijfsnaam)
  assert.equal(data.meta.bedrijfsadres, 'Langestraat-Noordzijde 128-B, Bedrijvenpark De Hoeksche Verbinding, 3262 HG Oud-Beijerland-aan-de-Maas')
  assert.equal(data.meta.bedrijfsTelefoon, instellingen.telefoon)
  assert.equal(data.meta.bedrijfsEmail, instellingen.email)
})

test('bouwSamenvatting: groepeert per status met voorzichtige formulering, sluit af met disclaimer', () => {
  const adviespunten = [
    adviespuntFixture({ onderwerp: 'Dakisolatie', advies_status: 'nu_onderzoeken' }),
    adviespuntFixture({ onderwerp: 'Ventilatie', advies_status: 'geen_actie_nodig' }),
  ]
  const paragrafen = bouwSamenvatting(adviespunten)
  assert.ok(paragrafen.some((p) => p.includes('dakisolatie')))
  assert.ok(paragrafen.some((p) => p.includes('ventilatie')))
  assert.equal(paragrafen.at(-1), 'Dit overzicht ondersteunt de beoordeling van de adviseur en vervangt geen technische inspectie.')
})

test('bouwSamenvatting: lege lijst geeft duidelijke melding, geen crash', () => {
  assert.deepEqual(bouwSamenvatting([]), ['Voor dit dossier is nog geen definitief advies vastgelegd.'])
  assert.deepEqual(bouwSamenvatting(null), ['Voor dit dossier is nog geen definitief advies vastgelegd.'])
})

test('bouwAdviesrapportData: bouwkundige analyse vult de 4 vaste rijen uit dossier.bouwkundige_analyse', () => {
  const dossier = dossierFixture({
    bouwkundige_analyse: {
      gevel: { waarde: '0,35', eenheid: 'Rc', beoordeling: 'Onvoldoende', opmerking: 'Spouw ongeïsoleerd' },
      dak: { waarde: '2,5', eenheid: 'Rc', beoordeling: 'Voldoet', opmerking: '' },
    },
  })
  const data = bouwAdviesrapportData({ dossier, adviespunten: [], pakketId: 'premium' })
  assert.equal(data.bouwkundigeAnalyse.length, 4)
  assert.equal(data.bouwkundigeAnalyse[0].label, 'Gevel (spouwmuur)')
  assert.equal(data.bouwkundigeAnalyse[0].waarde, '0,35 Rc')
  assert.equal(data.bouwkundigeAnalyse[0].beoordeling, 'Onvoldoende')
  assert.equal(data.bouwkundigeAnalyse[2].waarde, null)
})

test('bouwAdviesrapportData: ontbrekende bouwkundige analyse wordt alleen gemarkeerd bij premium/gold', () => {
  const dossier = dossierFixture()
  const basis = bouwAdviesrapportData({ dossier, adviespunten: [], pakketId: 'basis' })
  assert.ok(!basis.ontbrekendeVelden.includes('bouwkundige analyse (Rc/U-waarden)'))

  const premium = bouwAdviesrapportData({ dossier, adviespunten: [], pakketId: 'premium' })
  assert.ok(premium.ontbrekendeVelden.includes('bouwkundige analyse (Rc/U-waarden)'))
})

test('bouwAdviesrapportData: subsidiestappen worden gesorteerd op volgorde en gedateerd geformatteerd', () => {
  const subsidieTaken = [
    { omschrijving: 'ISDE-aanvraag', verantwoordelijke: 'SMV Advies', volgorde: 1, deadline: '2026-06-01' },
    { omschrijving: 'EIA-melding', verantwoordelijke: 'SMV Advies', volgorde: 0, deadline: null },
  ]
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'gold', subsidieTaken })
  assert.equal(data.subsidieStappen.length, 2)
  assert.equal(data.subsidieStappen[0].actie, 'EIA-melding')
  assert.equal(data.subsidieStappen[0].deadline, null)
  assert.equal(data.subsidieStappen[1].actie, 'ISDE-aanvraag')
  assert.equal(data.subsidieStappen[1].deadline, '01-06-2026')
})

test('bouwAdviesrapportData: lege subsidiestappen worden alleen bij gold gemarkeerd als ontbrekend', () => {
  const premium = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'premium' })
  assert.ok(!premium.ontbrekendeVelden.includes('subsidiebegeleidingsplan'))

  const gold = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'gold' })
  assert.ok(gold.ontbrekendeVelden.includes('subsidiebegeleidingsplan'))
})

/**
 * Ronde 2026-10-19 (projectplan "Klantwaarde-uitbreidingen", Fase 1 —
 * #1/#2/3): grafiek-/roadmap-/prioriteitendata voor het adviesrapport.
 */
test('bouwPrioriteitenSamenvatting: neemt de eerste 3 maatregelen mét terugverdientijd, in de bestaande volgorde', () => {
  const maatregelen = [
    { nummer: 1, onderwerp: 'Dakisolatie', terugverdientijd: '4 jaar' },
    { nummer: 2, onderwerp: 'LED-verlichting', terugverdientijd: null },
    { nummer: 3, onderwerp: 'Gevelisolatie', terugverdientijd: '5 jaar' },
    { nummer: 4, onderwerp: 'Zonnepanelen', terugverdientijd: '7 jaar' },
    { nummer: 5, onderwerp: 'Warmtepomp', terugverdientijd: '9 jaar' },
  ]
  const [zin] = bouwPrioriteitenSamenvatting(maatregelen)
  assert.match(zin, /Dakisolatie \(4 jaar\)/)
  assert.match(zin, /Gevelisolatie \(5 jaar\)/)
  assert.match(zin, /Zonnepanelen \(7 jaar\)/)
  assert.doesNotMatch(zin, /Warmtepomp/)
  assert.doesNotMatch(zin, /LED-verlichting/)
})

test('bouwPrioriteitenSamenvatting: geeft lege array zonder enige maatregel met terugverdientijd', () => {
  assert.deepEqual(bouwPrioriteitenSamenvatting([{ nummer: 1, onderwerp: 'X', terugverdientijd: null }]), [])
  assert.deepEqual(bouwPrioriteitenSamenvatting([]), [])
})

test('bouwEnergieKostenOverzicht: rekent nieuwe kosten uit huidige kosten min besparing, rond af op hele euro\'s/kg', () => {
  const snapshot = { resultaat: { huidigeKosten: 12345.6, totaleBesparing: 2345.4, co2: 987.6 } }
  const overzicht = bouwEnergieKostenOverzicht(snapshot)
  assert.equal(overzicht.huidigeKosten, 12346)
  assert.equal(overzicht.nieuweKosten, 10000)
  assert.equal(overzicht.besparingPerJaar, 2345)
  assert.equal(overzicht.co2PerJaar, 988)
})

test('bouwEnergieKostenOverzicht: nieuwe kosten nooit negatief, ook niet bij een besparing groter dan de huidige kosten', () => {
  const overzicht = bouwEnergieKostenOverzicht({ resultaat: { huidigeKosten: 500, totaleBesparing: 900, co2: 100 } })
  assert.equal(overzicht.nieuweKosten, 0)
})

test('bouwEnergieKostenOverzicht: null zonder energie-indicatie-snapshot — nooit een geschat cijfer', () => {
  assert.equal(bouwEnergieKostenOverzicht(null), null)
  assert.equal(bouwEnergieKostenOverzicht({}), null)
  assert.equal(bouwEnergieKostenOverzicht({ resultaat: {} }), null)
})

test('bouwEnergieKostenOverzicht: correctieronde — ontbrekende totaleBesparing wordt NIET stilzwijgend € 0, maar maakt het hele overzicht null (geen verzonnen nulbesparing)', () => {
  assert.equal(bouwEnergieKostenOverzicht({ resultaat: { huidigeKosten: 4000 } }), null)
  assert.equal(bouwEnergieKostenOverzicht({ resultaat: { huidigeKosten: 4000, totaleBesparing: null } }), null)
  assert.equal(bouwEnergieKostenOverzicht({ resultaat: { huidigeKosten: 4000, totaleBesparing: undefined } }), null)
})

test('bouwEnergieKostenOverzicht: ongeldige (NaN/Infinity) cijfers geven ook null, nooit een gok', () => {
  assert.equal(bouwEnergieKostenOverzicht({ resultaat: { huidigeKosten: 4000, totaleBesparing: NaN } }), null)
  assert.equal(bouwEnergieKostenOverzicht({ resultaat: { huidigeKosten: NaN, totaleBesparing: 1000 } }), null)
  assert.equal(bouwEnergieKostenOverzicht({ resultaat: { huidigeKosten: Infinity, totaleBesparing: 1000 } }), null)
  assert.equal(bouwEnergieKostenOverzicht({ resultaat: { huidigeKosten: 4000, totaleBesparing: 'onbekend' } }), null)
})

test('bouwEnergieKostenOverzicht: een echt berekende besparing van 0 blijft een geldige, getoonde 0 (geen maatregelen met besparing is geen "onbekend")', () => {
  const overzicht = bouwEnergieKostenOverzicht({ resultaat: { huidigeKosten: 3000, totaleBesparing: 0, co2: 0 } })
  assert.ok(overzicht)
  assert.equal(overzicht.besparingPerJaar, 0)
  assert.equal(overzicht.nieuweKosten, 3000)
  assert.equal(overzicht.co2PerJaar, 0)
})

function mjopComponentFixture(overrides = {}) {
  return { id: 'c1', typeId: 'dak', present: 'ja', ...overrides }
}

test('bouwRoadmapRegels: verdeelt onderdelen naar korte/middellange/lange termijn op basis van het relevante jaar', () => {
  const jaar = new Date().getFullYear()
  const snapshot = {
    components: [
      mjopComponentFixture({ id: 'c1', typeId: 'verwarming', replacementYear: jaar + 1 }),
      mjopComponentFixture({ id: 'c2', typeId: 'dakisolatie', replacementYear: jaar + 3 }),
      mjopComponentFixture({ id: 'c3', typeId: 'gevelisolatie', replacementYear: jaar + 8 }),
    ],
  }
  const roadmap = bouwRoadmapRegels(snapshot)
  assert.match(roadmap.kort, /Cv \/ verwarming/)
  assert.match(roadmap.middellang, /Dakisolatie/)
  assert.match(roadmap.lang, /Gevelisolatie/)
})

test('bouwRoadmapRegels: sluit "geen actie nodig" en "onvoldoende informatie" uit — die horen niet op een tijdlijn van aankomende momenten', () => {
  const jaar = new Date().getFullYear()
  const snapshot = {
    components: [
      // Recent geplaatst, geen vervangingsjaar opgegeven -> geen_actie_nodig (zie linking.js RECENT_INSTALL_YEARS).
      mjopComponentFixture({ id: 'c1', typeId: 'ventilatie', installationYear: jaar - 1 }),
      // Geen enkel jaartal bekend -> onvoldoende_informatie.
      mjopComponentFixture({ id: 'c2', typeId: 'koeling' }),
    ],
  }
  const roadmap = bouwRoadmapRegels(snapshot)
  assert.equal(roadmap.kort, null)
  assert.equal(roadmap.middellang, null)
  assert.equal(roadmap.lang, null)
})

test('bouwRoadmapRegels: null zonder MJOP-snapshot of zonder componenten', () => {
  assert.equal(bouwRoadmapRegels(null), null)
  assert.equal(bouwRoadmapRegels({}), null)
  assert.equal(bouwRoadmapRegels({ components: [] }), null)
})

test('bouwAdviesrapportData: energieOverzicht/roadmap/prioriteitenSamenvatting komen uit dossier.energie_snapshot/mjop_snapshot', () => {
  const jaar = new Date().getFullYear()
  const dossier = dossierFixture({
    energie_snapshot: { resultaat: { huidigeKosten: 4000, totaleBesparing: 1000, co2: 500 } },
    mjop_snapshot: { components: [mjopComponentFixture({ replacementYear: jaar + 1 })] },
  })
  const data = bouwAdviesrapportData({
    dossier,
    adviespunten: [adviespuntFixture({ onderwerp: 'Dakisolatie', terugverdientijd_jaren: 4 })],
    pakketId: 'premium',
  })
  assert.deepEqual(data.energieOverzicht, { huidigeKosten: 4000, nieuweKosten: 3000, besparingPerJaar: 1000, co2PerJaar: 500 })
  assert.match(data.roadmap.kort, /Dak/)
  assert.match(data.prioriteitenSamenvatting[0], /Dakisolatie \(4 jaar\)/)
})

test('bouwAdviesrapportData: energieOverzicht/roadmap blijven null zonder snapshots, zonder dit als "ontbrekend" te markeren', () => {
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'basis' })
  assert.equal(data.energieOverzicht, null)
  assert.equal(data.roadmap, null)
  assert.ok(!data.ontbrekendeVelden.some((v) => /energie|roadmap/i.test(v)))
})
