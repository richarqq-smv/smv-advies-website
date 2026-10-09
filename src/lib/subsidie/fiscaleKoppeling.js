/**
 * Koppelt EIA-/MIA-/Vamil-bedrijfsmiddelen (fiscaleBedrijfsmiddelen.js) aan
 * een concreet dossier — pure logica, geen React/database. Zelfde rol als
 * subsidieCheck.js (lib/dossier/) voor de generieke RVO-index, maar met
 * SEMANTISCHE categorie-matching op een vaste, eindige trefwoordenlijst in
 * plaats van vrije substring-matching over elk RVO-veld — dat voorkomt dat
 * een algemene regeling als "Innovatiekrediet" of "Garantie
 * Ondernemingsfinanciering" tussen concrete gebouwmaatregelen verschijnt
 * (opdracht §3.1/§8.2): die hebben helemaal geen categorie hier, dus
 * kunnen nooit matchen.
 *
 * Dit zijn uitdrukkelijk ZOEKAANLEIDINGEN, geen automatische goedkeuring
 * (opdracht §5): een bedrijfsmiddel verschijnt alleen als er een concreet,
 * benoembaar dossiersignaal voor de categorie is, en de reden wordt altijd
 * letterlijk uit dat signaal afgeleid — nooit verzonnen.
 *
 * Pandtype-grens (opdracht §3, laatste alinea): EIA/MIA/Vamil zijn
 * uitsluitend voor ondernemers/bedrijfsmiddelen, nooit voor een
 * privéwoning. Hergebruikt de al bestaande, geteste
 * isZakelijkPand()/ZAKELIJKE_GEBRUIKSTYPES (afspraakBeschikbaarheid.js) —
 * geen tweede pandtype-lijst.
 */
import { isZakelijkPand } from '../klantOmgeving/afspraakBeschikbaarheid.js'
import { FISCALE_BEDRIJFSMIDDELEN, FISCALE_CATEGORIE } from './fiscaleBedrijfsmiddelen.js'

export const FISCAAL_RELEVANTIE_STATUS = {
  MOGELIJK_RELEVANT: 'mogelijk_relevant',
  CONTROLE_VEREIST: 'controle_vereist',
  NIET_VAN_TOEPASSING: 'niet_van_toepassing',
}

export const FISCAAL_RELEVANTIE_STATUS_LABELS = {
  [FISCAAL_RELEVANTIE_STATUS.MOGELIJK_RELEVANT]: 'Mogelijk relevant',
  [FISCAAL_RELEVANTIE_STATUS.CONTROLE_VEREIST]: 'Controle vereist',
  [FISCAAL_RELEVANTIE_STATUS.NIET_VAN_TOEPASSING]: 'Niet van toepassing',
}

// Vaste, eindige trefwoordenlijst per categorie — bewust GEEN vrije
// substring-match over de volledige RVO-tekst (dat is precies de fout in
// de oude subsidieCheck.js-aanpak die irrelevante algemene regelingen liet
// matchen). Elk trefwoord is specifiek genoeg om nooit een algemene
// financierings-/innovatieregeling te raken.
const TREFWOORDEN_PER_CATEGORIE = [
  { categorie: FISCALE_CATEGORIE.ISOLATIE, trefwoorden: ['isolatie', 'dakisolatie', 'gevelisolatie', 'vloerisolatie', 'spouwmuur', 'hr++', 'triple glas'] },
  { categorie: FISCALE_CATEGORIE.WARMTEPOMP, trefwoorden: ['warmtepomp'] },
  { categorie: FISCALE_CATEGORIE.VENTILATIE, trefwoorden: ['ventilatie', 'warmteterugwinning', 'luchtbehandeling'] },
  { categorie: FISCALE_CATEGORIE.OPWEK_OPSLAG, trefwoorden: ['zonnepaneel', 'zonnepanelen', 'pv-paneel', 'zonnestroom', 'batterij', 'accu', 'energieopslag'] },
  { categorie: FISCALE_CATEGORIE.COLLECTIEF, trefwoorden: ['collectieve warmte', 'collectief verwarmen', 'warmtenet'] },
  { categorie: FISCALE_CATEGORIE.GROEN_DAK_GEVEL, trefwoorden: ['groendak', 'groen dak', 'sedumdak', 'vegetatiedak', 'groene gevel'] },
  { categorie: FISCALE_CATEGORIE.DUURZAAM_GEBOUW, trefwoorden: ['breeam', 'gpr gebouw', 'duurzaam gebouw'] },
  { categorie: FISCALE_CATEGORIE.GROEN_TERREIN, trefwoorden: ['bedrijfsterrein', 'ontharden', 'waterberging'] },
]

