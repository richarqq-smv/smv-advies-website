/**
 * Pure data-assembly voor de subsidiebegeleiding — zelfde rol als
 * bouwAdviesrapportData() in lib/klantOmgeving/adviesrapport.js: bouwt
 * uitsluitend een gestructureerd data-object, vult zelf geen document,
 * roept geen AI aan, verzint geen bedragen die niet uit de regelset of
 * ingevoerde specificaties komen. Dit ÉÉN object is de bron voor zowel
 * het scherm (SubsidieBegeleiding.jsx) als het gegenereerde subsidieblad
 * (subsidieDocumentHtml.js) — ze kunnen dus nooit uit elkaar lopen.
 */
import { ONDERSTEUNDE_MAATREGELEN, MAATREGEL_LABELS } from './isdeIsolatieRegels.js'
import { ONDERSTEUNDE_APPARAATMAATREGELEN, APPARAAT_LABELS } from './isdeApparaatRegels.js'
import { beoordeelMaatregel, SUBSIDIE_STATUSSEN, SUBSIDIE_STATUS_LABELS } from './subsidieEligibility.js'
import { beoordeelApparaatMaatregel } from './subsidieApparaatEligibility.js'
import { beoordeelVentilatie } from './subsidieVentilatieEligibility.js'
import { berekenCombinatie } from './subsidieCalculator.js'
import { controleerBronnen } from './subsidieBronControle.js'
import { nietOndersteundeCategorieen } from './subsidieInventaris.js'
import { vindRelevanteFiscaleBedrijfsmiddelen } from './fiscaleKoppeling.js'

const BEREKENBAAR_VOOR_COMBINATIE = new Set([SUBSIDIE_STATUSSEN.VAN_TOEPASSING, SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING])

function formatDatum(input) {
  const datum = input ? new Date(input) : new Date()
  if (Number.isNaN(datum.getTime())) return null
  return datum.toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
}

function bouwKlantgegevens(dossier) {
  const klant = dossier?.klanten ?? null
  const contact = dossier?.contactpersonen ?? null
  const pand = dossier?.panden ?? null
  const klantnaam = klant?.bedrijfsnaam || klant?.naam || contact?.naam || null
  const adresregel = pand?.adres || null
  const plaatsregel = [pand?.postcode, pand?.plaats].filter(Boolean).join(' ') || null
  const pandadres = [adresregel, plaatsregel].filter(Boolean).join(', ') || null
  return { klantnaam, pandadres, postcode: pand?.postcode ?? null, plaats: pand?.plaats ?? null }
}

/**
 * Regionale/lokale subsidies (opdracht §12/13) — bewust GEEN
 * lokale-regelingen-tabel: honderden gemeentelijke/provinciale regelingen
 * hardcoden is niet betrouwbaar bij te houden. In plaats daarvan een
 * expliciete, eerlijke status: "geen regeling gevonden" is nooit
 * hetzelfde als "er bestaat geen regeling" (opdracht §12, laatste zin).
 */
function bouwRegionaleSectie({ postcode, plaats }) {
  if (!postcode && !plaats) {
    return { locatieBekend: false, postcode: null, plaats: null, boodschap: 'Regionale subsidie niet te bepalen — postcode/plaats van het pand ontbreken nog in het dossier.' }
  }
  return {
    locatieBekend: true,
    postcode,
    plaats,
    boodschap: `Lokale subsidiecontrole vereist — controleer of de gemeente en/of provincie van ${[postcode, plaats].filter(Boolean).join(' ')} een eigen verduurzamingssubsidie heeft. Dit is niet automatisch gecontroleerd.`,
  }
}

/**
 * Bouwt uit de bestaande opname-waarnemingen (lib/klantOmgeving/opname.js,
 * onderdeel 'dak'/'gevel') een puur ter-referentie-tonende lijst — nooit
 * geïnterpreteerd als subsidie-input (opdracht §12/75). `waarnemingen` is
 * de platte lijst over alle opnames van dit dossier; deze functie filtert
 * zelf op onderdeel.
 */
function opnameReferentie(waarnemingen, onderdeel) {
  return (waarnemingen ?? [])
    .filter((w) => w.onderdeel === onderdeel)
    .map((w) => ({
      huidigeSituatie: w.huidige_situatie || null,
      maatvoering: w.maatvoering || null,
      mogelijkeMaatregel: w.mogelijke_maatregel || null,
    }))
    .filter((w) => w.huidigeSituatie || w.maatvoering || w.mogelijkeMaatregel)
}

