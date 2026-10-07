import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Statische bron-controles voor het contactformulier
 * (websiteoptimalisatieronde 2026-10-02). Pure validatielogica staat al
 * in contactForm.test.js — dit bestand controleert de bedrading: dat de
 * bestaande EmailJS-infrastructuur wordt hergebruikt (geen nieuw
 * backend-systeem), dat er geen valse "verzonden"-bevestiging kan
 * ontstaan, en dat de bestaande mailto/tel-knoppen op Contact.jsx intact
 * blijven staan naast het formulier.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function leesZonderComments(...relatievePad) {
  const volledigPad = path.join(HIER, ...relatievePad)
  const bron = readFileSync(volledigPad, 'utf8')
  return bron.replace(/\/\*[\s\S]*?\*\//g, '')
}

test('ContactForm.jsx: hergebruikt sendEmail() uit lib/emailjs.js, geen eigen fetch/XHR naar een nieuw backend', () => {
  const bron = leesZonderComments('ContactForm.jsx')
  assert.match(bron, /import \{ sendEmail, EMAILJS_TEMPLATE_CONTACT \} from '\.\.\/\.\.\/lib\/emailjs'/)
  assert.match(bron, /sendEmail\(EMAILJS_TEMPLATE_CONTACT, buildContactEmailParams\(values\)\)/)
  assert.equal(/fetch\(|XMLHttpRequest|axios/.test(bron), false)
})

test('ContactForm.jsx: valideert met de bestaande validateContactForm() vóór verzending, geen losse inline-validatie', () => {
  const bron = leesZonderComments('ContactForm.jsx')
  assert.match(bron, /import \{ validateContactForm, buildContactEmailParams \} from '\.\.\/\.\.\/lib\/contactForm'/)
  assert.match(bron, /validateContactForm\(values\)/)
})

test('ContactForm.jsx: toont een foutstatus bij een mislukte verzending, nooit automatisch een succesmelding', () => {
  const bron = leesZonderComments('ContactForm.jsx')
  assert.match(bron, /catch \{\s*setStatus\('error'\)/)
  assert.match(bron, /status === 'error'/)
  assert.match(bron, /Verzenden is niet gelukt/)
})

test('ContactForm.jsx: alleen naam, e-mail en vraag zijn verplicht (required) — bedrijfsnaam/plaats/telefoon niet', () => {
  const bron = leesZonderComments('ContactForm.jsx')
  const vereisteVelden = [...bron.matchAll(/id="(\w+)"[\s\S]{0,200}?required/g)].map((m) => m[1])
  assert.deepEqual(new Set(vereisteVelden), new Set(['naam', 'email', 'vraag']))
})

test('emailjs.js: EMAILJS_TEMPLATE_CONTACT wijst naar een echt EmailJS-template-ID, niet meer naar de ONTBREKEND_-placeholder', () => {
  const bron = leesZonderComments('..', '..', 'lib', 'emailjs.js')
  assert.match(bron, /export const EMAILJS_TEMPLATE_CONTACT = 'template_\w+'/)
})

test('ContactForm.jsx: voorkomt dubbel verzenden bij snel dubbelklikken via een ref-guard (niet alleen de disabled-knop)', () => {
  const bron = leesZonderComments('ContactForm.jsx')
  assert.match(bron, /const bezigRef = useRef\(false\)/)
  assert.match(bron, /if \(bezigRef\.current\) return/)
  assert.match(bron, /bezigRef\.current = true/)
  assert.match(bron, /finally \{\s*bezigRef\.current = false/)
})

test('contactForm.js: buildContactEmailParams() stuurt alleen expliciet benoemde velden naar EmailJS, geen JSON.stringify van het hele formulier', () => {
  const bron = leesZonderComments('..', '..', 'lib', 'contactForm.js')
  assert.equal(/JSON\.stringify/.test(bron), false)
  assert.match(bron, /verzonden_op: new Date\(\)\.toLocaleString\('nl-NL'\)/)
})

test('Contact.jsx: bestaande mailto/tel-knoppen blijven bestaan naast het formulier', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'Contact.jsx')
  assert.match(bron, /mailtoHref/)
  assert.match(bron, /COMPANY\.phoneHref/)
  assert.match(bron, /<ContactForm \/>/)
})
