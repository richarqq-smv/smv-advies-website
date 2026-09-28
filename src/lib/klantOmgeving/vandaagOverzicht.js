/**
 * "Vandaag voor SMV" (werkfase Fase 5 — SMV-audit-opvolging, 2026-09-28).
 *
 * Volledig deterministisch, GEEN AI: uitsluitend bestaande databasevelden,
 * statussen en datums. Geen score, geen percentage, geen voorspelling —
 * elke categorie hieronder is een feitelijke, direct navolgbare regel op
 * al bestaande kolommen (zie de toelichting per functie). Puur I/O-vrije
 * logica; de aanroeper (Admin.jsx) haalt de data op via
 * lib/klantOmgeving/api.js#adminListDossiers/#adminListOffertes.
 *
 * Bewust GEEN her-berekening van open MJOP-/Energie-signalen per dossier
 * hier (dat zou voor elk dossier een aparte adviespunten-query vereisen,
 * N+1 — zie DossierHealthCheck.jsx/dossierHealthCheck.js voor die, wel
 * per-dossier, volledige berekening). Hier volstaat het aantal
 * adviespunten (via een goedkope embedded `count`, zie adminListDossiers())
 * om onderscheid te maken tussen "nog geen enkel adviespunt" en "er is al
 * iets vastgelegd" — genoeg voor een feitelijk "vandaag"-signaal, niet
 * bedoeld als vervanging van de volledige Health Check.
 */

function vandaagIso() {
  return new Date().toISOString().slice(0, 10)
}

function aantalAdviespunten(dossier) {
  // Supabase/PostgREST embedded aggregaat: `[{ count: n }]` of ontbrekend.
  return dossier.adviespunten?.[0]?.count ?? 0
}

/**
 * Offertes met status 'verstuurd' die nog niet verlopen zijn — moeten
 * worden opgevolgd. Gesorteerd op `verzonden_op` (werkfase Fase 10),
 * oudste eerst: hoe langer geleden verstuurd, hoe eerder opvolgen logisch
 * is — een feitelijke sortering op een bestaand datumveld, geen score.
 * Offertes zonder `verzonden_op` (zou niet moeten voorkomen bij status
 * 'verstuurd', maar defensief) komen laatst.
 */
function vindOffertesOpTeVolgen(offertes, vandaag) {
  // .filter() geeft altijd een nieuwe array — .sort() muteert die veilig,
  // nooit de meegegeven `offertes`-array zelf (zelfde stijl als elders,
  // bijv. lib/energieScan/calculations.js).
  return offertes
    .filter((o) => o.status === 'verstuurd' && o.geldig_tot >= vandaag)
    .sort((a, b) => (a.verzonden_op ?? '9999').localeCompare(b.verzonden_op ?? '9999'))
}

/** Offertes (concept of verstuurd) waarvan de geldigheidsdatum al is verstreken. */
function vindOffertesVerlopen(offertes, vandaag) {
  return offertes.filter((o) => (o.status === 'concept' || o.status === 'verstuurd') && o.geldig_tot < vandaag)
}

/** Open dossiers zonder gekoppelde MJOP-snapshot. */
function vindDossiersZonderMjop(dossiers) {
  return dossiers.filter((d) => d.status === 'open' && !d.mjop_snapshot)
}

/** Open dossiers zonder gekoppelde Energie-indicatie-snapshot. */
function vindDossiersZonderEnergie(dossiers) {
  return dossiers.filter((d) => d.status === 'open' && !d.energie_snapshot)
}

/** Open dossiers mét MJOP- of Energie-brondata, maar nog geen enkel adviespunt — de brondata is er, er is nog niets mee gedaan. */
function vindDossiersMetOnbehandeldeSignalen(dossiers) {
  return dossiers.filter((d) => d.status === 'open' && (d.mjop_snapshot || d.energie_snapshot) && aantalAdviespunten(d) === 0)
}

/** Open dossiers met minstens één adviespunt — advies is gestart, dossier zou beoordeeld/afgerond kunnen worden. */
function vindDossiersKlaarVoorAdvies(dossiers) {
  return dossiers.filter((d) => d.status === 'open' && aantalAdviespunten(d) > 0)
}

/** Afgeronde dossiers zonder enige offerte — het advies is definitief, er is nog geen offerte voor opgesteld. */
function vindDossiersKlaarVoorOfferte(dossiers, offertes) {
  const dossierIdsMetOfferte = new Set(offertes.map((o) => o.dossier_id))
  return dossiers.filter((d) => d.status === 'afgerond' && !dossierIdsMetOfferte.has(d.dossier_id))
}

/**
 * Bouwt het volledige "Vandaag voor SMV"-overzicht. `dossiers` komt van
 * adminListDossiers(), `offertes` van adminListOffertes() — beide
 * ongewijzigde rijen, deze functie leest alleen, muteert niets.
 */
export function bouwVandaagOverzicht({ dossiers = [], offertes = [] }, { vandaag = vandaagIso() } = {}) {
  return {
    offertesOpTeVolgen: vindOffertesOpTeVolgen(offertes, vandaag),
    offertesVerlopen: vindOffertesVerlopen(offertes, vandaag),
    dossiersZonderMjop: vindDossiersZonderMjop(dossiers),
    dossiersZonderEnergie: vindDossiersZonderEnergie(dossiers),
    dossiersMetOnbehandeldeSignalen: vindDossiersMetOnbehandeldeSignalen(dossiers),
    dossiersKlaarVoorAdvies: vindDossiersKlaarVoorAdvies(dossiers),
    dossiersKlaarVoorOfferte: vindDossiersKlaarVoorOfferte(dossiers, offertes),
  }
}

/** Vaste labels + korte toelichting per categorie, voor UI-weergave (één plek, geen losse strings her en der). */
export const VANDAAG_CATEGORIE_INFO = {
  offertesOpTeVolgen: { label: 'Offertes om op te volgen', toelichting: 'Verstuurd, geldigheid nog niet verstreken.' },
  offertesVerlopen: { label: 'Offertes verlopen', toelichting: 'Geldigheidsdatum is al verstreken, nog geen eindstatus.' },
  dossiersZonderMjop: { label: 'Dossiers zonder MJOP', toelichting: 'Open dossier, nog geen MJOP gekoppeld.' },
  dossiersZonderEnergie: { label: 'Dossiers zonder energiegegevens', toelichting: 'Open dossier, nog geen Energie-indicatie gekoppeld.' },
  dossiersMetOnbehandeldeSignalen: { label: 'Dossiers met onbehandelde signalen', toelichting: 'MJOP of Energie aanwezig, nog geen adviespunt vastgelegd.' },
  dossiersKlaarVoorAdvies: { label: 'Dossiers met advies in behandeling', toelichting: 'Adviespunten vastgelegd, dossier staat nog open.' },
  dossiersKlaarVoorOfferte: { label: 'Dossiers klaar voor offerte', toelichting: 'Advies afgerond, nog geen offerte opgesteld.' },
}
