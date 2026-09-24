/**
 * Dossier-domeinmodel: het koppelpunt tussen een onafhankelijke Klant en
 * een onafhankelijk Pand (Pand-basismodel, hoofdstuk 12) — geen vaste
 * Klant→Pand→Dossier-keten. Kent maar twee statussen (hoofdstuk 6): een
 * apart "concept"-stadium is in het ontwerp expliciet afgewezen omdat het
 * geen onderscheidend gedrag toevoegt.
 */
import { generateId } from './id.js'
import { createPandSnapshot } from './snapshot.js'

export const DOSSIER_STATUS = {
  OPEN: 'open',
  AFGEROND: 'afgerond',
}

export function createDossier({ klant, pand, primaireContactpersoonId = null } = {}) {
  if (!klant?.klantId) throw new Error('createDossier vereist een Klant met klantId.')
  if (!pand?.pandId) throw new Error('createDossier vereist een Pand met pandId.')
  if (primaireContactpersoonId && !klant.contactpersonen?.some((c) => c.contactpersoonId === primaireContactpersoonId)) {
    throw new Error('primaireContactpersoonId moet een bestaande Contactpersoon van deze Klant zijn.')
  }

  const now = new Date().toISOString()
  return {
    dossierId: generateId(),
    klantId: klant.klantId,
    pandId: pand.pandId,
    primaireContactpersoonId,
    status: DOSSIER_STATUS.OPEN,
    pandSnapshot: createPandSnapshot(pand),
    createdAt: now,
    updatedAt: now,
  }
}

export function isDossierOpen(dossier) {
  return dossier.status === DOSSIER_STATUS.OPEN
}

/**
 * Ververst de snapshot met de op dit moment geldende Pandgegevens — alleen
 * toegestaan zolang het Dossier open is (hoofdstuk 6). Dit is normale
 * voortgang binnen een lopend traject, geen herschrijving van geschiedenis.
 */
export function refreshDossierSnapshot(dossier, pand) {
  if (!isDossierOpen(dossier)) {
    throw new Error('Een afgerond Dossier kan zijn snapshot niet meer bijwerken.')
  }
  if (dossier.pandId !== pand.pandId) {
    throw new Error('Dit Pand hoort niet bij dit Dossier.')
  }
  return { ...dossier, pandSnapshot: createPandSnapshot(pand), updatedAt: new Date().toISOString() }
}

/**
 * Sluit een Dossier af. Vanaf dit moment moet de inhoud reproduceerbaar
 * blijven (hoofdstuk 6) — het resultaat wordt daarom volledig bevroren
 * (Object.freeze), bewust zonder apart versioneringssysteem. Idempotent:
 * een al afgerond Dossier wordt ongewijzigd teruggegeven.
 */
export function completeDossier(dossier) {
  if (!isDossierOpen(dossier)) return dossier
  return Object.freeze({ ...dossier, status: DOSSIER_STATUS.AFGEROND, updatedAt: new Date().toISOString() })
}
