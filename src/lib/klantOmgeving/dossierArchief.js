/**
 * Pure statuslogica voor het dossier-archief (admin-feature, 2026-09-28).
 * Geen I/O — alleen afleidingen uit een al opgehaald Dossier-object, zodat
 * zowel Admin.jsx (welke knop tonen) als Archief.jsx (welke dossiers
 * tonen/welke actie) uit precies dezelfde bron putten. De echte
 * handhaving blijft bij de database: RLS (dossiers_update) en de
 * bewaak_dossier_integriteit()-trigger, die archiveren sowieso al beperkt
 * tot een actief (open) Dossier — zie 0010_dossier_archief.sql en
 * archiveerDossier()/herstelDossier() in api.js.
 */

/** Of een Dossier gearchiveerd is — puur op basis van `gearchiveerd_op` (null/undefined = niet gearchiveerd). */
export function isDossierGearchiveerd(dossier) {
  return Boolean(dossier?.gearchiveerd_op)
}

/**
 * Of de prullenbakknop (archiveren) zinvol is: alleen een actief (open),
 * nog niet gearchiveerd Dossier. Een afgerond Dossier krijgt hier bewust
 * ook `false` — niet omdat deze functie dat zelf beslist als "verboden",
 * maar omdat de database dat sowieso al blokkeert (bewaak_dossier_
 * integriteit); de knop simpelweg niet tonen voorkomt een gegarandeerd
 * mislukte actie in de UI.
 */
export function magDossierArchiveren(dossier) {
  return dossier?.status === 'open' && !isDossierGearchiveerd(dossier)
}

/** Of de herstelknop zinvol is: alleen een daadwerkelijk gearchiveerd Dossier. */
export function magDossierHerstellen(dossier) {
  return isDossierGearchiveerd(dossier)
}
