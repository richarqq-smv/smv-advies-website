import { ROUTES } from '../routes.js'

/**
 * Bepaalt welk dossieroverzicht de "Terug naar dossiers"-knop op
 * Adviesdossier (DossierDetail.jsx) moet tonen. Twee echte overzichten
 * bestaan er (gecontroleerd in de code, niet aangenomen): Account.jsx
 * (/account — de eigen panden/dossiers van een klant) en Admin.jsx
 * (/admin — de "Dossiers"-lijst van alle klanten, alleen voor een admin).
 * Pure functie zodat deze keuze zelf deterministisch getest kan worden,
 * los van of de pagina daadwerkelijk gerenderd kan worden (dit project
 * heeft bewust geen React-componenttest-tooling, zie package.json).
 */
export function bepaalDossierOverzichtRoute(isAdmin) {
  return isAdmin ? ROUTES.admin : ROUTES.account
}
