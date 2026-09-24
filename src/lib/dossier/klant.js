/**
 * Klant- en Contactpersoon-domeinmodel, per het Pand-basismodel
 * (ontwerpdocument, hoofdstuk 4). Bewust minimaal: geen CRM, alleen wat
 * nodig is om een Dossier aan een Klant met één primaire Contactpersoon
 * te kunnen koppelen. Meerdere Contactpersonen per Klant zijn mogelijk;
 * overige betrokkenheid bij één Dossier blijft voor nu een vrij tekstveld
 * op het Dossier zelf, geen eigen relatie.
 */
import { generateId } from './id.js'

export function createKlant({ naam = '', email = '', telefoon = '', bedrijfsnaam = '' } = {}) {
  return {
    klantId: generateId(),
    naam,
    email,
    telefoon,
    bedrijfsnaam,
    contactpersonen: [],
  }
}

export function createContactpersoon({ naam = '', email = '', telefoon = '', rol = '' } = {}) {
  return {
    contactpersoonId: generateId(),
    naam,
    email,
    telefoon,
    rol,
  }
}

/** Voegt een Contactpersoon toe zonder de Klant te muteren. */
export function addContactpersoon(klant, contactpersoon) {
  return { ...klant, contactpersonen: [...klant.contactpersonen, contactpersoon] }
}
