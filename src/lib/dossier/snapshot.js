/**
 * Correctie 1 uit de architectuur-stresstest, de enige structurele
 * bevinding: een Dossier bevriest de relevante Pand-basisgegevens op het
 * moment van gebruik, in plaats van live naar het Pandprofiel te
 * verwijzen (Pand-basismodel, hoofdstuk 11). Alleen velden die een
 * berekening of advies daadwerkelijk kunnen beïnvloeden worden gesnapshot
 * — identiteit, locatie en systeemmetadata horen daar bewust niet in
 * (zie de "Wel/niet in het snapshot"-tabel in datzelfde hoofdstuk).
 */

export const PAND_SNAPSHOT_FIELDS = [
  'bouwjaar',
  'gebruikstype',
  'vloeroppervlak',
  'bouwlagen',
  'gebruikers',
  'energiebron',
  'verwarmingssysteemType',
  'energielabel',
]

/**
 * Bevroren, onafhankelijke kopie van de relevante Pandgegevens — nooit
 * een verwijzing naar het Pandobject zelf. Een latere wijziging aan het
 * Pand mag dit resultaat niet meer kunnen veranderen.
 */
export function createPandSnapshot(pand) {
  const snapshot = {}
  for (const field of PAND_SNAPSHOT_FIELDS) snapshot[field] = pand[field]
  return Object.freeze(snapshot)
}
