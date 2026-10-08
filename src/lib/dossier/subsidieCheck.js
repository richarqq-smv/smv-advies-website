/**
 * Subsidiecheck (pakket-/subsidiearchitectuurronde, 2026-10-08; uitgebreid
 * met traceerbaarheid, 2026-10-09) — koppelt de bestaande RVO-
 * referentielijst (rvo_subsidie_index) aan een dossier, puur als
 * weergavefilter/ordening. GEEN nieuwe opslag, GEEN tweede
 * subsidiedatabase: dossiergebonden subsidie-informatie blijft in
 * dossier_subsidies (0035_dossier_subsidies.sql), de RVO-referenties
 * blijven in rvo_subsidie_index (0036_rvo_subsidie_index.sql). Dit bestand
 * voegt alleen een pure, client-side koppeling tussen de twee toe.
 *
 * Traceerbaarheidsronde (2026-10-09) — ONDERZOEKSRESULTAAT: de vorige
 * versie van dit bestand verzamelde alle MJOP-/Energie-/pand-signalen in
 * één platte, gededupliceerde Set<string> (`bepaalSubsidieSignalen`) en
 * `bevatSignaal()` gaf alleen een boolean terug. Daardoor kon een match
 * wel zeggen "deze regeling matcht met dit dossier", maar nooit "vanwege
 * MJOP-maatregel X" — de herkomst ging al verloren vóórdat er werd
 * gematcht. Dat was de kern van de ontbrekende traceerbaarheid.
 *
 * Deze versie verliest die herkomst niet meer: elk signaal is een object
 * `{ tekst, bron }` met `bron.type` ('mjop' | 'energie' | 'pand') en de
 * concrete brongegevens (componentId/componentLabel/measureName voor MJOP,
 * energieMaatregelId/maatregelNaam voor Energie, gebruikstype voor pand).
 * `koppelRvoRegelingenAanDossier()` geeft nu `matchendeSignalen` terug per
 * regeling — exact welke signalen de match veroorzaakten, geen nieuwe
 * matchingregel, alleen hetzelfde bestaande substring-criterium met
 * behouden herkomst. Geen bedragen/percentages/eligibility: zie
 * SUBSIDIE_CHECK_STATUSSEN, onveranderd drie weergavestatussen.
 *
 * `vindGekoppeldAdviespunt()` is nieuw: probeert een gematcht signaal
 * terug te leiden naar een al bestaand, structureel `adviespunt` in dit
 * dossier (voor Energie-signalen op maatregelnaam, voor MJOP-signalen op
 * bouwdeel/componentId — zie de toelichting bij de functie zelf voor de
 * precieze grens van wat daar wél en niet betrouwbaar uit valt af te
 * leiden). Als dat lukt, kan de aanroeper de AL BESTAANDE
 * `koppelSubsidieMaatregel(subsidieId, adviespuntId)` (api.js,
 * dossier_subsidie_maatregelen) gebruiken om de keten
 * "subsidietraject → regeling → concrete maatregel" relationeel vast te
 * leggen — geen nieuwe tabel/kolom, geen nieuwe koppelfunctie.
 *
 * Neemt bewust kant-en-klare insights aan (`mjopInsights`/`energieInsights`,
 * de resultaten van buildInsights()/buildEnergieInsights()) in plaats van
 * zelf die functies aan te roepen: lib/mjop/linking.js importeert zonder
 * bestandsextensie (`from './constants'`), wat de kale node--test-runner
 * niet kan oplossen (zelfde bekende, documenteerde beperking als
 * lib/energieScan/calculations.js — zie energieInsights.js's moduledoc).
 * De aanroeper (SubsidieCheck.jsx, onder Vite) berekent die insights met de
 * bestaande, ongewijzigde functies.
 */

