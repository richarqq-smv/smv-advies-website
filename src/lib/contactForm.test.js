import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateContactForm, buildContactEmailParams } from './contactForm.js'

test('validateContactForm: lege waarden geven fouten voor naam, e-mail en vraag', () => {
  const errors = validateContactForm({ naam: '', email: '', vraag: '' })
  assert.equal(errors.naam, 'Vul uw naam in.')
  assert.equal(errors.email, 'Vul een geldig e-mailadres in.')
  assert.equal(errors.vraag, 'Vul uw vraag in.')
})

test('validateContactForm: ongeldig e-mailadres geeft een fout', () => {
  const errors = validateContactForm({ naam: 'Jan', email: 'niet-een-email', vraag: 'Een vraag' })
  assert.equal(errors.email, 'Vul een geldig e-mailadres in.')
})

test('validateContactForm: geldige minimale invoer geeft geen fouten', () => {
  const errors = validateContactForm({ naam: 'Jan', email: 'jan@bedrijf.nl', vraag: 'Een vraag over mijn pand.' })
  assert.deepEqual(errors, {})
})

test('validateContactForm: bedrijfsnaam, plaats en telefoon zijn niet verplicht', () => {
  const errors = validateContactForm({
    naam: 'Jan',
    email: 'jan@bedrijf.nl',
    vraag: 'Een vraag.',
    bedrijfsnaam: '',
    plaats: '',
    telefoon: '',
  })
  assert.deepEqual(errors, {})
})

test('validateContactForm: alleen-witruimte telt als leeg', () => {
  const errors = validateContactForm({ naam: '   ', email: 'jan@bedrijf.nl', vraag: '   ' })
  assert.equal(errors.naam, 'Vul uw naam in.')
  assert.equal(errors.vraag, 'Vul uw vraag in.')
})

test('buildContactEmailParams: trimt verplichte velden en zet lege optionele velden op een leesbaar streepje', () => {
  const params = buildContactEmailParams({ naam: '  Jan  ', email: ' jan@bedrijf.nl ', vraag: ' Een vraag. ' })
  const { verzonden_op, ...rest } = params
  assert.deepEqual(rest, {
    naam: 'Jan',
    bedrijfsnaam: '-',
    plaats: '-',
    email: 'jan@bedrijf.nl',
    telefoon: '-',
    vraag: 'Een vraag.',
  })
  assert.equal(typeof verzonden_op, 'string')
  assert.ok(verzonden_op.length > 0)
})

test('buildContactEmailParams: verzonden_op is een leesbare datum/tijd-string, geen ruwe timestamp', () => {
  const params = buildContactEmailParams({ naam: 'Jan', email: 'jan@bedrijf.nl', vraag: 'Een vraag.' })
  assert.match(params.verzonden_op, /\d{1,4}.\d{1,2}.\d{1,4},?\s+\d{1,2}:\d{2}/)
})

test('buildContactEmailParams: gevulde optionele velden blijven staan, getrimd', () => {
  const params = buildContactEmailParams({
    naam: 'Jan',
    bedrijfsnaam: ' Jansen BV ',
    plaats: ' Oud-Beijerland ',
    email: 'jan@bedrijf.nl',
    telefoon: ' 06 12 34 56 78 ',
    vraag: 'Een vraag.',
  })
  assert.equal(params.bedrijfsnaam, 'Jansen BV')
  assert.equal(params.plaats, 'Oud-Beijerland')
  assert.equal(params.telefoon, '06 12 34 56 78')
})
