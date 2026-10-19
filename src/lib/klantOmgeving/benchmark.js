/**
 * Pure benchmark-logica (projectplan "Klantwaarde-uitbreidingen", Fase 6
 * — #10, eerste toepassing van het Opties-paneel). Vergelijkt de
 * energiekosten per m² van één dossier met het gemiddelde van ALLE
 * ANDERE dossiers met bruikbare data — nooit het eigen dossier in het
 * gemiddelde meegerekend.
 *
 * Kosten per m² (i.p.v. kWh/m²) is bewust gekozen: `huidigeKosten` staat
 * al kant-en-klaar in `energie_snapshot.resultaat` (zie
 * bouwEnergieKostenOverzicht() in adviesrapport.js), geen eigen,
 * onbevestigde gas-naar-kWh-omrekenfactor nodig — "claim-gevoelige
 * teksten zijn altijd exact, nooit een schatting" geldt ook hier.
 */
export const BENCHMARK_MINIMUM_VERGELIJKINGSGROEP = 3

function kostenPerM2(dossier) {
  const kosten = dossier?.energie_snapshot?.resultaat?.huidigeKosten
  const oppervlak = dossier?.pand_snapshot?.vloeroppervlak
  if (kosten == null || !oppervlak || oppervlak <= 0) return null
  return kosten / oppervlak
}

/**
 * `alleDossiers` is de volledige lijst (elk dossier met zijn eigen
 * `energie_snapshot`/`pand_snapshot`). Geeft `null` terug als het eigen
 * dossier geen bruikbare data heeft, of als er te weinig ANDERE dossiers
 * met bruikbare data zijn (< `BENCHMARK_MINIMUM_VERGELIJKINGSGROEP`) —
 * nooit een onbetrouwbaar gemiddelde van 1-2 panden als representatief
 * tonen.
 */
export function bouwBenchmark(dossierId, alleDossiers) {
  const eigenDossier = (alleDossiers ?? []).find((d) => d.dossier_id === dossierId)
  const eigenWaarde = eigenDossier ? kostenPerM2(eigenDossier) : null
  if (eigenWaarde == null) return null

  const anderenWaarden = (alleDossiers ?? [])
    .filter((d) => d.dossier_id !== dossierId)
    .map(kostenPerM2)
    .filter((w) => w != null)

  if (anderenWaarden.length < BENCHMARK_MINIMUM_VERGELIJKINGSGROEP) return null

  const gemiddelde = anderenWaarden.reduce((som, w) => som + w, 0) / anderenWaarden.length

  return {
    eigenWaarde: Math.round(eigenWaarde),
    gemiddelde: Math.round(gemiddelde),
    aantalVergeleken: anderenWaarden.length,
  }
}
