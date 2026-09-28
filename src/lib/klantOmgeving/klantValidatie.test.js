import { test } from 'node:test'
import assert from 'node:assert/strict'
import { valideerKlantRegistratie } from './klantValidatie.js'

test('ontbrekende naam wordt geweigerd', () => {
  const fouten = valideerKlantRegistratie({ naam: '', email: 'a@b.nl', telefoon: '' })
  assert.equal(fouten.naam, 'Vul eerst uw naam in.')
})

test('alleen witruimte als naam telt als ontbrekend', () => {
  const fouten = valideerKlantRegistratie({ naam: '   ', email: 'a@b.nl', telefoon: '' })
  assert.equal(fouten.naam, 'Vul eerst uw naam in.')
})

test('geen e-mail en geen telefoon wordt geweigerd op beide velden', () => {
  const fouten = valideerKlantRegistratie({ naam: 'Jan', email: '', telefoon: '' })
  assert.ok(fouten.email)
  assert.ok(fouten.telefoon)
})

test('alleen e-mailadres is voldoende contactgegeven', () => {
  const fouten = valideerKlantRegistratie({ naam: 'Jan', email: 'jan@voorbeeld.nl', telefoon: '' })
  assert.equal(fouten.email, undefined)
  assert.equal(fouten.telefoon, undefined)
})

test('alleen telefoonnummer is voldoende contactgegeven', () => {
  const fouten = valideerKlantRegistratie({ naam: 'Jan', email: '', telefoon: '0612345678' })
  assert.equal(fouten.email, undefined)
  assert.equal(fouten.telefoon, undefined)
})

test('complete gegevens worden volledig geaccepteerd', () => {
  const fouten = valideerKlantRegistratie({ naam: 'Jan Jansen', email: 'jan@voorbeeld.nl', telefoon: '0612345678' })
  assert.deepEqual(fouten, {})
})

test('ontbrekende waarden geven nooit een crash (undefined invoer)', () => {
  const fouten = valideerKlantRegistratie({ naam: undefined, email: undefined, telefoon: undefined })
  assert.ok(fouten.naam)
  assert.ok(fouten.email)
  assert.ok(fouten.telefoon)
})
