/**
 * De bewuste relatie tussen een Klant en een Pand — het resultaat van
 * Richards actie "Koppel aan deze klant" ("Pand naar Klant naar Dossier",
 * ontwerpdocument hoofdstuk 6). Bewust géén veld op Pand (geen
 * `klantId`) en géén veld op Klant (geen `pandIds[]`): een Pand kan in de
 * tijd bij verschillende Klanten horen, en die geschiedenis mag nooit
 * verdwijnen doordat een enkel veld wordt overschreven. Een
 * KlantPandRelatie is daarom een eigen, klein record — eenmaal aangemaakt,
 * nooit overschreven of verwijderd door een latere koppeling.
 *
 * Bewust geen `status`/`vanaf`/`tot`-velden: omdat relaties nooit worden
 * overschreven (een nieuwe koppeling aan een andere Klant maakt een nieuwe,
 * aparte relatie aan, zie koppelKlantAanPand hieronder), volstaat het loutere
 * bestaan van een relatie-record al om de geschiedenis vast te leggen. Een
 * administratief actief/inactief-systeem is voor deze stap niet nodig.
 */
import { generateId } from './id.js'
import { saveKlantPandRelatie, loadAllKlantPandRelaties } from './storage.js'

export function createKlantPandRelatie({ klantId, pandId }) {
  if (!klantId) throw new Error('createKlantPandRelatie vereist een klantId.')
  if (!pandId) throw new Error('createKlantPandRelatie vereist een pandId.')
  return {
    relatieId: generateId(),
    klantId,
    pandId,
    aangemaaktOp: new Date().toISOString(),
  }
}

/** Geeft de bestaande relatie tussen deze Klant en dit Pand terug, of `null`. */
export function findKlantPandRelatie(klantId, pandId) {
  return loadAllKlantPandRelaties().find((r) => r.klantId === klantId && r.pandId === pandId) ?? null
}

/**
 * Koppelt een Klant bewust aan een Pand. Bestaat de koppeling al (dezelfde
 * Klant, hetzelfde Pand), dan wordt die bestaande relatie teruggegeven —
 * nooit een tweede, identieke koppeling. Dit maakt de actie ook veilig om
 * te herhalen (bijv. na een mislukte vorige poging): opnieuw aanroepen
 * maakt nooit een duplicaat.
 */
export function koppelKlantAanPand(klant, pand) {
  if (!klant?.klantId) throw new Error('koppelKlantAanPand vereist een Klant met klantId.')
  if (!pand?.pandId) throw new Error('koppelKlantAanPand vereist een Pand met pandId.')

  const bestaande = findKlantPandRelatie(klant.klantId, pand.pandId)
  if (bestaande) return bestaande

  const relatie = createKlantPandRelatie({ klantId: klant.klantId, pandId: pand.pandId })
  if (!saveKlantPandRelatie(relatie)) {
    throw new Error('De koppeling tussen Klant en Pand kon niet worden opgeslagen.')
  }
  return relatie
}
