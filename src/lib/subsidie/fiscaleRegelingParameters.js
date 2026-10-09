/**
 * Jaargebonden, generieke parameters voor EIA/MIA/Vamil — pure data, geen
 * logica (zelfde rol/patroon als isdeIsolatieRegels.js voor ISDE).
 * Regelsetversie 2026. EIA/MIA/Vamil zijn GEEN directe subsidie: het zijn
 * fiscale regelingen (investeringsaftrek resp. willekeurige afschrijving)
 * — zie `soort` hieronder en de toelichting per regeling. Nooit een netto
 * belastingvoordeel berekenen (dat vereist het toepasselijke belasting-
 * tarief en de fiscale positie van de klant, die deze applicatie niet
 * kent) — uitsluitend de bekende, officiële fiscale parameters zelf.
 *
 * Bronnen (gecontroleerd 2026-10-09 via web-onderzoek — directe toegang
 * tot rvo.nl is vanuit deze omgeving niet mogelijk (DNS-blokkade), dus
 * deze cijfers zijn vastgesteld via meerdere onafhankelijke, elkaar
 * bevestigende secundaire bronnen (belastingadvieskantoren die het
 * Belastingplan 2026 beschrijven: Meijburg, BDO, PwC, EY) in plaats van
 * de RVO-pagina zelf rechtstreeks. Waar slechts één bron een cijfer
 * noemde (zoals de MIA-categorieën 27/36/45%) is dat NIET hier
 * opgenomen als "officieel geverifieerd generiek percentage" — die
 * indeling staat daarom alleen als toelichting in de moduledoc, niet als
 * harde waarde, en per-bedrijfsmiddel geldt uitsluitend het percentage
 * dat voor dát bedrijfsmiddel specifiek is gevonden (zie
 * fiscaleBedrijfsmiddelen.js).
 *
 * - EIA 2026: aftrekpercentage 40% van het investeringsbedrag (eenmalige
 *   aftrek op de fiscale winst), minimale investering € 2.500 per
 *   bedrijfsmiddel, maximum € 153 miljoen per onderneming per jaar,
 *   landelijk budget € 460 miljoen. Alleen nieuwe (ongebruikte)
 *   bedrijfsmiddelen op de Energielijst van het jaar waarin de
 *   koopovereenkomst/bestelling is getekend. Melding bij RVO binnen 3
 *   maanden na het aangaan van de investeringsverplichting.
 * - MIA/Vamil 2026: drie aftrekcategorieën (27%/36%/45%, afhankelijk van
 *   het bedrijfsmiddel — zie het percentage per bedrijfsmiddel zelf) plus
 *   Vamil: tot 75% van de investering willekeurig (zelf te kiezen moment)
 *   afschrijven, de rest volgens de gewone regels. Gecombineerd
 *   MIA/Vamil-budget 2026 circa € 155 miljoen (MIA € 135 miljoen, Vamil
 *   € 20 miljoen). Minimale investering € 2.500, melding bij RVO binnen 3
 *   maanden na de investeringsverplichting. Vanaf 2026 niet meer te
 *   combineren met de SSEB- of SWIM-subsidie voor hetzelfde bedrijfsmiddel.
 * - Vamil is NOOIT een vast subsidiepercentage of directe uitbetaling —
 *   het is uitsluitend een afschrijvingsmogelijkheid (tijdelijk fiscaal
 *   voordeel via een lagere winst in het gekozen jaar), zie `soort:
 *   'fiscale_afschrijving'` hieronder.
 */

export const REGELSET_VERSIE_FISCAAL = '2026'

export const FISCALE_REGELING_SOORT = {
  DIRECTE_SUBSIDIE: 'directe_subsidie',
  FISCALE_AFTREK: 'fiscale_aftrek',
  FISCALE_AFSCHRIJVING: 'fiscale_afschrijving',
}

export const FISCALE_REGELING_SOORT_LABELS = {
  [FISCALE_REGELING_SOORT.DIRECTE_SUBSIDIE]: 'Directe subsidie',
  [FISCALE_REGELING_SOORT.FISCALE_AFTREK]: 'Fiscale investeringsaftrek',
  [FISCALE_REGELING_SOORT.FISCALE_AFSCHRIJVING]: 'Fiscale afschrijvingsmogelijkheid',
}

