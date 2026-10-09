/**
 * Generieke registratie van EIA-/MIA-/Vamil-bedrijfsmiddelen binnen de
 * scope van SMV Advies (gebouwde omgeving/utiliteitsbouw) — regelsetversie
 * 2026. Pure data, geen logica (zelfde rol als isdeIsolatieRegels.js voor
 * ISDE): fiscaleKoppeling.js leest hier uit, nooit andersom.
 *
 * ONDERZOEKSVERANTWOORDING (2026-10-09): directe toegang tot rvo.nl is
 * vanuit deze omgeving niet mogelijk (DNS-blokkade op het hele domein,
 * zowel voor de opgegeven brochure-PDF's als losse rvo.nl-pagina's).
 * Onderzoek is daarom gedaan via de zoekresultaten/snippets van een
 * webzoekmachine, die bij meerdere losse rvo.nl/milieu-en-
 * energielijst-2026/<code>-pagina's titel + (deels) voorwaarden teruggaf.
 * Elke entry hieronder vermeldt expliciet welke velden uit die snippets
 * zijn bevestigd en welke NIET — ontbrekende/onzekere velden zijn `null`
 * met een toelichting, nooit een gegokt getal (opdracht: "gebruik geen
 * fictieve bedrijfsmiddelcodes, percentages, investeringsgrenzen"). Een
 * bedrijfsmiddel dat wél topicaal relevant is voor SMV maar waarvan geen
 * betrouwbare code/pagina is gevonden, staat NIET in deze lijst (geen
 * verzonnen code) — zie i.p.v. daarvan de "Controle vereist"-items
 * onderaan, die wel de juiste algemene vindplaats-URL hebben.
 *
 * `verificatieStatus`:
 * - 'officieel_geverifieerd' — code, titel en kernvoorwaarden rechtstreeks
 *   uit een rvo.nl-paginasnippet bevestigd.
 * - 'mogelijk_relevant'      — code/titel/URL bevestigd, maar niet alle
 *   voorwaarden/percentages volledig uit de snippet op te maken; de
 *   adviseur moet de volledige RVO-pagina zelf raadplegen.
 * - 'controle_vereist'       — onderwerp/categorie bevestigd relevant voor
 *   SMV, maar GEEN betrouwbare specifieke bedrijfsmiddelcode gevonden;
 *   verwijst naar de officiële Milieu- en Energielijst 2026-overzichtspagina.
 * (`buiten_scope`/`niet_van_toepassing` worden niet hier vastgelegd, maar
 * runtime bepaald door fiscaleKoppeling.js op basis van het pandtype —
 * eenzelfde bedrijfsmiddel kan voor het ene dossier "mogelijk relevant"
 * zijn en voor het andere "niet van toepassing", dat is geen vaste
 * eigenschap van het bedrijfsmiddel zelf.)
 *
 * `categorie` koppelt een bedrijfsmiddel aan de dossier-signalen die het
 * kunnen aanleiden (zie fiscaleKoppeling.js) — geen vrije tekstmatch,
 * een vaste, eindige set categorieën.
 */
import { FISCALE_REGELING_SOORT } from './fiscaleRegelingParameters.js'

export const FISCALE_CATEGORIE = {
  ISOLATIE: 'isolatie',
  VENTILATIE: 'ventilatie',
  WARMTEPOMP: 'warmtepomp',
  OPWEK_OPSLAG: 'opwek_opslag',
  COLLECTIEF: 'collectief',
  GROEN_DAK_GEVEL: 'groen_dak_gevel',
  DUURZAAM_GEBOUW: 'duurzaam_gebouw',
  GROEN_TERREIN: 'groen_terrein',
}

const MILIEU_ENERGIELIJST_OVERZICHT = {
  label: 'RVO — Milieu- en Energielijst 2026 (overzicht)',
  url: 'https://www.rvo.nl/milieu-energielijst-2026',
  gecontroleerdOp: '2026-10-09',
}

function codePagina(code) {
  return `https://www.rvo.nl/milieu-en-energielijst-2026/${code}`
}

