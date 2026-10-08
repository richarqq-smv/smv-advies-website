/**
 * Jaargebonden regelconfiguratie voor ISDE-isolatiemaatregelen — pure
 * data, geen logica. Dit is bewust de ENIGE plek waar een tarief/eis/bron-
 * URL staat: subsidieEligibility.js en subsidieCalculator.js lezen hier
 * uit, nooit andersom (opdracht §32-35/46: "regelingconfiguratie, niet
 * vijf keer hardcoded").
 *
 * Bronnen (gecontroleerd 2026-10-08 — zie `bron.gecontroleerdOp`
 * hieronder; dat is vandaag, nooit een datum na vandaag, zie opdracht §20.
 * Eerdere versie van dit bestand had hier per abuis 2026-10-09 staan —
 * één dag ná de datum waarop die controle feitelijk plaatsvond; hersteld
 * in deze ronde):
 * - Dakisolatie: RVO-meldcodepagina's voor dakisolatiesystemen (bv.
 *   rvo.nl/meldcodes-isolatie/ka30327-...) vermelden voor 2026 een
 *   subsidiebedrag van € 16,25/m² bij één isolatiemaatregel en
 *   € 32,50/m² bij meerdere isolatiemaatregelen in dezelfde aanvraag
 *   ("uw subsidie verdubbelt bij meer dan één maatregel"), met een
 *   minimale Rd-waarde van 3,5 m²K/W (2,5 bij een monument) en minimaal
 *   70% van het dakoppervlak binnen de thermische schil.
 * - Gevelisolatie: RVO-meldcodepagina's voor gevelisolatiesystemen (bv.
 *   rvo.nl/meldcodes-isolatie/ka31000-... en ka31001-...) vermelden
 *   voor 2026 € 20,25/m² bij één maatregel, € 40,50/m² bij meerdere
 *   maatregelen, minimale Rd-waarde 3,5 m²K/W, subsidiabel oppervlak
 *   minimaal 10 m² en maximaal 170 m². Spouwmuurisolatie is bij RVO GEEN
 *   eigen meldcode-categorie met een eigen tarief — spouwmuur- en
 *   buitengevelisolatie delen dezelfde "gevelisolatie"-categorie en dus
 *   dezelfde regel hierboven (geen apart derde maatregel-type verzonnen).
 * - Vloerisolatie: meerdere onafhankelijke RVO-meldcodepagina's
 *   (o.a. ka18164, ka20826, ka19461, ka18161, ka18808, ka26835) vermelden
 *   voor 2026 identiek € 5,50/m² bij één maatregel, € 11,00/m² bij
 *   combinatie, minimale Rd-waarde 3,5 m²K/W.
 * - Bodemisolatie: eigen, lager tarief dan vloerisolatie (andere RVO-
 *   meldcodecategorie) — meerdere onafhankelijke meldcodepagina's
 *   (o.a. ka18779, ka27246, ka20269, ka21040, ka18863) vermelden voor
 *   2026 identiek € 3,00/m² bij één maatregel, € 6,00/m² bij combinatie,
 *   minimale Rd-waarde 3,5 m²K/W. RVO behandelt vloer- en bodemisolatie
 *   van dezelfde vloer als elkaar uitsluitend (je kiest er één) — dat is
 *   een aanvraagvoorwaarde, geen rekenregel van deze engine; de adviseur
 *   moet dit zelf bewaken (zie `onbekendeVoorwaarden`).
 * - Geen betrouwbare, rechtstreeks-RVO-bevestigde minimum-/maximum-
 *   oppervlakte voor dak-, vloer- of bodemisolatie gevonden tijdens deze
 *   controle — dat veld blijft daarom bewust leeg (`null`) in plaats van
 *   een gegokt getal. Zie `onbekendeVoorwaarden` hieronder; de
 *   eligibility-laag slaat een check over die geen regel heeft, in
 *   plaats van een voorwaarde te verzinnen.
 * - HR++ glas: in de vorige ronde bewust niet geïmplementeerd omdat alleen
 *   onderling tegensprekende commerciële bronnen waren gevonden. Bij
 *   hercontrole (gerichte inhoudelijke uitbreidingsronde, 2026-10-08) wél
 *   gevonden: meerdere onafhankelijke RVO-meldcodepagina's voor
 *   hoogrendementsglas (o.a. ka30612, ka30598, ka30617, ka30621, ka30619,
 *   ka30643, ka30626) vermelden identiek € 25/m² bij één maatregel,
 *   € 50/m² bij combinatie, bij een maximale U-waarde van 1,2 W/m²K.
 *   Let op de richting: bij glas is LAGER beter (U-waarde), in
 *   tegenstelling tot isolatie hierboven waar HOGER beter is (Rd-waarde)
 *   — zie `technischeEisRichting` per regel hieronder.
 * - Triple glas: RVO-meldcodepagina (ka30689) vermeldt € 111/m² bij één
 *   maatregel, € 222/m² bij combinatie, maximale U-waarde 0,7 W/m²K.
 *   Vereist vervanging van de kozijnen (anders valt het product terug op
 *   een HR++-meldcode/-tarief) — dat is al verwerkt in wélke meldcode de
 *   installateur voor het product opgeeft, geen apart veld hier nodig.
 * - Combinatie-bijzonderheid bij glas: twee glasproducten samen (bv.
 *   HR++ én triple in dezelfde aanvraag) tellen NIET als "combinatie" met
 *   elkaar — het is dezelfde maatregelsoort. Daarom delen beide
 *   glasregels hieronder dezelfde `combinatieCategorie: 'glas'`, zodat de
 *   calculator ze niet dubbel meetelt (zie subsidieCalculator.js).
 * - Geen betrouwbare, rechtstreeks-RVO-bevestigde minimum-/maximum-
 *   oppervlakte voor glas gevonden (de veelgenoemde "3 tot 45 m²" komt
 *   uitsluitend van commerciële bronnen) — net als bij dak/vloer/bodem
 *   blijft dat veld daarom bewust `null`.
 * - Kozijnen/deuren zónder glas: geen zelfstandige ISDE-categorie
 *   gevonden — RVO subsidieert kozijnen alleen indirect via de
 *   triple-glas-eis ("nieuwe kozijnen nodig voor het triple-glastarief"),
 *   niet als losse maatregel. Bewust niet als eigen maatregel toegevoegd.
 * - Ventilatie: zie isdeVentilatieRegel.js — apart bestand omdat het geen
 *   €/m²-tarief is maar een vast bedrag mét een harde voorwaarde
 *   (verplichte combinatie met isolatie).
 * - Algemene RVO-informatie-/aanvraagpagina (stabiele URL, niet per
 *   product): https://www.rvo.nl/subsidies-financiering/isde/
 *   woningeigenaren/isolatiemaatregelen — gebruikt hier als zowel de
 *   "officiële bron" als de "officiële aanvraagpagina", omdat er geen
 *   afzonderlijke, op dit moment bevestigde aanvraag-specifieke URL is.
 *
 * Nieuw jaar toevoegen = een nieuwe sleutel onder ISDE_ISOLATIE_REGELS
 * met eigen, opnieuw gecontroleerde bron — nooit het vorige jaar
 * hergebruiken "omdat het er vergelijkbaar uitziet" (opdracht §34).
 */

