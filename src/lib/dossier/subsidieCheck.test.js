import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bepaalSubsidieSignalen,
  koppelRvoRegelingenAanDossier,
  vindGekoppeldAdviespunt,
  sorteerSubsidieCheck,
  SUBSIDIE_CHECK_STATUSSEN,
} from './subsidieCheck.js'

test('bepaalSubsidieSignalen: neemt het pandtype op als signaal, met bron.type "pand"', () => {
  const signalen = bepaalSubsidieSignalen({ pand: { gebruikstype: 'Horeca' } })
  assert.equal(signalen.length, 1)
  assert.equal(signalen[0].tekst, 'horeca')
  assert.equal(signalen[0].bron.type, 'pand')
  assert.equal(signalen[0].bron.label, 'Horeca')
})

test('bepaalSubsidieSignalen: neemt MJOP-aanbevelingen op met behouden herkomst (componentId/componentLabel/measureName)', () => {
  const mjopInsights = [
    {
      componentId: 'dak-1',
      componentLabel: 'Dak',
      recommendations: [{ measureId: 'm1', measureName: 'Dakisolatie verbeteren' }],
    },
  ]
  const signalen = bepaalSubsidieSignalen({ mjopInsights })
  assert.equal(signalen.length, 1)
  assert.equal(signalen[0].tekst, 'dakisolatie verbeteren')
  assert.deepEqual(signalen[0].bron, { type: 'mjop', label: 'Dakisolatie verbeteren', componentId: 'dak-1', componentLabel: 'Dak' })
})

test('bepaalSubsidieSignalen: slaat MJOP-aanbevelingen zonder measureName over (bv. "onvoldoende_informatie"-insight)', () => {
  const mjopInsights = [{ componentId: 'c1', componentLabel: 'CV-ketel', recommendations: [{ measureId: null, measureName: null }] }]
  assert.deepEqual(bepaalSubsidieSignalen({ mjopInsights }), [])
})

test('bepaalSubsidieSignalen: neemt Energie-maatregelen op met behouden herkomst (energieMaatregelId)', () => {
  const energieInsights = [{ energieMaatregelId: 'Zonnepanelen', maatregelNaam: 'Zonnepanelen' }]
  const signalen = bepaalSubsidieSignalen({ energieInsights })
  assert.equal(signalen.length, 1)
  assert.equal(signalen[0].tekst, 'zonnepanelen')
  assert.deepEqual(signalen[0].bron, { type: 'energie', label: 'Zonnepanelen', energieMaatregelId: 'Zonnepanelen' })
})

test('bepaalSubsidieSignalen: geen data geeft een lege, geen crashende lijst', () => {
  assert.deepEqual(bepaalSubsidieSignalen({}), [])
  assert.deepEqual(bepaalSubsidieSignalen(), [])
})

test('koppelRvoRegelingenAanDossier: een regeling die al in dossier_subsidies staat (zelfde titel) is "vastgelegd" en heeft geen matchendeSignalen meer', () => {
  const rvoItems = [{ id: 'r1', titel: 'ISDE', intro: 'Investeringssubsidie duurzame energie' }]
  const bestaandeSubsidies = [{ regeling_naam: 'isde', status: 'ingediend' }]
  const [resultaat] = koppelRvoRegelingenAanDossier({ rvoItems, signalen: [], bestaandeSubsidies })
  assert.equal(resultaat.status, SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD)
  assert.equal(resultaat.bestaandeSubsidie.status, 'ingediend')
  assert.deepEqual(resultaat.matchendeSignalen, [])
})

test('koppelRvoRegelingenAanDossier: tekst-match met een signaal geeft "mogelijk relevant" én retourneert het concrete matchende signaal (traceerbaarheid)', () => {
  const rvoItems = [{ id: 'r1', titel: 'Zonnepanelen-subsidie', intro: 'Voor bedrijven die zonnepanelen plaatsen' }]
  const signaal = { tekst: 'zonnepanelen', bron: { type: 'energie', label: 'Zonnepanelen', energieMaatregelId: 'Zonnepanelen' } }
  const [resultaat] = koppelRvoRegelingenAanDossier({ rvoItems, signalen: [signaal] })
  assert.equal(resultaat.status, SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT)
  assert.equal(resultaat.matchendeSignalen.length, 1)
  assert.equal(resultaat.matchendeSignalen[0].bron.type, 'energie')
  assert.equal(resultaat.matchendeSignalen[0].bron.label, 'Zonnepanelen')
})

test('koppelRvoRegelingenAanDossier: geen match en geen bestaande rij geeft "te beoordelen" met lege matchendeSignalen, nooit "niet relevant"', () => {
  const rvoItems = [{ id: 'r1', titel: 'Onbekende regeling', intro: 'Iets volledig anders' }]
  const signaal = { tekst: 'zonnepanelen', bron: { type: 'energie', label: 'Zonnepanelen' } }
  const [resultaat] = koppelRvoRegelingenAanDossier({ rvoItems, signalen: [signaal] })
  assert.equal(resultaat.status, SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN)
  assert.deepEqual(resultaat.matchendeSignalen, [])
})

