import { test } from 'node:test'
import assert from 'node:assert/strict'
import { valideerNieuwPand, ZAKELIJKE_GEBRUIKSTYPES } from './pandValidatie.js'

test('valideerNieuwPand: alles leeg behalve gebruikstype is geldig (overige velden zijn optioneel)', () => {
  const fouten = valideerNieuwPand({ gebruikstype: 'kantoor', bouwjaar: '', vloeroppervlak: '', bouwlagen: '', gebruikers: '' })
  assert.deepEqual(fouten, {})
})

test('valideerNieuwPand: ontbrekend gebruikstype geeft een foutmelding', () => {
  const fouten = valideerNieuwPand({ gebruikstype: '' })
  assert.ok(fouten.gebruikstype)
})

test('valideerNieuwPand: onbekend gebruikstype (niet in ZAKELIJKE_GEBRUIKSTYPES) geeft een foutmelding', () => {
  const fouten = valideerNieuwPand({ gebruikstype: 'woonboot' })
  assert.ok(fouten.gebruikstype)
})

test('valideerNieuwPand: elk toegestaan gebruikstype is geldig', () => {
  ZAKELIJKE_GEBRUIKSTYPES.forEach((waarde) => {
    const fouten = valideerNieuwPand({ gebruikstype: waarde })
    assert.equal(fouten.gebruikstype, undefined, `${waarde} zou geldig moeten zijn`)
  })
})

test('valideerNieuwPand: ongeldig bouwjaar (niet-geheel getal, te laag, te hoog) geeft een foutmelding', () => {
  assert.ok(valideerNieuwPand({ gebruikstype: 'kantoor', bouwjaar: '12.5' }).bouwjaar)
  assert.ok(valideerNieuwPand({ gebruikstype: 'kantoor', bouwjaar: '1500' }).bouwjaar)
  assert.ok(valideerNieuwPand({ gebruikstype: 'kantoor', bouwjaar: '3000' }).bouwjaar)
  assert.equal(valideerNieuwPand({ gebruikstype: 'kantoor', bouwjaar: '2010' }).bouwjaar, undefined)
})

test('valideerNieuwPand: vloeroppervlak/bouwlagen moeten positief zijn, gebruikers mag 0 zijn', () => {
  assert.ok(valideerNieuwPand({ gebruikstype: 'kantoor', vloeroppervlak: '0' }).vloeroppervlak)
  assert.ok(valideerNieuwPand({ gebruikstype: 'kantoor', vloeroppervlak: '-5' }).vloeroppervlak)
  assert.ok(valideerNieuwPand({ gebruikstype: 'kantoor', bouwlagen: '0' }).bouwlagen)
  assert.equal(valideerNieuwPand({ gebruikstype: 'kantoor', gebruikers: '0' }).gebruikers, undefined)
  assert.ok(valideerNieuwPand({ gebruikstype: 'kantoor', gebruikers: '-1' }).gebruikers)
})

test('valideerNieuwPand: NaN/oneindig in numerieke velden wordt nooit stilzwijgend geaccepteerd', () => {
  assert.ok(valideerNieuwPand({ gebruikstype: 'kantoor', vloeroppervlak: 'abc' }).vloeroppervlak)
  assert.ok(valideerNieuwPand({ gebruikstype: 'kantoor', bouwjaar: 'abc' }).bouwjaar)
})