/**
 * Bouwt de volledige, maatregel-specifieke subsidiedata voor één maatregel:
 * beoordeling (eligibility), ontbrekende gegevens, en — als combinatie al
 * bekend is — het berekeningsresultaat van berekenCombinatie().
 */
function bouwMaatregelData({ maatregelKey, specificatie, combinatieResultaat, opnameWaarnemingen }) {
  const eligibility = beoordeelMaatregel({ maatregelKey, specificatie: specificatie ?? {} })
  return {
    maatregelKey,
    soort: 'isolatie',
    label: MAATREGEL_LABELS[maatregelKey],
    status: eligibility.status,
    statusLabel: SUBSIDIE_STATUS_LABELS[eligibility.status],
    redenen: eligibility.redenen,
    ontbrekendeGegevens: eligibility.ontbrekendeGegevens,
    regel: eligibility.regel,
    specificatie: specificatie ?? null,
    berekening: combinatieResultaat ?? null,
    opnameReferentie: opnameWaarnemingen ?? [],
  }
}

/** Zelfde rol als bouwMaatregelData(), maar voor apparaatmaatregelen (warmtepomp/zonneboiler). */
function bouwApparaatMaatregelData({ apparaatKey, specificatie, combinatieResultaat, opnameWaarnemingen }) {
  const eligibility = beoordeelApparaatMaatregel({ apparaatKey, specificatie: specificatie ?? {} })
  return {
    maatregelKey: apparaatKey,
    soort: 'apparaat',
    label: APPARAAT_LABELS[apparaatKey],
    status: eligibility.status,
    statusLabel: SUBSIDIE_STATUS_LABELS[eligibility.status],
    redenen: eligibility.redenen,
    ontbrekendeGegevens: eligibility.ontbrekendeGegevens,
    regel: eligibility.regel,
    specificatie: specificatie ?? null,
    berekening: combinatieResultaat ?? null,
    opnameReferentie: opnameWaarnemingen ?? [],
  }
}

/**
 * Zelfde rol als bouwMaatregelData(), maar voor ventilatie — met de harde
 * voorwaarde (RVO-pagina, zie isdeVentilatieRegel.js) dat ventilatie
 * uitsluitend subsidiabel is in combinatie met minimaal één subsidiabele
 * isolatiemaatregel. `heeftIsolatieContext` is door de aanroeper al
 * bepaald (op basis van ALLE isolatiemaatregelen in dit dossier) — deze
 * functie downgradet de eigen (geïsoleerde) beoordeling van
 * beoordeelVentilatie() als die voorwaarde niet is vervuld, in plaats
 * van een status te tonen die feitelijk niet houdbaar is.
 */
function bouwVentilatieMaatregelData({ specificatie, combinatieResultaat, heeftIsolatieContext }) {
  const eligibility = beoordeelVentilatie({ specificatie: specificatie ?? {} })
  const moetDowngraden = !heeftIsolatieContext && BEREKENBAAR_VOOR_COMBINATIE.has(eligibility.status)

  if (moetDowngraden) {
    return {
      maatregelKey: 'ventilatie',
      soort: 'ventilatie',
      label: 'Ventilatie',
      status: SUBSIDIE_STATUSSEN.CONTROLE_VEREIST,
      statusLabel: SUBSIDIE_STATUS_LABELS[SUBSIDIE_STATUSSEN.CONTROLE_VEREIST],
      redenen: ['Controle vereist — ventilatie is bij RVO alleen subsidiabel in combinatie met minimaal één subsidiabele isolatiemaatregel; die is in dit dossier nog niet vastgesteld.'],
      ontbrekendeGegevens: eligibility.ontbrekendeGegevens,
      regel: eligibility.regel,
      specificatie: specificatie ?? null,
      berekening: null,
      opnameReferentie: [],
    }
  }

  return {
    maatregelKey: 'ventilatie',
    soort: 'ventilatie',
    label: 'Ventilatie',
    status: eligibility.status,
    statusLabel: SUBSIDIE_STATUS_LABELS[eligibility.status],
    redenen: eligibility.redenen,
    ontbrekendeGegevens: eligibility.ontbrekendeGegevens,
    regel: eligibility.regel,
    specificatie: specificatie ?? null,
    berekening: combinatieResultaat ?? null,
    opnameReferentie: [],
  }
}

