/**
 * Energie-indicatie → Dossier-adapter: vertaalt een voltooide scan (de
 * gevalideerde invoerwaarden + het resultaat van berekenResultaat(), zie
 * lib/energieScan/calculations.js) naar de zelfstandige momentopname die
 * op een Dossier wordt opgeslagen. Zelfde rol als mjopAdapter.js voor
 * MJOP: puur functioneel, geen state, geen I/O, geen nieuwe berekening —
 * uitsluitend een vertaalstap tussen twee al bestaande domeinen.
 *
 * Waarom labels i.p.v. ruwe waarden (`pandtype: 'kantoor'` etc.): een
 * eenmaal opgeslagen Energie-indicatie mag nooit van betekenis veranderen
 * doordat fieldOptions.js later een label herschrijft. Ruwe waarden met
 * een live lookup op weergavemoment zou dat risico juist introduceren —
 * vandaar dat de labeltekst hier, eenmalig, op het moment van opslaan
 * wordt bevroren (dezelfde bron als emailParams.js al gebruikt, geen
 * tweede labeltabel).
 */
import { LABELS } from '../energieScan/fieldOptions.js'

/** Huidige versie van de snapshotstructuur hieronder — metadata, verandert nooit het rekenmodel zelf. */
export const ENERGIE_SNAPSHOT_VERSIE = 1

function resolveLabel(categorie, waarde) {
  if (waarde == null) return null
  return LABELS[categorie]?.[waarde] ?? waarde
}

/**
 * Bouwt de Energie-snapshot uit de invoerwaarden (het `values`-object van
 * useEnergieScan, na prepareCalculationInput) en het resultaat
 * (berekenResultaat(values)). Bevat uitsluitend wat nodig is om de scan
 * achteraf te begrijpen — nooit de contactvelden (naam/bedrijfsnaam/
 * email/telefoon): die horen bij de EmailJS-lead van de publieke tool,
 * niet bij het Dossier, dat zijn eigen Klant/Contactpersoon al heeft.
 */
export function energieScanResultToSnapshot(values, result) {
  return {
    versie: ENERGIE_SNAPSHOT_VERSIE,
    uitgevoerd_op: new Date().toISOString(),
    invoer: {
      pandtype: resolveLabel('pandtype', values.pandtype),
      bouwjaar: resolveLabel('bouwjaar', values.bouwjaar),
      oppervlakte: values.oppervlakte ?? null,
      verdiepingen: resolveLabel('verdiepingen', values.verdiepingen),
      beglazing: resolveLabel('beglazing', values.beglazing),
      isolatie_gevel: resolveLabel('isolatie', values.isolatie_gevel),
      isolatie_dak: resolveLabel('isolatie', values.isolatie_dak),
      isolatie_vloer: resolveLabel('isolatie', values.isolatie_vloer),
      verwarming: resolveLabel('verwarming', values.verwarming),
      gasverbruik: values.gasverbruik ?? null,
      elekverbruik: values.elekverbruik ?? null,
      energiekosten: values.energiekosten ?? null,
    },
    resultaat: {
      score: result.score,
      band: {
        band: result.band.band,
        status: result.band.status,
        desc: result.band.desc,
      },
      huidig: {
        gas: result.huidig.gas,
        elek: result.huidig.elek,
        bron: result.huidig.bron,
      },
      huidigeKosten: result.huidigeKosten,
      totaleBesparing: result.totaleBesparing,
      co2: result.co2,
      // Losse kopieën, geen referenties naar result.maatregelen — en
      // `relevant` bewust niet meegenomen: dat vlagveld heeft de filtering
      // in berekenMaatregelen() al gedaan, in de uiteindelijke lijst is
      // het altijd true en dus zonder informatiewaarde.
      maatregelen: result.maatregelen.map((m) => ({
        naam: m.naam,
        toelichting: m.toelichting,
        besparingM3: m.besparingM3 ?? null,
        besparingKwh: m.besparingKwh ?? null,
        isElektrisch: m.isElektrisch ?? false,
        investeringLaag: m.investeringLaag,
        investeringHoog: m.investeringHoog,
        besparingEuro: m.besparingEuro,
        terugverdientijd: m.terugverdientijd,
      })),
    },
  }
}

/**
 * Structurele sanity-check op een Energie-snapshot, vóór opslaan (Fase 2,
 * zie api.js's saveEnergieSnapshot()). Geen tweede inhoudelijke
 * validatielaag die de calculator-invoer herkeurt — dat blijft exclusief
 * lib/energieScan/validation.js's taak — uitsluitend een check dat de
 * vorm klopt die energieScanResultToSnapshot() hierboven altijd oplevert.
 */
export function isValidEnergieSnapshot(snapshot) {
  return Boolean(
    snapshot &&
      typeof snapshot === 'object' &&
      snapshot.versie != null &&
      snapshot.invoer &&
      typeof snapshot.invoer === 'object' &&
      snapshot.resultaat &&
      typeof snapshot.resultaat === 'object',
  )
}