function categorieenVoorTekst(tekst) {
  const tekstLower = (tekst ?? '').toLowerCase()
  if (!tekstLower) return []
  return TREFWOORDEN_PER_CATEGORIE.filter(({ trefwoorden }) => trefwoorden.some((t) => tekstLower.includes(t))).map((c) => c.categorie)
}

// dossier_subsidie_specificaties-maatregelsleutels (ISDE-engine) hebben al
// een directe, betrouwbare categorie — geen trefwoordmatch nodig.
const MAATREGELKEY_NAAR_CATEGORIE = {
  dakisolatie: FISCALE_CATEGORIE.ISOLATIE,
  gevelisolatie: FISCALE_CATEGORIE.ISOLATIE,
  vloerisolatie: FISCALE_CATEGORIE.ISOLATIE,
  bodemisolatie: FISCALE_CATEGORIE.ISOLATIE,
  glasHrpp: FISCALE_CATEGORIE.ISOLATIE,
  glasTriple: FISCALE_CATEGORIE.ISOLATIE,
  ventilatie: FISCALE_CATEGORIE.VENTILATIE,
  warmtepomp_hybride: FISCALE_CATEGORIE.WARMTEPOMP,
  warmtepomp_elektrisch: FISCALE_CATEGORIE.WARMTEPOMP,
}

/**
 * Verzamelt per categorie de concrete dossiersignalen (met herkomst) die
 * EIA/MIA/Vamil-bedrijfsmiddelen in die categorie kunnen aanleiden.
 * Bronnen: MJOP-aanbevelingen, Energie-indicatie-maatregelen, opname-
 * waarnemingen (mogelijke_maatregel-tekst) en al vastgelegde ISDE-
 * specificaties. Geeft een Map<categorie, signaal[]> terug, signaal =
 * `{ tekst, bron: { type, label } }` — zelfde vorm als subsidieCheck.js,
 * voor herkenbaarheid in de UI.
 */
export function bepaalFiscaleCategorieSignalen({ mjopInsights = [], energieInsights = [], waarnemingen = [], specificatiesPerMaatregel = {} } = {}) {
  const perCategorie = new Map()
  function voegToe(categorie, tekst, bron) {
    if (!perCategorie.has(categorie)) perCategorie.set(categorie, [])
    perCategorie.get(categorie).push({ tekst, bron })
  }

  mjopInsights.forEach((insight) => {
    ;(insight?.recommendations ?? []).forEach((r) => {
      if (!r?.measureName) return
      categorieenVoorTekst(r.measureName).forEach((categorie) => voegToe(categorie, r.measureName, { type: 'mjop', label: r.measureName }))
    })
  })

  energieInsights.forEach((insight) => {
    if (!insight?.maatregelNaam) return
    categorieenVoorTekst(insight.maatregelNaam).forEach((categorie) => voegToe(categorie, insight.maatregelNaam, { type: 'energie', label: insight.maatregelNaam }))
  })

  ;(waarnemingen ?? []).forEach((w) => {
    const tekst = w?.mogelijke_maatregel
    if (!tekst) return
    categorieenVoorTekst(tekst).forEach((categorie) => voegToe(categorie, tekst, { type: 'opname', label: tekst, onderdeel: w.onderdeel ?? null }))
  })

  Object.entries(specificatiesPerMaatregel ?? {}).forEach(([maatregelKey, specificatie]) => {
    if (!specificatie) return
    const categorie = MAATREGELKEY_NAAR_CATEGORIE[maatregelKey]
    if (!categorie) return
    voegToe(categorie, maatregelKey, { type: 'isde_specificatie', label: maatregelKey })
  })

  return perCategorie
}

