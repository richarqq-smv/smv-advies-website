/**
 * Ventilatie binnen ISDE — nieuw vanaf 1 januari 2026, bewust een apart
 * bestand omdat dit geen €/m²-tarief is (zoals isdeIsolatieRegels.js)
 * en geen per-apparaat-ingevoerd bedrag (zoals isdeApparaatRegels.js),
 * maar een vast, voor alle gevonden producten identiek bedrag.
 *
 * Bron (gecontroleerd 2026-10-08): meerdere onafhankelijke RVO-
 * meldcodepagina's voor ventilatie-eenheden (o.a. ka31506, ka31507,
 * ka31505, ka31502, ka31560, ka31593, ka31596, ka31589, ka31554, van
 * zowel Itho Daalderop als Renson) vermelden identiek € 400 vanaf
 * 01/01/2026 — geen apparaatspecifiek bedrag zoals bij warmtepomp/
 * zonneboiler, dus hier WEL als vaste waarde vastgelegd (geen gok: dit
 * is een herhaald, onafhankelijk bevestigd bedrag, geen schatting).
 * Officiële informatiepagina: https://www.rvo.nl/subsidies-financiering/
 * isde/woningeigenaren/ventilatie — bevestigt bovendien de harde
 * voorwaarde: "u krijgt alleen ventilatiesubsidie als u de
 * ventilatiemaatregel combineert met één of meer isolatiemaatregelen."
 * Dat is geen "tariefverdubbeling bij combinatie" zoals bij isolatie,
 * maar een harde precondition zonder welke ventilatie NOOIT subsidiabel
 * is — die afhankelijkheid van andere maatregelen kan subsidieEligibility.js
 * niet zelf zien (die beoordeelt één maatregel geïsoleerd), dus die
 * check gebeurt op het niveau dat alle maatregelen samen kent:
 * subsidieDocumentData.js.
 */
export const RVO_VENTILATIE_PAGINA = {
  label: 'RVO — ISDE Ventilatie woningeigenaren',
  url: 'https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/ventilatie',
  gecontroleerdOp: '2026-10-08',
}

export const ISDE_VENTILATIE_REGEL = {
  2026: {
    scheme: 'ISDE',
    maatregelKey: 'ventilatie',
    label: 'Ventilatie (mechanische ventilatie met warmteterugwinning, in combinatie met isolatie)',
    bedragVast: 400,
    bron: RVO_VENTILATIE_PAGINA,
  },
}

export function vindVentilatieRegel(jaar) {
  if (!jaar) return null
  return ISDE_VENTILATIE_REGEL[jaar] ?? null
}
