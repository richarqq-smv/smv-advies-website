/**
 * Pakketgrenzen die uit packages.js volgen, hier als pure, testbare logica
 * — geen React, geen database. Gold's "Maximaal 3 geselecteerde
 * maatregelen" (src/data/packages.js) is de enige harde grens die
 * vandaag bestaat; deze module is bewust klein en breidt zich pas uit als
 * een volgend pakket-specifiek limiet nodig blijkt.
 *
 * Zelfde regel als de database-trigger `bewaak_adviespunten_pakketlimiet`
 * (0025_dossiers_pakket_id.sql) — hier vooraf zichtbaar in de UI zodat de
 * adviseur de melding ziet vóórdat de insert door de database geweigerd
 * wordt, niet in plaats daarvan (de trigger blijft de echte handhaving).
 */
export const GOLD_MAX_ADVIESPUNTEN = 3

/** Of er voor dit pakket nog een nieuw adviespunt bij mag — true voor elk pakket zonder grens (basis/premium/onbekend). */
export function magAdviespuntToevoegen({ pakketId, huidigAantal }) {
  if (pakketId !== 'gold') return true
  return (huidigAantal ?? 0) < GOLD_MAX_ADVIESPUNTEN
}

/** Leesbare toelichting bij een bereikte grens — null als er geen grens geldt/bereikt is. */
export function pakketLimietMelding({ pakketId, huidigAantal }) {
  if (magAdviespuntToevoegen({ pakketId, huidigAantal })) return null
  return `Dit Gold-dossier heeft het maximum van ${GOLD_MAX_ADVIESPUNTEN} maatregelen bereikt.`
}