test('koppelRvoRegelingenAanDossier: signalen van 1-2 tekens geven nooit een match (voorkomt toevallige afkortingstreffers)', () => {
  const rvoItems = [{ id: 'r1', titel: 'NL-regeling voor mkb', intro: '' }]
  const signaal = { tekst: 'nl', bron: { type: 'pand', label: 'nl' } }
  const [resultaat] = koppelRvoRegelingenAanDossier({ rvoItems, signalen: [signaal] })
  assert.equal(resultaat.status, SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN)
})

test('koppelRvoRegelingenAanDossier: zoekt ook in sectoren/onderwerpen/doelgroepen/tags, niet alleen titel/intro', () => {
  const rvoItems = [{ id: 'r1', titel: 'Regeling X', intro: '', sectoren: [], onderwerpen: [], doelgroepen: ['horeca'], tags: [] }]
  const signaal = { tekst: 'horeca', bron: { type: 'pand', label: 'Horeca' } }
  const [resultaat] = koppelRvoRegelingenAanDossier({ rvoItems, signalen: [signaal] })
  assert.equal(resultaat.status, SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT)
})

test('koppelRvoRegelingenAanDossier: verzint nooit bedragen/percentages/eligibility-velden', () => {
  const rvoItems = [{ id: 'r1', titel: 'Regeling X', intro: '' }]
  const [resultaat] = koppelRvoRegelingenAanDossier({ rvoItems, signalen: [] })
  assert.equal('bedrag' in resultaat, false)
  assert.equal('percentage' in resultaat, false)
  assert.equal('eligibility' in resultaat, false)
  assert.equal('inAanmerking' in resultaat, false)
})

test('vindGekoppeldAdviespunt: Energie-signaal matcht exact op het bevroren maatregelNaam van een gepromoveerd adviespunt', () => {
  const signaal = { tekst: 'zonnepanelen', bron: { type: 'energie', label: 'Zonnepanelen', energieMaatregelId: 'Zonnepanelen' } }
  const adviespunten = [
    { adviespunt_id: 'a1', herkomst: 'automatisch', signaal_bevroren: { herkomst: 'energie', maatregelNaam: 'Zonnepanelen' } },
    { adviespunt_id: 'a2', herkomst: 'handmatig', signaal_bevroren: null },
  ]
  const gevonden = vindGekoppeldAdviespunt(signaal, adviespunten)
  assert.equal(gevonden?.adviespunt_id, 'a1')
})

test('vindGekoppeldAdviespunt: MJOP-signaal matcht alleen op componentId (bouwdeelniveau), niet op specifieke maatregel', () => {
  const signaal = { tekst: 'dakisolatie verbeteren', bron: { type: 'mjop', label: 'Dakisolatie verbeteren', componentId: 'dak-1', componentLabel: 'Dak' } }
  const adviespunten = [{ adviespunt_id: 'a1', herkomst: 'automatisch', signaal_bevroren: { componentId: 'dak-1', componentLabel: 'Dak' } }]
  const gevonden = vindGekoppeldAdviespunt(signaal, adviespunten)
  assert.equal(gevonden?.adviespunt_id, 'a1')
})

test('vindGekoppeldAdviespunt: geeft null als er geen overeenkomend adviespunt bestaat (geen gok, geen fictief adviespunt)', () => {
  const signaal = { tekst: 'dakisolatie verbeteren', bron: { type: 'mjop', label: 'Dakisolatie verbeteren', componentId: 'dak-1' } }
  assert.equal(vindGekoppeldAdviespunt(signaal, []), null)
  assert.equal(vindGekoppeldAdviespunt(signaal, [{ adviespunt_id: 'a1', herkomst: 'handmatig', signaal_bevroren: null }]), null)
})

test('vindGekoppeldAdviespunt: een pand-signaal heeft nooit een adviespunt-relatie', () => {
  const signaal = { tekst: 'horeca', bron: { type: 'pand', label: 'Horeca' } }
  const adviespunten = [{ adviespunt_id: 'a1', herkomst: 'automatisch', signaal_bevroren: { componentId: 'dak-1' } }]
  assert.equal(vindGekoppeldAdviespunt(signaal, adviespunten), null)
})

test('sorteerSubsidieCheck: vastgelegd eerst, dan mogelijk relevant, dan de rest; alfabetisch binnen elke groep', () => {
  const gekoppeld = [
    { item: { titel: 'Z-regeling' }, status: SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN },
    { item: { titel: 'B-regeling' }, status: SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT },
    { item: { titel: 'A-regeling' }, status: SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD },
    { item: { titel: 'A-regeling-2' }, status: SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT },
  ]
  const gesorteerd = sorteerSubsidieCheck(gekoppeld)
  assert.deepEqual(gesorteerd.map((g) => g.item.titel), ['A-regeling', 'A-regeling-2', 'B-regeling', 'Z-regeling'])
})
