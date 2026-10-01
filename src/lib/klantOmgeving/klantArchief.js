/**
 * Pure statuslogica voor het klant-archief (admin-feature, 2026-10-01) —
 * zelfde opzet als dossierArchief.js, nu voor Klant. Productbeslissing:
 * een klant archiveren archiveert ook al zijn actieve dossiers mee (zie
 * 0031_klant_archief.sql), dus deze module geeft naast de klant-status ook
 * terug welke/hoeveel dossiers dat raakt, zodat de UI dat vóór de
 * bevestiging kan tonen. De echte handhaving blijft bij de database: RLS
 * (klanten_update) en de bewaak_klant_integriteit()-trigger.
 */

/** Of een Klant gearchiveerd is — puur op basis van `gearchiveerd_op` (null/undefined = niet gearchiveerd). */
export function isKlantGearchiveerd(klant) {
  return Boolean(klant?.gearchiveerd_op)
}

/** Of de archiveerknop zinvol is: alleen een nog niet gearchiveerde Klant. */
export function magKlantArchiveren(klant) {
  return !isKlantGearchiveerd(klant)
}

/** Of de herstelknop zinvol is: alleen een daadwerkelijk gearchiveerde Klant. */
export function magKlantHerstellen(klant) {
  return isKlantGearchiveerd(klant)
}

/**
 * Welke dossiers van deze klant worden meegearchiveerd als de klant nu
 * wordt gearchiveerd — alleen actieve (status 'open', nog niet
 * gearchiveerde) dossiers; een afgerond dossier staat door
 * bewaak_dossier_integriteit() sowieso al vast en kan niet worden
 * meegearchiveerd, en een al los-gearchiveerd dossier hoeft niet nogmaals.
 * Puur om de bevestigingstekst op te bouwen ("N dossier(s) gaan mee") —
 * de database bepaalt zelf, onafhankelijk hiervan, welke rijen de
 * cascade-update daadwerkelijk raakt.
 */
export function dossiersDieMeeArchiveren(dossiersVanKlant) {
  return (dossiersVanKlant ?? []).filter((d) => d?.status === 'open' && !d?.gearchiveerd_op)
}
