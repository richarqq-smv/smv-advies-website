/**
 * Pure optelling voor de dashboardkaart "Totaal tot nu toe" in het
 * klantaccount (projectplan "Klantwaarde-uitbreidingen", Fase 2 — #12,
 * ronde 2026-10-19). Hergebruikt bewust exact dezelfde, al-berekende
 * energiekosten/CO₂-cijfers als het adviesrapport (Fase 1, #1) —
 * `bouwEnergieKostenOverzicht()` uit adviesrapport.js — en telt die simpelweg
 * op over alle dossiers van de klant. Geen nieuwe berekening, geen eigen
 * databron, geen schatting voor een dossier zonder Energie-indicatie.
 */
import { bouwEnergieKostenOverzicht } from './adviesrapport.js'

/**
 * `dossiers` is de lijst zoals `listDossiersVoorKlant()` teruggeeft (elk
 * dossier bevat zijn eigen `energie_snapshot`). Een dossier zonder (nog)
 * uitgevoerde Energie-indicatie draagt simpelweg niets bij aan de som —
 * hij wordt niet overgeslagen met een foutmelding, en ook niet met een
 * geschatte waarde meegeteld.
 *
 * Geeft `null` terug als geen enkel dossier bijdraagt, zodat de kaart in
 * de UI dan helemaal niet getoond wordt (consistent met hoe het
 * grafiekblok in het adviesrapport zich gedraagt bij ontbrekende data).
 */
export function bouwKlantTotalen(dossiers) {
  const overzichten = (dossiers ?? [])
    .map((d) => bouwEnergieKostenOverzicht(d.energie_snapshot))
    .filter(Boolean)

  if (overzichten.length === 0) return null

  const besparingPerJaar = overzichten.reduce((som, o) => som + o.besparingPerJaar, 0)
  const co2Overzichten = overzichten.filter((o) => o.co2PerJaar != null)
  const co2PerJaar = co2Overzichten.length > 0 ? co2Overzichten.reduce((som, o) => som + o.co2PerJaar, 0) : null

  return {
    besparingPerJaar,
    co2PerJaar,
    aantalDossiers: overzichten.length,
  }
}
