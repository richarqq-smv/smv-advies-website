/**
 * Publieke API van de geïsoleerde Klant/Pand/Dossier-domeinmodule.
 * `saveMjopSnapshotToPand` blijft de enige functie die MJOP zelf aanroept
 * (useMjopBuilding.js). De Klant↔Pand↔Dossier-flow (koppelKlantAanPand,
 * openAdviesdossier) wordt aangeroepen vanuit de aparte, interne
 * dossier-UI (components/dossier/) — nooit automatisch vanuit MJOP. Nog
 * altijd niet gekoppeld aan Energie-indicatie.
 *
 * Advieslaag: `createAdviespunt`/`createSignaalBevroren` (adviespunt.js) en
 * `addAdviespunt`/`updateAdviespunt`/`removeAdviespunt` (dossier.js) vormen
 * samen de enige API om `dossier.adviespunten` te vullen — altijd via een
 * bewuste actie van Richard, nooit automatisch vanuit een MJOP-signaal.
 */
export { generateId } from './id.js'
export { createKlant, createContactpersoon, addContactpersoon } from './klant.js'
export { createPand, updatePand } from './pand.js'
export { PAND_SNAPSHOT_FIELDS, createPandSnapshot } from './snapshot.js'
export {
  DOSSIER_STATUS,
  createDossier,
  isDossierOpen,
  refreshDossierSnapshot,
  completeDossier,
  addAdviespunt,
  updateAdviespunt,
  removeAdviespunt,
} from './dossier.js'
export { createAdviespunt, createSignaalBevroren } from './adviespunt.js'
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
  saveKlantPandRelatie,
  loadKlantPandRelatie,
  loadAllKlantPandRelaties,
  deleteKlantPandRelatie,
} from './storage.js'
export { createKlantPandRelatie, findKlantPandRelatie, koppelKlantAanPand } from './klantPandRelatie.js'
export { openAdviesdossier, vindOpenDossier } from './openDossier.js'
export {
  buildingToPandInput,
  createMjopSnapshotFromBuilding,
  buildingToContactInfo,
  mjopBuildingToDossierInput,
} from './mjopAdapter.js'
export { saveMjopSnapshotToPand, loadMjopSnapshotForPand, getGekoppeldPandVoorMjopBuilding } from './mjopKoppeling.js'
