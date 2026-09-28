/**
 * Browser-native CSV-export (werkfase Fase 12). Zelfde Blob-downloadpatroon
 * als dossierExport.js/lib/mjop/importExport.js — geen externe service.
 * RFC4180-achtige escaping: een veld met komma, aanhalingsteken of
 * regeleinde wordt in dubbele aanhalingstekens gezet, met verdubbelde
 * interne aanhalingstekens.
 */
function csvVeld(waarde) {
  const tekst = waarde === null || waarde === undefined ? '' : String(waarde)
  if (/[",\n]/.test(tekst)) {
    return `"${tekst.replace(/"/g, '""')}"`
  }
  return tekst
}

/** Bouwt CSV-tekst uit een array kolomdefinities (`{ header, waarde(rij) }`) en rijen. */
export function bouwCsv(kolommen, rijen) {
  const regels = [kolommen.map((k) => csvVeld(k.header)).join(',')]
  for (const rij of rijen) {
    regels.push(kolommen.map((k) => csvVeld(k.waarde(rij))).join(','))
  }
  return regels.join('\r\n') + '\r\n'
}

/** Dossiers-overzicht (werkfase Fase 12) — klant/pand/status/aantal adviespunten, voor adminListDossiers()-rijen. */
export function bouwDossiersCsv(dossiers = []) {
  return bouwCsv(
    [
      { header: 'Klant', waarde: (d) => d.klanten?.naam || d.klanten?.bedrijfsnaam || '' },
      { header: 'Pand', waarde: (d) => d.panden?.omschrijving || d.panden?.adres || '' },
      { header: 'Status', waarde: (d) => d.status },
      { header: 'Aantal adviespunten', waarde: (d) => d.adviespunten?.[0]?.count ?? 0 },
      { header: 'Aangemaakt op', waarde: (d) => (d.created_at ? d.created_at.slice(0, 10) : '') },
    ],
    dossiers,
  )
}

export function triggerCsvDownload(csvText, bestandsnaam) {
  const blob = new Blob(['﻿' + csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = bestandsnaam
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
