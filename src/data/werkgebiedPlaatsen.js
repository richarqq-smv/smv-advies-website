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
 * `hotspot` zijn percentage-posities (links/boven) op
 * werkgebied-hoeksche-waard.png (1672x941), gebruikt voor de klikbare
 * puntjes op Werkgebied.jsx — bepaald door de bestaande pin-labels op de
 * afbeelding visueel op te meten, dus altijd nog even in de browser
 * controleren/bijstellen na wijzigingen aan de afbeelding zelf.
 */
export const WERKGEBIED_PLAATSEN = [
  {
    slug: 'oud-beijerland',
    naam: 'Oud-Beijerland',
    title: 'Verduurzamingsadvies in Oud-Beijerland',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Oud-Beijerland — SMV Advies is hier gevestigd en kent de regio als geen ander.',
    intro:
      'SMV Advies is gevestigd in Oud-Beijerland: de regionale kern van de Hoeksche Waard, met het grootste bedrijventerrein van het eiland. Het dorp (oorspronkelijk "Beijerland" geheten) bestaat al sinds 1559 en groeide uit tot het drukste zakelijke centrum van de regio — precies het gebied waar we dagelijks komen.',
    feit:
      'Als vestigingsplaats is dit voor ons geen "werkgebied erbij", maar de plek waar we zelf gevestigd zijn en de meeste bedrijfspanden al kennen.',
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
    hotspot: { x: 33.2, y: 30.3 },
  },
  {
    slug: 'heinenoord',
    naam: 'Heinenoord',
    title: 'Verduurzamingsadvies in Heinenoord',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Heinenoord, vlak bij de Heinenoordtunnel en de A29.',
    intro:
      'Heinenoord ligt direct bij de Heinenoordtunnel, de verbinding met Barendrecht en de A29 — voor veel bedrijfspanden hier een praktisch gegeven, geen bijzaak. Het dorp zelf wordt al in 1312 genoemd en herbergt met Museum Hoeksche Waard ook een eigen stukje streekgeschiedenis.',
    feit:
      'Rond de A29-afslag liggen de bedrijventerreinen Reedijk en Boonsweg — veelal de bedrijfspanden waar wij hier over de vloer komen.',
    bedrijventerrein: 'bedrijventerrein Reedijk/Boonsweg, bij de A29-afslag',
    faq: [
      {
        question: 'Is SMV Advies ook actief in Heinenoord?',
        answer:
          'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Heinenoord, onder andere rond bedrijventerrein Reedijk/Boonsweg bij de A29.',
      },
    ],
    hotspot: { x: 52.4, y: 25.7 },
  },
  {
    slug: 'puttershoek',
    naam: 'Puttershoek',
    title: 'Verduurzamingsadvies in Puttershoek',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Puttershoek, met bedrijventerrein SHIPP21.',
    intro:
      'Puttershoek heeft een stevig industrieel verleden: hier stond tot 2004 de Suiker Unie-suikerfabriek. Op en rond die locatie ligt nu bedrijventerrein SHIPP21, een van de actievere bedrijfslocaties van de Hoeksche Waard.',
    feit: 'Van voormalige fabrieksgrond tot modern bedrijventerrein — precies het soort pand waar verduurzaming vaak het meeste oplevert.',
    bedrijventerrein: 'bedrijventerrein SHIPP21',
    faq: [
      {
        question: 'Is SMV Advies ook actief in Puttershoek?',
        answer:
          'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Puttershoek, waaronder bedrijventerrein SHIPP21.',
      },
    ],
    hotspot: { x: 63.2, y: 32.6 },
  },
  {
    slug: 'maasdam',
    naam: 'Maasdam',
    title: 'Verduurzamingsadvies in Maasdam',
    metaDescription: 'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Maasdam, Hoeksche Waard.',
    intro:
      'Maasdam is een oud dijkdorp langs de Binnenbedijkte Maas, met een monumentale kerk en de nog altijd zichtbare molen "De Hoop" uit 1830. Bedrijfspanden hier liggen verspreid in en direct rond de dorpskern.',
    feit: 'Een kleiner dorp vraagt niet om een ander soort advies, maar wel om iemand die de lokale situatie kent in plaats van een landelijke sjabloonaanpak.',
    bedrijventerrein: null,
    faq: [
      {
        question: 'Is SMV Advies ook actief in Maasdam?',
        answer: 'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Maasdam en omgeving.',
      },
    ],
    hotspot: { x: 76.6, y: 37.4 },
  },
  {
    slug: 'zuid-beijerland',
    naam: 'Zuid-Beijerland',
    title: 'Verduurzamingsadvies in Zuid-Beijerland',
    metaDescription: 'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Zuid-Beijerland, Hoeksche Waard.',
    intro:
      'Zuid-Beijerland is een klassiek polderdorp, oorspronkelijk bekend als "Den Hitsert", met een kruiskerk met naaldspits uit 1933 als herkenbaar middelpunt. Het dorp ligt aan de westkant van het eiland, tussen de Spui en het Haringvliet.',
    feit: 'Een rustig polderdorp met verspreide bedrijfspanden — juist hier scheelt het kennen van de lokale bouwperiodes in de praktijk tijd.',
    bedrijventerrein: null,
    faq: [
      {
        question: 'Is SMV Advies ook actief in Zuid-Beijerland?',
        answer: 'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Zuid-Beijerland en omgeving.',
      },
    ],
    hotspot: { x: 20.5, y: 44.9 },
  },
  {
    slug: 'mijnsheerenland',
    naam: 'Mijnsheerenland',
    title: 'Verduurzamingsadvies in Mijnsheerenland',
    metaDescription: 'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Mijnsheerenland, Hoeksche Waard.',
    intro:
      'Mijnsheerenland is een polderdorp langs de Binnenbedijkte Maas, vlakbij de A29-afslag Heinenoord. Die ligging betekent dat bedrijfspanden hier vaak goed bereikbaar zijn, ook voor leveranciers en installateurs.',
    feit: 'Centraal gelegen tussen Oud-Beijerland en de A29 — praktisch voor ons én voor de bedrijven die hier gevestigd zijn.',
    bedrijventerrein: null,
    faq: [
      {
        question: 'Is SMV Advies ook actief in Mijnsheerenland?',
        answer: 'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Mijnsheerenland en omgeving.',
      },
    ],
    hotspot: { x: 42.5, y: 45.6 },
  },
  {
    slug: 's-gravendeel',
    naam: "'s-Gravendeel",
    title: "Verduurzamingsadvies in 's-Gravendeel",
    metaDescription:
      "Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in 's-Gravendeel, aan de Dordtsche Kil.",
    intro:
      '\'s-Gravendeel ontstond na het droogleggen van de Nieuw-Bonaventura-polder in 1593 en groeide uit tot een centrum van de vlasindustrie. Het dorp ligt direct aan de Dordtsche Kil, een drukke vaarroute — een heel ander karakter dan de meer landinwaarts gelegen polderdorpen.',
    feit: 'Die rivierligging brengt ook een eigen, relatief groot bedrijventerrein met zich mee, een van de grotere van de Hoeksche Waard.',
    bedrijventerrein: 'een van de relatief grote bedrijventerreinen van de Hoeksche Waard',
    faq: [
      {
        question: "Is SMV Advies ook actief in 's-Gravendeel?",
        answer:
          "Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in 's-Gravendeel, inclusief het bedrijventerrein aan de Dordtsche Kil.",
      },
    ],
    hotspot: { x: 85.9, y: 51.4 },
  },
  {
    slug: 'klaaswaal',
    naam: 'Klaaswaal',
    title: 'Verduurzamingsadvies in Klaaswaal',
    metaDescription: 'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Klaaswaal, Hoeksche Waard.',
    intro:
      'Klaaswaal was tot 1984 een zelfstandige gemeente en ligt in het Cromstrijen-deel van de Hoeksche Waard, dicht bij Numansdorp. Net als in de andere kleinere kernen liggen bedrijfspanden hier verspreid in en rond het dorp.',
    feit: 'Geen eigen groot bedrijventerrein, maar wel dezelfde aandacht voor uw pand als in de grotere kernen.',
    bedrijventerrein: null,
    faq: [
      {
        question: 'Is SMV Advies ook actief in Klaaswaal?',
        answer: 'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Klaaswaal en omgeving.',
      },
    ],
    hotspot: { x: 34.0, y: 54.6 },
  },
  {
    slug: 'strijen',
    naam: 'Strijen',
    title: 'Verduurzamingsadvies in Strijen',
    metaDescription: 'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Strijen, Hoeksche Waard.',
    intro:
      'Strijen is een streekdorp met meerdere buurtschappen (onder meer Cillaarshoek, Mookhoek en Strijensas) en dankt zijn naam vermoedelijk aan de inmiddels verdwenen waterloop "de Striene". Het dorp heeft met bedrijventerrein Oud-Bonaventura een van de grotere bedrijfslocaties van de regio.',
    feit: 'Een streekdorp met zowel historische kern als een eigen bedrijventerrein — precies de combinatie waar lokale kennis van bouwperiodes het verschil maakt.',
    bedrijventerrein: 'bedrijventerrein Oud-Bonaventura',
    faq: [
      {
        question: 'Is SMV Advies ook actief in Strijen?',
        answer:
          'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Strijen, waaronder bedrijventerrein Oud-Bonaventura.',
      },
    ],
    hotspot: { x: 68.1, y: 58.0 },
  },
  {
    slug: 'numansdorp',
    naam: 'Numansdorp',
    title: 'Verduurzamingsadvies in Numansdorp',
    metaDescription:
      'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Numansdorp, bij bedrijventerrein Middelsluis-Noord.',
    intro:
      'Numansdorp werd in 1642 gesticht rond de haven en is vooral bekend van Fort Buitensluis: een negentiende-eeuws fort dat ooit de vaarroute tussen Volkerak en Hollands Diep bewaakte en sinds 2015 vrij toegankelijk is. Bedrijfspanden liggen hier vooral op en rond bedrijventerrein Middelsluis-Noord, vlot bereikbaar via de N487 naar de A29.',
    feit: 'Een dorp met zowel een eigen bedrijventerrein als een herkenbaar historisch landmark — en met circa een kwartier rijden een van de iets verder gelegen kernen vanaf Oud-Beijerland.',
    bedrijventerrein: 'bedrijventerrein Middelsluis-Noord',
    faq: [
      {
        question: 'Is SMV Advies ook actief in Numansdorp?',
        answer:
          'Ja, SMV Advies verzorgt onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in Numansdorp, waaronder bedrijventerrein Middelsluis-Noord.',
      },
    ],
    hotspot: { x: 60.4, y: 72.6 },
  },
]

export function getWerkgebiedPlaatsBySlug(slug) {
  return WERKGEBIED_PLAATSEN.find((plaats) => plaats.slug === slug) ?? null
}
