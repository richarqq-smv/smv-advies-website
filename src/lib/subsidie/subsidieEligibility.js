/**
 * Pure beoordelingslogica voor één subsidiabele maatregel — geen database,
 * geen React, geen berekening (zie subsidieCalculator.js daarvoor). Hier
 * wordt uitsluitend bepaald: is er genoeg informatie, en voldoet wat we
 * weten aan de bekende voorwaarden? Nooit een gok, altijd een reden (zie
 * opdracht §3/38).
 *
 * Statusvolgorde (van onvoldoende info naar volledig):
 * 1. NIET_VOLDOENDE_GEGEVENS — basisgegevens (jaar/oppervlakte/Rd)
 *    ontbreken, er is nog geen zinnige uitspraak te doen.
 * 2. NIET_VAN_TOEPASSING — een expliciet, bekend gegeven sluit de
 *    maatregel uit (geen isolatie bevestigd, of Rd/oppervlakte onder een
 *    bekend minimum) — een harde, uitgelegde "nee", nooit een gok.
 * 3. CONTROLE_VEREIST — de basisgegevens zijn onvoldoende eenduidig om
 *    zelfs de eerste beoordeling te doen (bv. onbekend of isolatie
 *    daadwerkelijk is aangebracht, of geen regelset voor dit jaar).
 * 4. WAARSCHIJNLIJK_VAN_TOEPASSING — alle technische voorwaarden die deze
 *    engine kent zijn gecontroleerd en voldaan, maar de meldcode (een
 *    productspecifiek, niet hier te verifiëren gegeven) ontbreekt nog.
 * 5. VAN_TOEPASSING — alles hierboven plus een bekende meldcode; de
 *    uiteindelijke vaststelling blijft altijd aan RVO (opdracht §63).
 */
import { vindRegel } from './isdeIsolatieRegels.js'

export const SUBSIDIE_STATUSSEN = {
  VAN_TOEPASSING: 'van_toepassing',
  WAARSCHIJNLIJK_VAN_TOEPASSING: 'waarschijnlijk_van_toepassing',
  CONTROLE_VEREIST: 'controle_vereist',
  NIET_VOLDOENDE_GEGEVENS: 'niet_voldoende_gegevens',
  NIET_VAN_TOEPASSING: 'niet_van_toepassing',
  // Gereserveerd voor een toekomstige maatregel met een harde, bekende
  // precondition die niet in deze vijf past (bv. "alleen bestaande bouw,
  // geen nieuwbouw") — voor dakisolatie/gevelisolatie nu niet nodig.
  VOORWAARDE_ONTBREEKT: 'voorwaarde_ontbreekt',
}

export const SUBSIDIE_STATUS_LABELS = {
  [SUBSIDIE_STATUSSEN.VAN_TOEPASSING]: 'Subsidie van toepassing',
  [SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING]: 'Waarschijnlijk van toepassing',
  [SUBSIDIE_STATUSSEN.CONTROLE_VEREIST]: 'Controle vereist',
  [SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS]: 'Niet voldoende gegevens',
  [SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING]: 'Niet van toepassing',
  [SUBSIDIE_STATUSSEN.VOORWAARDE_ONTBREEKT]: 'Voorwaarde ontbreekt',
}

function ontbrekendeGegevensVoor({ uitvoeringsjaar, oppervlakteM2, technischeWaarde, meldcode, isolatieBevestigd }, maatregelKey) {
  const lijst = []
  if (!uitvoeringsjaar) lijst.push('Uitvoeringsjaar')
  if (isolatieBevestigd === 'onbekend') lijst.push('Bevestiging dat isolatie onderdeel is van de maatregel')
  if (oppervlakteM2 == null) lijst.push(`Oppervlakte (${maatregelKey})`)
  if (technischeWaarde == null) lijst.push(`Isolatiewaarde (Rd/U-waarde) (${maatregelKey})`)
  if (!meldcode) lijst.push(`Meldcode (${maatregelKey})`)
  return lijst
}

/**
 * Doelgroepen anders dan eigenaar-bewoner (VvE → SVVE, verhuurder/overig
 * → SVOH, zakelijk pand → EIA/MIA/Vamil) kennen een eigen regeling met
 * eigen tarieven — niet bevestigd in deze engine (opdracht §2/§12/§13:
 * expliciet onderscheid maken, maar nooit een tarieventabel verzinnen die
 * niet betrouwbaar is vastgesteld). Een niet-standaard doelgroep levert
 * daarom altijd Controle vereist op, vóórdat er naar technische
 * volledigheid wordt gekeken.
 *
 * "zakelijk" (EIA/MIA/Vamil-uitbreidingsronde, 2026-10-09): ISDE in deze
 * engine is onderzocht voor woningeigenaren (zie isdeIsolatieRegels.js'
 * eigen bronvermelding) — voor een zakelijk pand (kantoor/horeca/
 * bedrijfshal e.d.) is dat normaliter niet de juiste regeling. In plaats
 * van die mismatch te verbergen achter een generieke "niet geïmplementeerd"-
 * tekst, verwijst de redengeving expliciet door naar de EIA/MIA/Vamil-
 * sectie op dezelfde pagina (fiscaleKoppeling.js), die wél voor zakelijke
 * panden is onderzocht.
 */
const DOELGROEP_LABELS = {
  vve: 'VvE (mogelijk SVVE)',
  overig: 'verhuurder/overige doelgroep (mogelijk SVOH)',
  zakelijk: 'zakelijk pand/ondernemer',
}