const EIA_BRON = {
  label: 'RVO — Energie-investeringsaftrek (EIA), Energielijst 2026',
  url: 'https://www.rvo.nl/subsidies-financiering/eia/energielijst',
  gecontroleerdOp: '2026-10-09',
}

const MIA_VAMIL_BRON = {
  label: 'RVO — MIA\\Vamil, Milieulijst 2026',
  url: 'https://www.rvo.nl/subsidies-financiering/mia-vamil/milieulijst',
  gecontroleerdOp: '2026-10-09',
}

/**
 * Generieke, regelingbrede parameters — NIET per bedrijfsmiddel (die staan
 * in fiscaleBedrijfsmiddelen.js). Gebruikt voor de algemene toelichting in
 * de UI/het document ("wat is EIA eigenlijk") en voor de controle op
 * minimale investeringsbedragen.
 */
export const FISCALE_REGELING_PARAMETERS = {
  eia: {
    key: 'eia',
    naam: 'EIA — Energie-investeringsaftrek',
    soort: FISCALE_REGELING_SOORT.FISCALE_AFTREK,
    aftrekPercentage: 40,
    minimaleInvestering: 2500,
    maximumPerOnderneming: 153_000_000,
    budgetLandelijk: 460_000_000,
    meldingstermijnMaanden: 3,
    toelichting:
      'EIA is géén subsidie die RVO uitbetaalt — het is een eenmalige extra aftrekpost op de fiscale winst (naast de gewone afschrijving) van 40% van het investeringsbedrag, voor nieuwe bedrijfsmiddelen op de Energielijst. Het daadwerkelijke belastingvoordeel hangt af van het toepasselijke belastingtarief en de fiscale positie van de onderneming — dat berekent deze applicatie niet.',
    bron: EIA_BRON,
  },
  mia: {
    key: 'mia',
    naam: 'MIA — Milieu-investeringsaftrek',
    soort: FISCALE_REGELING_SOORT.FISCALE_AFTREK,
    aftrekPercentage: null, // verschilt per bedrijfsmiddel (27/36/45%) — zie fiscaleBedrijfsmiddelen.js
    minimaleInvestering: 2500,
    budgetLandelijk: 135_000_000,
    meldingstermijnMaanden: 3,
    toelichting:
      'MIA is géén subsidie die RVO uitbetaalt — het is een extra aftrekpost op de fiscale winst, met een percentage dat per bedrijfsmiddel op de Milieulijst verschilt (doorgaans 27%, 36% of 45% van het investeringsbedrag). Het daadwerkelijke belastingvoordeel hangt af van het toepasselijke belastingtarief en de fiscale positie van de onderneming.',
    bron: MIA_VAMIL_BRON,
  },
  vamil: {
    key: 'vamil',
    naam: 'Vamil — Willekeurige afschrijving milieu-investeringen',
    soort: FISCALE_REGELING_SOORT.FISCALE_AFSCHRIJVING,
    afschrijvingPercentageMax: 75,
    minimaleInvestering: 2500,
    budgetLandelijk: 20_000_000,
    meldingstermijnMaanden: 3,
    toelichting:
      'Vamil is GEEN subsidiepercentage en GEEN directe uitbetaling. Het is een afschrijvingsmogelijkheid: tot 75% van de investering mag in een zelf te kiezen jaar worden afgeschreven (de rest volgens de gewone regels), wat de fiscale winst in dat jaar tijdelijk verlaagt. Dit levert een liquiditeits-/tijdvoordeel op, geen vaststaand bedrag.',
    bron: MIA_VAMIL_BRON,
  },
}

/** Regelingsoort-label voor een losse regeling-key ('eia'|'mia'|'vamil') — gebruikt in UI/document om nooit "subsidie" te schrijven waar een fiscale regeling wordt bedoeld. */
export function fiscaleRegelingSoortLabel(regelingKey) {
  const regeling = FISCALE_REGELING_PARAMETERS[regelingKey]
  return regeling ? FISCALE_REGELING_SOORT_LABELS[regeling.soort] : null
}
