import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * TelefonischeAfspraakSectie.jsx (werkfase 2026-10-05) — klantgerichte
 * afspraakplanner op DossierDetail.jsx. Deze test bewaakt de privacy-/
 * securityprincipes uit de opdracht op broncodeniveau: het component mag
 * zelf nooit rechtstreeks de admin-only tabel `planning_afspraken`
 * bevragen, moet uitsluitend via de drie veilige RPC-wrappers in api.js
 * lopen, en mag nergens interne blokkade-/notitievelden of een eigen
 * `klant_id`/`status`/`type`-override aanbieden.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
}

test('TelefonischeAfspraakSectie.jsx: bevraagt planning_afspraken nooit rechtstreeks (uitsluitend via api.js-RPC-wrappers)', () => {
  const bron = lees('TelefonischeAfspraakSectie.jsx')
  assert.equal(/from\(['"]planning_afspraken['"]\)/.test(bron), false)
  assert.equal(/supabase\.rpc/.test(bron), false, 'moet via api.js lopen, niet rechtstreeks supabase.rpc aanroepen')
})

test('TelefonischeAfspraakSectie.jsx: gebruikt de drie verwachte, veilige functies uit api.js', () => {
  const bron = lees('TelefonischeAfspraakSectie.jsx')
  assert.match(bron, /getBeschikbareMomenten/)
  assert.match(bron, /getMijnTelefonischeAfspraak/)
  assert.match(bron, /boekTelefonischeAfspraak/)
})

test('TelefonischeAfspraakSectie.jsx: geeft nooit zelf klant_id/status/type/notitie mee aan de boekingsaanroep', () => {
  const bron = lees('TelefonischeAfspraakSectie.jsx')
  assert.equal(/klant_id|klantId\s*[:,]/.test(bron), false)
  assert.equal(/\bstatus\s*:\s*['"]gepland['"]/.test(bron), false)
  assert.equal(/\btype\s*:\s*['"]telefonisch_adviesgesprek['"]/.test(bron), false)
  assert.equal(/\bnotitie\b/.test(bron), false)
})

test('TelefonischeAfspraakSectie.jsx: toont nooit interne blokkade-/afspraakvelden (reden, onderwerp van anderen)', () => {
  const bron = lees('TelefonischeAfspraakSectie.jsx')
  assert.equal(/\bonderwerp\b/.test(bron), false)
  assert.equal(/\breden\b/i.test(bron), false)
})

test('TelefonischeAfspraakSectie.jsx: is uitsluitend zichtbaar voor een zakelijk pand (isZakelijkPand-gate)', () => {
  const bron = lees('TelefonischeAfspraakSectie.jsx')
  assert.match(bron, /isZakelijkPand/)
})

test('TelefonischeAfspraakSectie.jsx: communiceert telefonisch en de duur van ca. 20-30 minuten richting de klant', () => {
  const bron = lees('TelefonischeAfspraakSectie.jsx')
  assert.match(bron, /[Tt]elefonisch/)
  assert.match(bron, /20-30 minuten/)
})

test('TelefonischeAfspraakSectie.jsx: gebruikt de bestaande datum-helper (geen eigen Date-rekenwerk voor "vandaag")', () => {
  const bron = lees('TelefonischeAfspraakSectie.jsx')
  assert.match(bron, /datumNaarIso/)
  assert.equal(/new Date\(\)\.toISOString\(\)\.slice/.test(bron), false)
})

test('TelefonischeAfspraakSectie.jsx: datumkiezer heeft een ondergrens (geen datums in het verleden selecteerbaar)', () => {
  const bron = lees('TelefonischeAfspraakSectie.jsx')
  assert.match(bron, /min=\{datumNaarIso\(new Date\(\)\)\}/)
})

test('TelefonischeAfspraakSectie.jsx: toont een vriendelijke melding bij een mislukte boeking en herlaadt de beschikbaarheid', () => {
  const bron = lees('TelefonischeAfspraakSectie.jsx')
  assert.match(bron, /foutmelding/)
  assert.match(bron, /getBeschikbareMomenten\(datum\)\.then\(setMomenten\)/)
})

// --- Wiring op DossierDetail.jsx (src/pages/ zit buiten de npm test-glob,
// maar is hiervandaan gewoon leesbaar — zelfde precedent als
// klantArchiefBroncontrole.test.js dat AdminDossiers.jsx/Archief.jsx leest). ---

test('DossierDetail.jsx: rendert TelefonischeAfspraakSectie met dossierId en het gebruikstype van het gekoppelde pand', () => {
  const bron = lees('..', '..', 'pages', 'DossierDetail.jsx')
  assert.match(bron, /import \{ TelefonischeAfspraakSectie \} from '\.\.\/components\/klantOmgeving\/TelefonischeAfspraakSectie'/)
  assert.match(bron, /<TelefonischeAfspraakSectie dossierId=\{dossier\.dossier_id\} gebruikstype=\{dossier\.panden\?\.gebruikstype\} \/>/)
})

test('DossierDetail.jsx: toont de afspraaksectie aan zowel klant als admin (niet achter een isAdmin-gate verstopt)', () => {
  const bron = lees('..', '..', 'pages', 'DossierDetail.jsx')
  const regel = bron.split('\n').find((r) => r.includes('<TelefonischeAfspraakSectie'))
  assert.ok(regel)
  assert.equal(/isAdmin \?/.test(regel), false)
})
