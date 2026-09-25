/**
 * Wat de huidige gebruiker in een Dossier mag — puur de UI-kant van
 * dezelfde regels die de database afdwingt (zie
 * supabase/migrations/0006_advies_en_dossier_alleen_adviseur.sql). De
 * database blijft de echte grens; deze functie zorgt er alleen voor dat de
 * klant geen knoppen ziet die RLS toch zou weigeren.
 *
 * Advies (adviespunten, adviesstatus, signaalkandidaten, afronden) en
 * offertes zijn uitsluitend werk van de adviseur. Een klant ziet zijn
 * dossier, en de adviespunten pas zodra het advies is afgerond.
 */
export function bepaalDossierRechten({ isAdmin, status }) {
  const admin = isAdmin === true
  const afgerond = status === 'afgerond'
  return {
    magAdviesBewerken: admin && !afgerond,
    magAfronden: admin && !afgerond,
    magOffertesBeheren: admin,
    toontAdviespunten: admin || afgerond,
  }
}
