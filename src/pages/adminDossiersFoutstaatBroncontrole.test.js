import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Health-check 2026-10-15: AdminDossiers.jsx had geen catch/foutstaat op
 * laadAlles(), in tegenstelling tot zijn broertjes AdminOffertes.jsx en
 * AdminFacturen.jsx — bij een mislukte fetch (RLS-fout, netwerkstoring)
 * bleef de pagina stilletjes "Nog geen dossiers." tonen, niet te
 * onderscheiden van een echt lege adminomgeving. Statische broncontrole
 * (zelfde patroon als elders in dit project), geen jsdom/React-render.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))
const ADMIN_DOSSIERS = readFileSync(path.join(HIER, 'AdminDossiers.jsx'), 'utf8')

test('AdminDossiers.jsx: laadAlles() heeft een catch-blok dat een foutstaat zet', () => {
  const fnBody = ADMIN_DOSSIERS.match(/async function laadAlles\(\) \{[\s\S]*?\n  \}/)[0]
  assert.match(fnBody, /catch[\s\S]*setFout\(/)
})

test('AdminDossiers.jsx: toont een role="alert"-foutmelding, zelfde patroon als AdminOffertes.jsx', () => {
  assert.match(ADMIN_DOSSIERS, /fout \? \(\s*<p role="alert"/)
})

test('AdminDossiers.jsx: fout wordt teruggezet naar null bij elke nieuwe laadpoging (geen hangende oude foutmelding)', () => {
  const fnBody = ADMIN_DOSSIERS.match(/async function laadAlles\(\) \{[\s\S]*?\n  \}/)[0]
  assert.match(fnBody, /setFout\(null\)/)
})
