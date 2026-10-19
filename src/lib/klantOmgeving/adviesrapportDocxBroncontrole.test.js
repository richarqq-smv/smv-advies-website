import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole voor het grafiek-/roadmap-/prioriteitenblok in het
 * adviesrapport (projectplan "Klantwaarde-uitbreidingen", Fase 1 — #1/#2/3,
 * ronde 2026-10-19). adviesrapportDocx.js gebruikt DOMParser/XMLSerializer/
 * canvas — browser-only API's zonder jsdom in dit project (zie
 * CLAUDE.md-conventie), dus net als de rest van dit bestand hier bewust
 * statische bron-checks i.p.v. uitvoeren.
 */
const BRON = readFileSync('src/lib/klantOmgeving/adviesrapportDocx.js', 'utf8')

test('genereerAdviesrapportDocx: alle nieuwe vul-stappen worden aangeroepen, in logische volgorde (tabel → prioriteiten → roadmap → grafiek)', () => {
  const start = BRON.indexOf('export async function genereerAdviesrapportDocx')
  const functieDeel = BRON.slice(start, start + 3000)
  const iMaatregelen = functieDeel.indexOf('vulMaatregelenTabel(doc, data.maatregelen)')
  const iPrioriteiten = functieDeel.indexOf('voegPrioriteitenSamenvattingToe(doc, data.prioriteitenSamenvatting)')
  const iRoadmap = functieDeel.indexOf('vulRoadmap(doc, data.roadmap)')
  const iGrafiek = functieDeel.indexOf('tekenEnergieKostenGrafiek(data.energieOverzicht)')
  assert.ok(iMaatregelen > -1 && iPrioriteiten > -1 && iRoadmap > -1 && iGrafiek > -1)
  assert.ok(iMaatregelen < iPrioriteiten && iPrioriteiten < iRoadmap && iRoadmap < iGrafiek)
})

test('Het grafiekblok staat in een eigen try/catch en voegt bij falen een waarschuwing toe — mag het al-werkende rapport nooit laten crashen', () => {
  const start = BRON.indexOf('if (data.energieOverzicht) {')
  const blok = BRON.slice(start, start + 900)
  assert.match(blok, /try \{/)
  assert.match(blok, /\} catch \{/)
  assert.match(blok, /waarschuwingen\.push\(/)
})

test('vulRoadmap: zoekt de 3 vaste Roadmap-placeholders op hun letterlijke sjabloonprefix, vult nooit een lege regel zonder duidelijkheid', () => {
  assert.match(BRON, /–  Korte termijn \(0-1 jaar\): /)
  assert.match(BRON, /–  Middellange termijn \(1-5 jaar\): /)
  assert.match(BRON, /–  Lange termijn \(5\+ jaar, gekoppeld aan natuurlijke vervangmomenten\): /)
  assert.match(BRON, /ROADMAP_LEEG_TEKST = 'Geen maatregelen in dit tijdvak bekend op basis van de MJOP-gegevens\.'/)
  assert.match(BRON, /roadmap\[key\] \?\? ROADMAP_LEEG_TEKST/)
})

test('vulRoadmap: ontbreekt de Roadmap-sectie (Basis-sjabloon), dan gebeurt er niets — geen crash, geen foutmelding', () => {
  const start = BRON.indexOf('function vulRoadmap(doc, roadmap) {')
  const functieDeel = BRON.slice(start, start + 400)
  assert.match(functieDeel, /if \(!roadmap\) return/)
  assert.match(functieDeel, /if \(!p\) return/)
})

test('De grafiek wordt vlak vóór "2. Uitgangspunten van dit rapport" geplaatst — direct na de Samenvatting-sectie, in alle 3 sjablonen identiek', () => {
  assert.match(BRON, /find\(\(p\) => elementTekst\(p\)\.trim\(\) === '2\. Uitgangspunten van dit rapport'\)/)
})

test('voegPrioriteitenSamenvattingToe: plaatst de prioriteitenzin vóór de maatregelentabel, hergebruikt vindMaatregelenTabel (geen eigen tabel-zoeklogica)', () => {
  const start = BRON.indexOf('function voegPrioriteitenSamenvattingToe')
  const functieDeel = BRON.slice(start, start + 1200)
  assert.match(functieDeel, /vindMaatregelenTabel\(doc\)/)
  assert.match(functieDeel, /tabel\.parentNode\.insertBefore\(p, tabel\)/)
})

test('Afbeelding-relatie: de rId wordt altijd berekend (hoogste bestaande + 1), nooit een vast/hardcoded rId — voorkomt botsing met het bestaande logo (rId7)', () => {
  assert.match(BRON, /function vindVolgendeRelId\(relsXmlText\)/)
  assert.match(BRON, /Math\.max\(\.\.\.ids\)/)
  assert.doesNotMatch(BRON, /r:embed="rId9"/)
})

test('voegAfbeeldingToe: registreert de relationship én voegt het PNG-bestand toe aan de zip, raakt [Content_Types].xml bewust niet aan (al gedekt door de bestaande png-Default)', () => {
  const start = BRON.indexOf('async function voegAfbeeldingToe')
  const functieDeel = BRON.slice(start, start + 700)
  assert.match(functieDeel, /relationships\/image/)
  assert.match(functieDeel, /zip\.file\(`word\/\$\{mediaNaam\}`, pngBytes\)/)
  assert.doesNotMatch(functieDeel, /Content_Types/)
})

test('tekenEnergieKostenGrafiek: tekent uitsluitend met de al-berekende overzicht-cijfers, geen eigen herberekening van kosten/besparing/CO2', () => {
  const start = BRON.indexOf('async function tekenEnergieKostenGrafiek')
  const functieDeel = BRON.slice(start, start + 2200)
  assert.match(functieDeel, /overzicht\.huidigeKosten/)
  assert.match(functieDeel, /overzicht\.nieuweKosten/)
  assert.match(functieDeel, /overzicht\.co2PerJaar/)
  assert.doesNotMatch(functieDeel, /totaleBesparing|huidig\.gas|huidig\.elek/)
})

test('Imports: adviesrapport.js levert nu ook de prioriteiten-/energie-/roadmap-data aan de docx-generator', () => {
  assert.match(BRON, /import \{ bouwAdviesrapportData \} from '\.\/adviesrapport\.js'/)
})
