/**
 * De 10 kernen van de Hoeksche Waard waar SMV Advies actief is — zelfde
 * kernen als op de illustratieve kaart in Werkgebied.jsx (zie ook de
 * alt-tekst daar). Elke plaats krijgt een eigen, geïndexeerde pagina
 * (/:plaats, zie routes.js/App.jsx/scripts/prerender.mjs), zodat iemand
 * die specifiek op "verduurzamingsadvies [dorp]" zoekt een pagina vindt
 * die dat dorp ook echt noemt — zelfde soort local-SEO-opzet als de
 * blogartikelen (BLOG_POSTS) voor onderwerpen.
 *
 * `feit` is bewust alleen gevuld met controleerbare, neutrale feiten
 * (ontstaansgeschiedenis, een rijksmonument, een bedrijventerrein) — geen
 * verzonnen klantverhalen of cijfers, zelfde principe als Cases.jsx ("we
 * verzinnen geen cijfers of cases die we niet kunnen onderbouwen"). Voor
 * een paar plaatsen (Klaaswaal, Zuid-Beijerland, Mijnsheerenland, Maasdam)
 * is bewust geen bedrijventerrein genoemd — daar is er geen eigen, met
 * naam bekend bedrijventerrein gevonden, dus wordt dat ook niet beweerd.
 *
 * `hotspot` (x/y/width/height, alles in procenten van
 * werkgebied-hoeksche-waard.png, 1672x941) bepaalt zowel de positie als
 * de afmeting van de klikbare knop op Werkgebied.jsx. Niet met het oog
 * geschat: opgemeten door de exacte pixelgrenzen van elke witte
 * naam-pil in de afbeelding te detecteren (kleurdrempel + connected-
 * components, met 14px/10px marge rondom) — zie de analyse in de
 * verificatieronde 2026-10-15. Verandert de afbeelding zelf, dan moeten
 * deze waarden opnieuw gemeten worden.
 */
