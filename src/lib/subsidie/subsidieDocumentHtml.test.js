import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwSubsidieDocumentHtml } from './subsidieDocumentHtml.js'
import { bouwSubsidieDocumentData } from './subsidieDocumentData.js'

const DOSSIER = {
  dossier_id: 'd-123',
  klanten: { bedrijfsnaam: 'Bakkerij De Korenbloem' },
  panden: { adres: 'Voorstraat 1', postcode: '3261 AB', plaats: 'Oud-Beijerland' },
}

function compleetData() {
  return bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    datum: '2026-10-15',
    adviseurNaam: 'Richard Schipper',
    specificatiesPerMaatregel: {
      dakisolatie: { oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
      gevelisolatie: { oppervlakteM2: 60, technischeWaarde: 3.5, meldcode: 'KA31000', isolatieBevestigd: 'ja' },
    },
  })
}

test('document is geldige HTML met titel en beide delen (wegwijzer + specifieke subsidies)', () => {
  const html = bouwSubsidieDocumentHtml(compleetData())
  assert.match(html, /^<!doctype html>/)
  assert.match(html, /Subsidieaanvraag — wegwijzer/)
  assert.match(html, /Specifieke subsidies voor dit dossier/)
})

test('correcte dossiergegevens staan in het document', () => {
  const html = bouwSubsidieDocumentHtml(compleetData())
  assert.match(html, /Bakkerij De Korenbloem/)
  assert.match(html, /Voorstraat 1, 3261 AB Oud-Beijerland/)
  assert.match(html, /d-123/)
  assert.match(html, />2026</)
})

test('correcte maatregelspecificaties: beide maatregelen met label/oppervlakte/Rd/meldcode staan erin', () => {
  const html = bouwSubsidieDocumentHtml(compleetData())
  assert.match(html, /Dakisolatie/)
  assert.match(html, /Gevelisolatie/)
  assert.match(html, /120 m²/)
  assert.match(html, /60 m²/)
  assert.match(html, /KA30327/)
  assert.match(html, /KA31000/)
})

test('correcte bron: klikbare RVO-link (<a href>) en broncontroledatum staan in het document', () => {
  const html = bouwSubsidieDocumentHtml(compleetData())
  assert.match(html, /<a href="https:\/\/www\.rvo\.nl\/[^"]*">/)
  // 2026-10-08 is vandaag (zie opdracht §20: nooit een toekomstige
  // controledatum) — bewust bijgewerkt in de uitbreidingsronde die ook de
  // eerdere, foutieve 2026-10-09 in isdeIsolatieRegels.js heeft herstelt.
  assert.match(html, /gecontroleerd op 2026-10-08/)
})

test('correcte aanvraaglink: "Open officiële aanvraagpagina" is een klikbare link', () => {
  const html = bouwSubsidieDocumentHtml(compleetData())
  assert.match(html, /<a href="https:\/\/www\.rvo\.nl\/[^"]*">Open officiële aanvraagpagina<\/a>/)
})

test('correcte datum: "Gegenereerd op" bevat de leesbare datum en de adviseursnaam', () => {
  const html = bouwSubsidieDocumentHtml(compleetData())
  assert.match(html, /Gegenereerd op 15 oktober 2026 door SMV Advies \(Richard Schipper\)/)
})

test('bevat de wettelijk/juridisch voorzichtige disclaimer-tekst (geen garantie), opdracht §63', () => {
  const html = bouwSubsidieDocumentHtml(compleetData())
  assert.match(html, /De uiteindelijke beoordeling en subsidievaststelling wordt uitgevoerd door de betreffende subsidieverstrekker/)
})

test('verzint geen bedrag als gegevens ontbreken: geen €-bedrag voor een maatregel zonder specificatie', () => {
  const data = bouwSubsidieDocumentData({ dossier: DOSSIER })
  const html = bouwSubsidieDocumentHtml(data)
  assert.match(html, /Nog niet berekenbaar/)
})

test('document bevat vloerisolatie/bodemisolatie en apparaatmaatregelen (uitbreidingsronde), elk met eigen tabel', () => {
  const data = bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    specificatiesPerMaatregel: {
      vloerisolatie: { oppervlakteM2: 30, technischeWaarde: 3.5, meldcode: 'KA18164', isolatieBevestigd: 'ja' },
      warmtepomp_hybride: { isolatieBevestigd: 'ja', meldcode: 'KA20994', bedrag: 1925, bronUrl: 'https://www.rvo.nl/meldcodes-warmtepompen/ka20994' },
    },
  })
  const html = bouwSubsidieDocumentHtml(data)
  assert.match(html, /Vloerisolatie/)
  assert.match(html, /Hybride warmtepomp/)
  assert.match(html, /KA20994/)
  assert.match(html, /€\s*1\.925,00/)
  assert.match(html, /<a href="https:\/\/www\.rvo\.nl\/meldcodes-warmtepompen\/ka20994">Open meldcodepagina<\/a>/)
})

test('document bevat een "Wat moet u nu doen?"-sectie met de dossierspecifieke actielijst', () => {
  const html = bouwSubsidieDocumentHtml(compleetData())
  assert.match(html, /Wat moet u nu doen\?/)
  assert.match(html, /<ol>/)
  assert.match(html, /Dien de aanvraag in via/)
})

test('document bevat een "Regionale\/lokale subsidie"-sectie, nooit "geen subsidie"', () => {
  const html = bouwSubsidieDocumentHtml(compleetData())
  assert.match(html, /Regionale\/lokale subsidie/)
  assert.match(html, /Lokale subsidiecontrole vereist/)
})

test('document bevat een expliciete sectie voor niet-geautomatiseerde categorieën (SVVE/SVOH/regionaal) — nooit stilzwijgend weggelaten, nooit "geen subsidie" (opdracht §9)', () => {
  const html = bouwSubsidieDocumentHtml(compleetData())
  assert.match(html, /Overige categorieën \(nog niet geautomatiseerd\)/)
  assert.match(html, /SVVE/)
  assert.match(html, /SVOH/)
  assert.equal(html.includes('Geen subsidie'), false)
})

test('escaped user-controlled tekst (klantnaam) om HTML-injectie te voorkomen', () => {
  const data = bouwSubsidieDocumentData({ dossier: { ...DOSSIER, klanten: { bedrijfsnaam: '<script>alert(1)</script>' } } })
  const html = bouwSubsidieDocumentHtml(data)
  assert.equal(html.includes('<script>alert(1)</script>'), false)
  assert.match(html, /&lt;script&gt;/)
})
