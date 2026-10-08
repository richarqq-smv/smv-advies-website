/**
 * Pure beoordelingslogica voor apparaatmaatregelen (warmtepomp,
 * zonneboiler) — zelfde statusmodel/-labels als subsidieEligibility.js
 * (hergebruikt, geen tweede statusset), maar een ander besluitpad: er is
 * geen oppervlakte/tarief om te controleren, het bedrag IS de invoer
 * (rechtstreeks overgenomen van de officiële meldcodepagina van het
 * specifieke apparaat door de adviseur, zie isdeApparaatRegels.js).
 */
import { vindApparaatRegel } from './isdeApparaatRegels.js'
import { SUBSIDIE_STATUSSEN } from './subsidieEligibility.js'

function ontbrekendeGegevensVoor({ uitvoeringsjaar, meldcode, bedrag, bronUrl, isolatieBevestigd }, apparaatKey) {
  const lijst = []
  if (!uitvoeringsjaar) lijst.push('Uitvoeringsjaar')
  if (isolatieBevestigd === 'onbekend') lijst.push(`Bevestiging dat dit apparaat daadwerkelijk wordt/is geïnstalleerd (${apparaatKey})`)
  if (!meldcode) lijst.push(`Meldcode (${apparaatKey})`)
  if (bedrag == null) lijst.push(`Subsidiebedrag van de officiële meldcodepagina (${apparaatKey})`)
  if (!bronUrl) lijst.push(`URL van de officiële meldcodepagina (${apparaatKey})`)
  return lijst
}

/**
 * Beoordeelt één apparaatmaatregel. `specificatie`:
 * `{ uitvoeringsjaar, meldcode, bedrag, bronUrl, isolatieBevestigd }` —
 * `isolatieBevestigd` is de hergebruikte kolom uit
 * dossier_subsidie_specificaties ('ja'/'nee'/'onbekend'), hier gelezen
 * als "is dit apparaat daadwerkelijk geïnstalleerd/wordt het dat".
 */
export function beoordeelApparaatMaatregel({ apparaatKey, specificatie = {} } = {}) {
  const { uitvoeringsjaar = null, meldcode = null, bedrag = null, bronUrl = null, isolatieBevestigd = 'onbekend' } = specificatie
  const ontbrekendeGegevens = ontbrekendeGegevensVoor({ uitvoeringsjaar, meldcode, bedrag, bronUrl, isolatieBevestigd }, apparaatKey)
  const infopagina = vindApparaatRegel(apparaatKey)?.infopagina ?? null

  if (isolatieBevestigd === 'nee') {
    return {
      status: SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING,
      redenen: ['De adviseur heeft bevestigd dat dit apparaat niet wordt/is geïnstalleerd.'],
      ontbrekendeGegevens,
      regel: null,
    }
  }

  if (!uitvoeringsjaar) {
    return {
      status: SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS,
      redenen: ['Uitvoeringsjaar is nog niet bekend — subsidie kan nog niet worden bepaald.'],
      ontbrekendeGegevens,
      regel: null,
    }
  }

  if (isolatieBevestigd === 'onbekend') {
    return {
      status: SUBSIDIE_STATUSSEN.CONTROLE_VEREIST,
      redenen: ['Controle vereist — nog niet bevestigd door de adviseur of dit apparaat daadwerkelijk wordt/is geïnstalleerd.'],
      ontbrekendeGegevens,
      regel: infopagina ? { scheme: 'ISDE', bron: infopagina } : null,
    }
  }

  if (!meldcode || bedrag == null || !bronUrl) {
    return {
      status: SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING,
      redenen: [
        'Geïnstalleerd/te installeren is bevestigd. Nog niet te berekenen omdat de meldcode, het subsidiebedrag en/of de bron-URL van het specifieke apparaat nog ontbreken — zoek het exacte apparaat op in de RVO-meldcodelijst en vul het daar genoemde bedrag in.',
      ],
      ontbrekendeGegevens,
      regel: infopagina ? { scheme: 'ISDE', bron: infopagina } : null,
    }
  }

  return {
    status: SUBSIDIE_STATUSSEN.VAN_TOEPASSING,
    redenen: ['Meldcode, subsidiebedrag en bron zijn ingevuld vanaf de officiële meldcodepagina van dit apparaat; de daadwerkelijke subsidievaststelling wordt door RVO gedaan.'],
    ontbrekendeGegevens,
    // `bron` blijft de algemene, met een bekende controledatum geverifieerde
    // RVO-informatiepagina (isdeApparaatRegels.js); `productBronUrl` is de
    // specifieke meldcodepagina die de adviseur zelf heeft overgenomen —
    // apart gehouden omdat van die ene pagina geen eigen controledatum is
    // vastgelegd (geen datum verzinnen, opdracht §20).
    regel: { scheme: 'ISDE', bron: infopagina, productBronUrl: bronUrl },
  }
}