/**
 * Bepaalt de dossierspecifieke relevantiestatus + reden voor één
 * bedrijfsmiddel. `bedrijfsmiddel.verificatieStatus` (registry-eigenschap,
 * brondata-kwaliteit) en de hier berekende relevantiestatus
 * (dossier-eigenschap) zijn bewust gescheiden — zie fiscaleBedrijfsmiddelen.js.
 */
function beoordeelFiscaalBedrijfsmiddel({ bedrijfsmiddel, pand, matchendeSignalen }) {
  const gebruikstype = pand?.gebruikstype ?? null

  if (!gebruikstype) {
    return {
      status: FISCAAL_RELEVANTIE_STATUS.CONTROLE_VEREIST,
      redenen: ['Pandtype van dit pand is nog niet ingevuld — EIA/MIA/Vamil geldt uitsluitend voor bedrijfsmatig gebruikte panden/bedrijfsmiddelen, niet voor een privéwoning.'],
      ontbrekendeGegevens: ['Pandtype (gebruikstype)'],
    }
  }

  if (!isZakelijkPand(gebruikstype)) {
    return {
      status: FISCAAL_RELEVANTIE_STATUS.NIET_VAN_TOEPASSING,
      redenen: [`Pandtype "${gebruikstype}" is niet aangemerkt als zakelijk — EIA/MIA/Vamil is uitsluitend van toepassing op bedrijfsmatig gebruikte panden, niet op een privéwoning.`],
      ontbrekendeGegevens: [],
    }
  }

  if (bedrijfsmiddel.verificatieStatus === 'controle_vereist') {
    return {
      status: FISCAAL_RELEVANTIE_STATUS.CONTROLE_VEREIST,
      redenen: ['Onderwerp is relevant voor dit dossier, maar er is geen betrouwbare, specifieke bedrijfsmiddelcode voor 2026 gevonden — controleer de officiële Milieu- en Energielijst 2026 zelf.'],
      ontbrekendeGegevens: ['Bevestigde bedrijfsmiddelcode', 'Investeringsbedrag', 'Investeringsdatum'],
    }
  }

  return {
    status: FISCAAL_RELEVANTIE_STATUS.MOGELIJK_RELEVANT,
    redenen: [
      matchendeSignalen.length > 0
        ? `Gekoppeld op basis van: ${[...new Set(matchendeSignalen.map((s) => s.bron.label))].join(', ')}.`
        : 'Gekoppeld op basis van een dossiersignaal in dezelfde categorie.',
      'De daadwerkelijke fiscale kwalificatie wordt uitsluitend door RVO/de Belastingdienst vastgesteld — deze applicatie is begeleiding, geen fiscale beoordeling.',
    ],
    ontbrekendeGegevens: ['Investeringsbedrag', 'Investeringsdatum (koopovereenkomst/bestelling)'],
  }
}

/**
 * Hoofdfunctie: vindt alle relevante fiscale bedrijfsmiddelen voor dit
 * dossier. Een bedrijfsmiddel wordt alleen meegenomen als zijn categorie
 * minstens één concreet dossiersignaal heeft (opdracht §5: "zoekaanleiding",
 * geen statische checklist die altijd alles toont) — met uitzondering van
 * geen enkele: zonder signaal wordt een bedrijfsmiddel nooit getoond.
 */
export function vindRelevanteFiscaleBedrijfsmiddelen({ pand = null, mjopInsights = [], energieInsights = [], waarnemingen = [], specificatiesPerMaatregel = {} } = {}) {
  const signalenPerCategorie = bepaalFiscaleCategorieSignalen({ mjopInsights, energieInsights, waarnemingen, specificatiesPerMaatregel })

  return FISCALE_BEDRIJFSMIDDELEN.filter((b) => signalenPerCategorie.has(b.categorie))
    .map((bedrijfsmiddel) => {
      const matchendeSignalen = signalenPerCategorie.get(bedrijfsmiddel.categorie) ?? []
      const beoordeling = beoordeelFiscaalBedrijfsmiddel({ bedrijfsmiddel, pand, matchendeSignalen })
      return { bedrijfsmiddel, matchendeSignalen, ...beoordeling }
    })
    .sort((a, b) => a.bedrijfsmiddel.titel.localeCompare(b.bedrijfsmiddel.titel))
}
