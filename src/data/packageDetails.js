/**
 * Aanvullende uitleg per pakket voor de "In detail"-secties op /pakketten
 * (Meer-informatie-ronde, 2026-10-07). Bewust een los bestand, net als
 * packageComparison.js — gekoppeld aan het bestaande pakket-id uit
 * src/data/packages.js, niet een tweede plek voor naam/prijs/features/cta.
 * Pakketten.jsx leest PACKAGES voor die velden en dit bestand uitsluitend
 * voor de extra uitleg; raakt een van beide uit sync, dan faalt
 * pakkettenMeerInformatieBroncontrole.test.js op het ontbrekende pakket-id.
 *
 * Inhoudelijk een uitwerking van de bestaande featurelijsten uit
 * packages.js, geen nieuwe dienstverlening — zie de toelichting daar en
 * de Algemene Voorwaarden (src/data/legalContent.js) voor de grenzen aan
 * wat SMV Advies belooft: geen garantie op besparing/resultaat/subsidie-
 * toekenning, Gold is "ondersteuning bij de aanvraag", niet "wij regelen
 * het".
 */
export const PACKAGE_DETAILS = {
  basis: {
    voorWie:
      'Voor ondernemers en pandeigenaren die nog aan het oriënteren zijn en op afstand, zonder locatiebezoek, een eerste, betrouwbare indicatie willen voordat ze verder investeren in tijd.',
    watJeOntvangt: [
      'Een QuickScan-rapport, gebaseerd op de door u aangeleverde gegevens en foto’s.',
      'Een overzicht van de huidige situatie en de belangrijkste knelpunten in uw pand.',
      'Een top 5 van maatregelen, met per maatregel een indicatie van investering, besparing en terugverdientijd.',
      'Een indicatie van mogelijke EIA/ISDE-subsidiemogelijkheden.',
    ],
    hoeHetProcesVerloopt: [
      'U vraagt het Basis Pakket aan.',
      'U levert de gevraagde gegevens en foto’s van uw pand aan.',
      'SMV Advies stelt op basis daarvan het QuickScan-rapport op.',
      'U ontvangt het rapport — wilt u een grondiger, op locatie onderbouwd plan, dan is het Premium Pakket de logische vervolgstap.',
    ],
  },
  premium: {
    voorWie:
      'Voor ondernemers die een investeringsbeslissing willen voorbereiden en een grondig, op locatie onderbouwd beeld willen van wat er kan, in welke volgorde en tegen welke kosten.',
    watJeOntvangt: [
      'Alles uit het Basis Pakket.',
      'Een fysieke opname van uw pand door een adviseur van SMV Advies.',
      'Een gedetailleerde bouwkundige en installatietechnische analyse.',
      'Advies over welke subsidies, zoals EIA en ISDE, per maatregel mogelijk van toepassing zijn.',
      'Advies over het juiste investeringsmoment, ook in samenhang met gepland onderhoud.',
      'Een stappenplan met fasering en een financieel overzicht.',
    ],
    hoeHetProcesVerloopt: [
      'U vraagt het Premium Pakket aan.',
      'SMV Advies plant een locatiebezoek in.',
      'Tijdens de opname worden pand en installaties geïnventariseerd.',
      'U ontvangt het analyserapport met stappenplan — wilt u de uitvoering ook begeleid hebben, dan is het Gold Pakket de logische vervolgstap.',
    ],
  },
  gold: {
    voorWie:
      'Voor ondernemers die niet alleen willen weten wát er moet gebeuren, maar het traject daarna ook begeleid willen hebben — binnen een vooraf afgebakende scope.',
    watJeOntvangt: [
      'Alles uit het Premium Pakket.',
      'Begeleiding bij maximaal 3 geselecteerde maatregelen.',
      'Het opvragen en vergelijken van offertes bij maximaal 3 aanbieders per maatregel, in 1 offerteronde.',
      'Aanwezigheid bij een startoverleg met de gekozen uitvoerder, en in totaal 3 klantcontactmomenten.',
      'Ondersteuning bij de EIA/ISDE-aanvraag.',
      'Eén visuele opleveringscheck op basis van beschikbare documenten — geen technische keuring, geen bouwkundige inspectie en geen garantie op uitvoeringskwaliteit.',
      'Begeleiding tot maximaal 12 maanden na start; werkzaamheden buiten deze scope zijn meerwerk.',
    ],
    hoeHetProcesVerloopt: [
      'U vraagt het Gold Pakket aan.',
      'Samen met SMV Advies bepaalt u, op basis van het Premium-advies, welke maximaal 3 maatregelen binnen de scope vallen.',
      'SMV Advies vraagt offertes op en vergelijkt deze met u.',
      'Na uw akkoord ondersteunt SMV Advies bij de subsidieaanvraag en is aanwezig bij het startoverleg met de uitvoerder.',
      'De uitvoering zelf gebeurt door de door u gekozen installateur of aannemer.',
      'SMV Advies rondt het traject af met een visuele opleveringscheck.',
    ],
  },
}
