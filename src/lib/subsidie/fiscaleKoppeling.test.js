import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bepaalFiscaleCategorieSignalen, vindRelevanteFiscaleBedrijfsmiddelen, FISCAAL_RELEVANTIE_STATUS } from './fiscaleKoppeling.js'
import { FISCALE_CATEGORIE } from './fiscaleBedrijfsmiddelen.js'

const ZAKELIJK_PAND = { gebruikstype: 'horeca' }
const WONING = { gebruikstype: 'woning' }
const PAND_ZONDER_TYPE = { gebruikstype: '' }

test('bepaalFiscaleCategorieSignalen matcht een MJOP-maatregel "Dakisolatie vervangen" uitsluitend op de isolatie-categorie', () => {
  const signalen = bepaalFiscaleCategorieSignalen({ mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Dakisolatie vervangen' }] }] })
  assert.ok(signalen.has(FISCALE_CATEGORIE.ISOLATIE))
  assert.equal(signalen.has(FISCALE_CATEGORIE.WARMTEPOMP), false)
})

test('bepaalFiscaleCategorieSignalen matcht een Energie-indicatie-maatregel "Hybride warmtepomp plaatsen" op warmtepomp', () => {
  const signalen = bepaalFiscaleCategorieSignalen({ energieInsights: [{ energieMaatregelId: 'e1', maatregelNaam: 'Hybride warmtepomp plaatsen' }] })
  assert.ok(signalen.has(FISCALE_CATEGORIE.WARMTEPOMP))
})

test('bepaalFiscaleCategorieSignalen matcht een opname-waarneming op ventilatie', () => {
  const signalen = bepaalFiscaleCategorieSignalen({ waarnemingen: [{ onderdeel: 'ventilatie', mogelijke_maatregel: 'Ventilatie met warmteterugwinning toevoegen' }] })
  assert.ok(signalen.has(FISCALE_CATEGORIE.VENTILATIE))
})

test('bepaalFiscaleCategorieSignalen matcht een al ingevulde ISDE-specificatie (dakisolatie) op isolatie', () => {
  const signalen = bepaalFiscaleCategorieSignalen({ specificatiesPerMaatregel: { dakisolatie: { oppervlakteM2: 40 } } })
  assert.ok(signalen.has(FISCALE_CATEGORIE.ISOLATIE))
})

test('een algemene, niet-gebouwgerelateerde tekst (bv. "Innovatiekrediet") matcht geen enkele categorie', () => {
  const signalen = bepaalFiscaleCategorieSignalen({ mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Innovatiekrediet aanvragen' }] }] })
  assert.equal(signalen.size, 0)
})

test('vindRelevanteFiscaleBedrijfsmiddelen geeft een lege lijst zonder enig dossiersignaal (geen statische checklist)', () => {
  assert.deepEqual(vindRelevanteFiscaleBedrijfsmiddelen({ pand: ZAKELIJK_PAND }), [])
})

test('vindRelevanteFiscaleBedrijfsmiddelen: zakelijk pand + isolatiesignaal geeft mogelijk_relevant met een concrete reden', () => {
  const resultaten = vindRelevanteFiscaleBedrijfsmiddelen({
    pand: ZAKELIJK_PAND,
    mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Dakisolatie vervangen' }] }],
  })
  assert.ok(resultaten.length > 0)
  resultaten.forEach((r) => {
    assert.equal(r.bedrijfsmiddel.categorie, FISCALE_CATEGORIE.ISOLATIE)
    assert.ok([FISCAAL_RELEVANTIE_STATUS.MOGELIJK_RELEVANT, FISCAAL_RELEVANTIE_STATUS.CONTROLE_VEREIST].includes(r.status))
    assert.ok(r.redenen.length > 0)
  })
  const biobasedIsolatie = resultaten.find((r) => r.bedrijfsmiddel.id === 'eia-210404')
  assert.ok(biobasedIsolatie, 'biobased isolatie (code 210404) had moeten matchen op het isolatiesignaal')
})

test('vindRelevanteFiscaleBedrijfsmiddelen: ontbrekend pandtype geeft controle_vereist, nooit mogelijk_relevant', () => {
  const resultaten = vindRelevanteFiscaleBedrijfsmiddelen({
    pand: PAND_ZONDER_TYPE,
    mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Dakisolatie vervangen' }] }],
  })
  assert.ok(resultaten.length > 0)
  resultaten.forEach((r) => assert.equal(r.status, FISCAAL_RELEVANTIE_STATUS.CONTROLE_VEREIST))
})

test('vindRelevanteFiscaleBedrijfsmiddelen: een woning (niet-zakelijk pandtype) geeft niet_van_toepassing, nooit mogelijk_relevant', () => {
  const resultaten = vindRelevanteFiscaleBedrijfsmiddelen({
    pand: WONING,
    mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Dakisolatie vervangen' }] }],
  })
  assert.ok(resultaten.length > 0)
  resultaten.forEach((r) => {
    assert.equal(r.status, FISCAAL_RELEVANTIE_STATUS.NIET_VAN_TOEPASSING)
    assert.match(r.redenen.join(' '), /niet.*zakelijk|privéwoning/i)
  })
})

test('vindRelevanteFiscaleBedrijfsmiddelen: een "controle_vereist"-bedrijfsmiddel (zonnepanelen) blijft controle_vereist, ook bij een zakelijk pand', () => {
  const resultaten = vindRelevanteFiscaleBedrijfsmiddelen({
    pand: ZAKELIJK_PAND,
    energieInsights: [{ energieMaatregelId: 'e1', maatregelNaam: 'Zonnepanelen plaatsen op het dak' }],
  })
  const zonnepanelen = resultaten.find((r) => r.bedrijfsmiddel.id === 'eia-controle-zonnepanelen')
  assert.ok(zonnepanelen)
  assert.equal(zonnepanelen.status, FISCAAL_RELEVANTIE_STATUS.CONTROLE_VEREIST)
})

test('vindRelevanteFiscaleBedrijfsmiddelen: al ingevulde ISDE-oppervlakte (dakisolatie) wordt hergebruikt als gekoppeldeGegevens i.p.v. alleen als "ontbrekend" getoond', () => {
  const resultaten = vindRelevanteFiscaleBedrijfsmiddelen({
    pand: ZAKELIJK_PAND,
    specificatiesPerMaatregel: { dakisolatie: { oppervlakteM2: 120 } },
  })
  const biobasedIsolatie = resultaten.find((r) => r.bedrijfsmiddel.id === 'eia-210404')
  assert.ok(biobasedIsolatie)
  assert.equal(biobasedIsolatie.status, FISCAAL_RELEVANTIE_STATUS.MOGELIJK_RELEVANT)
  assert.deepEqual(biobasedIsolatie.gekoppeldeGegevens, [{ label: 'Oppervlakte Dakisolatie', waarde: '120 m²', bron: 'Al vastgelegd bij de ISDE-specificatie van deze maatregel' }])
  // Investeringsbedrag/-datum blijven echt ontbrekend — die registreert de ISDE-engine nergens, dus mag nooit verzonnen worden.
  assert.deepEqual(biobasedIsolatie.ontbrekendeGegevens, ['Investeringsbedrag', 'Investeringsdatum (koopovereenkomst/bestelling)'])
})

test('vindRelevanteFiscaleBedrijfsmiddelen: zonder ISDE-specificatie (alleen een MJOP-signaal) is gekoppeldeGegevens leeg, geen gegokte waarde', () => {
  const resultaten = vindRelevanteFiscaleBedrijfsmiddelen({
    pand: ZAKELIJK_PAND,
    mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Dakisolatie vervangen' }] }],
  })
  resultaten.forEach((r) => assert.deepEqual(r.gekoppeldeGegevens, []))
})

test('vindRelevanteFiscaleBedrijfsmiddelen: een niet-zakelijk pand geeft nooit gekoppeldeGegevens, ook niet met een ISDE-oppervlakte', () => {
  const resultaten = vindRelevanteFiscaleBedrijfsmiddelen({
    pand: WONING,
    specificatiesPerMaatregel: { dakisolatie: { oppervlakteM2: 120 } },
  })
  resultaten.forEach((r) => assert.deepEqual(r.gekoppeldeGegevens, []))
})

test('vindRelevanteFiscaleBedrijfsmiddelen is alfabetisch gesorteerd op titel', () => {
  const resultaten = vindRelevanteFiscaleBedrijfsmiddelen({
    pand: ZAKELIJK_PAND,
    mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Dakisolatie vervangen' }, { measureName: 'Warmtepomp plaatsen' }] }],
  })
  const titels = resultaten.map((r) => r.bedrijfsmiddel.titel)
  assert.deepEqual(titels, [...titels].sort((a, b) => a.localeCompare(b)))
})