const RVO_ISOLATIE_PAGINA = {
  label: 'RVO — ISDE isolatiemaatregelen (woningeigenaren)',
  url: 'https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/isolatiemaatregelen',
  gecontroleerdOp: '2026-10-08',
}

const RVO_GLAS_PAGINA = {
  label: 'RVO — ISDE isolatiemaatregelen (woningeigenaren)',
  url: 'https://www.rvo.nl/subsidies-financiering/isde/woningeigenaren/isolatiemaatregelen',
  gecontroleerdOp: '2026-10-08',
}

export const ISDE_ISOLATIE_REGELS = {
  2026: {
    dakisolatie: {
      scheme: 'ISDE',
      maatregelKey: 'dakisolatie',
      label: 'Dakisolatie',
      technischeEisRichting: 'rd_minimum',
      technischeEenheidLabel: 'Rd, m²K/W',
      minimumRd: 3.5,
      minimumRdMonument: 2.5,
      tariefPerM2Enkel: 16.25,
      tariefPerM2Combinatie: 32.5,
      minOppervlakteM2: null,
      maxOppervlakteM2: null,
      combinatieCategorie: 'dak',
      onbekendeVoorwaarden: ['minimale/maximale oppervlakte niet rechtstreeks bij RVO bevestigd tijdens broncontrole'],
      bron: RVO_ISOLATIE_PAGINA,
    },
    gevelisolatie: {
      scheme: 'ISDE',
      maatregelKey: 'gevelisolatie',
      label: 'Gevelisolatie (incl. spouwmuur)',
      technischeEisRichting: 'rd_minimum',
      technischeEenheidLabel: 'Rd, m²K/W',
      minimumRd: 3.5,
      minimumRdMonument: 2.5,
      tariefPerM2Enkel: 20.25,
      tariefPerM2Combinatie: 40.5,
      minOppervlakteM2: 10,
      maxOppervlakteM2: 170,
      combinatieCategorie: 'gevel',
      onbekendeVoorwaarden: [],
      bron: RVO_ISOLATIE_PAGINA,
    },
    vloerisolatie: {
      scheme: 'ISDE',
      maatregelKey: 'vloerisolatie',
      label: 'Vloerisolatie',
      technischeEisRichting: 'rd_minimum',
      technischeEenheidLabel: 'Rd, m²K/W',
      minimumRd: 3.5,
      minimumRdMonument: 3.5,
      tariefPerM2Enkel: 5.5,
      tariefPerM2Combinatie: 11.0,
      minOppervlakteM2: null,
      maxOppervlakteM2: null,
      combinatieCategorie: 'vloer',
      onbekendeVoorwaarden: ['minimale/maximale oppervlakte niet rechtstreeks bij RVO bevestigd tijdens broncontrole', 'RVO geeft subsidie voor óf vloer- óf bodemisolatie van dezelfde vloer, niet voor beide — door de adviseur te bewaken'],
      bron: RVO_ISOLATIE_PAGINA,
    },
    bodemisolatie: {
      scheme: 'ISDE',
      maatregelKey: 'bodemisolatie',
      label: 'Bodemisolatie',
      technischeEisRichting: 'rd_minimum',
      technischeEenheidLabel: 'Rd, m²K/W',
      minimumRd: 3.5,
      minimumRdMonument: 3.5,
      tariefPerM2Enkel: 3.0,
      tariefPerM2Combinatie: 6.0,
      minOppervlakteM2: null,
      maxOppervlakteM2: null,
      combinatieCategorie: 'bodem',
      onbekendeVoorwaarden: ['minimale/maximale oppervlakte niet rechtstreeks bij RVO bevestigd tijdens broncontrole', 'RVO geeft subsidie voor óf vloer- óf bodemisolatie van dezelfde vloer, niet voor beide — door de adviseur te bewaken'],
      bron: RVO_ISOLATIE_PAGINA,
    },
    glasHrpp: {
      scheme: 'ISDE',
      maatregelKey: 'glasHrpp',
      label: 'HR++ glas',
      technischeEisRichting: 'u_maximum',
      technischeEenheidLabel: 'U, W/m²K',
      maximumU: 1.2,
      tariefPerM2Enkel: 25,
      tariefPerM2Combinatie: 50,
      minOppervlakteM2: null,
      maxOppervlakteM2: null,
      combinatieCategorie: 'glas',
      onbekendeVoorwaarden: ['minimale/maximale oppervlakte niet rechtstreeks bij RVO bevestigd tijdens broncontrole (commerciële bronnen noemen 3–45 m², niet officieel bevestigd)'],
      bron: RVO_GLAS_PAGINA,
    },
    glasTriple: {
      scheme: 'ISDE',
      maatregelKey: 'glasTriple',
      label: 'Triple glas',
      technischeEisRichting: 'u_maximum',
      technischeEenheidLabel: 'U, W/m²K',
      maximumU: 0.7,
      tariefPerM2Enkel: 111,
      tariefPerM2Combinatie: 222,
      minOppervlakteM2: null,
      maxOppervlakteM2: null,
      combinatieCategorie: 'glas',
      onbekendeVoorwaarden: [
        'minimale/maximale oppervlakte niet rechtstreeks bij RVO bevestigd tijdens broncontrole (commerciële bronnen noemen 3–45 m², niet officieel bevestigd)',
        'vereist vervanging van de kozijnen — anders geldt het HR++-tarief; dit wordt bepaald door welke meldcode het product daadwerkelijk heeft',
      ],
      bron: RVO_GLAS_PAGINA,
    },
  },
}

