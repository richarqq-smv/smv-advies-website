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

// Besparing in m3 gas per m2 (dak/gevel/vloer/glas), per huidige staat.
// GLAS_FACTOR is in dezelfde eenheid (m3 gas/m2/jaar) als de andere drie —
// eerder hier "relatieve factor" genoemd, maar de berekening in
// calculations.js behandelt hem identiek aan DAK/GEVEL/VLOER_FACTOR
// (vermenigvuldigd met een m2-oppervlak, opgeteld bij de andere m3-besparingen).
export const DAK_FACTOR = { geen: 11, matig: 9, redelijk: 6, goed: 2, onbekend: 8 }
export const GEVEL_FACTOR = { geen: 8, matig: 6.5, redelijk: 5, goed: 1.5, onbekend: 6 }
export const VLOER_FACTOR = { geen: 5.5, matig: 4.5, redelijk: 3, goed: 1, onbekend: 4 }
export const GLAS_FACTOR = { enkel: 16, dubbel: 12, hr: 6, hrpp: 1, triple: 0, onbekend: 10 }

/**
 * Typische Rc-waardes (thermische weerstand, m²K/W) en U-waardes voor
 * beglazing (W/m²K, het omgekeerde van Rc — warmtedoorgang i.p.v.
 * -weerstand). Dit zijn algemene, stabiele bouwfysische richtwaarden die
 * niet jaarlijks veranderen — in tegenstelling tot bijv. ISDE-
 * subsidiedrempels, die wél jaarlijks wijzigen en apart tegen de meest
 * recente RVO-bron gecontroleerd moeten worden, nooit tegen deze tabel.
 *
 * Herkomst: algemeen erkende bouwfysische richtwaarden voor Nederlandse
 * bedrijfspanden/woningen, niet ontleend aan de brontool.
 *
 * Gebruikt om de kwalitatieve isolatie-/beglazingscategorieën die de
 * gebruiker in stap 2 kiest (geen/matig/redelijk/goed, resp.
 * enkel/dubbel/hr/hrpp/triple) te onderbouwen met een concrete Rc-/
 * U-indicatie (zie RC_HINT_* / U_HINT_BEGLAZING hieronder) — vóór deze
 * tabel had de gebruiker geen enkel houvast bij het kiezen van een
 * subjectief label als "Matig" of "Redelijk".
 *
 * BELANGRIJK: de reeds geverifieerde besparingsmultipliers hierboven
 * (ISOLATIE_FACTOR, DAK_FACTOR, GEVEL_FACTOR, VLOER_FACTOR, GLAS_FACTOR)
 * zijn NIET herschreven op basis van deze Rc-waardes. Een volledige
 * fysica-herberekening (Rc x oppervlak x graaddagen / rendement) zou een
 * wezenlijk andere uitkomst geven dan de huidige, expliciet als
 * "overgenomen uit de brontool, niet aanpassen zonder herverificatie"
 * gemarkeerde multipliers — zonder toegang tot die brontool zou dat een
 * ongeverifieerde koerswijziging zijn in plaats van een controle.
 */
export const RC_REFERENTIEWAARDEN = {
  gevel: { ongeisoleerd: [0.2, 0.4], naIsolatie: [1.3, 1.5], nieuwbouwBeng: 4.7 },
  dak: { ongeisoleerd: [0.15, 0.3], naIsolatie: [2.5, 6.0], nieuwbouwBeng: 4.7 },
  vloer: { ongeisoleerd: [0.15, 0.2], naIsolatie: [2.5, 3.5], nieuwbouwBeng: 3.7 },
  beglazing: {
    enkel: 5.1,
    dubbelOud: [2.8, 3.0],
    hrpp: [1.1, 1.2],
    triple: [0.6, 0.8],
    nieuwbouwGemiddeld: 1.65,
  },
}

/**
 * Korte, gebruikersgerichte Rc-indicatie per keuze in stap 2, afgeleid van
 * RC_REFERENTIEWAARDEN hierboven — getoond als hint onder elke optie
 * (zie OptionGrid.jsx). "Matig"/"redelijk" liggen tussen de ongeïsoleerd-
 * en na-isolatiewaarde in; daarvoor bestaat geen aparte bronwaarde, dus
 * die worden als indicatieve bandbreedte weergegeven ("typisch",
 * "richting") in plaats van als een foutief precieze waarde.
 */
export const RC_HINT_GEVEL = {
  geen: 'Rc ≈ 0,2-0,4 — vergelijkbaar met een ongeïsoleerde spouwmuur',
  matig: 'Rc typisch < 1,0 — merkbaar onder standaard na-isolatieniveau (1,3+)',
  redelijk: 'Rc typisch 0,8-1,3 — richting standaard na-isolatieniveau',
  goed: 'Rc ≈ 1,3-1,5 of hoger — standaard na-isolatieniveau',
}

export const RC_HINT_DAK = {
  geen: 'Rc ≈ 0,15-0,3 — vergelijkbaar met een ongeïsoleerd dak',
  matig: 'Rc typisch < 2,5 — merkbaar onder standaard na-isolatieniveau (2,5+)',
  redelijk: 'Rc typisch 1,5-2,5 — richting standaard na-isolatieniveau',
  goed: 'Rc ≈ 2,5-6,0 — standaard na-isolatieniveau',
}

export const RC_HINT_VLOER = {
  geen: 'Rc ≈ 0,15-0,2 — vergelijkbaar met een ongeïsoleerde vloer',
  matig: 'Rc typisch < 2,5 — merkbaar onder standaard na-isolatieniveau (2,5+)',
  redelijk: 'Rc typisch 1,5-2,5 — richting standaard na-isolatieniveau',
  goed: 'Rc ≈ 2,5-3,5 — standaard na-isolatieniveau',
}

// HR-glas (tussen verouderd dubbel en HR++) is een erkende Nederlandse
// beglazingsklasse; het gangbare U-waardebereik komt niet uit de door de
// gebruiker aangeleverde tabel maar is dezelfde soort algemene, stabiele
// richtwaarde als de rest van deze sectie.
export const U_HINT_BEGLAZING = {
  enkel: 'U ≈ 5,1 — hoogste warmteverlies van alle glastypen',
  dubbel: 'U ≈ 2,8-3,0 (verouderd dubbel glas)',
  hr: 'U ≈ 1,6-2,0 (HR-glas, tussen verouderd dubbel en HR++)',
  hrpp: 'U ≈ 1,1-1,2 — bij nieuwbouw-gemiddelde (≤ 1,65)',
  triple: 'U ≈ 0,6-0,8 — ruim onder nieuwbouw-gemiddelde',
}

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