/**
 * Verzamelt de zoeksignalen voor dit dossier mét behouden herkomst: pandtype
 * + elke MJOP-aanbeveling (per bouwdeel/measureName) + elke Energie-
 * maatregel. Puur verzamelen, geen nieuwe regel, geen gok over relevantie —
 * dat gebeurt pas in koppelRvoRegelingenAanDossier().
 */
export function bepaalSubsidieSignalen({ pand, mjopInsights = [], energieInsights = [] } = {}) {
  const signalen = []
  const gezien = new Set()

  function voegToe(tekst, bron) {
    if (!tekst) return
    const tekstLower = String(tekst).toLowerCase()
    const key = `${bron.type}:${tekstLower}:${bron.componentId ?? ''}:${bron.energieMaatregelId ?? ''}`
    if (gezien.has(key)) return
    gezien.add(key)
    signalen.push({ tekst: tekstLower, bron })
  }

  if (pand?.gebruikstype) voegToe(pand.gebruikstype, { type: 'pand', label: pand.gebruikstype })

  mjopInsights.forEach((insight) => {
    ;(insight?.recommendations ?? []).forEach((r) => {
      if (!r?.measureName) return
      voegToe(r.measureName, {
        type: 'mjop',
        label: r.measureName,
        componentId: insight.componentId ?? null,
        componentLabel: insight.componentLabel ?? null,
      })
    })
  })

  energieInsights.forEach((insight) => {
    if (!insight?.maatregelNaam) return
    voegToe(insight.maatregelNaam, {
      type: 'energie',
      label: insight.maatregelNaam,
      energieMaatregelId: insight.energieMaatregelId ?? null,
    })
  })

  return signalen
}

/** Platte, doorzoekbare tekst van één RVO-item — titel/intro/sectoren/onderwerpen/doelgroepen/tags. */
function rvoItemTekst(item) {
  return [item.titel, item.intro, ...(item.sectoren ?? []), ...(item.onderwerpen ?? []), ...(item.doelgroepen ?? []), ...(item.tags ?? [])]
    .filter((v) => typeof v === 'string' && v.trim())
    .join(' ')
    .toLowerCase()
}

/** Woorden van 3+ tekens, om toevallige een-/twee-letter-matches (bv. "nl", kale afkortingen zonder context) te vermijden. Geeft de daadwerkelijk matchende signalen terug (met herkomst), niet alleen een boolean. */
function matchendeSignalen(tekst, signalen) {
  return signalen.filter((signaal) => signaal.tekst.length > 2 && tekst.includes(signaal.tekst))
}

export const SUBSIDIE_CHECK_STATUSSEN = {
  VASTGELEGD: 'vastgelegd',
  MOGELIJK_RELEVANT: 'mogelijk_relevant',
  TE_BEOORDELEN: 'te_beoordelen',
}

export const SUBSIDIE_CHECK_STATUS_LABELS = {
  [SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD]: 'Al vastgelegd in dit dossier',
  [SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT]: 'Mogelijk relevant',
  [SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN]: 'Te beoordelen',
}

/**
 * Koppelt elk RVO-item aan dit dossier. Een regeling die al als
 * dossier_subsidies-rij bestaat (zelfde titel, hoofdletter-/spatie-
 * ongevoelig) krijgt status "vastgelegd" — dat is dan SMV-beoordeling,
 * geen RVO-broninformatie meer; `matchendeSignalen` is dan leeg, want de
 * aanleiding is niet meer relevant zodra iets al is vastgelegd. De rest
 * krijgt "mogelijk_relevant" (met de concrete, matchende signalen —
 * díe zijn de "aanleiding"/"waarom" in de UI) of "te_beoordelen" (geen
 * match, niet per se irrelevant).
 */
