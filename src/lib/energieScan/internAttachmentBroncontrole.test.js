import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Statische bron-controles (zelfde patroon als publiekeOutputBroncontrole.test.js
 * — geen jsdom/React-testrunner in dit project) voor de JSON-kopie op de
 * interne Energie Indicatie-leadmail. EmailJS' dynamische bestandsbijlagen
 * (sendForm + File) bleken een betaald-abonnement-feature ("Subscription
 * Limitation" bij het instellen), dus dit is teruggebracht naar platte
 * tekst in een extra merge-veld op de bestaande sendEmail() — geen
 * sendForm, geen File/DataTransfer, geen formulierbouw meer nodig.
 * De eigenlijke payload-logica wordt al apart getest in
 * internAttachment.test.js; dit bestand controleert alleen de bedrading
 * (welke mail krijgt het veld, welke niet) en de scope-grenzen uit de
 * opdracht (geen publieke downloadknop, bestaande flows ongewijzigd).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const HOOK = lees('..', '..', 'hooks', 'useEnergieScan.js')
const EMAILJS = lees('..', 'emailjs.js')
const RESULTS_VIEW = lees('..', '..', 'components', 'energieIndicatie', 'ResultsView.jsx')

test('useEnergieScan.js: de JSON-tekst gaat alleen mee in de interne leadmail (leadParams), niet in de klantbevestiging (confirmParams)', () => {
  assert.match(HOOK, /leadParams\[ENERGIE_INDICATIE_JSON_PARAM\] = JSON\.stringify\(buildInterneJsonPayload\(state\.values, result\), null, 2\)/)
  assert.equal(/confirmParams\[ENERGIE_INDICATIE_JSON_PARAM\]/.test(HOOK), false)
})

test('useEnergieScan.js: verstuurt de interne leadmail nog steeds via de gewone, bestaande sendEmail() — geen sendForm/attachment-pad meer', () => {
  assert.match(HOOK, /sendEmail\(EMAILJS_TEMPLATE_LEAD, leadParams\)\.catch\(\(\) => \{\}\)/)
  assert.equal(/sendEmailWithAttachment|sendForm/.test(HOOK), false)
})

test('useEnergieScan.js: bouwt de JSON-payload uit internAttachment.js, geen losse/eigen implementatie', () => {
  assert.match(HOOK, /from ['"]\.\.\/lib\/energieScan\/internAttachment['"]/)
  assert.match(HOOK, /buildInterneJsonPayload\(state\.values, result\)/)
})

test('emailjs.js: geen sendForm/File/DataTransfer-code meer (betaalfunctie, niet beschikbaar op dit EmailJS-plan)', () => {
  assert.equal(/sendEmailWithAttachment|sendForm|DataTransfer|new File\(/.test(EMAILJS), false)
})

test('emailjs.js: bestaande sendEmail() blijft ongewijzigd aanwezig', () => {
  assert.match(EMAILJS, /export async function sendEmail\(templateId, params, publicKey\) \{/)
})

test('ResultsView.jsx: geen publieke JSON-downloadknop — alleen print/PDF en "Opnieuw invullen" blijven bestaan', () => {
  assert.equal(/\.json/i.test(RESULTS_VIEW), false)
  assert.equal(/download.*json|json.*download/i.test(RESULTS_VIEW), false)
  assert.match(RESULTS_VIEW, /Download als PDF/)
  assert.match(RESULTS_VIEW, /Opnieuw invullen/)
})

test('ResultsView.jsx: de bestaande hot-lead/dossierkoppeling (EnergieDossierKoppeling) blijft ongewijzigd aanwezig', () => {
  assert.match(RESULTS_VIEW, /<EnergieDossierKoppeling/)
})