// Welk opname-onderdeel (lib/klantOmgeving/opname.js, OPNAME_ONDERDELEN)
// puur ter referentie bij welke maatregel getoond wordt — nooit
// automatisch geïnterpreteerd als subsidie-input (opdracht §12/75).
// bodemisolatie heeft geen eigen onderdeel in het opnameformulier (de 17
// vaste onderdelen kennen alleen "vloer") — blijft daarom zonder referentie.
const OPNAME_ONDERDEEL_PER_MAATREGEL = {
  dakisolatie: 'dak',
  gevelisolatie: 'gevel',
  vloerisolatie: 'vloer',
  bodemisolatie: null,
  glasHrpp: 'glas',
  glasTriple: 'glas',
  warmtepomp_hybride: 'warmtepomp',
  warmtepomp_elektrisch: 'warmtepomp',
  zonneboiler: 'warmtapwater',
  ventilatie: 'ventilatie',
}

/**
 * Bouwt de volledige, sjabloon-onafhankelijke subsidiedata voor één
 * dossier. `specificatiesPerMaatregel` is een object `{ dakisolatie:
 * {...} | null, gevelisolatie: {...} | null }` met de admin-ingevoerde
 * technische input (dossier_subsidie_specificaties, camelCase velden:
 * uitvoeringsjaar/oppervlakteM2/technischeWaarde/meldcode/
 * isolatieBevestigd). `waarnemingen` is de platte lijst opname-
 * waarnemingen van dit dossier (puur ter referentie, zie hierboven).
 *
 * `uitvoeringsjaar` (apart van wat eventueel al per maatregel is
 * opgeslagen) is het dossierbrede jaar dat de adviseur op het
 * subsidiescherm kan instellen — ontbreekt dat, dan geldt voor elke
 * maatregel zonder eigen jaar automatisch "jaar ontbreekt" (opdracht §5).
 *
 * `mjopInsights`/`energieInsights` (EIA/MIA/Vamil-uitbreidingsronde,
 * 2026-10-09): optionele, AL DOOR DE AANROEPER BEREKENDE insight-arrays
 * (buildInsights()/buildEnergieInsights()) — zelfde patroon als
 * subsidieCheck.js hergebruikt voor de RVO-index-koppeling. Dit bestand
 * importeert die functies bewust niet zelf (lib/mjop/linking.js kan niet
 * door de kale node--test-runner worden opgelost, zie subsidieCheck.js's
 * moduledoc) — de aanroeper (AdminSubsidieBegeleiding.jsx, onder Vite)
 * berekent ze. Puur optioneel: zonder insights wordt `fiscaleRegelingen`
 * gewoon een lege array (geen crash, geen gok).
 */
