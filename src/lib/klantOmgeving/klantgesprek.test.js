import { test } from 'node:test'
import assert from 'node:assert/strict'
import { vindVragenOmTeStellen, vindHerbeoordelingen, bepaalVolgendeActie } from './klantgesprek.js'

const VANDAAG = '2026-09-28'

test('vindVragenOmTeStellen: alleen onvoldoende_informatie', () => {
  const adviespunten = [
    { adviespunt_id: 'a', advies_status: 'onvoldoende_informatie' },
    { adviespunt_id: 'b', advies_status: 'nu_onderzoeken' },
    { adviespunt_id: 'c', advies_status: 'onvoldoende_informatie' },
  ]
  const vragen = vindVragenOmTeStellen(adviespunten)
  assert.deepEqual(vragen.map((a) => a.adviespunt_id), ['a', 'c'])
})

test('vindVragenOmTeStellen: lege lijst bij geen input', () => {
  assert.deepEqual(vindVragenOmTeStellen(), [])
})

test('vindHerbeoordelingen: alleen niet-lege herbeoordelen_bij', () => {
  const adviespunten = [
    { adviespunt_id: 'a', herbeoordelen_bij: 'Over twee jaar' },
    { adviespunt_id: 'b', herbeoordelen_bij: null },
    { adviespunt_id: 'c', herbeoordelen_bij: '' },
    { adviespunt_id: 'd', herbeoordelen_bij: '  ' },
    { adviespunt_id: 'e', herbeoordelen_bij: 'Bij vervanging cv-ketel' },
  ]
  const herbeoordelingen = vindHerbeoordelingen(adviespunten)
  assert.deepEqual(herbeoordelingen.map((a) => a.adviespunt_id), ['a', 'e'])
})

test('vindHerbeoordelingen (Fase 9): telt ook mee met alleen een structurele datum, zonder vrije tekst', () => {
  const adviespunten = [
    { adviespunt_id: 'a', herbeoordelen_bij: null, herbeoordelen_datum: '2027-01-15' },
    { adviespunt_id: 'b', herbeoordelen_bij: null, herbeoordelen_datum: null },
  ]
  const herbeoordelingen = vindHerbeoordelingen(adviespunten)
  assert.deepEqual(herbeoordelingen.map((a) => a.adviespunt_id), ['a'])
})

test('bepaalVolgendeActie: open signalen wegen zwaarder dan al het andere', () => {
  const actie = bepaalVolgendeActie({ dossierStatus: 'afgerond', openSignalenAantal: 3, aantalAdviespunten: 5, laatsteOfferte: { status: 'geaccepteerd' }, vandaag: VANDAAG })
  assert.match(actie, /^3 automatische signalen/)
})

test('bepaalVolgendeActie: enkelvoud bij precies 1 open signaal', () => {
  const actie = bepaalVolgendeActie({ dossierStatus: 'open', openSignalenAantal: 1, vandaag: VANDAAG })
  assert.match(actie, /^1 automatisch signaal beoordelen/)
})

test('bepaalVolgendeActie: open dossier zonder adviespunten -> advies opstellen', () => {
  assert.equal(bepaalVolgendeActie({ dossierStatus: 'open', openSignalenAantal: 0, aantalAdviespunten: 0, vandaag: VANDAAG }), 'Advies opstellen.')
})

test('bepaalVolgendeActie: open dossier met adviespunten -> bespreken/afronden', () => {
  assert.equal(
    bepaalVolgendeActie({ dossierStatus: 'open', openSignalenAantal: 0, aantalAdviespunten: 2, vandaag: VANDAAG }),
    'Advies bespreken met de klant en eventueel het dossier afronden.',
  )
})

test('bepaalVolgendeActie: afgerond zonder offerte -> offerte opstellen', () => {
  assert.equal(bepaalVolgendeActie({ dossierStatus: 'afgerond', openSignalenAantal: 0, laatsteOfferte: null, vandaag: VANDAAG }), 'Offerte opstellen.')
})

test('bepaalVolgendeActie: laatste offerte concept -> versturen', () => {
  assert.equal(
    bepaalVolgendeActie({ dossierStatus: 'afgerond', laatsteOfferte: { status: 'concept', geldig_tot: '2026-12-01' }, vandaag: VANDAAG }),
    'Offerte versturen.',
  )
})

test('bepaalVolgendeActie: laatste offerte verstuurd en nog geldig -> opvolgen', () => {
  assert.equal(
    bepaalVolgendeActie({ dossierStatus: 'afgerond', laatsteOfferte: { status: 'verstuurd', geldig_tot: '2026-12-01' }, vandaag: VANDAAG }),
    'Offerte opvolgen.',
  )
})

test('bepaalVolgendeActie: laatste offerte verstuurd en verlopen -> vervolgstap klant', () => {
  const actie = bepaalVolgendeActie({ dossierStatus: 'afgerond', laatsteOfferte: { status: 'verstuurd', geldig_tot: '2026-09-01' }, vandaag: VANDAAG })
  assert.match(actie, /verlopen/)
})

test('bepaalVolgendeActie: eindstatus offerte (geaccepteerd/afgewezen/geannuleerd) -> geen directe actie', () => {
  for (const status of ['geaccepteerd', 'afgewezen', 'geannuleerd']) {
    assert.equal(
      bepaalVolgendeActie({ dossierStatus: 'afgerond', laatsteOfferte: { status }, vandaag: VANDAAG }),
      'Geen directe actie — offerte is afgehandeld.',
    )
  }
})