/**
 * Beoordeelt één maatregel voor één dossier. `specificatie` is de
 * admin-ingevoerde technische input (dossier_subsidie_specificaties):
 * `{ uitvoeringsjaar, oppervlakteM2, technischeWaarde, meldcode,
 * isolatieBevestigd }`. Geeft altijd een object terug met `status`,
 * `redenen` (waarom, opdracht §38), `ontbrekendeGegevens` (opdracht
 * §11/39) en `regel` (de gevonden regelset, of `null`) — nooit een crash
 * op onvolledige input.
 */
export function beoordeelMaatregel({ maatregelKey, specificatie = {} } = {}) {
  const { uitvoeringsjaar = null, oppervlakteM2 = null, technischeWaarde = null, meldcode = null, isolatieBevestigd = 'onbekend', doelgroep = 'eigenaar_bewoner' } = specificatie
  const ontbrekendeGegevens = ontbrekendeGegevensVoor({ uitvoeringsjaar, oppervlakteM2, technischeWaarde, meldcode, isolatieBevestigd }, maatregelKey)

  if (doelgroep === 'zakelijk') {
    return {
      status: SUBSIDIE_STATUSSEN.CONTROLE_VEREIST,
      redenen: [
        'Doelgroep zakelijk pand/ondernemer — ISDE in deze engine is onderzocht voor woningeigenaren en is normaliter niet van toepassing op een zakelijk pand. Bekijk de EIA/MIA/Vamil-sectie op deze pagina voor de fiscale regelingen die wél voor zakelijke panden zijn onderzocht.',
      ],
      ontbrekendeGegevens,
      regel: null,
    }
  }

  if (doelgroep && doelgroep !== 'eigenaar_bewoner') {
    return {
      status: SUBSIDIE_STATUSSEN.CONTROLE_VEREIST,
      redenen: [`Doelgroep ${DOELGROEP_LABELS[doelgroep] ?? doelgroep} — deze regeling is nog niet in deze engine geïmplementeerd. Controleer de officiële voorwaarden voor deze doelgroep op rvo.nl voordat u verder gaat.`],
      ontbrekendeGegevens,
      regel: null,
    }
  }

  // Expliciete adviseursbevestiging weegt zwaarder dan ontbrekende techniek:
  // als "nee" is bevestigd, is verder rekenen zinloos (opdracht §75/76).
  if (isolatieBevestigd === 'nee') {
    return {
      status: SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING,
      redenen: ['De adviseur heeft bevestigd dat er geen isolatie is aangebracht bij deze maatregel.'],
      ontbrekendeGegevens,
      regel: null,
    }
  }

  if (!uitvoeringsjaar || oppervlakteM2 == null || technischeWaarde == null) {
    return {
      status: SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS,
      redenen: ['Uitvoeringsjaar, oppervlakte en isolatiewaarde zijn nog niet allemaal bekend — subsidie kan nog niet worden bepaald.'],
      ontbrekendeGegevens,
      regel: null,
    }
  }

  const regel = vindRegel(uitvoeringsjaar, maatregelKey)
  if (!regel) {
    return {
      status: SUBSIDIE_STATUSSEN.CONTROLE_VEREIST,
      redenen: [`Voor uitvoeringsjaar ${uitvoeringsjaar} is nog geen regelset voor deze maatregel vastgelegd — officiële regeling controleren.`],
      ontbrekendeGegevens,
      regel: null,
    }
  }

  if (isolatieBevestigd === 'onbekend') {
    return {
      status: SUBSIDIE_STATUSSEN.CONTROLE_VEREIST,
      redenen: ['Controle vereist — isolatiemaatregel niet expliciet vastgesteld door de adviseur.'],
      ontbrekendeGegevens,
      regel,
    }
  }

  // Rd-waarde (isolatie): hoger is beter, dus een minimum geldt. U-waarde
  // (glas): lager is beter, dus een maximum geldt — de richting staat per
  // regel vast (`technischeEisRichting`), nooit aangenomen (opdracht §3).
  if (regel.technischeEisRichting === 'u_maximum') {
    if (technischeWaarde > regel.maximumU) {
      return {
        status: SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING,
        redenen: [`Niet subsidiabel omdat de ingevoerde U-waarde (${technischeWaarde}) niet aan de maximale eis voldoet (U ≤ ${regel.maximumU}).`],
        ontbrekendeGegevens,
        regel,
      }
    }
  } else if (technischeWaarde < regel.minimumRd) {
    return {
      status: SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING,
      redenen: [`Niet subsidiabel omdat de ingevoerde isolatiewaarde (Rd ${technischeWaarde}) niet aan de minimale eis voldoet (Rd ≥ ${regel.minimumRd}).`],
      ontbrekendeGegevens,
      regel,
    }
  }

  if (regel.minOppervlakteM2 != null && oppervlakteM2 < regel.minOppervlakteM2) {
    return {
      status: SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING,
      redenen: [`Niet subsidiabel omdat de oppervlakte (${oppervlakteM2} m²) onder het minimum van ${regel.minOppervlakteM2} m² ligt.`],
      ontbrekendeGegevens,
      regel,
    }
  }

  if (!meldcode) {
    return {
      status: SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING,
      redenen: [
        'De bekende voorwaarden (jaar, oppervlakte, isolatiewaarde) zijn gecontroleerd en voldaan. Nog niet te berekenen omdat de meldcode ontbreekt — vraag de leverancier/installateur om de officiële meldcode van het toegepaste product.',
      ],
      ontbrekendeGegevens,
      regel,
    }
  }

  return {
    status: SUBSIDIE_STATUSSEN.VAN_TOEPASSING,
    redenen: ['Alle bekende voorwaarden zijn gecontroleerd en voldaan; de daadwerkelijke subsidievaststelling wordt door RVO gedaan.'],
    ontbrekendeGegevens,
    regel,
  }
}
