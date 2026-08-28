import { ROUTES } from '../lib/routes.js'

/**
 * Full article bodies, written for this project. `sections` is a small
 * block model — h2/h3/p/ul/callout — so BlogPost.jsx can render real
 * headings, contextual internal links and callouts without embedding
 * markup or JSX in this data file. A paragraph/list item can be a plain
 * string, or an array of parts where a part is either a string or
 * `{ text, to }` for an inline link with natural anchor text.
 */
export const BLOG_POSTS = [
  {
    slug: 'dakisolatie-voor-uw-bedrijfspand',
    category: 'Isolatie',
    title: 'Dakisolatie voor uw bedrijfspand: waar het echt verschil maakt',
    excerpt:
      'Het dak is vaak de grootste warmteverliezer van een bedrijfspand. Hoe u kansen herkent, wat het oplevert en waar u op moet letten.',
    date: '18 juli 2026',
    isoDate: '2026-07-18',
    readTime: '5 min',
    bodyAvailable: true,
    sections: [
      {
        type: 'p',
        parts: [
          'Bij de meeste bedrijfspanden ontstaat het grootste warmteverlies niet via de gevel of de ramen, maar via het dak. Warme lucht stijgt, en bij een bedrijfshal, kantoor of winkelpand met een groot, plat dakoppervlak telt dat extra hard door. Toch is dakisolatie precies de maatregel die ondernemers het langst laten liggen — vaak simpelweg omdat het dak niet zichtbaar is vanaf de vloer.',
        ],
      },
      { type: 'h2', text: 'Hoeveel warmte verliest u eigenlijk via het dak?' },
      {
        type: 'p',
        parts: [
          'Bij een bedrijfspand van vóór 1990 is het dak in veel gevallen helemaal niet of nauwelijks geïsoleerd. Bij dat type pand kan het dak verantwoordelijk zijn voor een aanzienlijk deel van het totale warmteverlies, soms zelfs het grootste deel, simpelweg omdat het dakoppervlak zo groot is ten opzichte van de gevel. Het exacte percentage verschilt sterk per pand: de bouwperiode, het type dakconstructie en de hoogte van de ruimte spelen allemaal mee. Dat is precies waarom we dit per pand doorrekenen in plaats van met één vaste vuistregel te werken.',
        ],
      },
      { type: 'h2', text: 'Isoleren tijdens onderhoud: de meest voordelige route' },
      {
        type: 'p',
        parts: [
          'De beste timing voor dakisolatie is vaak geen los project, maar het moment waarop de dakbedekking toch al aan vervanging toe is. Bij een plat dak met bitumen of EPDM staat die vervanging na verloop van tijd sowieso op de planning — en dat is het natuurlijke moment om isolatie mee te nemen. De meerkosten ten opzichte van alleen een nieuwe dakbedekking zijn dan relatief beperkt, terwijl het isolatie-effect voor jaren vaststaat.',
        ],
      },
      { type: 'h2', text: 'Wat het oplevert, naast een lagere energierekening' },
      {
        type: 'p',
        parts: [
          'Een beter geïsoleerd dak merkt u het hele jaar: minder warmteverlies in de winter, maar ook minder hitteopbouw in de zomer — vooral in kantoren en winkels vaak het verschil tussen een prettig en een onwerkbaar binnenklimaat. Voor personeel en klanten is dat comfortverschil in de praktijk net zo waardevol als de besparing op de energierekening.',
        ],
      },
      { type: 'h2', text: 'Waar u op moet letten' },
      {
        type: 'ul',
        items: [
          'Thermische bruggen: aansluitingen bij dakranden, lichtkoepels en doorvoeren blijven vaak de zwakke plekken, ook ná isolatie.',
          'Dampopen of dampdicht: de juiste opbouw voorkomt vochtproblemen in de dakconstructie — een detail voor een gespecialiseerde dakdekker.',
          'Draagvermogen van de bestaande constructie: extra isolatie en eventuele ballast wegen mee, met name bij oudere hallen.',
          'Bouwregelgeving: zodra een substantieel deel van het dakoppervlak wordt vernieuwd, gelden er vanuit de bouwregelgeving minimale isolatiewaarden. Uw uitvoerende partij moet hier rekening mee houden.',
        ],
      },
      { type: 'h2', text: 'Subsidie en terugverdientijd' },
      {
        type: 'p',
        parts: [
          'Of dakisolatie in aanmerking komt voor de EIA hangt af van de exacte uitvoering en de jaarlijkse Energielijst van RVO, en dat wisselt per jaar. In ons overzicht van ',
          { text: 'EIA, ISDE en SDE++', to: ROUTES.blogPost('eia-isde-sde-subsidies') },
          ' leggen we uit hoe die regelingen in grote lijnen werken en wanneer ze relevant zijn.',
        ],
      },
      {
        type: 'p',
        parts: [
          'Qua terugverdientijd hoort dakisolatie vaak bij de maatregelen met de kortste terugverdientijd van alle bouwkundige ingrepen, juist omdat de meerkosten bij een toch al geplande dakvervanging beperkt zijn. De exacte terugverdientijd hangt af van uw huidige situatie, het type dak en de energieprijzen — iets wat we in een QuickScan concreet voor uw pand berekenen.',
        ],
      },
      {
        type: 'callout',
        title: 'Vaak de eerste stap vóór een warmtepomp',
        text: [
          'Overweegt u ook een warmtepomp? Een goed geïsoleerd dak is meestal de voorwaarde om die efficiënt te laten draaien. Lees meer in ',
          { text: 'De warmtepomp in het mkb', to: ROUTES.blogPost('warmtepomp-in-het-mkb') },
          '.',
        ],
      },
      { type: 'h2', text: 'Conclusie' },
      {
        type: 'p',
        parts: [
          'Het dak is voor veel bedrijfspanden de plek waar de grootste en snelst terugverdiende winst te behalen valt, zeker wanneer er toch al onderhoud aan de dakbedekking op de planning staat. De enige manier om te weten of dat ook voor uw pand geldt, is het daadwerkelijk laten doorrekenen — bekijk hoe zo’n traject er bij ons uitziet in onze ',
          { text: 'werkwijze', to: ROUTES.werkwijze },
          '.',
        ],
      },
    ],
    cta: {
      label: 'Start de gratis energie-indicatie',
      to: ROUTES.energieIndicatie,
      text: 'Benieuwd of dakisolatie ook bij uw pand de grootste winst oplevert? Onze gratis energie-indicatie geeft in een paar minuten een eerste beeld.',
    },
  },
  {
    slug: 'eia-isde-sde-subsidies',
    category: 'Subsidies',
    title: 'EIA, ISDE en SDE++: welke subsidie past bij uw verduurzaming?',
    excerpt:
      'Subsidies kunnen de terugverdientijd van maatregelen fors verkorten. Een overzicht van de belangrijkste regelingen en wanneer ze van toepassing zijn.',
    date: '4 juli 2026',
    isoDate: '2026-07-04',
    readTime: '6 min',
    bodyAvailable: true,
    sections: [
      {
        type: 'p',
        parts: [
          'Subsidies en fiscale regelingen kunnen de terugverdientijd van een verduurzamingsmaatregel flink verkorten, maar het landschap van EIA, ISDE en SDE++ is voor de meeste ondernemers verwarrend. Dit artikel legt de drie belangrijkste regelingen op hoofdlijnen uit. Percentages, drempelbedragen en voorwaarden wijzigen jaarlijks, dus controleer de actuele voorwaarden altijd bij RVO.nl of vraag het ons na.',
        ],
      },
      { type: 'h2', text: 'EIA — Energie-investeringsaftrek' },
      {
        type: 'p',
        parts: [
          'De EIA is geen subsidie in de vorm van een uitkering, maar een fiscaal voordeel: u mag een percentage van het investeringsbedrag extra aftrekken van de winst, bovenop de normale afschrijving. Dat levert alleen voordeel op als de investering ook daadwerkelijk op de jaarlijkse Energielijst van RVO staat — een lijst met technische maatregelen die per jaar wordt vastgesteld. De aanvraag moet vrijwel altijd binnen een paar maanden na het aangaan van de investeringsverplichting worden gedaan, dus vóórdat u definitief tekent bij een leverancier of installateur.',
        ],
      },
      { type: 'h2', text: 'ISDE — Investeringssubsidie duurzame energie en energiebesparing' },
      {
        type: 'p',
        parts: [
          'De ISDE is wél een directe subsidie-uitkering, geen belastingaftrek. Voor mkb-bedrijfspanden is deze regeling met name relevant voor warmtepompen. Voor zakelijke zonnepanelen is de ISDE inmiddels afgeschaft — daar resteren voor zonnepanelen vooral fiscale voordelen zoals de EIA en de kleinschaligheidsinvesteringsaftrek (KIA). Voor warmtepompen geldt de ISDE nog wel, met een subsidiebedrag dat afhangt van het vermogen en type installatie.',
        ],
      },
      { type: 'h2', text: 'SDE++ — Stimulering Duurzame Energieproductie en Klimaattransitie' },
      {
        type: 'p',
        parts: [
          'De SDE++ is primair bedoeld voor grootschalige of energie-intensieve investeringen die een aanzienlijke CO₂-reductie opleveren, en kent een aanvraagproces dat is toegesneden op dat soort projecten. Voor een individueel mkb-bedrijfspand van bescheiden omvang is deze regeling meestal minder relevant. Zodra het gaat om een grotere installatie, bijvoorbeeld een omvangrijk warmtepompsysteem of een groot zonnepanelenveld, kan het de moeite waard zijn om te laten checken of de SDE++ alsnog in beeld komt.',
        ],
      },
      { type: 'h2', text: 'Subsidie voor het advies zelf: de SVM-regeling' },
      {
        type: 'p',
        parts: [
          'Minder bekend, maar voor de eerste stap juist relevant: er bestaat een regeling gericht op het verduurzamingsadvies zelf, de Subsidieregeling Verduurzaming MKB (SVM), die een deel van de advieskosten kan vergoeden tot een bedrag van enkele duizenden euro’s. De precieze voorwaarden en het openstaande budget wisselen, dus vraag ons gerust of uw traject hiervoor in aanmerking komt.',
        ],
      },
      { type: 'h2', text: 'Praktisch: wanneer en hoe combineren' },
      {
        type: 'ul',
        items: [
          'Vraag subsidies aan vóórdat u een verplichting aangaat bij een leverancier of installateur — achteraf aanvragen is bij veel regelingen niet meer mogelijk.',
          'Budgetten zijn vaak jaarlijks vastgesteld en kunnen op zijn voordat het jaar om is — vroeg beginnen loont.',
          'Regelingen zijn deels te combineren, maar niet altijd: de exacte samenloop verschilt per maatregel en per jaar.',
          'Bewaar alle offertes en technische specificaties; die zijn nodig bij zowel de aanvraag als een eventuele controle achteraf.',
        ],
      },
      {
        type: 'callout',
        title: 'Wij nemen dit voor u door',
        text: [
          'Vanaf het Premium Pakket voeren we standaard een subsidie-check uit en adviseren we over de regelingen die op uw situatie van toepassing zijn. Bij het Gold Pakket helpen we ook met de daadwerkelijke aanvraag bij het RVO. Twijfelt u welke regelingen voor uw pand van toepassing zijn? ',
          { text: 'Neem gerust contact met ons op', to: ROUTES.contact },
          '.',
        ],
      },
      { type: 'h2', text: 'Conclusie' },
      {
        type: 'p',
        parts: [
          'EIA, ISDE en SDE++ zijn geen keuzemenu waar u zomaar één regeling uit pikt: welke van toepassing is, hangt af van het type maatregel, de schaal van de investering en het moment waarop u aanvraagt. De grootste winst zit vaak niet in het kennen van de regelingen zelf, maar in het op tijd checken vóórdat u een investering vastlegt.',
        ],
      },
    ],
    cta: {
      label: 'Bekijk de pakketten',
      to: ROUTES.pakketten,
      text: 'Wilt u weten welke subsidies concreet van toepassing zijn op uw bedrijfspand? Vanaf het Premium Pakket nemen we dit standaard mee.',
    },
  },
  {
    slug: 'warmtepomp-in-het-mkb',
    category: 'Installaties',
    title: 'De warmtepomp in het mkb: wanneer is het de juiste stap?',
    excerpt:
      'Een warmtepomp is duurzaam, maar alleen slim als uw pand er klaar voor is. Lees wanneer het werkt en wat u vooraf moet regelen.',
    date: '20 juni 2026',
    isoDate: '2026-06-20',
    readTime: '5 min',
    bodyAvailable: true,
    sections: [
      {
        type: 'p',
        parts: [
          'Een warmtepomp is voor veel mkb-bedrijfspanden een logische stap richting een lagere energierekening en minder gasverbruik. Maar een warmtepomp is geen één-op-één vervanging van een cv-ketel: hij werkt het efficiëntst bij lagere aanvoertemperaturen, en dat stelt eisen aan het pand die niet elk bedrijfspand direct vervult.',
        ],
      },
      { type: 'h2', text: 'Hybride of volledig elektrisch' },
      {
        type: 'p',
        parts: [
          'Een hybride warmtepomp werkt samen met de bestaande cv-ketel: de warmtepomp neemt het grootste deel van de verwarming voor zijn rekening, en de ketel springt alleen bij op de koudste dagen. Dat maakt een hybride oplossing vaak een logische tussenstap, zeker bij een bestaande installatie die nog in goede staat is. Een volledig elektrische (all-electric) warmtepomp vervangt de ketel helemaal, maar vraagt wel meer van de schil van het pand: goede isolatie en meestal lage-temperatuurafgifte, zoals vloerverwarming of grotere radiatoren.',
        ],
      },
      { type: 'h2', text: 'Is uw pand er klaar voor?' },
      {
        type: 'p',
        parts: [
          'Het isolatieniveau van het pand is bepalend. Lage-temperatuurverwarming werkt het best in een pand waar de warmte niet meteen wegloopt via dak, gevel of glas. Bij een matig geïsoleerd pand is een warmtepomp technisch vaak nog wel mogelijk, maar dan met een lager rendement dan verwacht. Wij zien in de praktijk regelmatig dat dakisolatie de logische stap vóór een warmtepomp is: lees meer in ons artikel over ',
          { text: 'dakisolatie voor uw bedrijfspand', to: ROUTES.blogPost('dakisolatie-voor-uw-bedrijfspand') },
          '.',
        ],
      },
      { type: 'h2', text: 'De elektrische aansluiting' },
      {
        type: 'p',
        parts: [
          'Naast het pand zelf speelt ook het elektriciteitsnet een rol. Een warmtepomp (en al helemaal in combinatie met zonnepanelen of laadpalen) vraagt meer capaciteit van uw aansluiting. In delen van Zuid-Holland speelt netcongestie inmiddels een rol bij het aanvragen of uitbreiden van een aansluiting — iets wat we vroeg in het traject meenemen, zodat dit niet pas bij de uitvoering als verrassing naar voren komt.',
        ],
      },
      { type: 'h2', text: 'Kosten en subsidie' },
      {
        type: 'p',
        parts: [
          'Voor zakelijke warmtepompen is de ISDE-subsidie op dit moment nog beschikbaar, met een bedrag dat afhangt van het vermogen en type systeem. Afhankelijk van de exacte installatie kan daarnaast de EIA van toepassing zijn. Een volledig overzicht van de regelingen staat in ons artikel over ',
          { text: 'EIA, ISDE en SDE++', to: ROUTES.blogPost('eia-isde-sde-subsidies') },
          '.',
        ],
      },
      { type: 'h2', text: 'Waar u op moet letten' },
      {
        type: 'ul',
        items: [
          'Geluid: de buitenunit maakt geluid — bij een pand dicht op de buren of in een woonomgeving is de plaatsing een aandachtspunt.',
          'Onderhoud: SMV Advies adviseert en begeleidt, maar voert zelf geen installatie of onderhoud uit — daarvoor verwijzen we u naar uw installateur.',
          'Fasering: een hybride tussenstap kan verstandiger zijn dan in één keer volledig overstappen, zeker als de bestaande ketel nog niet aan vervanging toe is.',
        ],
      },
      { type: 'h2', text: 'Conclusie' },
      {
        type: 'p',
        parts: [
          'Een warmtepomp is voor veel bedrijfspanden een goede stap, maar het rendement staat of valt met de staat van het pand en de beschikbare aansluitcapaciteit. Een gedegen doorrekening vooraf voorkomt dat u investeert in een installatie die onder haar mogelijkheden blijft presteren.',
        ],
      },
    ],
    cta: {
      label: 'Bekijk vergelijkbare cases',
      to: ROUTES.cases,
      text: 'Benieuwd hoe dit er in de praktijk uitziet? Bekijk voorbeelden van bedrijfspanden die we hierin hebben begeleid.',
    },
  },
  {
    slug: 'led-verlichting-snelste-stap',
    category: 'Efficiëntie',
    title: 'LED-verlichting: de snelste verduurzamingsstap die er is',
    excerpt: 'Verlichting is zichtbaar, meetbaar en snel terug te verdienen. Waarom LED voor veel bedrijven de ideale eerste stap is.',
    date: '5 juni 2026',
    isoDate: '2026-06-05',
    readTime: '4 min',
    bodyAvailable: true,
    sections: [
      {
        type: 'p',
        parts: [
          'Van alle verduurzamingsmaatregelen is LED-verlichting meestal de laagdrempeligste: de investering is relatief beperkt, de uitvoering is snel, en het effect is direct zichtbaar op de energierekening. Voor veel ondernemers is dit dan ook de eerste stap, nog vóór grotere ingrepen zoals isolatie of een warmtepomp.',
        ],
      },
      { type: 'h2', text: 'Waarom oude verlichting zoveel kost' },
      {
        type: 'p',
        parts: [
          'TL-verlichting en ouder type armaturen zetten een aanzienlijk deel van hun energieverbruik om in warmte in plaats van licht. LED doet dat veel efficiënter, met doorgaans een flinke reductie in het verbruik voor dezelfde hoeveelheid licht. In een hal, showroom of kantoor met verlichting die vrijwel de hele werkdag brandt, telt dat verschil rechtstreeks door in de energierekening.',
        ],
      },
      { type: 'h2', text: 'Meer dan alleen de lamp' },
      {
        type: 'p',
        parts: [
          'De grootste besparing zit niet altijd in de lamp zelf, maar in hoe de verlichting wordt aangestuurd. Aanwezigheidsdetectie zorgt dat verlichting uitgaat in ruimtes die niemand gebruikt, en daglichtsturing dimt armaturen automatisch bij voldoende daglicht. Vooral in showrooms, magazijnen en hallen die niet continu bezet zijn, is dit vaak een grotere besparing dan de overstap naar LED alleen.',
        ],
      },
      { type: 'h2', text: 'Kosten en terugverdientijd' },
      {
        type: 'p',
        parts: [
          'De terugverdientijd van LED hangt sterk af van het aantal branduren: een bedrijfshal die lange dagen draait, verdient de investering doorgaans sneller terug dan een kantoor met beperkte openingstijden. Afhankelijk van het type armatuur en de toepassing kan LED-verlichting daarnaast in aanmerking komen voor de EIA — zie ons overzicht van ',
          { text: 'EIA, ISDE en SDE++', to: ROUTES.blogPost('eia-isde-sde-subsidies') },
          '.',
        ],
      },
      { type: 'h2', text: 'Waar u op moet letten' },
      {
        type: 'ul',
        items: [
          'Kies niet automatisch de goedkoopste armaturen: kleurweergave en flikkervrij licht maken op de werkvloer echt verschil.',
          'Check de bestaande bedrading en dimbaarheid vooraf — niet elk systeem is zonder meer geschikt voor sturing.',
          'Denk verder dan alleen vervanging: aanwezigheidsdetectie en daglichtsturing leveren vaak de grootste aanvullende winst.',
        ],
      },
      { type: 'h2', text: 'Conclusie' },
      {
        type: 'p',
        parts: [
          'LED-verlichting is zelden de maatregel met de grootste absolute besparing, maar wel vrijwel altijd de snelste. Voor wie wil beginnen zonder meteen een grote investering te doen, is dit doorgaans de logische eerste stap — ook als aanvulling op grotere maatregelen zoals isolatie, zoals we bespreken in ons artikel over ',
          { text: 'verborgen energieverspillers', to: ROUTES.blogPost('verborgen-energieverspillers') },
          '.',
        ],
      },
    ],
    cta: {
      label: 'Start de gratis energie-indicatie',
      to: ROUTES.energieIndicatie,
      text: 'Wilt u weten wat LED-verlichting concreet oplevert voor uw pand? Onze gratis energie-indicatie geeft direct een eerste inschatting.',
    },
  },
  {
    slug: 'verborgen-energieverspillers',
    category: 'Inzicht',
    title: 'Verborgen energieverspillers in uw bedrijfspand',
    excerpt: 'Soms zijn het de onopvallende dingen die jaarlijks veel kosten. Vijf verspillers die in een QuickScan vaak boven water komen.',
    date: '22 mei 2026',
    isoDate: '2026-05-22',
    readTime: '5 min',
    bodyAvailable: true,
    sections: [
      {
        type: 'p',
        parts: [
          'Niet elke besparing zit in een grote installatie. Regelmatig blijkt tijdens een QuickScan dat een fors deel van de energierekening wordt veroorzaakt door kleine, onopvallende zaken die jarenlang niemand is opgevallen. Vijf verspillers die we het vaakst tegenkomen.',
        ],
      },
      { type: 'h2', text: '1. Persluchtlekken' },
      {
        type: 'p',
        parts: [
          'Bedrijven met een compressor voor persluchtgereedschap of productieapparatuur verliezen vaak een aanzienlijk deel van de geproduceerde perslucht via lekkende slangen, koppelingen en afsluiters. Perslucht opwekken is relatief energie-intensief, dus elke lekkage kost structureel geld — vaak zonder dat iemand het merkt, omdat de compressor gewoon blijft draaien.',
        ],
      },
      { type: 'h2', text: '2. Verlichting die onnodig blijft branden' },
      {
        type: 'p',
        parts: [
          'Verlichting in magazijnen, gangen en opslagruimtes blijft regelmatig de hele dag branden, ook als er niemand aanwezig is. Aanwezigheidsdetectie is vaak een kleine ingreep met direct effect — zie ook ons artikel over ',
          { text: 'LED-verlichting', to: ROUTES.blogPost('led-verlichting-snelste-stap') },
          '.',
        ],
      },
      { type: 'h2', text: '3. Sluimerverbruik buiten werktijd' },
      {
        type: 'p',
        parts: [
          'Machines, computers en apparatuur die in stand-by blijven staan buiten werktijd, tellen op. Bij een pand met veel apparatuur kan dit sluimerverbruik oplopen tot een verrassend aandeel van het totale verbruik buiten de openingstijden. Tijdschakelaars en een simpele instructie aan het einde van de werkdag lossen dit vaak al grotendeels op.',
        ],
      },
      { type: 'h2', text: '4. Slecht afgestelde verwarming en ventilatie' },
      {
        type: 'p',
        parts: [
          'Een te hoog ingestelde thermostaat, verwarming en ventilatie die niet op elkaar zijn afgestemd, of deuren die bij laden en lossen structureel openstaan: dit soort dagelijkse gewoontes kost meer dan de meeste ondernemers verwachten. Het raakt ook aan de bouwkundige schil van het pand — zie ons artikel over ',
          { text: 'dakisolatie', to: ROUTES.blogPost('dakisolatie-voor-uw-bedrijfspand') },
          ' voor de grotere, structurele kant hiervan.',
        ],
      },
      { type: 'h2', text: '5. Verouderde, verkeerd gedimensioneerde installaties' },
      {
        type: 'p',
        parts: [
          'Een cv-ketel of compressor die te groot is gedimensioneerd voor de werkelijke vraag, schakelt voortdurend aan en uit in plaats van gelijkmatig te moduleren. Dat is inefficiënter én slijtagegevoeliger dan een installatie die goed is afgestemd op het werkelijke verbruik.',
        ],
      },
      { type: 'h2', text: 'Waarom dit vaak onopgemerkt blijft' },
      {
        type: 'p',
        parts: [
          'De meeste bedrijfspanden hebben één energiemeter voor het hele pand. Zonder uitsplitsing per functie — verlichting, verwarming, productieapparatuur — ziet u alleen de totale rekening, niet waar het verbruik precies vandaan komt. Dat maakt het lastig om zelf te bepalen waar de winst zit.',
        ],
      },
      {
        type: 'callout',
        title: 'De eerste stap is inzicht',
        text: 'Een QuickScan brengt deze verspillers concreet in kaart voor uw eigen pand, inclusief een inschatting van wat oplossen ervan oplevert.',
      },
      { type: 'h2', text: 'Conclusie' },
      {
        type: 'p',
        parts: [
          'Grote maatregelen krijgen de meeste aandacht, maar de kleine, verborgen verspillers zijn vaak het snelst en goedkoopst op te lossen. Inzicht is daarbij de eerste en belangrijkste stap.',
        ],
      },
    ],
    cta: {
      label: 'Start de gratis energie-indicatie',
      to: ROUTES.energieIndicatie,
      text: 'Wilt u weten welke verborgen verspillers in uw pand meespelen? Begin met onze gratis energie-indicatie.',
    },
  },
]

export function getBlogPostBySlug(slug) {
  return BLOG_POSTS.find((post) => post.slug === slug)
}
