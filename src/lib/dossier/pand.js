/**
 * Pand-domeinmodel: exact het veldenvoorstel uit het Pand-basismodel
 * (ontwerpdocument, hoofdstuk 17). Onafhankelijk van Energie-indicatie en
 * MJOP — geen berekende waarden, statussen of adviseursnotities (zie
 * hoofdstuk 16 van hetzelfde document voor wat hier bewust buiten blijft).
 * Bijna niets is verplicht: een leeg veld betekent "niet bekend", nooit
 * een blokkade — zelfde uitgangspunt als de MJOP-tool.
 */
import { generateId } from './id.js'

export function createPand({
  omschrijving = '',
  adres = '',
  postcode = '',
  plaats = '',
  bouwjaar = null,
  gebruikstype = null,
  vloeroppervlak = null,
  bouwlagen = null,
  gebruikers = null,
  energiebron = null,
  verwarmingssysteemType = null,
  energielabel = null,
  opmerkingen = '',
  ontstaanVia = 'intake',
} = {}) {
  const now = new Date().toISOString()
  return {
    pandId: generateId(),
    omschrijving,
    adres,
    postcode,
    plaats,
    bouwjaar,
    gebruikstype,
    vloeroppervlak,
    bouwlagen,
    gebruikers,
    energiebron,
    verwarmingssysteemType,
    energielabel,
    opmerkingen,
    aangemaaktOp: now,
    laatstGewijzigd: now,
    ontstaanVia,
  }
}

/**
 * Werkt het actuele Pandprofiel bij (bijv. een correctie of een echte
 * verandering aan het pand). Bestaande Dossier-snapshots blijven hierdoor
 * onaangetast — zie snapshot.js en de Correctie 1-uitwerking in hoofdstuk 11.
 */
export function updatePand(pand, changes) {
  return {
    ...pand,
    ...changes,
    pandId: pand.pandId,
    aangemaaktOp: pand.aangemaaktOp,
    laatstGewijzigd: new Date().toISOString(),
  }
}
