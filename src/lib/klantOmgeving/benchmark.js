/**
 * Pure benchmark-logica (projectplan "Klantwaarde-uitbreidingen", Fase 6
 * — #10, eerste toepassing van het Opties-paneel). Vergelijkt de
 * energiekosten per m² van één dossier met het gemiddelde van ANDERE
 * dossiers met bruikbare data — nooit het eigen dossier in het
 * gemiddelde meegerekend.
 *
 * Kosten per m² (i.p.v. kWh/m²) is bewust gekozen: `huidigeKosten` staat
 * al kant-en-klaar in `energie_snapshot.resultaat` (zie
 * bouwEnergieKostenOverzicht() in adviesrapport.js), geen eigen,
 * onbevestigde gas-naar-kWh-omrekenfactor nodig — "claim-gevoelige
 * teksten zijn altijd exact, nooit een schatting" geldt ook hier.
 *
 * Correctieronde (2026-10-19): de vergelijkingsgroep bestond uit ALLE
 * andere dossiers met bruikbare cijfers, zonder enig vergelijkbaarheids-
 * kenmerk — dat werd in de UI (DossierDetail.jsx) toch "gemiddelde van
 * vergelijkbare dossiers" genoemd, wat meer suggereert dan de berekening
 * waarmaakt (een kantoor werd zo tegen een bedrijfshal afgezet). De enige
 * structurele, al bestaande bouwkundige classificatie in de brondata is
 * `pand_snapshot.gebruikstype` (zie ZAKELIJKE_GEBRUIKSTYPES/
 * pandValidatie.js) — de vergelijkingsgroep wordt nu beperkt tot andere
 * dossiers met HETZELFDE gebruikstype. Geen enkele andere classificatie
 * wordt verzonnen; ontbreekt het eigen gebruikstype, dan is er geen
 * verdedigbare vergelijkingsgroep vast te stellen en blijft het resultaat
 * `null` (geen benchmark), net als bij elk ander ontbrekend gegeven hier.
 */
export const BENCHMARK_MINIMUM_VERGELIJKINGSGROEP = 3

function kostenPerM2(dossier) {
  const kosten = dossier?.energie_snapshot?.resultaat?.huidigeKosten
  const oppervlak = dossier?.pand_snapshot?.vloeroppervlak
  if (kosten == null || !oppervlak || oppervlak <= 0) return null
  return kosten / oppervlak
}

function gebruikstypeVan(dossier) {
  const waarde = dossier?.pand_snapshot?.gebruikstype
  return typeof waarde === 'string' && waarde.trim() ? waarde : null
}

/**
 * `alleDossiers` is de volledige lijst (elk dossier met zijn eigen
 * `energie_snapshot`/`pand_snapshot`). Geeft `null` terug als het eigen
 * dossier geen bruikbare data of geen bekend gebruikstype heeft, of als
 * er te weinig ANDERE dossiers met hetzelfde gebruikstype EN bruikbare
 * data zijn (< `BENCHMARK_MINIMUM_VERGELIJKINGSGROEP`) — nooit een
 * onbetrouwbaar of oneerlijk vergelijkbaar gemiddelde tonen.
 */
export function bouwBenchmark(dossierId, alleDossiers) {
  const eigenDossier = (alleDossiers ?? []).find((d) => d.dossier_id === dossierId)
  const eigenWaarde = eigenDossier ? kostenPerM2(eigenDossier) : null
  const eigenGebruikstype = eigenDossier ? gebruikstypeVan(eigenDossier) : null
  if (eigenWaarde == null || eigenGebruikstype == null) return null

  const anderenWaarden = (alleDossiers ?? [])
    .filter((d) => d.dossier_id !== dossierId && gebruikstypeVan(d) === eigenGebruikstype)
    .map(kostenPerM2)
    .filter((w) => w != null)

  if (anderenWaarden.length < BENCHMARK_MINIMUM_VERGELIJKINGSGROEP) return null

  const gemiddelde = anderenWaarden.reduce((som, w) => som + w, 0) / anderenWaarden.length

  return {
    eigenWaarde: Math.round(eigenWaarde),
    gemiddelde: Math.round(gemiddelde),
    aantalVergeleken: anderenWaarden.length,
    gebruikstype: eigenGebruikstype,
  }
}