export const WERKGEBIED_PLAATSEN = [
  {
    slug: 'oud-beijerland',
    naam: 'Oud-Beijerland',
    title: 'Verduurzamingsadvies in Oud-Beijerland',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Oud-Beijerland, waar SMV Advies zelf gevestigd is.',
    intro:
      'SMV Advies is gevestigd in Oud-Beijerland: de regionale kern van de Hoeksche Waard, met het grootste bedrijventerrein van het eiland. Het dorp (oorspronkelijk "Beijerland" geheten) bestaat al sinds 1559 en groeide uit tot het drukste zakelijke centrum van de regio.',
    feit:
      'Als vestigingsplaats onderscheidt Oud-Beijerland zich: hier is SMV Advies zelf gevestigd, middenin het drukste zakelijke centrum van de Hoeksche Waard.',
    bedrijventerrein: 'het grootste bedrijventerrein van de Hoeksche Waard',
    faq: [
      {
        question: 'Is SMV Advies gevestigd in Oud-Beijerland?',
        answer:
          'Ja, SMV Advies is gevestigd in Oud-Beijerland en werkt vanuit hier voor mkb-bedrijfspanden in de hele Hoeksche Waard.',
      },
      {
        question: 'Werkt SMV Advies ook buiten Oud-Beijerland?',
        answer:
          'Ja, naast Oud-Beijerland is SMV Advies actief in alle kernen van de Hoeksche Waard, van Numansdorp tot \'s-Gravendeel.',
      },
    ],
    hotspot: { x: 33.3, y: 30.5, width: 9.0, height: 5.1 },
  },
  {
    slug: 'heinenoord',
    naam: 'Heinenoord',
    title: 'Verduurzamingsadvies in Heinenoord',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Heinenoord, vlak bij de Heinenoordtunnel en de A29.',
    intro:
      'Heinenoord ligt direct bij de Heinenoordtunnel, de verbinding met Barendrecht en de A29. Voor veel bedrijfspanden hier is dat een praktisch gegeven, geen bijzaak. Het dorp zelf wordt al in 1312 genoemd en herbergt met Museum Hoeksche Waard ook een eigen stukje streekgeschiedenis.',
    feit:
      'Rond de A29-afslag liggen de bedrijventerreinen Reedijk en Boonsweg, met een flink aantal mkb-bedrijfspanden op loop- en rijafstand van de tunnel.',
    bedrijventerrein: 'bedrijventerrein Reedijk/Boonsweg, bij de A29-afslag',
    faq: [
      {
        question: 'Is SMV Advies ook actief in Heinenoord?',
        answer:
          'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Heinenoord, onder andere rond bedrijventerrein Reedijk/Boonsweg bij de A29.',
      },
    ],
    hotspot: { x: 52.9, y: 26.1, width: 7.4, height: 4.9 },
  },
  {
    slug: 'puttershoek',
    naam: 'Puttershoek',
    title: 'Verduurzamingsadvies in Puttershoek',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Puttershoek, met bedrijventerrein SHIPP21.',
    intro:
      'Puttershoek heeft een stevig industrieel verleden: hier stond tot 2004 de Suiker Unie-suikerfabriek. Op en rond die locatie ligt nu bedrijventerrein SHIPP21, een van de actievere bedrijfslocaties van de Hoeksche Waard.',
    feit: 'Van voormalige fabrieksgrond tot modern bedrijventerrein: SHIPP21 bestaat uit een mix van bedrijfspanden met uiteenlopende bouwjaren en energieprestaties.',
    bedrijventerrein: 'bedrijventerrein SHIPP21',
    faq: [
      {
        question: 'Is SMV Advies ook actief in Puttershoek?',
        answer:
          'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Puttershoek, waaronder bedrijventerrein SHIPP21.',
      },
    ],
    hotspot: { x: 63.8, y: 32.9, width: 8.3, height: 5.2 },
  },
  {
    slug: 'maasdam',
    naam: 'Maasdam',
    title: 'Verduurzamingsadvies in Maasdam',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Maasdam, bij molen "De Hoop" en de Binnenbedijkte Maas.',
    intro:
      'Maasdam is een oud dijkdorp langs de Binnenbedijkte Maas, met een monumentale kerk en de nog altijd zichtbare molen "De Hoop" uit 1822. Bedrijfspanden hier liggen verspreid in en direct rond de dorpskern.',
    feit: 'Een dorp zonder eigen bedrijventerrein betekent bedrijfspanden die verspreid liggen. Elk pand vraagt dan om een eigen beoordeling in plaats van een standaardaanpak.',
    bedrijventerrein: null,
    faq: [
      {
        question: 'Is SMV Advies ook actief in Maasdam?',
        answer: 'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Maasdam, ook als uw pand buiten de dorpskern ligt.',
      },
    ],
    hotspot: { x: 77.2, y: 38.0, width: 6.5, height: 5.3 },
  },
  {
    slug: 'zuid-beijerland',
    naam: 'Zuid-Beijerland',
    title: 'Verduurzamingsadvies in Zuid-Beijerland',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Zuid-Beijerland, het voormalige "Den Hitsert".',
    intro:
      'Zuid-Beijerland is een klassiek polderdorp, oorspronkelijk bekend als "Den Hitsert", met een kruiskerk met naaldspits uit 1933 als herkenbaar middelpunt. Het dorp ligt aan de westkant van het eiland, tussen de Spui en het Haringvliet.',
    feit: 'Verspreid liggende bedrijfspanden in een polderdorp vragen om maatwerk, want elk pand heeft zijn eigen bouwperiode en staat van onderhoud.',
    bedrijventerrein: null,
    faq: [
      {
        question: 'Is SMV Advies ook actief in Zuid-Beijerland?',
        answer: 'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Zuid-Beijerland, tussen de Spui en het Haringvliet.',
      },
    ],
    hotspot: { x: 20.5, y: 45.5, width: 9.2, height: 4.9 },
  },
  {
    slug: 'mijnsheerenland',
    naam: 'Mijnsheerenland',
    title: 'Verduurzamingsadvies in Mijnsheerenland',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Mijnsheerenland, centraal tussen Oud-Beijerland en de A29.',
    intro:
      'Mijnsheerenland is een polderdorp langs de Binnenbedijkte Maas, vlakbij de A29-afslag Heinenoord. Die ligging betekent dat bedrijfspanden hier vaak goed bereikbaar zijn, ook voor leveranciers en installateurs.',
    feit: 'Centraal gelegen tussen Oud-Beijerland en de A29. Dat is praktisch voor bedrijven die hier gevestigd zijn, ook voor leveranciers en installateurs.',
    bedrijventerrein: null,
    faq: [
      {
        question: 'Is SMV Advies ook actief in Mijnsheerenland?',
        answer: 'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Mijnsheerenland, ook vlak bij de A29-afslag Heinenoord.',
      },
    ],
    hotspot: { x: 43.2, y: 46.3, width: 9.5, height: 5.0 },
  },
  {
    slug: 's-gravendeel',
    naam: "'s-Gravendeel",
    title: "Verduurzamingsadvies in 's-Gravendeel",
    metaDescription:
      "Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in 's-Gravendeel, aan de Dordtsche Kil.",
    intro:
      '\'s-Gravendeel ontstond na het droogleggen van de Nieuw-Bonaventura-polder in 1593 en groeide uit tot een centrum van de vlasindustrie. Het dorp ligt direct aan de Dordtsche Kil, een drukke vaarroute. Dat geeft het een heel ander karakter dan de meer landinwaarts gelegen polderdorpen.',
    feit: 'Die rivierligging brengt ook een eigen, relatief groot bedrijventerrein met zich mee, een van de grotere van de Hoeksche Waard.',
    bedrijventerrein: 'een van de relatief grote bedrijventerreinen van de Hoeksche Waard',
    faq: [
      {
        question: "Is SMV Advies ook actief in 's-Gravendeel?",
        answer:
          "Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in 's-Gravendeel, inclusief het bedrijventerrein aan de Dordtsche Kil.",
      },
    ],
    hotspot: { x: 86.8, y: 52.1, width: 8.1, height: 4.9 },
  },
  {
    slug: 'klaaswaal',
    naam: 'Klaaswaal',
    title: 'Verduurzamingsadvies in Klaaswaal',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Klaaswaal, in het Cromstrijen-deel van de Hoeksche Waard.',
    intro:
      'Klaaswaal was tot 1984 een zelfstandige gemeente en ligt in het Cromstrijen-deel van de Hoeksche Waard, dicht bij Numansdorp. Net als in de andere kleinere kernen liggen bedrijfspanden hier verspreid in en rond het dorp.',
    feit: 'Geen eigen groot bedrijventerrein, maar wel dezelfde zorgvuldige beoordeling van uw pand als in de grotere kernen.',
    bedrijventerrein: null,
    faq: [
      {
        question: 'Is SMV Advies ook actief in Klaaswaal?',
        answer: 'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Klaaswaal, in het Cromstrijen-deel van de Hoeksche Waard.',
      },
    ],
    hotspot: { x: 34.4, y: 55.5, width: 7.0, height: 5.0 },
  },
  {
    slug: 'strijen',
    naam: 'Strijen',
    title: 'Verduurzamingsadvies in Strijen',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Strijen, bij bedrijventerrein Oud-Bonaventura.',
    intro:
      'Strijen is een streekdorp met meerdere buurtschappen (onder meer Cillaarshoek, Mookhoek en Strijensas) en dankt zijn naam vermoedelijk aan de inmiddels verdwenen waterloop "de Striene". Het dorp heeft met bedrijventerrein Oud-Bonaventura een van de grotere bedrijfslocaties van de regio.',
    feit: 'Een streekdorp met zowel een historische kern als een eigen bedrijventerrein, elk met een eigen bouwperiode en dus een eigen aanpak.',
    bedrijventerrein: 'bedrijventerrein Oud-Bonaventura',
    faq: [
      {
        question: 'Is SMV Advies ook actief in Strijen?',
        answer:
          'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Strijen, waaronder bedrijventerrein Oud-Bonaventura.',
      },
    ],
    hotspot: { x: 68.7, y: 58.9, width: 5.3, height: 5.0 },
  },
  {
    slug: 'numansdorp',
    naam: 'Numansdorp',
    title: 'Verduurzamingsadvies in Numansdorp',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Numansdorp, bij bedrijventerrein Middelsluis-Noord.',
    intro:
      'Numansdorp werd in 1642 gesticht rond de haven en is vooral bekend van Fort Buitensluis: een negentiende-eeuws fort dat ooit de vaarroute tussen Volkerak en Hollands Diep bewaakte en sinds 2015 opengesteld is voor bezoekers. Bedrijfspanden liggen hier vooral op en rond bedrijventerrein Middelsluis-Noord, vlot bereikbaar via de N487 naar de A29.',
    feit: 'Een dorp met zowel een eigen bedrijventerrein als een herkenbaar historisch landmark. Met circa een kwartier rijden vanaf Oud-Beijerland is het een van de iets verder gelegen kernen.',
    bedrijventerrein: 'bedrijventerrein Middelsluis-Noord',
    faq: [
      {
        question: 'Is SMV Advies ook actief in Numansdorp?',
        answer:
          'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Numansdorp, waaronder bedrijventerrein Middelsluis-Noord.',
      },
    ],
    hotspot: { x: 60.9, y: 74.0, width: 7.8, height: 5.6 },
  },
]

export function getWerkgebiedPlaatsBySlug(slug) {
  return WERKGEBIED_PLAATSEN.find((plaats) => plaats.slug === slug) ?? null
}