export function koppelRvoRegelingenAanDossier({ rvoItems = [], signalen = [], bestaandeSubsidies = [] } = {}) {
  const bestaandPerTitel = new Map(bestaandeSubsidies.map((s) => [s.regeling_naam.trim().toLowerCase(), s]))

  return rvoItems.map((item) => {
    const bestaand = bestaandPerTitel.get(item.titel.trim().toLowerCase()) ?? null
    if (bestaand) {
      return { item, bestaandeSubsidie: bestaand, status: SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD, matchendeSignalen: [] }
    }

    const matches = matchendeSignalen(rvoItemTekst(item), signalen)
    const status = matches.length > 0 ? SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT : SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN
    return { item, bestaandeSubsidie: null, status, matchendeSignalen: matches }
  })
}

/**
 * Probeert een gematcht signaal terug te leiden naar een al bestaand
 * `adviespunt` in dit dossier — de relationele stap die
 * "subsidietraject → concrete MJOP-/Energie-maatregel" mogelijk maakt via
 * de AL BESTAANDE dossier_subsidie_maatregelen-koppeltabel (geen nieuwe
 * tabel/kolom).
 *
 * Betrouwbaarheidsgrens (bewust, zie moduledoc "ONDERZOEKSRESULTAAT"):
 * - Energie-signalen zijn 1-op-1 te matchen: een adviespunt dat ooit uit
 *   een Energie-signaal is gepromoveerd bevraagt zijn bevroren
 *   `maatregelNaam` (zie createEnergieSignaalBevroren()), exact dezelfde
 *   stabiele identiteit als energieInsights.js gebruikt. Een match hier is
 *   dus betrouwbaar.
 * - MJOP-signalen zijn dat NIET op maatregelniveau: het bevroren
 *   MJOP-signaal op een adviespunt (zie createSignaalBevroren()) bewaart
 *   alleen componentId/componentLabel/status/relevantYear — niet welke
 *   specifieke measureName/measureId uit de aanbevelingen is gekozen (één
 *   bouwdeel kan meerdere mogelijke maatregelen hebben). Deze functie kan
 *   voor MJOP dus alleen matchen op BOUWDEEL (componentId), niet op de
 *   exacte maatregel. Dat is een reëel gat in de bestaande data, geen
 *   gok: de aanroeper moet dit resultaat dus presenteren als "gerelateerd
 *   adviespunt (zelfde bouwdeel)", niet als "dit IS de maatregel".
 * - Een pand-signaal (gebruikstype) heeft nooit een adviespunt-relatie:
 *   dat is dossierniveau, geen maatregel.
 * - Handmatige adviespunten (herkomst: 'handmatig') hebben geen
 *   signaal_bevroren en worden dus nooit gevonden — terecht: er is geen
 *   automatisch signaal om op te matchen.
 */
export function vindGekoppeldAdviespunt(signaal, adviespunten = []) {
  if (!signaal?.bron) return null

  if (signaal.bron.type === 'energie') {
    return (
      adviespunten.find((a) => a.signaal_bevroren?.herkomst === 'energie' && a.signaal_bevroren?.maatregelNaam === signaal.bron.label) ?? null
    )
  }

  if (signaal.bron.type === 'mjop' && signaal.bron.componentId != null) {
    return (
      adviespunten.find((a) => a.herkomst === 'automatisch' && a.signaal_bevroren && !a.signaal_bevroren.herkomst && a.signaal_bevroren.componentId === signaal.bron.componentId) ?? null
    )
  }

  return null
}

const SORTVOLGORDE = {
  [SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD]: 0,
  [SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT]: 1,
  [SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN]: 2,
}

/** Vastgelegd eerst, dan mogelijk relevant, dan de rest — stabiel binnen elke groep (alfabetisch op titel). */
export function sorteerSubsidieCheck(gekoppeld) {
  return [...gekoppeld].sort((a, b) => {
    const volgordeVerschil = SORTVOLGORDE[a.status] - SORTVOLGORDE[b.status]
    if (volgordeVerschil !== 0) return volgordeVerschil
    return a.item.titel.localeCompare(b.item.titel)
  })
}
