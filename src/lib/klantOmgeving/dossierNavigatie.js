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

/**
 * Voegt een `dossierId`-querycontext toe aan een bestaand pad (Energie-
 * indicatie, Account, MJOP-tool) — het "kruimelpad" waarmee die pagina's
 * weten uit welk Dossier ze geopend zijn en een "Terug naar dossier"-link
 * kunnen tonen. Geen nieuwe identifier: `dossierId` is exact het bestaande
 * `dossiers.dossier_id`-veld (zie ROUTES.dossier). Zonder `dossierId`
 * blijft het pad ongewijzigd — elke bestemming werkt dus ook prima zonder
 * dossiercontext (bijv. de publieke, niet-ingelogde Energie-indicatie).
 */
export function voegDossierContextToe(pad, dossierId) {
  if (!dossierId) return pad
  const separator = pad.includes('?') ? '&' : '?'
  return `${pad}${separator}dossierId=${encodeURIComponent(dossierId)}`
}

/** Leest `dossierId` uit een al opgehaalde URLSearchParams — puur, geen eigen parsing-aanname. */
export function leesDossierContext(searchParams) {
  return searchParams?.get('dossierId') || null
}

/**
 * Kiest welk Dossier vooraf geselecteerd moet staan in
 * EnergieDossierKoppeling.jsx se dossierkeuze — de voorkeur uit de
 * dossiercontext (`?dossierId=`, zie leesDossierContext) als die geldig
 * is, anders het eerste open Dossier, anders 'nieuw'.
 *
 * BELANGRIJK (security): "geldig" betekent hier uitsluitend "komt voor in
 * `openDossiers`" — en die lijst komt altijd al uit een tenant-gescoopte
 * query (listDossiersVoorKlant(klant.klant_id) in EnergieDossierKoppeling,
 * zelf weer beperkt door RLS dossiers_select). Een dossierId uit de URL
 * wordt dus NOOIT direct vertrouwd of los opgevraagd — het kan hooguit een
 * item uit een al-geautoriseerde lijst voorselecteren. Een vreemd, niet-
 * bestaand of niet-eigen dossierId matcht simpelweg niets en valt terug op
 * het standaardgedrag; de echte afdwinging blijft bij RLS (dossiers_update
 * bij het daadwerkelijk opslaan, zie saveEnergieSnapshot() in api.js).
 */
export function kiesVoorkeursDossier(openDossiers, voorkeurDossierId) {
  const isGeldig = Boolean(voorkeurDossierId) && openDossiers.some((d) => d.dossier_id === voorkeurDossierId)
  if (isGeldig) return voorkeurDossierId
  return openDossiers.length > 0 ? openDossiers[0].dossier_id : 'nieuw'
}
