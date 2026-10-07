import { ROUTES } from '../lib/routes'

/**
 * Verbatim from the client's existing published FAQ (verified during the
 * site analysis), grouped into categories for scannability — the
 * original showed these as one flat list. No answers were reworded.
 *
 * `answerParts`, where present, is what Faq.jsx renders instead of
 * `answer` — the same text split around one internal link. `answer`
 * itself is left untouched and unused for rendering in that case,
 * because getFaqSchema() reads `answer` verbatim as the FAQPage
 * schema's plain-text Answer — splitting it into parts there would
 * corrupt the structured data.
 */
export const FAQ_CATEGORIES = [
  {
    category: 'Pakketten & prijzen',
    items: [
      {
        question: 'Wat is het verschil tussen de drie pakketten?',
        answer:
          'Het Basis Pakket (QuickScan) geeft u op afstand een eerste, betrouwbare indicatie inclusief een indicatie van EIA/ISDE-subsidiemogelijkheden. Het Premium Pakket voegt een fysieke opname, een gedetailleerde bouwkundige en installatietechnische analyse en een financieel overzicht met scenario\'s toe. Het Gold Pakket ontzorgt binnen een vooraf afgebakende scope: maximaal 3 geselecteerde maatregelen, offertes bij maximaal 3 aanbieders per maatregel en één visuele opleveringscheck bij afronding.',
      },
      {
        question: 'Wat kost een verduurzamingsadvies?',
        answer:
          'Het Basis Pakket kost € 495 (tot 1.000 m²) of € 695 (1.000–2.500 m²), het Premium Pakket € 995 of € 1.295 en het Gold Pakket € 2.495 of € 2.995, steeds excl. btw en afhankelijk van de oppervlakte van uw pand. Voor grotere of complexere panden stellen we een prijs op aanvraag vast.',
      },
      {
        question: 'Zijn de genoemde besparingen en investeringen bindend?',
        answer:
          'Nee. De bedragen in ons rapport zijn indicatief, gebaseerd op kentallen en een visuele opname. Voor een sluitend uitvoeringsbudget zijn offertes van uitvoerende partijen nodig. Daar helpen we u graag bij, met name in het Gold Pakket.',
      },
    ],
  },
  {
    category: 'Werkwijze & proces',
    items: [
      {
        question: 'Hoe lang duurt een QuickScan?',
        answer:
          'Van opdracht tot rapport rekent u doorgaans op 1 tot 2 weken, afhankelijk van de beschikbaarheid voor een locatiebezoek. Het locatiebezoek zelf duurt 1 tot 2 uur.',
      },
      {
        question: 'Wat als ik niet tevreden ben over het rapport?',
        answer:
          'Klachten dienen we zo spoedig mogelijk, uiterlijk binnen 30 dagen na constatering, gemotiveerd in. We reageren binnen 14 dagen en zoeken samen naar een oplossing. Zie ook onze Algemene Voorwaarden.',
      },
      {
        question: 'Bieden jullie ook onderhoud of monitoring na de uitvoering?',
        answer:
          'SMV Advies richt zich op advies en begeleiding. Voor onderhoud en monitoring van installaties verwijzen we u naar uw installateur. In het Gold Pakket verzorgen we wel de eindafname en eindrapportage na uitvoering.',
      },
      {
        question: 'Ik werk al met een vaste installateur, kan ik dan nog bij SMV Advies terecht?',
        answer:
          'Ja. Wij voeren zelf geen installatiewerk uit en hebben geen belang bij een bepaalde installateur. Ons advies staat los van wie de uitvoering doet: u kunt de uitkomst gebruiken bij uw eigen installateur, of wij denken mee bij de keuze.',
      },
      {
        question: 'Ik heb al een meerjarenonderhoudsplan (MJOP), heeft een advies van SMV dan nog zin?',
        answer:
          'Een MJOP richt zich op onderhoud en vervanging van bouwdelen en installaties. Ons advies kijkt specifiek naar verduurzamingsmaatregelen zoals energie, isolatie en installaties, en hoe die zich verhouden tot al geplande onderhoudsmomenten. Beide vullen elkaar aan, ze vervangen elkaar niet.',
      },
    ],
  },
  {
    category: 'Onafhankelijkheid & regio',
    items: [
      {
        question: 'Is SMV Advies onafhankelijk?',
        answer:
          'Ja, volledig. SMV Advies voert zelf geen bouwkundige of installatietechnische werkzaamheden uit en verkoopt geen producten. Ons advies is puur gericht op uw belang. Bij het Gold Pakket schakelen we installateurs in, maar de keuze ligt altijd bij u.',
      },
      {
        question: 'In welke regio zijn jullie actief?',
        answer:
          'SMV Advies is gevestigd in Oud-Beijerland en actief in de hele Hoeksche Waard en omliggende plaatsen. Denkt u aan een pand buiten deze regio? Neem contact op en we bekijken de mogelijkheden.',
      },
    ],
  },
  {
    category: 'Subsidies & privacy',
    items: [
      {
        question: 'Helpen jullie met subsidies zoals EIA en ISDE?',
        answer:
          'Ja. Vanaf het Premium Pakket voeren we een subsidie-check uit en adviseren we per maatregel welke regelingen zoals de EIA, ISDE en SDE++ mogelijk van toepassing zijn. Bij het Gold Pakket ondersteunen we u ook bij de daadwerkelijke aanvraag bij het RVO.',
        answerParts: [
          'Ja. Vanaf het Premium Pakket voeren we een subsidie-check uit en adviseren we per maatregel welke regelingen zoals ',
          { text: 'de EIA, ISDE en SDE++', to: ROUTES.blogPost('eia-isde-sde-subsidies') },
          ' mogelijk van toepassing zijn. Bij het Gold Pakket ondersteunen we u ook bij de daadwerkelijke aanvraag bij het RVO.',
        ],
      },
      {
        // Corrected to match the tool's actual behavior: the previous
        // answer said contact details were only needed if the visitor
        // wanted the report emailed. In reality, step 4 of the energy scan
        // (src/lib/energieScan/validation.js, validateStep4) requires
        // naam/bedrijfsnaam/e-mail/telefoon before any result is shown at
        // all. Per instruction, the tool is leading — this answer was
        // rewritten to match it, not the other way around.
        question: 'Kan ik de gratis energie-indicatie anoniem doen?',
        answer:
          'Nee. Naast pandkenmerken zoals oppervlakte en bouwjaar vraagt de tool ook uw naam, bedrijfsnaam, e-mailadres en telefoonnummer — dit is nodig om uw persoonlijke rapport te kunnen berekenen en toesturen. U kunt wel altijd bezwaar maken tegen opvolgend contact naar aanleiding van uw aanvraag.',
      },
    ],
  },
]
