import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwEnergieIndicatieLink, bouwEnergieUitnodigingTekst } from './energieUitnodiging.js'

test('bouwEnergieIndicatieLink: bouwt een absolute link met dossiercontext', () => {
  const link = bouwEnergieIndicatieLink('https://smv-advies.nl', 'd-1')
  assert.equal(link, 'https://smv-advies.nl/energie-indicatie?dossierId=d-1')
})

test('bouwEnergieUitnodigingTekst: bevat de link en een persoonlijke aanhef met klantnaam', () => {
  const tekst = bouwEnergieUitnodigingTekst({ klantNaam: 'Jan Jansen', link: 'https://smv-advies.nl/energie-indicatie?dossierId=d-1' })
  assert.match(tekst, /Beste Jan Jansen/)
  assert.match(tekst, /https:\/\/smv-advies\.nl\/energie-indicatie\?dossierId=d-1/)
})

test('bouwEnergieUitnodigingTekst: valt terug op een neutrale aanhef zonder klantnaam', () => {
  const tekst = bouwEnergieUitnodigingTekst({ klantNaam: null, link: 'https://smv-advies.nl/energie-indicatie?dossierId=d-1' })
  assert.match(tekst, /^Beste,/)
})

test('bouwEnergieUitnodigingTekst: bevat geen interne/berekende bedragen (geen scanresultaat nodig)', () => {
  const tekst = bouwEnergieUitnodigingTekst({ klantNaam: 'Jan', link: 'https://smv-advies.nl/energie-indicatie?dossierId=d-1' })
  assert.doesNotMatch(tekst, /besparing|investering|€/)
})
