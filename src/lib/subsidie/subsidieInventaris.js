/**
 * Centrale, leesbare inventaris van alle onderzochte subsidiecategorieën
 * binnen de scope van SMV Advies (gerichte inhoudelijke uitbreidingsronde,
 * 2026-10-08) — opdracht §8: "een toekomstige developer moet meteen
 * kunnen zien welke subsidies deze engine ondersteunt." Puur data, geen
 * logica; `subsidieDocumentData.js` gebruikt dit om niet-ondersteunde
 * maar wél relevante categorieën EXPLICIET in het document te vermelden
 * (opdracht §9: nooit stilzwijgend weglaten, dat oogt als "geen subsidie").
 *
 * status:
 * - 'geimplementeerd'   — regel/tarief/voorwaarden betrouwbaar vastgelegd,
 *                         `maatregelKey` verwijst naar de echte engine-sleutel.
 * - 'controle_vereist'  — officiële regeling bestaat, maar betrouwbare
 *                         implementatie is (nog) niet mogelijk: ontbrekende
 *                         tarieven, ontbrekende doelgroep-infrastructuur in
 *                         de bestaande applicatie, of allebei.
 * - 'niet_subsidiabel'  — onderzocht; geen zelfstandige ISDE/SVVE/SVOH-
 *                         categorie gevonden voor deze maatregel.
 */
export const SUBSIDIE_INVENTARIS = [
  { categorie: 'Dakisolatie', status: 'geimplementeerd', maatregelKey: 'dakisolatie' },
  { categorie: 'Gevelisolatie / spouwmuurisolatie', status: 'geimplementeerd', maatregelKey: 'gevelisolatie' },
  { categorie: 'Vloerisolatie', status: 'geimplementeerd', maatregelKey: 'vloerisolatie' },
  { categorie: 'Bodemisolatie', status: 'geimplementeerd', maatregelKey: 'bodemisolatie' },
  { categorie: 'HR++ glas', status: 'geimplementeerd', maatregelKey: 'glasHrpp' },
  { categorie: 'Triple glas', status: 'geimplementeerd', maatregelKey: 'glasTriple' },
  {
    categorie: 'Kozijnen/deuren (zonder glas)',
    status: 'niet_subsidiabel',
    reden: 'Geen zelfstandige ISDE-categorie gevonden — kozijnen zijn alleen relevant als voorwaarde bij het triple-glastarief (zie glasTriple), niet als losse maatregel.',
  },
  {
    categorie: 'Ventilatie (mechanische ventilatie met warmteterugwinning)',
    status: 'geimplementeerd',
    maatregelKey: 'ventilatie',
    reden: 'Alleen subsidiabel in combinatie met minimaal één andere subsidiabele isolatiemaatregel in hetzelfde dossier (harde RVO-voorwaarde).',
  },
  { categorie: 'Hybride warmtepomp', status: 'geimplementeerd', maatregelKey: 'warmtepomp_hybride' },
  { categorie: 'Elektrische (all-electric) warmtepomp', status: 'geimplementeerd', maatregelKey: 'warmtepomp_elektrisch' },
  { categorie: 'Zonneboiler', status: 'geimplementeerd', maatregelKey: 'zonneboiler' },
  {
    categorie: 'SVVE (verduurzaming VvE-gebouwen)',
    status: 'controle_vereist',
    reden:
      'Officiële regeling bestaat (RVO SVVE, looptijd t/m 2030), maar deze applicatie heeft geen rechtsvorm-/doelgroepstructuur om een dossier betrouwbaar als VvE te herkennen, en de per-maatregel SVVE-tarieven/-maxima zijn niet onafhankelijk bevestigd. Dossiers met doelgroep "vve" krijgen daarom "Controle vereist" (zie subsidieEligibility.js).',
  },
  {
    categorie: 'SVOH (verduurzaming en onderhoud huurwoningen)',
    status: 'controle_vereist',
    reden:
      'Officiële regeling bestaat (RVO SVOH, looptijd t/m 2029), maar valt buiten de eigenaar-bewoner-scope die deze applicatie tot nu toe ondersteunt; bedragen/maxima zijn niet onafhankelijk bevestigd. Dossiers met doelgroep "overig" krijgen daarom "Controle vereist".',
  },
  {
    categorie: 'Regionale/gemeentelijke/provinciale subsidie',
    status: 'controle_vereist',
    reden: 'Geen betrouwbare, actueel doorzoekbare database van lokale regelingen beschikbaar — wordt per dossier altijd expliciet als "Lokale subsidiecontrole vereist" getoond, nooit als "geen subsidie".',
  },
]

/** Alles behalve 'geimplementeerd' — gebruikt om het document een expliciete "niet-ondersteunde maatregelen"-sectie te geven (opdracht §9). */
export function nietOndersteundeCategorieen() {
  return SUBSIDIE_INVENTARIS.filter((r) => r.status !== 'geimplementeerd')
}
