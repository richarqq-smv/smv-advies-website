/**
 * Pure logica voor de loyaliteitskorting na 1 jaar (projectplan
 * "Klantwaarde-uitbreidingen", Fase 5 — #8, ronde 2026-10-19). De
 * kortingslogica is letterlijk zoals Richard 'm heeft bevestigd: 3/2/1
 * opties afhankelijk van het pakket dat de klant had bij afronding van
 * het dossier (`dossiers.pakket_id`) — Basis krijgt 3 opties, Premium 2,
 * Gold 1 (geen hogere tier meer mogelijk).
 *
 * Wordt zowel hier (voor de preview in DossierDetail.jsx) als — als
 * bewust losstaande kopie, Edge Functions worden onafhankelijk van de
 * frontend-bundel gedeployed — in supabase/functions/
 * loyaliteitskorting-sync/index.ts gebruikt. Bij een wijziging hier dus
 * ook die kopie bijwerken.
 */
const PAKKET_VOLGORDE = ['basis', 'premium', 'gold']
const PAKKET_LABELS = { basis: 'Basis', premium: 'Premium', gold: 'Gold' }

/**
 * Geeft de 3/2/1 kortingsopties voor een gegeven pakket-tier, oplopend
 * van "zelfde pakket" (4,5%) tot "2 stappen omhoog" (15%, alleen vanaf
 * Basis). Een onbekend/ontbrekend pakketId geeft een lege lijst — nooit
 * een gok welke korting zou gelden.
 */
export function bouwKortingOpties(pakketId) {
  const index = PAKKET_VOLGORDE.indexOf(pakketId)
  if (index === -1) return []

  const opties = [
    { doelPakketId: pakketId, doelPakketLabel: PAKKET_LABELS[pakketId], percentage: 4.5, omschrijving: `Zelfde pakket (${PAKKET_LABELS[pakketId]})` },
  ]
  if (index + 1 < PAKKET_VOLGORDE.length) {
    const eenStapHoger = PAKKET_VOLGORDE[index + 1]
    opties.push({ doelPakketId: eenStapHoger, doelPakketLabel: PAKKET_LABELS[eenStapHoger], percentage: 9.5, omschrijving: `Upgrade naar ${PAKKET_LABELS[eenStapHoger]}` })
  }
  if (index + 2 < PAKKET_VOLGORDE.length) {
    const tweeStappenHoger = PAKKET_VOLGORDE[index + 2]
    opties.push({ doelPakketId: tweeStappenHoger, doelPakketLabel: PAKKET_LABELS[tweeStappenHoger], percentage: 15, omschrijving: `Upgrade naar ${PAKKET_LABELS[tweeStappenHoger]}` })
  }
  return opties
}

/**
 * Deterministisch, direct terug te herleiden naar het dossier — geen
 * aparte kortingentabel nodig. Randvoorwaarde uit het projectplan: "de
 * kortingscode moet traceerbaar zijn zodat Richard 'm kan valideren bij
 * gebruik" — AdminDossiers.jsx zoekt inmiddels ook op dossier_nummer,
 * dus Richard kan "LOY-SMV-DOS-2026-0042" direct terugzoeken op
 * "SMV-DOS-2026-0042".
 */
export function bouwKortingCode(dossierNummer) {
  if (!dossierNummer) return null
  return `LOY-${dossierNummer}`
}