export const FISCALE_BEDRIJFSMIDDELEN = [
  // --- EIA (Energielijst 2026) ---
  {
    id: 'eia-210404',
    regelingen: ['eia'],
    bedrijfsmiddelcode: '210404',
    titel: 'Biobased isolatie voor bestaande constructies',
    officieleUrl: codePagina('210404'),
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.ISOLATIE,
    toepassingsgebied: 'Na-isolatie van bestaande bedrijfsgebouwen (dak/wand/vloer) met biobased isolatiemateriaal.',
    doelgroep: 'Ondernemers (IB/Vpb) met een bestaand bedrijfsgebouw.',
    technischeVoorwaarden: [
      'Isolatiemateriaal moet biobased zijn (specifieke materiaaleisen op de RVO-paginazelf — niet uit de gevonden snippet te herleiden).',
      'Geldt voor bestaande constructies (geen nieuwbouw).',
    ],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Alleen het wettelijke EIA-minimum (€ 2.500) is bevestigd; een eventueel maximum per m² is niet uit de gevonden snippet te herleiden.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: 40, toelichting: 'Generiek EIA-aftrekpercentage 2026 (zie fiscaleRegelingParameters.js) — geen bedrijfsmiddel-specifiek percentage gevonden.' },
    uitsluitingen: ['Niet-biobased isolatiemateriaal valt onder een andere/geen EIA-categorie.'],
    samenloop: ['Combinatie met ISDE is niet van toepassing — ISDE in deze applicatie geldt voor woningeigenaren, EIA voor ondernemers/bedrijfsmiddelen.'],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum (koopovereenkomst/bestelling)', 'Oppervlakte en toegepast isolatiemateriaal'],
    vereisteBewijsstukken: ['Offerte/factuur', 'Productspecificatie (bevestiging biobased materiaal)'],
    procedure: { stap: 'melden', omschrijving: 'Melden bij RVO binnen 3 maanden na het aangaan van de investeringsverplichting, via het eLoket.', termijnMaanden: 3 },
    bron: { label: 'RVO — Milieu- en Energielijst 2026, code 210404', url: codePagina('210404'), gecontroleerdOp: '2026-10-09' },
    regelsetVersie: '2026',
    verificatieStatus: 'mogelijk_relevant',
  },
  {
    id: 'eia-210800',
    regelingen: ['eia'],
    bedrijfsmiddelcode: '210800',
    titel: 'Luchtbehandelingskast met warmteterugwinning voor nieuwe bedrijfsgebouwen',
    officieleUrl: codePagina('210800'),
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.VENTILATIE,
    toepassingsgebied: 'Ventilatie-/klimaatinstallatie in een nieuw bedrijfsgebouw.',
    doelgroep: 'Ondernemers (IB/Vpb) die een nieuw bedrijfsgebouw (laten) bouwen.',
    technischeVoorwaarden: [
      'Warmtewisselaar: thermisch rendement ≥ 83%.',
      'Maximaal drukverlies 250 Pa over de wisselaar.',
      'Maximale luchtsnelheid 1,4 m/s in de kast.',
      'Eurovent-label A+ of beter in de wintersituatie.',
      'Koelmachines, ketels, warmtepompen, leidingwerk, luchtkanalen, bevochtiging en adiabatische koeling vallen buiten deze post.',
      'Meetmethode: NEN-EN 13053:2019, nominale condities.',
    ],
    investeringsgrenzen: { minimum: 2500, maximum: 5000, toelichting: 'Maximaal € 5.000 per luchtbehandelingskast voor niet-geïntegreerde meet- en regeltechniek (uit de gevonden snippet; controleer het volledige investeringsmaximum voor de kast zelf op de RVO-pagina).' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: 40, toelichting: 'Generiek EIA-aftrekpercentage 2026.' },
    uitsluitingen: ['Bestaande bedrijfsgebouwen vallen onder code 210801 (lichtere eisen), niet onder deze nieuwbouw-code.'],
    samenloop: [],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'Luchtdebiet en Eurovent-label van de gekozen kast'],
    vereisteBewijsstukken: ['Offerte/factuur', 'Productdatasheet met thermisch rendement/drukverlies/Eurovent-label'],
    procedure: { stap: 'melden', omschrijving: 'Melden bij RVO binnen 3 maanden na het aangaan van de investeringsverplichting, via het eLoket.', termijnMaanden: 3 },
    bron: { label: 'RVO — Milieu- en Energielijst 2026, code 210800', url: codePagina('210800'), gecontroleerdOp: '2026-10-09' },
    regelsetVersie: '2026',
    verificatieStatus: 'officieel_geverifieerd',
  },
  {
    id: 'eia-210801',
    regelingen: ['eia'],
    bedrijfsmiddelcode: '210801',
    titel: 'Luchtbehandelingskast met warmteterugwinning voor bestaande bedrijfsgebouwen',
    officieleUrl: codePagina('210801'),
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.VENTILATIE,
    toepassingsgebied: 'Vervanging/toevoeging van een ventilatie-/klimaatinstallatie in een bestaand bedrijfsgebouw.',
    doelgroep: 'Ondernemers (IB/Vpb) met een bestaand bedrijfsgebouw.',
    technischeVoorwaarden: [
      'Luchtdebiet groter dan 1.000 m³/uur.',
      'Warmtewisselaar: thermisch rendement ≥ 78%.',
      'Maximaal drukverlies 230 Pa over de wisselaar.',
      'Maximale luchtsnelheid 1,6 m/s in de kast.',
      'Eurovent-label A of beter in de wintersituatie.',
    ],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Alleen het wettelijke EIA-minimum bevestigd; de gevonden snippet vermeldt onderdeel b (investeringsmaximum) niet volledig.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: 40, toelichting: 'Generiek EIA-aftrekpercentage 2026.' },
    uitsluitingen: ['Nieuwbouw valt onder code 210800 (strengere eisen), niet onder deze bestaande-bouw-code.'],
    samenloop: [],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'Luchtdebiet en Eurovent-label van de gekozen kast'],
    vereisteBewijsstukken: ['Offerte/factuur', 'Productdatasheet met thermisch rendement/drukverlies/Eurovent-label'],
    procedure: { stap: 'melden', omschrijving: 'Melden bij RVO binnen 3 maanden na het aangaan van de investeringsverplichting, via het eLoket.', termijnMaanden: 3 },
    bron: { label: 'RVO — Milieu- en Energielijst 2026, code 210801 (gecontroleerd door RVO op 17-12-2025)', url: codePagina('210801'), gecontroleerdOp: '2026-10-09' },
    regelsetVersie: '2026',
    verificatieStatus: 'officieel_geverifieerd',
  },
  {
    id: 'eia-211103',
    regelingen: ['eia'],
    bedrijfsmiddelcode: '211103',
    titel: 'Warmtepomp op gesloten bodembron (brine/water)',
    officieleUrl: codePagina('211103'),
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.WARMTEPOMP,
    toepassingsgebied: 'Ruimteverwarming van een bedrijfsgebouw via een bodemwarmtepomp.',
    doelgroep: 'Ondernemers (IB/Vpb) met een bedrijfsgebouw.',
    technischeVoorwaarden: [
      'SCOP (seizoensrendement) ≥ 5,2 voor ruimteverwarming.',
      'Vanaf 2026: alleen warmtepompen met een halogeenvrij koudemiddel komen in aanmerking (synthetische koudemiddelen zoals R32 zijn uitgesloten, met uitzondering van lucht-/watergerelateerde bodemwarmtepompen — exacte uitzonderingsgrens niet volledig uit de gevonden snippet te herleiden, controleer de RVO-pagina).',
    ],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Geen specifiek maximum in de gevonden snippet.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: 40, toelichting: 'Generiek EIA-aftrekpercentage 2026.' },
    uitsluitingen: ['Warmtepompen met synthetisch (niet-halogeenvrij) koudemiddel, behalve de genoemde uitzondering.', 'Gasgestookte cv-ketels als hoofdverwarming zijn volledig uitgesloten van EIA.'],
    samenloop: ['Combinatie met codes 211106/211107/211108 (andere wateraanvoer-varianten) is uitsluitend — kies de code die bij de daadwerkelijke installatie past.'],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'SCOP en koudemiddeltype van de gekozen warmtepomp'],
    vereisteBewijsstukken: ['Offerte/factuur', 'Productdatasheet met SCOP en koudemiddeltype'],
    procedure: { stap: 'melden', omschrijving: 'Melden bij RVO binnen 3 maanden na het aangaan van de investeringsverplichting, via het eLoket.', termijnMaanden: 3 },
    bron: { label: 'RVO — Milieu- en Energielijst 2026, code 211103', url: codePagina('211103'), gecontroleerdOp: '2026-10-09' },
    regelsetVersie: '2026',
    verificatieStatus: 'mogelijk_relevant',
  },
  {
    id: 'eia-211107',
    regelingen: ['eia'],
    bedrijfsmiddelcode: '211107',
    titel: 'Lucht/water warmtepomp',
    officieleUrl: codePagina('211107'),
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.WARMTEPOMP,
    toepassingsgebied: 'Ruimteverwarming (eventueel gecombineerd met tapwater) van een bedrijfsgebouw via een lucht/water-warmtepomp.',
    doelgroep: 'Ondernemers (IB/Vpb) met een bedrijfsgebouw.',
    technischeVoorwaarden: [
      'Vanaf 2026: alleen warmtepompen met een halogeenvrij koudemiddel komen in aanmerking.',
      'Exacte SCOP-/rendementseis niet volledig uit de gevonden snippet te herleiden — controleer de RVO-pagina.',
    ],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Geen specifiek maximum in de gevonden snippet.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: 40, toelichting: 'Generiek EIA-aftrekpercentage 2026.' },
    uitsluitingen: ['Warmtepompen met synthetisch (niet-halogeenvrij) koudemiddel.', 'Gasgestookte cv-ketels als hoofdverwarming zijn volledig uitgesloten van EIA.'],
    samenloop: ['Combinatie met codes 211103/211106/211108 is uitsluitend — kies de code die bij de daadwerkelijke installatie past.'],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'Koudemiddeltype van de gekozen warmtepomp'],
    vereisteBewijsstukken: ['Offerte/factuur', 'Productdatasheet met koudemiddeltype'],
    procedure: { stap: 'melden', omschrijving: 'Melden bij RVO binnen 3 maanden na het aangaan van de investeringsverplichting, via het eLoket.', termijnMaanden: 3 },
    bron: { label: 'RVO — Milieu- en Energielijst 2026, code 211107', url: codePagina('211107'), gecontroleerdOp: '2026-10-09' },
    regelsetVersie: '2026',
    verificatieStatus: 'mogelijk_relevant',
  },
  {
    id: 'eia-251118',
    regelingen: ['eia'],
    bedrijfsmiddelcode: '251118',
    titel: 'Accu (batterij) voor opslag van duurzaam opgewekte elektriciteit',
    officieleUrl: codePagina('251118'),
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.OPWEK_OPSLAG,
    toepassingsgebied: 'Stationaire batterijopslag bij een bedrijfsmatige duurzame-opwekinstallatie (bv. zonnepanelen op een bedrijfspand).',
    doelgroep: 'Ondernemers (IB/Vpb) met een duurzame-opwekinstallatie.',
    technischeVoorwaarden: [
      'Minimaal 5 kW en 15 kWh.',
      'Mag een omvormer en regelsysteem omvatten.',
      'Vanaf 2026: alleen accu´s zonder vloeibaar lood-zuur komen in aanmerking.',
    ],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Geen specifiek maximum in de gevonden snippet.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: 40, toelichting: 'Generiek EIA-aftrekpercentage 2026.' },
    uitsluitingen: ['Accu´s met vloeibaar lood-zuur.', 'Niet gekoppeld aan een duurzame-opwekinstallatie op dezelfde netaansluiting (voorwaarde uit secundaire bron, niet rechtstreeks op de RVO-pagina bevestigd — Controle vereist).'],
    samenloop: ['Niet tegelijk met code 260101 voor dezelfde accu (kies de code die bij de daadwerkelijke toepassing/koppeling past).'],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'Capaciteit (kW/kWh) van de accu', 'Aanwezigheid en vermogen van de gekoppelde opwekinstallatie'],
    vereisteBewijsstukken: ['Offerte/factuur', 'Productdatasheet met capaciteit en accutype'],
    procedure: { stap: 'melden', omschrijving: 'Melden bij RVO binnen 3 maanden na het aangaan van de investeringsverplichting, via het eLoket.', termijnMaanden: 3 },
    bron: { label: 'RVO — Milieu- en Energielijst 2026, code 251118', url: codePagina('251118'), gecontroleerdOp: '2026-10-09' },
    regelsetVersie: '2026',
    verificatieStatus: 'mogelijk_relevant',
  },
  {
    id: 'eia-260101',
    regelingen: ['eia'],
    bedrijfsmiddelcode: '260101',
    titel: 'Opslag van elektrische energie',
    officieleUrl: codePagina('260101'),
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.OPWEK_OPSLAG,
    toepassingsgebied: 'Stationaire batterijopslag die via software is gekoppeld aan een elektrische deelmarkt (marktgekoppelde opslag/balancering).',
    doelgroep: 'Ondernemers (IB/Vpb) met een marktgekoppelde batterij.',
    technischeVoorwaarden: ['Automatische in-/uitschakeling afhankelijk van een elektrische deelmarkt, via software — een accu zonder deze marktkoppeling komt niet in aanmerking onder deze code.'],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Geen specifiek maximum in de gevonden snippet.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: 40, toelichting: 'Generiek EIA-aftrekpercentage 2026.' },
    uitsluitingen: ['Een accu zonder softwarematige marktkoppeling.'],
    samenloop: ['Niet tegelijk met code 251118 voor dezelfde accu.'],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'Bevestiging van de marktkoppelingssoftware'],
    vereisteBewijsstukken: ['Offerte/factuur', 'Productdatasheet/softwarespecificatie'],
    procedure: { stap: 'melden', omschrijving: 'Melden bij RVO binnen 3 maanden na het aangaan van de investeringsverplichting, via het eLoket.', termijnMaanden: 3 },
    bron: { label: 'RVO — Milieu- en Energielijst 2026, code 260101', url: codePagina('260101'), gecontroleerdOp: '2026-10-09' },
    regelsetVersie: '2026',
    verificatieStatus: 'mogelijk_relevant',
  },
  {
    id: 'eia-270204',
    regelingen: ['eia'],
    bedrijfsmiddelcode: '270204',
    titel: 'Energiesysteem voor het collectief verwarmen en/of koelen van bestaande gebouwen',
    officieleUrl: codePagina('270204'),
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.COLLECTIEF,
    toepassingsgebied: 'Collectieve warmte-/koude-installatie voor meerdere bestaande gebouwen (bv. bij een VvE of bedrijfsverzamelgebouw).',
    doelgroep: 'Ondernemers (IB/Vpb), eventueel samenwerkend met andere gebouweigenaren.',
    technischeVoorwaarden: ['Exacte technische eisen (rendement/capaciteit) niet uit de gevonden snippet te herleiden — controleer de volledige RVO-pagina.'],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Niet bevestigd in de gevonden snippet.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: 40, toelichting: 'Generiek EIA-aftrekpercentage 2026.' },
    uitsluitingen: [],
    samenloop: [],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'Aantal aangesloten gebouwen/eigenaren'],
    vereisteBewijsstukken: ['Offerte/factuur', 'Technisch ontwerp van het collectieve systeem'],
    procedure: { stap: 'melden', omschrijving: 'Melden bij RVO binnen 3 maanden na het aangaan van de investeringsverplichting, via het eLoket.', termijnMaanden: 3 },
    bron: { label: 'RVO — Milieu- en Energielijst 2026, code 270204', url: codePagina('270204'), gecontroleerdOp: '2026-10-09' },
    regelsetVersie: '2026',
    verificatieStatus: 'mogelijk_relevant',
  },

  // --- MIA/Vamil (Milieulijst 2026) ---
  {
    id: 'mia-vamil-5300',
    regelingen: ['mia', 'vamil'],
    bedrijfsmiddelcode: '5300',
    titel: 'Groendak',
    officieleUrl: codePagina('5300'),
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.GROEN_DAK_GEVEL,
    toepassingsgebied: 'Aanleg van een groendak (vegetatiedak) op een bedrijfsgebouw.',
    doelgroep: 'Ondernemers (IB/Vpb) met een bedrijfsgebouw.',
    technischeVoorwaarden: [
      'Omschrijving omvat de vegetatielaag, substraat en drainage; optioneel dakisolatie/dakbedekking.',
      'Bestrating en meubilair op het dak vallen buiten deze post.',
      'Een vegetatiedak dat onderdeel is van een gebouw dat al onder code D 5200 t/m D 5230 (duurzaam gebouw) is gemeld, komt niet apart in aanmerking als zelfstandig bedrijfsmiddel.',
    ],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Geen specifiek maximum in de gevonden snippet.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: 45, toelichting: 'MIA 45% — rechtstreeks uit de gevonden snippet voor dit bedrijfsmiddel.' },
    fiscaalParameterVamil: { type: FISCALE_REGELING_SOORT.FISCALE_AFSCHRIJVING, percentage: 75, toelichting: 'Vamil 75% willekeurige afschrijving — rechtstreeks uit de gevonden snippet voor dit bedrijfsmiddel.' },
    uitsluitingen: ['Niet apart subsidiabel als het al onderdeel is van een gemeld duurzaam gebouw (code D 5200-5230).'],
    samenloop: ['MIA en Vamil zijn voor dit bedrijfsmiddel beide van toepassing en te combineren (geen blind optellen van percentages — het zijn twee verschillende soorten fiscaal voordeel, zie fiscaleRegelingParameters.js).'],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'Oppervlakte van het groendak', 'Bevestiging dat het gebouw niet al onder D 5200-5230 is gemeld'],
    vereisteBewijsstukken: ['Offerte/factuur', 'Technische tekening/specificatie van de dakopbouw'],
    procedure: { stap: 'melden', omschrijving: 'Melden bij RVO binnen 3 maanden na het aangaan van de investeringsverplichting, via het eLoket.', termijnMaanden: 3 },
    bron: { label: 'RVO — Milieu- en Energielijst 2026, code 5300', url: codePagina('5300'), gecontroleerdOp: '2026-10-09' },
    regelsetVersie: '2026',
    verificatieStatus: 'officieel_geverifieerd',
  },
  {
    id: 'mia-vamil-5221',
    regelingen: ['mia', 'vamil'],
    bedrijfsmiddelcode: '5221',
    titel: 'Duurzaam gerenoveerd of zeer duurzaam nieuw utiliteitsgebouw volgens GPR Gebouw',
    officieleUrl: codePagina('5221'),
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.DUURZAAM_GEBOUW,
    toepassingsgebied: 'Nieuwbouw of ingrijpende renovatie van een utiliteitsgebouw (kantoor/bedrijfspand) volgens het GPR Gebouw-certificeringssysteem.',
    doelgroep: 'Ondernemers (IB/Vpb) met een utiliteitsgebouw.',
    technischeVoorwaarden: ['Vereist een GPR Gebouw-score/certificering — exacte minimumscore niet uit de gevonden snippet te herleiden, controleer de RVO-pagina.'],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Niet bevestigd in de gevonden snippet.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: null, toelichting: 'Geen bedrijfsmiddel-specifiek percentage in de gevonden snippet — controle vereist op de RVO-pagina zelf.' },
    uitsluitingen: [],
    samenloop: ['Een vegetatiedak (code 5300) dat onderdeel is van dit gebouw telt niet apart mee, zie code 5300.'],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'GPR Gebouw-certificaat/score'],
    vereisteBewijsstukken: ['GPR Gebouw-rapportage', 'Offerte/factuur bouw-/renovatiekosten'],
    procedure: { stap: 'melden', omschrijving: 'Melden bij RVO binnen 3 maanden na het aangaan van de investeringsverplichting, via het eLoket.', termijnMaanden: 3 },
    bron: { label: 'RVO — Milieu- en Energielijst 2026, code 5221', url: codePagina('5221'), gecontroleerdOp: '2026-10-09' },
    regelsetVersie: '2026',
    verificatieStatus: 'mogelijk_relevant',
  },
  {
    id: 'mia-vamil-5340',
    regelingen: ['mia', 'vamil'],
    bedrijfsmiddelcode: '5340',
    titel: 'Groen en gezond bedrijfsterrein (aanpassen bestaande situatie)',
    officieleUrl: codePagina('5340'),
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.GROEN_TERREIN,
    toepassingsgebied: 'Klimaatadaptieve/vergroenende aanpassing van een bestaand bedrijfsterrein (bv. ontharding, waterberging, beplanting).',
    doelgroep: 'Ondernemers (IB/Vpb) met een bestaand bedrijfsterrein.',
    technischeVoorwaarden: ['Exacte technische eisen niet uit de gevonden snippet te herleiden — controleer de volledige RVO-pagina.'],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Niet bevestigd in de gevonden snippet.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: null, toelichting: 'Geen bedrijfsmiddel-specifiek percentage in de gevonden snippet.' },
    uitsluitingen: [],
    samenloop: [],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'Oppervlakte en aard van de terreinaanpassing'],
    vereisteBewijsstukken: ['Offerte/factuur', 'Technisch plan van de terreinaanpassing'],
    procedure: { stap: 'melden', omschrijving: 'Melden bij RVO binnen 3 maanden na het aangaan van de investeringsverplichting, via het eLoket.', termijnMaanden: 3 },
    bron: { label: 'RVO — Milieu- en Energielijst 2026, code 5340', url: codePagina('5340'), gecontroleerdOp: '2026-10-09' },
    regelsetVersie: '2026',
    verificatieStatus: 'mogelijk_relevant',
  },

  // --- Controle vereist: onderwerp bevestigd relevant, geen betrouwbare specifieke code gevonden ---
  {
    id: 'eia-controle-zonnepanelen',
    regelingen: ['eia'],
    bedrijfsmiddelcode: null,
    titel: 'Zonnepanelen (PV) op een bedrijfsgebouw — specifieke 2026-code niet bevestigd',
    officieleUrl: MILIEU_ENERGIELIJST_OVERZICHT.url,
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.OPWEK_OPSLAG,
    toepassingsgebied: 'Zonnepanelen op een bedrijfsgebouw — onderwerp is bevestigd relevant (secundaire bronnen noemen een piekvermogengrens van 100 kW per aansluiting voor 2026), maar een betrouwbare, specifieke bedrijfsmiddelcode op de Energielijst 2026 is niet gevonden.',
    doelgroep: 'Ondernemers (IB/Vpb) met zonnepanelen op een bedrijfsgebouw.',
    technischeVoorwaarden: [],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Niet bevestigd — zie toepassingsgebied.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: null, toelichting: 'Niet te bepalen zonder bevestigde code.' },
    uitsluitingen: [],
    samenloop: ['Zonnepanelen die onder de SDE(++)-beschikking vallen, kennen een eigen aansluitcode (251117) — controleer of dat hier van toepassing is.'],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'Piekvermogen van de installatie'],
    vereisteBewijsstukken: ['Offerte/factuur'],
    procedure: { stap: 'controleren', omschrijving: 'Zoek de actuele, specifieke bedrijfsmiddelcode op de officiële Milieu- en Energielijst 2026 voordat een melding wordt voorbereid.', termijnMaanden: 3 },
    bron: MILIEU_ENERGIELIJST_OVERZICHT,
    regelsetVersie: '2026',
    verificatieStatus: 'controle_vereist',
  },
  {
    id: 'eia-controle-energiemanagementsysteem',
    regelingen: ['eia'],
    bedrijfsmiddelcode: null,
    titel: 'Energiemanagement-/monitoringsysteem voor gebouwinstallaties — specifieke 2026-code niet gevonden',
    officieleUrl: MILIEU_ENERGIELIJST_OVERZICHT.url,
    investeringsjaar: 2026,
    categorie: FISCALE_CATEGORIE.DUURZAAM_GEBOUW,
    toepassingsgebied: 'Meet-/regel-/energiemanagementsystemen voor bestaande gebouwinstallaties — geen specifieke, betrouwbare code gevonden tijdens dit onderzoek (alleen code 420000 "nieuwe processen" kwam naar voren, en die past niet op bestaande gebouwinstallaties).',
    doelgroep: 'Ondernemers (IB/Vpb) met een bedrijfsgebouw.',
    technischeVoorwaarden: [],
    investeringsgrenzen: { minimum: 2500, maximum: null, toelichting: 'Niet bevestigd.' },
    fiscaalParameter: { type: FISCALE_REGELING_SOORT.FISCALE_AFTREK, percentage: null, toelichting: 'Niet te bepalen zonder bevestigde code.' },
    uitsluitingen: [],
    samenloop: [],
    vereisteDossiergegevens: ['Investeringsbedrag', 'Investeringsdatum', 'Functionele omschrijving van het systeem'],
    vereisteBewijsstukken: ['Offerte/factuur'],
    procedure: { stap: 'controleren', omschrijving: 'Zoek de actuele, specifieke bedrijfsmiddelcode op de officiële Milieu- en Energielijst 2026, of vraag RVO (eia@rvo.nl) naar de juiste code.', termijnMaanden: 3 },
    bron: MILIEU_ENERGIELIJST_OVERZICHT,
    regelsetVersie: '2026',
    verificatieStatus: 'controle_vereist',
  },
]

/** Alle bedrijfsmiddelen voor één categorie (zie FISCALE_CATEGORIE) — gebruikt door fiscaleKoppeling.js. */
export function fiscaleBedrijfsmiddelenVoorCategorie(categorie) {
  return FISCALE_BEDRIJFSMIDDELEN.filter((b) => b.categorie === categorie)
}

/** Eén bedrijfsmiddel op stabiele interne ID. */
export function vindFiscaalBedrijfsmiddel(id) {
  return FISCALE_BEDRIJFSMIDDELEN.find((b) => b.id === id) ?? null
}