export function bouwSubsidieDocumentData({
  dossier,
  specificatiesPerMaatregel = {},
  waarnemingen = [],
  uitvoeringsjaar = null,
  adviseurNaam = null,
  datum = null,
  mjopInsights = [],
  energieInsights = [],
} = {}) {
  const { klantnaam, pandadres, postcode, plaats } = bouwKlantgegevens(dossier)

  const isolatieRuw = ONDERSTEUNDE_MAATREGELEN.map((maatregelKey) => {
    const opgeslagen = specificatiesPerMaatregel[maatregelKey] ?? null
    // Het dossierbrede jaar vult alleen aan als de maatregel zelf nog geen
    // eigen jaar heeft — een al ingevuld maatregel-jaar wordt nooit overschreven.
    const specificatie = opgeslagen ? { ...opgeslagen, uitvoeringsjaar: opgeslagen.uitvoeringsjaar ?? uitvoeringsjaar } : uitvoeringsjaar ? { uitvoeringsjaar } : null
    return { maatregelKey, soort: 'isolatie', specificatie, aangeraakt: opgeslagen != null }
  })
  const apparaatRuw = ONDERSTEUNDE_APPARAATMAATREGELEN.map((apparaatKey) => {
    const opgeslagen = specificatiesPerMaatregel[apparaatKey] ?? null
    const specificatie = opgeslagen ? { ...opgeslagen, uitvoeringsjaar: opgeslagen.uitvoeringsjaar ?? uitvoeringsjaar } : uitvoeringsjaar ? { uitvoeringsjaar } : null
    return { maatregelKey: apparaatKey, soort: 'apparaat', specificatie, aangeraakt: opgeslagen != null }
  })
  const ventilatieOpgeslagen = specificatiesPerMaatregel.ventilatie ?? null
  const ventilatieSpecificatie = ventilatieOpgeslagen
    ? { ...ventilatieOpgeslagen, uitvoeringsjaar: ventilatieOpgeslagen.uitvoeringsjaar ?? uitvoeringsjaar }
    : uitvoeringsjaar
      ? { uitvoeringsjaar }
      : null
  const ventilatieAangeraakt = ventilatieOpgeslagen != null

  // Harde RVO-voorwaarde (isdeVentilatieRegel.js): ventilatie is alleen
  // subsidiabel in combinatie met minimaal één subsidiabele isolatie-
  // maatregel. Dat kan beoordeelVentilatie() niet zelf zien (die
  // beoordeelt één maatregel geïsoleerd) — hier, waar alle maatregelen
  // samen bekend zijn, wordt dat bepaald.
  const isolatieOnafhankelijkSubsidiabel = isolatieRuw.some(
    ({ aangeraakt, maatregelKey, specificatie }) => aangeraakt && BEREKENBAAR_VOOR_COMBINATIE.has(beoordeelMaatregel({ maatregelKey, specificatie: specificatie ?? {} }).status),
  )

  const alleRuw = [...isolatieRuw, ...apparaatRuw]

  // Alleen maatregelen waar de adviseur daadwerkelijk iets heeft ingevoerd
  // (een bestaande dossier_subsidie_specificaties-rij) tellen mee voor de
  // vraag "is er al een betrouwbaar totaalbedrag" — anders zou het totaal
  // nooit verschijnen zodra de engine een maatregel kent die deze adviseur
  // voor dit dossier nog niet eens heeft aangeraakt (bv. zonneboiler in een
  // dossier dat alleen over dakisolatie gaat). Ventilatie telt alleen mee
  // als de combinatievoorwaarde met isolatie al is vastgesteld — anders
  // zou het vaste €400-bedrag ten onrechte in het totaal meetellen.
  const combinatieInvoer = alleRuw
    .filter(({ aangeraakt }) => aangeraakt)
    .map(({ maatregelKey, soort, specificatie }) => ({
      maatregelKey,
      soort,
      eligibility:
        soort === 'apparaat'
          ? beoordeelApparaatMaatregel({ apparaatKey: maatregelKey, specificatie: specificatie ?? {} })
          : beoordeelMaatregel({ maatregelKey, specificatie: specificatie ?? {} }),
      oppervlakteM2: specificatie?.oppervlakteM2 ?? null,
      bedrag: specificatie?.bedrag ?? null,
    }))
  if (ventilatieAangeraakt && isolatieOnafhankelijkSubsidiabel) {
    const ventilatieEligibility = beoordeelVentilatie({ specificatie: ventilatieSpecificatie ?? {} })
    combinatieInvoer.push({
      maatregelKey: 'ventilatie',
      soort: 'apparaat',
      eligibility: ventilatieEligibility,
      oppervlakteM2: null,
      bedrag: ventilatieEligibility.regel?.bedragVast ?? null,
    })
  }
  const combinatie = berekenCombinatie(combinatieInvoer)

  const maatregelen = alleRuw.map(({ maatregelKey, soort, specificatie }) => {
    const berekeningResultaat = combinatie.resultaten.find((r) => r.maatregelKey === maatregelKey) ?? null
    const onderdeelCode = OPNAME_ONDERDEEL_PER_MAATREGEL[maatregelKey] ?? null
    const opnameWaarnemingen = onderdeelCode ? opnameReferentie(waarnemingen, onderdeelCode) : []
    return soort === 'apparaat'
      ? bouwApparaatMaatregelData({ apparaatKey: maatregelKey, specificatie, combinatieResultaat: berekeningResultaat, opnameWaarnemingen })
      : bouwMaatregelData({ maatregelKey, specificatie, combinatieResultaat: berekeningResultaat, opnameWaarnemingen })
  })
  const ventilatieBerekening = combinatie.resultaten.find((r) => r.maatregelKey === 'ventilatie') ?? null
  maatregelen.push(
    bouwVentilatieMaatregelData({ specificatie: ventilatieSpecificatie, combinatieResultaat: ventilatieBerekening, heeftIsolatieContext: isolatieOnafhankelijkSubsidiabel }),
  )

  const bronnenRuw = [...new Set(maatregelen.map((m) => m.regel?.bron).filter(Boolean).map((b) => JSON.stringify(b)))].map((s) => JSON.parse(s))
  const bronnen = controleerBronnen(bronnenRuw)

  const ontbrekendeVelden = []
  if (!uitvoeringsjaar && !maatregelen.some((m) => m.specificatie?.uitvoeringsjaar)) ontbrekendeVelden.push('Uitvoeringsjaar')
  maatregelen.forEach((m) => {
    m.ontbrekendeGegevens.forEach((g) => {
      if (!ontbrekendeVelden.includes(g)) ontbrekendeVelden.push(g)
    })
  })

  const regionaal = bouwRegionaleSectie({ postcode, plaats })
  const actielijst = bouwActielijst({ maatregelen, bronnen })

  // EIA/MIA/Vamil (2026-10-09) — volledig gescheiden van de ISDE-
  // maatregelen hierboven: andere soort regeling (fiscale aftrek/
  // afschrijving i.p.v. directe subsidie), andere beoordelingslogica
  // (relevantie + pandtype-grens i.p.v. Rd/U-waarde-eligibility). Nooit in
  // `maatregelen`/`combinatie` meegeteld — dat zou fiscaal voordeel en
  // directe subsidie tot één misleidend totaalbedrag optellen.
  const fiscaleRegelingen = vindRelevanteFiscaleBedrijfsmiddelen({
    pand: dossier?.panden ?? null,
    mjopInsights,
    energieInsights,
    waarnemingen,
    specificatiesPerMaatregel,
  })

  return {
    meta: {
      klantnaam,
      pandadres,
      dossierId: dossier?.dossier_id ?? null,
      datumGegenereerd: formatDatum(datum),
      adviseur: adviseurNaam,
      uitvoeringsjaar,
    },
    maatregelen,
    combinatie,
    ontbrekendeVelden,
    bronnen,
    regionaal,
    actielijst,
    nietOndersteund: nietOndersteundeCategorieen(),
    fiscaleRegelingen,
  }
}

