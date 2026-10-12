import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole (statische source-grep) voor de meerwerk-snelkeuze
 * (2026-10-12) — een dropdown met standaard meerwerkregels die bij keuze
 * zowel de omschrijving als een standaardprijs voorinvult, zonder het
 * bestaande vrije invoerveld te vervangen. Pure-logicatests voor
 * MEERWERK_STANDAARD_OPTIES staan in offerte.test.js.
 */
const offerteEditorJsx = readFileSync('src/components/klantOmgeving/OfferteEditor.jsx', 'utf8')

test('OfferteEditor.jsx: importeert MEERWERK_STANDAARD_OPTIES uit de centrale offerte-module (geen tweede, losse lijst)', () => {
  assert.match(offerteEditorJsx, /MEERWERK_STANDAARD_OPTIES/)
  assert.match(offerteEditorJsx, /from '\.\.\/\.\.\/lib\/klantOmgeving\/offerte'/)
})

test('OfferteEditor.jsx: de standaardoptie-dropdown vult bij keuze zowel omschrijving als eenheidsprijs tegelijk in', () => {
  const selectStart = offerteEditorJsx.indexOf('aria-label="Standaard meerwerkoptie kiezen"')
  const selectVoorDeel = offerteEditorJsx.slice(Math.max(0, selectStart - 400), selectStart)
  assert.match(selectVoorDeel, /omschrijving: optie\.omschrijving, eenheidsprijs: optie\.eenheidsprijs/)
})

test('OfferteEditor.jsx: het bestaande vrije invoerveld voor de omschrijving blijft ongewijzigd beschikbaar (niet vervangen door de dropdown)', () => {
  assert.match(offerteEditorJsx, /placeholder="Bijv\. extra locatiebezoek"/)
  assert.match(offerteEditorJsx, /onChange=\{\(e\) => onWijzig\(\{ \.\.\.regel, omschrijving: e\.target\.value \}\)\}/)
})