export const ONDERSTEUNDE_MAATREGELEN = ['dakisolatie', 'gevelisolatie', 'vloerisolatie', 'bodemisolatie', 'glasHrpp', 'glasTriple']

export const MAATREGEL_LABELS = {
  dakisolatie: 'Dakisolatie',
  gevelisolatie: 'Gevelisolatie',
  vloerisolatie: 'Vloerisolatie',
  bodemisolatie: 'Bodemisolatie',
  glasHrpp: 'HR++ glas',
  glasTriple: 'Triple glas',
}

/**
 * De technische-eenheid-labels (Rd vs. U-waarde) per jaar in
 * ISDE_ISOLATIE_REGELS opvragen, zoals eerst gedaan werd, vereist een
 * bekend uitvoeringsjaar — vóórdat dat jaar bekend is (bv. tijdens de
 * opname, die chronologisch vaak vóór de subsidiepagina gebeurt) viel de
 * eenheid dan altijd terug op de Rd-standaardwaarde, ook voor glas. De
 * eenheid (Rd of U) is echter een intrinsieke eigenschap van de
 * MAATREGEL zelf, niet van het jaar — daarom hier apart, jaar-onafhankelijk
 * vastgelegd zodat de juiste eenheid altijd getoond kan worden, ook vóór
 * er een uitvoeringsjaar is gekozen.
 */
export const TECHNISCHE_EENHEID_PER_MAATREGEL = {
  dakisolatie: 'Rd, m²K/W',
  gevelisolatie: 'Rd, m²K/W',
  vloerisolatie: 'Rd, m²K/W',
  bodemisolatie: 'Rd, m²K/W',
  glasHrpp: 'U, W/m²K',
  glasTriple: 'U, W/m²K',
}

/** Geeft de regelset voor dit jaar+maatregel, of `null` als er (nog) geen regelset voor dat jaar/die maatregel bestaat — nooit terugvallen op een ander jaar. */
export function vindRegel(jaar, maatregelKey) {
  if (!jaar) return null
  return ISDE_ISOLATIE_REGELS[jaar]?.[maatregelKey] ?? null
}
