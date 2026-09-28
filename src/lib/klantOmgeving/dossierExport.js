/**
 * Browser-native JSON-export van één volledig Dossier (werkfase Fase 12).
 * Zelfde patroon als lib/mjop/importExport.js#triggerJsonDownload: Blob +
 * synthetic <a download>, geen externe exportservice, geen betaalde opslag.
 *
 * Exporteert uitsluitend data die de aanroepende sessie al heeft opgehaald
 * (en dus al via RLS mocht zien) — deze module voegt geen eigen
 * autorisatie of extra dataverkeer toe, puur een client-side serialisatie
 * van al in memory aanwezige props.
 */
export function bouwDossierExportJson({ dossier, adviespunten = [], offertes = [] }) {
  const payload = {
    exportVersie: 1,
    geexporteerdOp: new Date().toISOString(),
    dossier: {
      dossierId: dossier.dossier_id,
      status: dossier.status,
      klant: dossier.klanten ?? null,
      contactpersoon: dossier.contactpersonen ?? null,
      pand: dossier.panden ?? null,
      pandSnapshot: dossier.pand_snapshot ?? null,
      mjopSnapshot: dossier.mjop_snapshot ?? null,
      energieSnapshot: dossier.energie_snapshot ?? null,
      aangemaaktOp: dossier.created_at,
    },
    adviespunten: adviespunten.map((a) => ({
      onderwerp: a.onderwerp,
      herkomst: a.herkomst,
      adviesStatus: a.advies_status,
      toelichting: a.toelichting,
      herbeoordelenBij: a.herbeoordelen_bij,
      herbeoordelenDatum: a.herbeoordelen_datum,
      signaalBevroren: a.signaal_bevroren,
    })),
    offertes: offertes.map((o) => ({
      offerteNummer: o.offerte_nummer,
      status: o.status,
      offerteDatum: o.offerte_datum,
      geldigTot: o.geldig_tot,
      verzondenOp: o.verzonden_op,
      pakketId: o.pakket_id,
      bedrag: o.bedrag,
      totaal: o.totaal,
    })),
  }
  return JSON.stringify(payload, null, 2)
}

function veiligeBestandsnaam(tekst) {
  return (
    String(tekst ?? '')
      .trim()
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'dossier'
  )
}

export function triggerDossierJsonDownload({ dossier, adviespunten, offertes }) {
  const json = bouwDossierExportJson({ dossier, adviespunten, offertes })
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const naam = veiligeBestandsnaam(dossier.panden?.omschrijving || dossier.klanten?.naam || dossier.dossier_id)
  a.href = url
  a.download = `dossier-${naam}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
