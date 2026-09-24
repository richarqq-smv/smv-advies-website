/**
 * De bewuste actie "Adviesdossier openen" — de tweede stap na "Koppel aan
 * deze klant" (klantPandRelatie.js). Hergebruikt uitsluitend bestaande
 * functies (createDossier, saveDossier, loadMjopSnapshotForPand); geen
 * tweede mapping- of snapshotlaag.
 *
 * Voorkomt twee gelijktijdig open Dossiers voor dezelfde Klant + hetzelfde
 * Pand: bestaat er al een open Dossier voor die combinatie, dan wordt dat
 * hergebruikt in plaats van een nieuwe aangemaakt. Dat maakt de actie ook
 * veilig om te herhalen (bijv. na een mislukte vorige poging of een dubbele
 * klik): nooit een duplicaat.
 */
import { createDossier, isDossierOpen } from './dossier.js'
import { loadAllDossiers, saveDossier } from './storage.js'
import { loadMjopSnapshotForPand } from './mjopKoppeling.js'

/** Het open Dossier voor deze Klant + dit Pand, of `null` als er geen is. */
export function vindOpenDossier(klantId, pandId) {
  return loadAllDossiers().find((d) => d.klantId === klantId && d.pandId === pandId && isDossierOpen(d)) ?? null
}

/**
 * Opent een Adviesdossier voor een Klant + Pand. Neemt automatisch de
 * bestaande MJOP-momentopname voor dit Pand mee als die er is — MJOP blijft
 * daarmee optioneel, een Dossier kan ook zonder MJOP worden geopend.
 *
 * Retourneert `{ dossier, hergebruikt }`: `hergebruikt` is `true` als er al
 * een open Dossier voor deze combinatie bestond (dat dossier wordt dan
 * teruggegeven, niet een nieuwe), anders `false`.
 */
export function openAdviesdossier({ klant, pand, primaireContactpersoonId = null } = {}) {
  if (!klant?.klantId) throw new Error('openAdviesdossier vereist een Klant met klantId.')
  if (!pand?.pandId) throw new Error('openAdviesdossier vereist een Pand met pandId.')

  const bestaandOpenDossier = vindOpenDossier(klant.klantId, pand.pandId)
  if (bestaandOpenDossier) {
    return { dossier: bestaandOpenDossier, hergebruikt: true }
  }

  const mjopSnapshot = loadMjopSnapshotForPand(pand.pandId)
  const dossier = createDossier({ klant, pand, primaireContactpersoonId, mjopSnapshot })
  if (!saveDossier(dossier)) {
    throw new Error('Het Dossier kon niet worden opgeslagen.')
  }
  return { dossier, hergebruikt: false }
}
