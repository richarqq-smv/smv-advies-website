import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Statische bron-controles (zelfde patroon als
 * energieScan/publiekeOutputBroncontrole.test.js): er is geen component-
 * rendertest-infrastructuur in dit project (geen jsdom/
 * @testing-library/react), dus dit test de brontekst van de betrokken
 * .jsx-bestanden i.p.v. het gerenderde resultaat. Comments worden eerst
 * gestript zodat een documentatiezin die toevallig een term noemt niet per
 * ongeluk de test laat slagen/falen om de verkeerde reden.
 *
 * Dekt de responsiviteitsronde (2026-10-01): de opname-stapnavigatie mag
 * geen horizontale scroll meer gebruiken, en de laatste stap moet
 * "Afronden" tonen i.p.v. "Volgende" en na afronden naar het dossier
 * teruggaan.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function leesZonderComments(...relatievePad) {
  const volledigPad = path.join(HIER, ...relatievePad)
  const bron = readFileSync(volledigPad, 'utf8')
  return bron.replace(/\/\*[\s\S]*?\*\//g, '')
}

// --- OpnameStapper.jsx: compacte stapnavigatie -----------------------------

test('OpnameStapper.jsx: gebruikt geen horizontaal scrollende rij meer (overflow-x-auto)', () => {
  const bron = leesZonderComments('..', '..', 'components', 'klantOmgeving', 'opname', 'OpnameStapper.jsx')
  assert.equal(/overflow-x-auto/.test(bron), false)
})

test('OpnameStapper.jsx: gebruikt een vaste grid-cols-4 die altijd binnen de paginabreedte past', () => {
  const bron = leesZonderComments('..', '..', 'components', 'klantOmgeving', 'opname', 'OpnameStapper.jsx')
  assert.match(bron, /grid-cols-4/)
  assert.equal(/whitespace-nowrap/.test(bron), false)
})

// --- AdminOpname.jsx: Afronden i.p.v. Volgende op de laatste stap ---------

test('AdminOpname.jsx: toont "Afronden" op de laatste stap i.p.v. "Volgende"', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'AdminOpname.jsx')
  assert.match(bron, /isLaatsteStap/)
  assert.match(bron, /Afronden/)
})

test('AdminOpname.jsx: roept updateOpnameStatus met \'afgerond\' aan en navigeert daarna naar het dossier', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'AdminOpname.jsx')
  assert.match(bron, /updateOpnameStatus\(opnameId, ['"]afgerond['"]\)/)
  assert.match(bron, /navigate\(ROUTES\.adminDossierDetail\(dossierId\)\)/)
})

test('AdminOpname.jsx: de Afronden-knop is uitgeschakeld zolang de checklist niet compleet is', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'AdminOpname.jsx')
  assert.match(bron, /disabled=\{afrondenBezig \|\| !checklistVoortgang\.compleet\}/)
})

// --- OpnameAfrondenStap.jsx: geen dubbele Afronden-knop meer ---------------

test('OpnameAfrondenStap.jsx: heeft geen eigen "Opname afronden"-knop meer (voorkomt dubbele submit-actie)', () => {
  const bron = leesZonderComments('..', '..', 'components', 'klantOmgeving', 'opname', 'OpnameAfrondenStap.jsx')
  assert.equal(/Opname afronden/.test(bron), false)
})

test('OpnameAfrondenStap.jsx: Heropenen-knop blijft bestaan voor een al afgeronde opname', () => {
  const bron = leesZonderComments('..', '..', 'components', 'klantOmgeving', 'opname', 'OpnameAfrondenStap.jsx')
  assert.match(bron, /Opname heropenen/)
  assert.match(bron, /updateOpnameStatus\(opname\.opname_id, ['"]opgeslagen['"]\)/)
})
