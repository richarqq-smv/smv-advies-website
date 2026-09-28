/**
 * Interne commerciële kans per dossier (2026-09-28) — uitsluitend de
 * vaste keuzelijst en validatie. Zie DossierDetail.jsx ("Interne
 * commerciële kans"-sectie, admin-only) en AdminKansen.jsx
 * (/admin/kansen). Bewust geen score/rangschikking/automatische
 * aanbeveling hier — de admin kiest zelf uit een vaste, neutrale lijst;
 * deze module bepaalt nooit zelf een waarde, alleen welke waarden geldig
 * zijn. Labels komen overeen met de bestaande pakketnamen/mindsets in
 * data/packages.js (Basis–Oriënteren, Premium–Beslissen,
 * Gold–Ontzorgd worden) — geen nieuwe naamgeving.
 */
export const VERVOLGSTAP_OPTIES = [
  { id: 'nog_bepalen', label: 'Nog bepalen' },
  { id: 'alleen_energie_quickscan', label: 'Alleen Energie Quickscan' },
  { id: 'basis_orienteren', label: 'Basis – Oriënteren' },
  { id: 'premium_beslissen', label: 'Premium – Beslissen' },
  { id: 'gold_ontzorgd', label: 'Gold – Ontzorgd worden' },
  { id: 'meerdere_mogelijkheden', label: 'Meerdere mogelijkheden' },
  { id: 'geen_vervolgopdracht', label: 'Geen directe vervolgopdracht' },
]
export const VERVOLGSTAP_LABELS = Object.fromEntries(VERVOLGSTAP_OPTIES.map((o) => [o.id, o.label]))
const VERVOLGSTAP_IDS = new Set(VERVOLGSTAP_OPTIES.map((o) => o.id))

/** Puur veld-voor-veld (zelfde vorm als klantValidatie.js/planning.js): een leeg object betekent geldig. */
export function valideerCommercieleKans({ vervolgstap } = {}) {
  const fouten = {}
  if (!VERVOLGSTAP_IDS.has(vervolgstap)) {
    fouten.vervolgstap = 'Kies een geldige optie.'
  }
  return fouten
}
