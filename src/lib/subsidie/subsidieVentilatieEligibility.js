/**
 * Pure beoordelingslogica voor de ventilatiemaatregel — zelfde statusset
 * als subsidieEligibility.js (hergebruikt). Beoordeelt UITSLUITEND de
 * ventilatiemaatregel zelf (jaar/meldcode/bevestiging); de harde
 * voorwaarde "moet gecombineerd worden met isolatie" wordt hier bewust
 * NIET gecontroleerd — dat vereist kennis van de ANDERE maatregelen in
 * het dossier, die deze functie niet krijgt (opzettelijk: één maatregel
 * per functie, zie isdeVentilatieRegel.js). Die combinatie-eis wordt
 * toegepast in subsidieDocumentData.js, dat alle maatregelen samen ziet.
 */
import { vindVentilatieRegel } from './isdeVentilatieRegel.js'
import { SUBSIDIE_STATUSSEN } from './subsidieEligibility.js'

function ontbrekendeGegevensVoor({ uitvoeringsjaar, meldcode, isolatieBevestigd }) {
  const lijst = []
  if (!uitvoeringsjaar) lijst.push('Uitvoeringsjaar')
  if (isolatieBevestigd === 'onbekend') lijst.push('Bevestiging dat de ventilatiemaatregel daadwerkelijk wordt/is geïnstalleerd')
  if (!meldcode) lijst.push('Meldcode (ventilatie)')
  return lijst
}

/** `specificatie`: `{ uitvoeringsjaar, meldcode, isolatieBevestigd }` (isolatieBevestigd hergebruikt als "wordt dit geïnstalleerd?", zelfde patroon als bij apparaten). */
export function beoordeelVentilatie({ specificatie = {} } = {}) {
  const { uitvoeringsjaar = null, meldcode = null, isolatieBevestigd = 'onbekend' } = specificatie
  const ontbrekendeGegevens = ontbrekendeGegevensVoor({ uitvoeringsjaar, meldcode, isolatieBevestigd })

  if (isolatieBevestigd === 'nee') {
    return {
      status: SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING,
      redenen: ['De adviseur heeft bevestigd dat deze ventilatiemaatregel niet wordt/is geïnstalleerd.'],
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

  const regel = vindVentilatieRegel(uitvoeringsjaar)
  if (!regel) {
    return {
      status: SUBSIDIE_STATUSSEN.CONTROLE_VEREIST,
      redenen: [`Voor uitvoeringsjaar ${uitvoeringsjaar} is nog geen regelset voor ventilatie vastgelegd — officiële regeling controleren.`],
      ontbrekendeGegevens,
      regel: null,
    }
  }

  if (isolatieBevestigd === 'onbekend') {
    return {
      status: SUBSIDIE_STATUSSEN.CONTROLE_VEREIST,
      redenen: ['Controle vereist — nog niet bevestigd door de adviseur of deze ventilatiemaatregel daadwerkelijk wordt/is geïnstalleerd.'],
      ontbrekendeGegevens,
      regel,
    }
  }

  if (!meldcode) {
    return {
      status: SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING,
      redenen: ['Geïnstalleerd/te installeren is bevestigd. Nog niet te berekenen omdat de meldcode van de ventilatie-eenheid ontbreekt — zoek het apparaat op in de RVO-meldcodelijst.'],
      ontbrekendeGegevens,
      regel,
    }
  }

  return {
    status: SUBSIDIE_STATUSSEN.VAN_TOEPASSING,
    redenen: [
      'Alle bekende voorwaarden voor de ventilatiemaatregel zelf zijn gecontroleerd en voldaan. Let op: ventilatie is alleen daadwerkelijk subsidiabel in combinatie met minimaal één subsidiabele isolatiemaatregel in dit dossier.',
    ],
    ontbrekendeGegevens,
    regel,
  }
}
