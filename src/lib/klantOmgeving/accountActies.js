/**
 * "Acties voor u" op /account (Klantomgeving-uitbreiding, 2026-09-28) —
 * hergebruikt letterlijk dezelfde feitelijke controles als de Dossier
 * Health Check (controleerKlant/controleerPand/controleerEnergie/
 * controleerMjop, dossierHealthCheck.js) in plaats van een tweede,
 * mogelijk afwijkende regelset te bouwen. Alleen de vorm is anders: één
 * platte lijst van concrete, nog-niet-`gereed`-punten over de HELE
 * klantrelatie heen (alle panden/dossiers), niet gegroepeerd per dossier.
 *
 * Bewust GEEN advies/offerte-categorie hier (in tegenstelling tot de volle
 * Dossier Health Check): "nog geen adviespunten"/"offerte nog concept" is
 * geen actie die de klant zelf kan/mag oppakken (SMV bepaalt wat een
 * adviespunt wordt, zie opdracht) — die twee categorieën horen dus niet in
 * een "dit kunt u zelf aanvullen"-lijst. Ook geen verzonnen "document
 * gevraagd"-actie: er bestaat geen veld/vlag in de architectuur die een
 * concreet documentverzoek vastlegt, en die nu verzinnen zou een niet-
 * bestaande workflow suggereren (zie opdracht: "maak geen nieuwe complexe
 * workflow").
 */
import { controleerKlant, controleerPand, controleerEnergie, controleerMjop, HEALTH_STATUS } from './dossierHealthCheck.js'
import { ROUTES } from '../routes.js'

/**
 * @param {object} params
 * @param {object|null} params.klant
 * @param {object|null} params.contactpersoon
 * @param {object[]} params.panden
 * @param {object[]} params.dossiers - elk met minstens `dossier_id`, `status`, `energie_snapshot`, `mjop_snapshot`, `panden` (het gekoppelde pand, voor een leesbaar label)
 * @returns {{categorie: string, label: string, reden: string, actie: {label: string, to: string}}[]}
 */
export function bouwAccountActies({ klant = null, contactpersoon = null, panden = [], dossiers = [] }) {
  const acties = []

  const klantResultaat = controleerKlant({ klant, contactpersoon })
  if (klantResultaat.status !== HEALTH_STATUS.GEREED) {
    acties.push({
      categorie: 'klant',
      label: 'Contactgegevens controleren',
      reden: klantResultaat.reden,
      actie: { label: 'Gegevens aanvullen', to: ROUTES.account },
    })
  }

  for (const pand of panden) {
    const pandResultaat = controleerPand({ pand })
    if (pandResultaat.status !== HEALTH_STATUS.GEREED) {
      acties.push({
        categorie: 'pand',
        label: `Pandgegevens aanvullen — ${pand.omschrijving || pand.adres || 'naamloos pand'}`,
        reden: pandResultaat.reden,
        actie: { label: 'Pand aanvullen', to: ROUTES.account },
      })
    }
  }

  // Alleen open dossiers: een afgerond dossier heeft geen lopende actie meer nodig.
  for (const dossier of dossiers.filter((d) => d.status === 'open')) {
    const label = dossier.panden?.omschrijving || dossier.panden?.adres || 'dossier'
    const energieResultaat = controleerEnergie({ energieSnapshot: dossier.energie_snapshot })
    if (energieResultaat.status !== HEALTH_STATUS.GEREED) {
      acties.push({
        categorie: 'energie',
        label: `Energiegegevens ontbreken — ${label}`,
        reden: energieResultaat.reden,
        actie: { label: 'Dossier openen', to: ROUTES.dossier(dossier.dossier_id) },
      })
    }
    const mjopResultaat = controleerMjop({ mjopSnapshot: dossier.mjop_snapshot })
    if (mjopResultaat.status !== HEALTH_STATUS.GEREED) {
      acties.push({
        categorie: 'mjop',
        label: `MJOP ontbreekt — ${label}`,
        reden: mjopResultaat.reden,
        actie: { label: 'Dossier openen', to: ROUTES.dossier(dossier.dossier_id) },
      })
    }
  }

  return acties
}
