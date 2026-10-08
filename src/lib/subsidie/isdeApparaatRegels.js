/**
 * Apparaatmaatregelen (warmtepomp, zonneboiler) binnen ISDE — bewust GEEN
 * tarieventabel zoals isdeIsolatieRegels.js. RVO publiceert voor deze
 * apparaten geen uniform €/eenheid-bedrag: het subsidiebedrag is per
 * geregistreerd product (meldcode) vastgesteld, afhankelijk van type,
 * vermogen en energielabel (bevestigd op de officiële RVO-pagina's
 * hieronder, gecontroleerd 2026-10-08 — "de subsidie hangt af van het
 * type warmtepomp, de energie-labelklasse en het vermogen"). Een eigen
 * formule verzinnen (bijvoorbeeld "startbedrag + X per kW") zou een
 * gegokt bedrag zijn zodra RVO die formule aanpast — opdracht §3 verbiedt
 * dat expliciet. Deze engine vraagt daarom altijd het daadwerkelijke
 * bedrag en de meldcode die de adviseur rechtstreeks overneemt van de
 * officiële meldcodepagina van dát ene apparaat, inclusief de URL van die
 * pagina als bron (opdracht §19: "geen nep-links").
 *
 * Bronnen:
 * - Warmtepomp: https://www.rvo.nl/subsidies-financiering/isde/
 *   woningeigenaren/warmtepomp
 * - Zonneboiler: https://www.rvo.nl/subsidies-financiering/isde/
 *   woningeigenaren/zonneboiler
 */

const WARMTEPOMP_INFOPAGINA = {
  label: 'RVO — ISDE Warmtepomp woningeigenaren',
  url: 'https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/warmtepomp',
  gecontroleerdOp: '2026-10-08',
}

const ZONNEBOILER_INFOPAGINA = {
  label: 'RVO — ISDE Zonneboiler woningeigenaren',
  url: 'https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/zonneboiler',
  gecontroleerdOp: '2026-10-08',
}

export const ISDE_APPARAAT_REGELS = {
  warmtepomp_hybride: {
    scheme: 'ISDE',
    maatregelKey: 'warmtepomp_hybride',
    label: 'Hybride warmtepomp',
    infopagina: WARMTEPOMP_INFOPAGINA,
  },
  warmtepomp_elektrisch: {
    scheme: 'ISDE',
    maatregelKey: 'warmtepomp_elektrisch',
    label: 'Elektrische (all-electric) warmtepomp',
    infopagina: WARMTEPOMP_INFOPAGINA,
  },
  zonneboiler: {
    scheme: 'ISDE',
    maatregelKey: 'zonneboiler',
    label: 'Zonneboiler',
    infopagina: ZONNEBOILER_INFOPAGINA,
  },
}

export const ONDERSTEUNDE_APPARAATMAATREGELEN = ['warmtepomp_hybride', 'warmtepomp_elektrisch', 'zonneboiler']

export const APPARAAT_LABELS = {
  warmtepomp_hybride: 'Hybride warmtepomp',
  warmtepomp_elektrisch: 'Elektrische (all-electric) warmtepomp',
  zonneboiler: 'Zonneboiler',
}

/** Geeft de infopagina/bron voor dit apparaat, of `null` als onbekend. */
export function vindApparaatRegel(apparaatKey) {
  return ISDE_APPARAAT_REGELS[apparaatKey] ?? null
}
