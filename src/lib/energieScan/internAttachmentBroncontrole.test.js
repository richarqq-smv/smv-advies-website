import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Statische bron-controles (zelfde patroon als publiekeOutputBroncontrole.test.js
 * — geen jsdom/React-testrunner in dit project) voor de JSON-bijlage op de
 * interne Energie Indicatie-leadmail. De eigenlijke payload-/
 * bestandsnaamlogica wordt al apart getest in internAttachment.test.js;
 * dit bestand controleert alleen de bedrading (welke mail krijgt de
 * bijlage, welke niet) en de scope-grenzen uit de opdracht (geen
 * publieke downloadknop, bestaande flows ongewijzigd).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const HOOK = lees('..', '..', 'hooks', 'useEnergieScan.js')
const EMAILJS = lees('..', 'emailjs.js')
const RESULTS_VIEW = lees('..', '..', 'components', 'energieIndicatie', 'ResultsView.jsx')

test('useEnergieScan.js: de JSON-bijlage gaat alleen mee met de interne leadmail (EMAILJS_TEMPLATE_LEAD), niet met de klantbevestiging', () => {
  assert.match(HOOK, /sendEmailWithAttachment\(EMAILJS_TEMPLATE_LEAD, leadParams, bijlage\)/)
  // De regel die EMAILJS_TEMPLATE_CONFIRM verstuurt, gebruikt nog steeds de
  // gewone sendEmail() zonder bijlage-argument.
  const confirmRegel = HOOK.match(/sendEmail\(EMAILJS_TEMPLATE_CONFIRM,[^\n]*/)[0]
  assert.equal(/bijlage/.test(confirmRegel), false)
})

test('useEnergieScan.js: bij een bijlagefout valt het terug op de gewone sendEmail (de interne mail blijft altijd verstuurd)', () => {
  assert.match(HOOK, /sendEmailWithAttachment\([^)]*\)\.catch\(\(\) => sendEmail\(EMAILJS_TEMPLATE_LEAD, leadParams\)\.catch\(\(\) => \{\}\)\)/)
})

test('useEnergieScan.js: bouwt de JSON-payload uit internAttachment.js, geen losse/eigen implementatie', () => {
  assert.match(HOOK, /from ['"]\.\.\/lib\/energieScan\/internAttachment['"]/)
  assert.match(HOOK, /buildInterneJsonPayload\(state\.values, result\)/)
  assert.match(HOOK, /buildInterneJsonBestandsnaam\(state\.values\)/)
})

test('emailjs.js: sendEmailWithAttachment bouwt een <form>-element dat NOOIT aan de pagina wordt toegevoegd (geen appendChild op document/body)', () => {
  const fnBody = EMAILJS.match(/export async function sendEmailWithAttachment\([\s\S]*?\n\}/)[0]
  assert.match(fnBody, /document\.createElement\('form'\)/)
  assert.equal(/document\.body\.appendChild|document\.appendChild/.test(fnBody), false)
})

test('emailjs.js: sendEmailWithAttachment gebruikt sendForm (multipart), niet send (platte JSON) — alleen sendForm ondersteunt een File-bijlage', () => {
  const fnBody = EMAILJS.match(/export async function sendEmailWithAttachment\([\s\S]*?\n\}/)[0]
  assert.match(fnBody, /emailjs\.sendForm\(EMAILJS_SERVICE_ID, templateId, form, publicKey\)/)
})

test('emailjs.js: het attachment-veld krijgt een File-object (geen Blob zonder bestandsnaam, geen ruwe string)', () => {
  const fnBody = EMAILJS.match(/export async function sendEmailWithAttachment\([\s\S]*?\n\}/)[0]
  assert.match(fnBody, /new File\(\[bijlage\.inhoud\], bijlage\.bestandsnaam, \{ type: bijlage\.type/)
  assert.match(fnBody, /fileInput\.name = bijlage\.veldNaam/)
})

test('emailjs.js: bestaande sendEmail() (zonder bijlage) blijft ongewijzigd aanwezig — geen vervanging, alleen een nieuwe functie ernaast', () => {
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
