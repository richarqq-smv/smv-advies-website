/**
 * Pure, transparante berekening (opdracht §10/77/78) — geen magic numbers:
 * elk tarief komt uit de regel zelf (isdeIsolatieRegels.js), nooit uit een
 * losse constante hier. Rekent alleen als de eligibility-laag al
 * `VAN_TOEPASSING` of `WAARSCHIJNLIJK_VAN_TOEPASSING` heeft vastgesteld —
 * bij elke andere status levert dit bewust geen bedrag op (§11: "niet
 * gokken").
 */
import { SUBSIDIE_STATUSSEN } from './subsidieEligibility.js'

const BEREKENBARE_STATUSSEN = new Set([SUBSIDIE_STATUSSEN.VAN_TOEPASSING, SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING])

/**
 * Berekent de subsidie voor één maatregel. `combinatieAantal` is het
 * aantal subsidiabele isolatiemaatregelen in dezelfde aanvraag (incl.
 * deze) — ISDE verdubbelt het tarief per m² zodra dat er 2 of meer zijn
 * (opdracht §7/8, bevestigd op de RVO-meldcodepagina's voor zowel dak-
 * als gevelisolatie). Geeft altijd `toelichtingRegels` terug: de
 * uitgeschreven herleiding die de adviseur kan nalezen (opdracht §10/77).
 */
export function berekenSubsidieVoorMaatregel({ eligibility, oppervlakteM2, combinatieAantal = 1 } = {}) {
  const { status, regel } = eligibility ?? {}
  const toelichtingRegels = []

  if (!regel || !BEREKENBARE_STATUSSEN.has(status) || oppervlakteM2 == null) {
    return { berekenbaar: false, bedrag: null, tarief: null, subsidiabelOppervlak: null, toelichtingRegels: ['Nog niet berekenbaar.'] }
  }

  const gecombineerd = combinatieAantal >= 2
  const tarief = gecombineerd ? regel.tariefPerM2Combinatie : regel.tariefPerM2Enkel
  toelichtingRegels.push(
    gecombineerd
      ? `Combinatietarief (${combinatieAantal} subsidiabele isolatiemaatregelen in deze aanvraag): € ${tarief.toFixed(2)}/m² (basistarief € ${regel.tariefPerM2Enkel.toFixed(2)}/m², verdubbeld bij combinatie).`
      : `Tarief bij één isolatiemaatregel: € ${tarief.toFixed(2)}/m².`,
  )

  let subsidiabelOppervlak = oppervlakteM2
  if (regel.maxOppervlakteM2 != null && oppervlakteM2 > regel.maxOppervlakteM2) {
    toelichtingRegels.push(`${regel.maxOppervlakteM2} m² subsidiabel maximum; geregistreerd: ${oppervlakteM2} m²; subsidiabel: ${regel.maxOppervlakteM2} m².`)
    subsidiabelOppervlak = regel.maxOppervlakteM2
  } else {
    toelichtingRegels.push(`Subsidiabel oppervlak: ${subsidiabelOppervlak} m² (geregistreerd: ${oppervlakteM2} m²).`)
  }

  const bedrag = Math.round(subsidiabelOppervlak * tarief * 100) / 100
  toelichtingRegels.push(`${subsidiabelOppervlak} m² × € ${tarief.toFixed(2)} = € ${bedrag.toFixed(2)}.`)

  return { berekenbaar: true, bedrag, tarief, subsidiabelOppervlak, toelichtingRegels }
}

/**
 * Berekent het bedrag voor één apparaatmaatregel (warmtepomp/zonneboiler)
 * — er is hier geen tarief om te berekenen, het bedrag IS de door de
 * adviseur van de officiële meldcodepagina overgenomen waarde (zie
 * subsidieApparaatEligibility.js). Deze functie bestaat puur om apparaat-
 * en isolatiemaatregelen in berekenCombinatie() op dezelfde manier te
 * kunnen behandelen — geen eigen rekenregel, alleen doorgeven + toelichten.
 */
function berekenApparaatMaatregel({ eligibility, bedrag } = {}) {
  const { status } = eligibility ?? {}
  if (!BEREKENBARE_STATUSSEN.has(status) || bedrag == null) {
    return { berekenbaar: false, bedrag: null, tarief: null, subsidiabelOppervlak: null, toelichtingRegels: ['Nog niet berekenbaar.'] }
  }
  return {
    berekenbaar: true,
    bedrag,
    tarief: null,
    subsidiabelOppervlak: null,
    toelichtingRegels: [`Vast bedrag overgenomen van de officiële meldcodepagina van dit apparaat: € ${bedrag.toFixed(2)}.`],
  }
}

/**
 * Berekent het combinatie-effect over meerdere maatregelen tegelijk —
 * geeft per maatregel het resultaat terug mét het juiste combinatietarief
 * (opdracht §7/37), plus een totaal als alle maatregelen berekenbaar
 * zijn. `maatregelen` is een array van `{ maatregelKey, eligibility,
 * oppervlakteM2, soort, bedrag }` — `soort` is `'isolatie'` (standaard,
 * oppervlakte x tarief) of `'apparaat'` (vast, adviseur-ingevoerd bedrag,
 * zie hierboven). Een apparaatmaatregel telt WEL mee in `combinatieAantal`
 * (RVO verdubbelt het isolatietarief ook bij combinatie met een
 * warmtepomp/zonneboiler), maar het bedrag van het apparaat zelf wordt
 * nooit verdubbeld — dat staat al vast op de meldcodepagina. Een
 * maatregel die zelf niet subsidiabel/berekenbaar is telt niet mee in
 * `combinatieAantal` — alleen daadwerkelijk subsidiabele maatregelen
 * beïnvloeden het tarief van elkaar.
 */
export function berekenCombinatie(maatregelen = []) {
  const subsidiabel = maatregelen.filter((m) => BEREKENBARE_STATUSSEN.has(m.eligibility?.status))
  // Combinatie-telling is op CATEGORIE, niet op aantal regels: twee
  // glasproducten (HR++ én triple) in dezelfde aanvraag tellen niet als
  // "combinatie" met elkaar, want het is dezelfde maatregelsoort (RVO-
  // regel, zie isdeIsolatieRegels.js). Een maatregel zonder eigen
  // `combinatieCategorie` (bv. een apparaat) telt op zijn eigen
  // maatregelKey, dus altijd apart.
  const combinatieAantal = new Set(subsidiabel.map((m) => m.eligibility?.regel?.combinatieCategorie ?? m.maatregelKey)).size

  const resultaten = maatregelen.map((m) =>
    m.soort === 'apparaat'
      ? { maatregelKey: m.maatregelKey, ...berekenApparaatMaatregel({ eligibility: m.eligibility, bedrag: m.bedrag }) }
      : { maatregelKey: m.maatregelKey, ...berekenSubsidieVoorMaatregel({ eligibility: m.eligibility, oppervlakteM2: m.oppervlakteM2, combinatieAantal }) },
  )

  const alleBerekenbaar = resultaten.length > 0 && resultaten.every((r) => r.berekenbaar)
  const totaalBedrag = alleBerekenbaar ? Math.round(resultaten.reduce((som, r) => som + r.bedrag, 0) * 100) / 100 : null

  return {
    combinatieVanToepassing: combinatieAantal >= 2,
    combinatieAantal,
    resultaten,
    totaalBerekenbaar: alleBerekenbaar,
    totaalBedrag,
  }
}
