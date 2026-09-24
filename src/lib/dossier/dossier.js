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

// Zelfde principe als PAND_SNAPSHOT_FIELDS in snapshot.js: alleen de
// inhoudelijke Contactpersoon-velden, niet het contactpersoonId zelf —
// dat blijft de verwijzing (`primaireContactpersoonId`), de snapshot is de
// bevroren inhoud op het moment van vastleggen (ontwerpdocument "Pand naar
// Klant naar Dossier", hoofdstuk 4/9).
const CONTACTPERSOON_SNAPSHOT_FIELDS = ['naam', 'email', 'telefoon', 'rol']

function findContactpersoon(klant, contactpersoonId) {
  return klant.contactpersonen?.find((c) => c.contactpersoonId === contactpersoonId) ?? null
}

/** Bevroren, onafhankelijke kopie van de Contactpersoon-inhoud — `null` als er geen primaire Contactpersoon is. */
function createContactpersoonSnapshot(contactpersoon) {
  if (!contactpersoon) return null
  const snapshot = {}
  for (const field of CONTACTPERSOON_SNAPSHOT_FIELDS) snapshot[field] = contactpersoon[field]
  return Object.freeze(snapshot)
}

export function createDossier({ klant, pand, primaireContactpersoonId = null } = {}) {
  if (!klant?.klantId) throw new Error('createDossier vereist een Klant met klantId.')
  if (!pand?.pandId) throw new Error('createDossier vereist een Pand met pandId.')
  const primaireContactpersoon = primaireContactpersoonId ? findContactpersoon(klant, primaireContactpersoonId) : null
  if (primaireContactpersoonId && !primaireContactpersoon) {
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
    contactpersoonSnapshot: createContactpersoonSnapshot(primaireContactpersoon),
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
 *
 * `klant` is optioneel: alleen meegeven wanneer ook de contactpersoon-
 * snapshot moet worden ververst (bijv. omdat de primaire contactpersoon
 * bewust wisselt, of omdat diens gegevens zijn gecorrigeerd). Zonder
 * `klant` blijven `contactpersoonSnapshot` en `primaireContactpersoonId`
 * ongewijzigd — bestaande aanroepen met alleen (dossier, pand) blijven dus
 * exact hetzelfde gedrag houden. Met `klant` maar zonder een expliciete
 * nieuwe `primaireContactpersoonId` wordt de snapshot ververst voor
 * dezelfde, al gekozen contactpersoon (het correctie-geval); met een
 * afwijkende `primaireContactpersoonId` wisselt de primaire contactpersoon
 * zelf (inclusief `null`, om de primaire contactpersoon te wissen).
 */
export function refreshDossierSnapshot(dossier, pand, klant = null, primaireContactpersoonId = dossier.primaireContactpersoonId) {
  if (!isDossierOpen(dossier)) {
    throw new Error('Een afgerond Dossier kan zijn snapshot niet meer bijwerken.')
  }
  if (dossier.pandId !== pand.pandId) {
    throw new Error('Dit Pand hoort niet bij dit Dossier.')
  }

  let contactpersoonSnapshot = dossier.contactpersoonSnapshot
  let nextPrimaireContactpersoonId = dossier.primaireContactpersoonId
  if (klant) {
    if (klant.klantId !== dossier.klantId) {
      throw new Error('Deze Klant hoort niet bij dit Dossier.')
    }
    const contactpersoon = primaireContactpersoonId ? findContactpersoon(klant, primaireContactpersoonId) : null
    if (primaireContactpersoonId && !contactpersoon) {
      throw new Error('primaireContactpersoonId moet een bestaande Contactpersoon van deze Klant zijn.')
    }
    contactpersoonSnapshot = createContactpersoonSnapshot(contactpersoon)
    nextPrimaireContactpersoonId = primaireContactpersoonId
  }

  return {
    ...dossier,
    pandSnapshot: createPandSnapshot(pand),
    contactpersoonSnapshot,
    primaireContactpersoonId: nextPrimaireContactpersoonId,
    updatedAt: new Date().toISOString(),
  }
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
