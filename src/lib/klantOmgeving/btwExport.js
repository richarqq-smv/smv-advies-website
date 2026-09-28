/**
 * CSV-export van een BTW-overzicht ("BTW-aangifte voorbereiden", opdracht
 * sectie 13) — zelfde Blob + synthetic <a download>-patroon als
 * dossierExport.js/lib/mjop/importExport.js#triggerJsonDownload, geen
 * externe exportservice. Uitdrukkelijk GEEN aangifte bij de
 * Belastingdienst en geen claim daarvan: dit is uitsluitend een
 * exportbestand voor de eigen administratie/boekhouder, met elke
 * onderliggende factuur/kostenpost traceerbaar terug te vinden (nooit
 * alleen het eindtotaal, zie opdracht sectie 12).
 */
function csvVeld(waarde) {
  const tekst = String(waarde ?? '')
  return /[";\n]/.test(tekst) ? `"${tekst.replace(/"/g, '""')}"` : tekst
}

function csvRegel(velden) {
  return velden.map(csvVeld).join(';')
}

export function bouwBtwAangifteCsv({ periodeLabel, overzicht, facturen = [], kosten = [] }) {
  const regels = [
    csvRegel([`BTW-overzicht ${periodeLabel}`]),
    csvRegel(['Controleer de bedragen voordat u de aangifte indient.']),
    '',
    csvRegel(['Omzet excl. btw', overzicht.omzetExclBtw]),
    csvRegel(['Btw verkoop (verschuldigd)', overzicht.btwVerkoop]),
    csvRegel(['Kosten excl. btw', overzicht.kostenExclBtw]),
    csvRegel(['Btw aftrekbaar', overzicht.btwAftrekbaar]),
    csvRegel(['Saldo (verschuldigd - aftrekbaar)', overzicht.saldo]),
    '',
    csvRegel(['Omzet — facturen']),
    csvRegel(['Factuurnummer', 'Factuurdatum', 'Status', 'Subtotaal excl. btw', 'Btw-bedrag', 'Totaal incl. btw']),
    ...facturen.map((f) => csvRegel([f.factuurnummer, f.factuurdatum, f.status, f.subtotaal_excl_btw, f.btw_bedrag, f.totaal_incl_btw])),
    '',
    csvRegel(['Kosten']),
    csvRegel(['Datum', 'Leverancier', 'Omschrijving', 'Categorie', 'Bedrag excl. btw', 'Btw-bedrag', 'Totaal incl. btw']),
    ...kosten.map((k) => csvRegel([k.datum, k.leverancier, k.omschrijving, k.categorie, k.bedrag_excl_btw, k.btw_bedrag, k.totaal_incl_btw])),
  ]
  return regels.join('\r\n')
}

function veiligeBestandsnaam(tekst) {
  return (
    String(tekst ?? '')
      .trim()
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'btw-overzicht'
  )
}

export function triggerBtwAangifteCsvDownload({ periodeLabel, overzicht, facturen, kosten }) {
  const csv = bouwBtwAangifteCsv({ periodeLabel, overzicht, facturen, kosten })
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `btw-overzicht-${veiligeBestandsnaam(periodeLabel)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
