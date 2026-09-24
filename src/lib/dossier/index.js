/**
 * Publieke API van de geïsoleerde Klant/Pand/Dossier-domeinmodule.
 * Bewust nog nergens geïmporteerd door Energie-indicatie, MJOP of enige
 * UI — dit is uitsluitend het fundament uit het Pand-basismodel
 * (ontwerpdocument), niet gekoppeld aan bestaande functionaliteit.
 */
export { generateId } from './id.js'
export { createKlant, createContactpersoon, addContactpersoon } from './klant.js'
export { createPand, updatePand } from './pand.js'
export { PAND_SNAPSHOT_FIELDS, createPandSnapshot } from './snapshot.js'
export { DOSSIER_STATUS, createDossier, isDossierOpen, refreshDossierSnapshot, completeDossier } from './dossier.js'
export {
  saveKlant,
  loadKlant,
  loadAllKlanten,
  deleteKlant,
  savePand,
  loadPand,
  loadAllPanden,
  deletePand,
  saveDossier,
  loadDossier,
  loadAllDossiers,
  deleteDossier,
} from './storage.js'
