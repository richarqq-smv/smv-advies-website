import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwBtwAangifteCsv } from './btwExport.js'

const overzicht = { omzetExclBtw: 1000, btwVerkoop: 210, kostenExclBtw: 100, btwAftrekbaar: 21, saldo: 189 }

test('bouwBtwAangifteCsv: bevat de controlewaarschuwing', () => {
  const csv = bouwBtwAangifteCsv({ periodeLabel: 'Q4 2026', overzicht, facturen: [], kosten: [] })
  assert.match(csv, /Controleer de bedragen voordat u de aangifte indient\./)
})

test('bouwBtwAangifteCsv: bevat de totalen uit het overzicht', () => {
  const csv = bouwBtwAangifteCsv({ periodeLabel: 'Q4 2026', overzicht, facturen: [], kosten: [] })
  assert.match(csv, /Omzet excl\. btw;1000/)
  assert.match(csv, /Saldo \(verschuldigd - aftrekbaar\);189/)
})

test('bouwBtwAangifteCsv: elke factuur en kostenpost staat als losse, traceerbare regel in het bestand', () => {
  const facturen = [{ factuurnummer: 'SMV-FAC-2026-0001', factuurdatum: '2026-10-01', status: 'verzonden', subtotaal_excl_btw: 500, btw_bedrag: 105, totaal_incl_btw: 605 }]
  const kosten = [{ datum: '2026-10-02', leverancier: 'Leverancier X', omschrijving: 'Kantoorartikelen', categorie: 'kantoor', bedrag_excl_btw: 50, btw_bedrag: 10.5, totaal_incl_btw: 60.5 }]
  const csv = bouwBtwAangifteCsv({ periodeLabel: 'Q4 2026', overzicht, facturen, kosten })
  assert.match(csv, /SMV-FAC-2026-0001;2026-10-01;verzonden;500;105;605/)
  assert.match(csv, /2026-10-02;Leverancier X;Kantoorartikelen;kantoor;50;10\.5;60\.5/)
})

test('bouwBtwAangifteCsv: escaped een puntkomma in een omschrijving veilig', () => {
  const kosten = [{ datum: '2026-10-02', leverancier: 'X', omschrijving: 'Inkt; papier', categorie: 'kantoor', bedrag_excl_btw: 10, btw_bedrag: 2.1, totaal_incl_btw: 12.1 }]
  const csv = bouwBtwAangifteCsv({ periodeLabel: 'Q4 2026', overzicht, facturen: [], kosten })
  assert.match(csv, /"Inkt; papier"/)
})
