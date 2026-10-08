import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bepaalSubsidieSignalen,
  koppelRvoRegelingenAanDossier,
  sorteerSubsidieCheck,
  SUBSIDIE_CHECK_STATUSSEN,
} from './subsidieCheck.js'

test('bepaalSubsidieSignalen: neemt het pandtype op als signaal', () => {
  const signalen = bepaalSubsidieSignalen({ pand: { gebruikstype: 'Horeca' } })
  assert.ok(signalen.includes('horeca'))
})

test('bepaalSubsidieSignalen: neemt de meegegeven MJOP-/Energie-maatregelnamen op, hoofdletterongevoelig', () => {
  const signalen = bepaalSubsidieSignalen({ mjopMaatregelNamen: ['Dakisolatie'], energieMaatregelNamen: ['Zonnepanelen'] })
  assert.ok(signalen.includes('dakisolatie'))
  assert.ok(signalen.includes('zonnepanelen'))
})

test('bepaalSubsidieSignalen: geen data geeft een lege, geen crashende lijst', () => {
  assert.deepEqual(bepaalSubsidieSignalen({}), [])
  assert.deepEqual(bepaalSubsidieSignalen(), [])
})

test('koppelRvoRegelingenAanDossier: een regeling die al in dossier_subsidies staat (zelfde titel) is "vastgelegd"', () => {
  const rvoItems = [{ id: 'r1', titel: 'ISDE', intro: 'Investeringssubsidie duurzame energie' }]
  const bestaandeSubsidies = [{ regeling_naam: 'isde', status: 'ingediend' }]
  const [resultaat] = koppelRvoRegelingenAanDossier({ rvoItems, signalen: [], bestaandeSubsidies })
  assert.equal(resultaat.status, SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD)
  assert.equal(resultaat.bestaandeSubsidie.status, 'ingediend')
})

test('koppelRvoRegelingenAanDossier: tekst-match met een signaal geeft "mogelijk relevant"', () => {
  const rvoItems = [{ id: 'r1', titel: 'Zonnepanelen-subsidie', intro: 'Voor bedrijven die zonnepanelen plaatsen' }]
  const [resultaat] = koppelRvoRegelingenAanDossier({ rvoItems, signalen: ['zonnepanelen'] })
  assert.equal(resultaat.status, SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT)
})

test('koppelRvoRegelingenAanDossier: geen match en geen bestaande rij geeft "te beoordelen", nooit "niet relevant"', () => {
  const rvoItems = [{ id: 'r1', titel: 'Onbekende regeling', intro: 'Iets volledig anders' }]
  const [resultaat] = koppelRvoRegelingenAanDossier({ rvoItems, signalen: ['zonnepanelen'] })
  assert.equal(resultaat.status, SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN)
})

test('koppelRvoRegelingenAanDossier: signalen van 1-2 tekens geven nooit een match (voorkomt toevallige afkortingstreffers)', () => {
  const rvoItems = [{ id: 'r1', titel: 'NL-regeling voor mkb', intro: '' }]
  const [resultaat] = koppelRvoRegelingenAanDossier({ rvoItems, signalen: ['nl'] })
  assert.equal(resultaat.status, SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN)
})

test('koppelRvoRegelingenAanDossier: zoekt ook in sectoren/onderwerpen/doelgroepen/tags, niet alleen titel/intro', () => {
  const rvoItems = [{ id: 'r1', titel: 'Regeling X', intro: '', sectoren: [], onderwerpen: [], doelgroepen: ['horeca'], tags: [] }]
  const [resultaat] = koppelRvoRegelingenAanDossier({ rvoItems, signalen: ['horeca'] })
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
