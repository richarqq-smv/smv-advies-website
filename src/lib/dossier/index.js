/**
 * Publieke API van de geïsoleerde Klant/Pand/Dossier-domeinmodule.
 * `saveMjopSnapshotToPand` (via mjopKoppeling.js) is de enige functie die
 * vanuit MJOP wordt aangeroepen (useMjopBuilding.js) — de rest van deze
 * module blijft ongebruikt door Energie-indicatie of enige UI. Dit is nog
 * altijd het fundament uit het Pand-basismodel (ontwerpdocument), bewust
 * nog niet gekoppeld aan Klant of Dossier vanuit MJOP (zie mjopKoppeling.js).
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
export {
  buildingToPandInput,
  createMjopSnapshotFromBuilding,
  buildingToContactInfo,
  mjopBuildingToDossierInput,
} from './mjopAdapter.js'
export { saveMjopSnapshotToPand } from './mjopKoppeling.js'
