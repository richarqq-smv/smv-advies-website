/**
 * All pricing, factor tables and score bands are carried over unchanged
 * from the existing (Base44-hosted) energy scan tool — see the Phase 4
 * research report. Prices at 2026 level. Do not tweak these numbers
 * without re-verifying against the source tool.
 */

export const GASPRIJS = 1.3 // euro per m3
export const ELEKPRIJS = 0.28 // euro per kWh
export const CO2_PER_M3_GAS = 1.789 // kg CO2 per m3 aardgas

// Geschat gasverbruik: m3 per m2 per jaar, per bouwjaarperiode.
export const GAS_BASIS_BOUWJAAR = {
  voor1980: 22,
  '1980-1995': 18,
  '1995-2005': 14,
  '2005-2015': 11,
  na2015: 8,
}

// Multiplier op het geschatte verbruik (niet hetzelfde als KWALITEIT_SCORE hieronder).
export const ISOLATIE_FACTOR = { geen: 1.3, matig: 1.1, redelijk: 1.0, goed: 0.78, onbekend: 1.05 }

export const TYPE_GAS_FACTOR = { kantoor: 1.0, winkel: 1.05, werkplaats: 0.9, magazijn: 0.55, overig: 0.9 }
export const TYPE_ELEK_KWH_M2 = { kantoor: 90, winkel: 110, werkplaats: 70, magazijn: 40, overig: 70 }

// Duurzaamheidsscore (0-100 per keuze) — los van ISOLATIE_FACTOR hierboven.
export const KWALITEIT_SCORE = { geen: 8, matig: 38, redelijk: 68, goed: 96, onbekend: 38 }
export const GLAS_SCORE = { enkel: 8, dubbel: 32, hr: 58, hrpp: 82, triple: 98, onbekend: 38 }
export const VERWARMING_SCORE = { oude_ketel: 8, hr_ketel: 34, hybride_wp: 62, volledige_wp: 96, stadsverwarming: 82, overig: 38 }
export const BOUWJAAR_SCORE = { voor1980: 12, '1980-1995': 30, '1995-2005': 48, '2005-2015': 68, na2015: 90 }

// Besparing in m3 gas per m2 (dak/gevel/vloer) of relatieve factor (glas), per huidige staat.
export const DAK_FACTOR = { geen: 11, matig: 9, redelijk: 6, goed: 2, onbekend: 8 }
export const GEVEL_FACTOR = { geen: 8, matig: 6.5, redelijk: 5, goed: 1.5, onbekend: 6 }
export const VLOER_FACTOR = { geen: 5.5, matig: 4.5, redelijk: 3, goed: 1, onbekend: 4 }
export const GLAS_FACTOR = { enkel: 16, dubbel: 12, hr: 6, hrpp: 1, triple: 0, onbekend: 10 }

// Statusbanden voor de score, aflopend gesorteerd op minimumscore.
export const SCORE_BANDS = [
  {
    min: 81,
    band: 1,
    status: 'Uitstekend presterend pand',
    desc: 'Uw pand scoort al sterk op energiegebied. Er is nog beperkte, maar waardevolle winst te behalen.',
  },
  {
    min: 61,
    band: 2,
    status: 'Goed op weg, met ruimte voor winst',
    desc: 'Uw pand presteert bovengemiddeld. Met gerichte maatregelen haalt u er nog meer uit.',
  },
  {
    min: 41,
    band: 3,
    status: 'Gemiddeld — ruimte voor verbetering',
    desc: 'Er is duidelijk winst te behalen. Een paar gerichte ingrepen leveren merkbaar comfort en besparing op.',
  },
  {
    min: 21,
    band: 4,
    status: 'Nog veel potentieel',
    desc: 'Er lekt op meerdere plekken energie weg. De maatregelen hieronder kunnen flink schelen op de energierekening.',
  },
  {
    min: 0,
    band: 5,
    status: 'Veel energieverlies — grote kans op besparing',
    desc: 'Dit pand verbruikt vermoedelijk aanzienlijk meer energie dan nodig. De maatregelen hieronder bieden de grootste besparingskansen.',
  },
]