const RELEVANTE_STATUSSEN_VOOR_ACTIE = ['van_toepassing', 'waarschijnlijk_van_toepassing', 'controle_vereist']

/**
 * Bouwt een concrete, dossierspecifieke actielijst (opdracht §15) —
 * uitsluitend stappen die voor DIT dossier daadwerkelijk relevant zijn,
 * geen vaste lijst die altijd hetzelfde toont. Puur en los testbaar van
 * de HTML-opmaak, zodat tests precies kunnen controleren welke stappen
 * wel/niet verschijnen.
 */
function bouwActielijst({ maatregelen, bronnen }) {
  const relevant = maatregelen.filter((m) => RELEVANTE_STATUSSEN_VOOR_ACTIE.includes(m.status))
  if (relevant.length === 0) return []

  const stappen = []
  const metOntbrekendeGegevens = relevant.filter((m) => m.ontbrekendeGegevens.length > 0)
  if (metOntbrekendeGegevens.length > 0) {
    stappen.push(`Vul de ontbrekende gegevens aan voor: ${metOntbrekendeGegevens.map((m) => m.label).join(', ')}.`)
  }
  const zonderMeldcode = relevant.filter((m) => !m.specificatie?.meldcode)
  if (zonderMeldcode.length > 0) {
    stappen.push(`Vraag de leverancier/installateur om de officiële meldcode voor: ${zonderMeldcode.map((m) => m.label).join(', ')}.`)
  }
  stappen.push('Verzamel offerte, factuur, betaalbewijs en foto’s van vóór en na de uitvoering.')
  const berekenbaar = relevant.filter((m) => m.berekening?.berekenbaar)
  if (berekenbaar.length > 0 && bronnen.length > 0) {
    stappen.push(`Dien de aanvraag in via de officiële aanvraagpagina: ${bronnen[0].url}.`)
  }
  stappen.push('Bewaar de aanvraagbevestiging, het zaaknummer en de uiteindelijke beschikking bij dit dossier.')
  return stappen
}
