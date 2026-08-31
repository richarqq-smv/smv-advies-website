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
    slug: 'zonnepanelen-op-uw-bedrijfspand',
    category: 'Installaties',
    title: 'Zonnepanelen op uw bedrijfspand: waar u rekening mee moet houden',
    excerpt:
      'Voordat u zonnepanelen laat plaatsen op uw bedrijfspand, spelen vergunning, de aflopende salderingsregeling, netcongestie en de fiscale kant allemaal een rol. Een overzicht van de belangrijkste aandachtspunten.',
    date: '31 augustus 2026',
    isoDate: '2026-08-31',
    readTime: '6 min',
    bodyAvailable: true,
    sections: [
      {
        type: 'p',
        parts: [
          'Zonnepanelen zijn voor veel bedrijfspanden een voor de hand liggende stap, maar de praktische voorbereiding wordt vaak onderschat. Vergunningsvoorwaarden, de aankomende wijziging in de salderingsregeling, de mogelijke rol van netcongestie en de vraag of uw dak de investering aankan, spelen allemaal mee vóórdat u een offerte aanvraagt. Dit artikel zet de belangrijkste aandachtspunten op een rij.',
        ],
      },
      { type: 'h2', text: 'Vergunningsvrij plaatsen: wanneer wel, wanneer niet' },
      {
        type: 'p',
        parts: [
          'In de meeste gevallen mag u zonnepanelen op het dak van uw bedrijfspand vergunningsvrij plaatsen, ongeacht wat het omgevingsplan voor de rest van het gebouw voorschrijft. Er gelden wel voorwaarden. Op een monument — gemeentelijk, provinciaal of rijksmonument — is vergunningsvrij plaatsen niet mogelijk. Ligt uw pand in een rijksbeschermd stads- of dorpsgezicht, dan mag u panelen alleen vergunningsvrij plaatsen op een achterdakvlak dat niet naar een openbaar toegankelijk gebied is gekeerd. Bij een plat dak geldt bovendien dat het paneel minimaal even ver van de dakrand moet blijven als het paneel hoog is. Kan uw situatie niet aan deze voorwaarden voldoen, dan is alsnog een omgevingsvergunning nodig. Omdat de precieze situatie van uw pand bepalend is, is dit iets om vooraf te laten beoordelen — bijvoorbeeld via het Omgevingsloket of uw gemeente.',
        ],
      },
      { type: 'h2', text: 'Saldering stopt per 2027: wat betekent dit voor teruglevering?' },
      {
        type: 'p',
        parts: [
          'De salderingsregeling — het wegstrepen van teruggeleverde stroom tegen uw eigen verbruik — geldt voor huishoudens en kleine bedrijven en stopt per 1 januari 2027. Tot en met 31 december 2026 kunt u nog gebruikmaken van de huidige regeling. Daarna krijgt u voor alle teruggeleverde stroom een vergoeding van uw energieleverancier; deze vergoeding moet tot 2030 minimaal 50% van het kale leveringstarief bedragen. Deze wijziging is door de Rijksoverheid bevestigd voor kleinverbruikers. Heeft u een bedrijfspand met een grootverbruikersaansluiting, dan is de situatie mogelijk anders geregeld — vraag dit na bij uw energieleverancier.',
        ],
      },
      { type: 'h2', text: 'Netcongestie en teruglevering: wanneer speelt dit voor u?' },
      {
        type: 'p',
        parts: [
          'Teruglevering van stroom — bijvoorbeeld via zonnepanelen — vraagt net als afname transportcapaciteit op het elektriciteitsnet. Is die capaciteit op uw locatie beperkt, dan kan een aanvraag voor een nieuwe of zwaardere aansluiting te maken krijgen met een wachtlijst. Of en hoe dit voor uw pand speelt, hangt sterk af van uw locatie en de omvang van uw teruglevering. Voor de actuele situatie in de Hoeksche Waard leest u meer in ',
          { text: 'ons artikel over netcongestie in de Hoeksche Waard', to: ROUTES.blogPost('netcongestie-hoeksche-waard') },
          '.',
        ],
      },
      { type: 'h2', text: 'Fiscaal voordeel: waar zonnepanelen in het subsidielandschap passen' },
      {
        type: 'p',
        parts: [
          'Voor zakelijke zonnepanelen is de investeringssubsidie (ISDE) niet meer beschikbaar; deze is afgeschaft. Wat resteert, is met name een fiscaal voordeel via de energie-investeringsaftrek (EIA), mits uw installatie voldoet aan de voorwaarden op de jaarlijkse Energielijst. Dat is een fiscale aftrek, geen directe subsidie-uitkering — een onderscheid dat in de praktijk nogal eens door elkaar loopt. Voor de volledige uitleg van EIA, ISDE, SDE++ en de kleinschaligheidsinvesteringsaftrek (KIA), en hoe deze regelingen zich tot elkaar verhouden, verwijzen we naar ',
          { text: 'ons overzicht van EIA, ISDE, SDE++ en KIA', to: ROUTES.blogPost('eia-isde-sde-subsidies') },
          '.',
        ],
      },
      { type: 'h2', text: 'Technische aandachtspunten bij een plat bedrijfsdak' },
      {
        type: 'p',
        parts: [
          'Een bedrijfsdak moet het gewicht van zonnepanelen, bevestigingsmateriaal en eventuele ballast kunnen dragen. Of dat het geval is, is een vraag voor een constructeur of uw installateur — dat is maatwerk per dak. Ook de staat van de dakbedekking zelf is relevant: panelen op een dak dat binnen afzienbare tijd toch vervangen of geïsoleerd moet worden, betekent in de praktijk vaak dubbel werk. Overweegt u naast zonnepanelen ook dakisolatie, dan is het de moeite waard om beide in samenhang te plannen. Meer over de bouwkundige kant van dakwerkzaamheden leest u in ',
          { text: 'ons artikel over dakisolatie voor uw bedrijfspand', to: ROUTES.blogPost('dakisolatie-voor-uw-bedrijfspand') },
          '.',
        ],
      },
      { type: 'h2', text: 'Wat SMV Advies voor u kan betekenen' },
      {
        type: 'callout',
        text: [
          'SMV Advies verkoopt geen zonnepanelen of installaties. Dat betekent dat we onafhankelijk kunnen meedenken over de vraag óf, wanneer en hoe zonnepanelen passen binnen het totale verduurzamingsplan voor uw pand. Twijfelt u waar u het beste kunt beginnen? ',
          { text: 'Neem gerust contact met ons op', to: ROUTES.contact },
          '.',
        ],
      },
      { type: 'h2', text: 'Conclusie' },
      {
        type: 'p',
        parts: [
          'Zonnepanelen op een bedrijfspand raken meteen aan meerdere dossiers tegelijk: vergunning, het aflopen van de salderingsregeling, mogelijke netcongestie en de fiscale kant. Geen van die onderdelen is voor elk pand hetzelfde, en de details wijzigen regelmatig. De kern is dat u deze punten vroeg in het traject in kaart brengt, vóórdat u een investering vastlegt.',
        ],
      },
    ],
    cta: {
      label: 'Start de gratis energie-indicatie',
      to: ROUTES.energieIndicatie,
      text: 'Overweegt u zonnepanelen op uw bedrijfspand? Onze gratis energie-indicatie geeft in een paar minuten een eerste beeld van waar de meeste winst te behalen valt.',
    },
  },
  {
    slug: 'energielabel-c-verplicht-bedrijfspand',
    category: 'Wetgeving',
    title: 'Energielabel C verplicht voor uw bedrijfspand: wat betekent dit?',
    excerpt:
      'Sinds 2023 moet een kantoorpand minimaal energielabel C hebben, anders geldt een gebruiksverbod. Ontdek of dit voor uw bedrijfspand geldt.',
    date: '30 augustus 2026',
    isoDate: '2026-08-30',
    readTime: '7 min',
    bodyAvailable: true,
    sections: [
      {
        type: 'p',
        parts: [
          'Sinds 1 januari 2023 moet een kantoorpand minimaal energielabel C hebben. Voldoet uw pand daar niet aan, dan mag het niet langer als kantoor worden gebruikt. In dit artikel leest u wat de verplichting precies inhoudt, voor welke panden dit geldt, welke uitzonderingen er zijn, en wat u kunt doen als uw bedrijfspand nog niet aan de eisen voldoet.',
        ],
      },
      { type: 'h2', text: 'Wat is de energielabel C-verplichting?' },
      {
        type: 'p',
        parts: [
          'Een energielabel geeft aan hoe energiezuinig een gebouw is. Voor kantoorgebouwen geldt sinds 1 januari 2023 een minimum: energielabel C, wat neerkomt op een maximaal primair fossiel energiegebruik van 225 kWh per vierkante meter per jaar. Deze eis staat in het ',
          { text: 'Besluit bouwwerken leefomgeving', href: 'https://wetten.overheid.nl/BWBR0041297/' },
          '. Kantoorgebouwen met een lager label — D tot en met G — voldoen niet aan de eis.',
        ],
      },
      { type: 'h2', text: 'Voor welke bedrijfspanden geldt energielabel C?' },
      {
        type: 'p',
        parts: [
          'De verplichting geldt voor gebouwen met een kantoorfunctie, en alleen wanneer aan twee voorwaarden tegelijk wordt voldaan: de kantoorfunctie beslaat minimaal 100 vierkante meter gebruiksoppervlak, én de kantoorfunctie is minimaal de helft van de totale gebruiksoppervlakte van het gebouw. Zit uw kantoor in een pand met bijvoorbeeld ook een werkplaats of showroom? Dan telt alleen het kantoordeel mee, en bepaalt de verhouding tot het totale pand of de verplichting van toepassing is.',
        ],
      },
      {
        type: 'p',
        parts: [
          'Heeft u meerdere kleinere kantoorunits in hetzelfde gebouw? Voor de grens van 100 vierkante meter worden die units bij elkaar opgeteld — de verplichting kan dus niet worden omzeild door een kantoor in meerdere kleine ruimtes te verdelen.',
        ],
      },
      { type: 'h2', text: 'Welke uitzonderingen zijn er?' },
      {
        type: 'p',
        parts: [
          { text: 'Het Informatiepunt Leefomgeving', href: 'https://iplo.nl/thema/energiebesparing/energielabel-verplichting-kantoren/uitzonderingssituaties/' },
          ' noemt een aantal situaties waarin de verplichting niet geldt:',
        ],
      },
      {
        type: 'ul',
        items: [
          'De kantoorfunctie beslaat minder dan de helft van het totale gebouw.',
          'De totale kantoor- en nevenoppervlakte is kleiner dan 100 vierkante meter.',
          'Het pand is een rijks-, provinciaal of gemeentelijk monument.',
          'U gebruikt het pand maximaal twee jaar als kantoor, bijvoorbeeld tijdens een verbouwing of transformatie.',
          'Het pand is verworven met het oog op onteigening.',
          'Het pand wordt niet verwarmd of gekoeld voor mensen.',
          'Het pand wordt gebruikt voor religieuze samenkomsten.',
          'Alle nog mogelijke energiebesparende maatregelen hebben een terugverdientijd van meer dan 10 jaar (de hardheidsclausule).',
        ],
      },
      {
        type: 'p',
        parts: [
          'Twijfelt u of een van deze uitzonderingen op uw pand van toepassing is? De daadwerkelijke gebruikssituatie is daarbij leidend, niet alleen de registratie in de Basisregistratie Adressen en Gebouwen (BAG).',
        ],
      },
      { type: 'h2', text: 'Wat gebeurt er als uw pand niet aan de verplichting voldoet?' },
      {
        type: 'p',
        parts: [
          'Voldoet uw kantoorpand niet aan de eis, dan mag het volgens de regelgeving niet langer als kantoor worden gebruikt of in gebruik worden genomen — een gebruiksverbod. Toezicht en handhaving liggen doorgaans bij de gemeente, eventueel via een omgevingsdienst. Zij bepalen per situatie welke vervolgstappen worden gezet wanneer een pand na controle nog steeds niet voldoet.',
        ],
      },
      {
        type: 'p',
        parts: [
          'Dit artikel gaat uitsluitend uit van wat ',
          { text: 'RVO', href: 'https://www.rvo.nl/onderwerpen/wetten-en-regels-gebouwen/energielabel-c-kantoren' },
          ' en het Informatiepunt Leefomgeving hierover vermelden. Voor de exacte gevolgen in uw specifieke situatie is contact met uw gemeente de meest betrouwbare bron.',
        ],
      },
      { type: 'h2', text: 'Hoe weet u of uw bedrijfspand aan de eisen voldoet?' },
      {
        type: 'p',
        parts: [
          'Het eenvoudigste startpunt is uw huidige energielabel: staat dat op A, B of C, dan voldoet uw pand al. Heeft u geen geldig label, of staat het op D of lager, dan is een vervolgstap nodig. Het helpt om daarbij drie dingen uit elkaar te houden.',
        ],
      },
      {
        type: 'ul',
        items: [
          'Energielabel: het officiële, geregistreerde label van uw gebouw. Dit wordt vastgesteld door een erkend energieadviseur en geregistreerd bij RVO — SMV Advies stelt zelf geen officieel energielabel vast.',
          'Verduurzamingsadvies: in kaart brengen welke maatregelen voor úw pand haalbaar en zinvol zijn, en in welke volgorde. Dit is wél waar SMV Advies in adviseert.',
          'Uitvoering: de maatregelen daadwerkelijk laten aanbrengen door een installateur of aannemer.',
        ],
      },
      { type: 'h2', text: 'Welke maatregelen kunnen helpen richting energielabel C?' },
      {
        type: 'p',
        parts: [
          'Welke maatregelen het meeste bijdragen, verschilt sterk per pand. Maatregelen die vaker een rol spelen zijn onder meer:',
        ],
      },
      {
        type: 'ul',
        items: [
          [
            { text: 'Dakisolatie', to: ROUTES.blogPost('dakisolatie-voor-uw-bedrijfspand') },
            ' en gevelisolatie, die het energieverbruik voor verwarming structureel verlagen.',
          ],
          [
            { text: 'LED-verlichting', to: ROUTES.blogPost('led-verlichting-snelste-stap') },
            ' met aanwezigheidsdetectie, wat vooral het elektriciteitsverbruik omlaag brengt.',
          ],
          [
            'Een ',
            { text: 'warmtepomp', to: ROUTES.blogPost('warmtepomp-in-het-mkb') },
            ' of een hybride variant, als het pand daar geschikt voor is.',
          ],
        ],
      },
      {
        type: 'p',
        parts: [
          'Geen van deze maatregelen garandeert op zichzelf een label C — of dat het geval is, hangt af van de huidige staat van uw pand, de combinatie van maatregelen en hoe deze door een erkend energieadviseur worden doorgerekend.',
        ],
      },
      { type: 'h2', text: 'Wat kan SMV Advies voor u betekenen?' },
      {
        type: 'p',
        parts: [
          'SMV Advies adviseert onafhankelijk over verduurzaming van bedrijfspanden in de Hoeksche Waard, zonder zelf maatregelen te verkopen of uit te voeren. Concreet betekent dat voor de energielabel C-verplichting: wij brengen in kaart welke maatregelen voor uw pand kansrijk zijn en in welke volgorde die het meeste opleveren. Wij stellen zelf geen officieel energielabel vast en regelen de verplichting niet namens u — dat blijft aan een erkend energieadviseur en, waar nodig, uw gemeente.',
        ],
      },
      {
        type: 'p',
        parts: [
          'Een QuickScan via onze ',
          { text: 'pakketten', to: ROUTES.pakketten },
          ' is een logische eerste stap om te bepalen waar uw pand nu staat, ook als u nog niet zeker weet of de verplichting op u van toepassing is. Bekijk ook onze ',
          { text: 'werkwijze', to: ROUTES.werkwijze },
          ' voor hoe zo’n traject eruitziet, of ',
          { text: 'werkgebied', to: ROUTES.werkgebied },
          ' voor de regio waarin wij actief zijn.',
        ],
      },
      { type: 'h2', text: 'Conclusie' },
      {
        type: 'p',
        parts: [
          'De energielabel C-verplichting is voor veel kantoorpanden al een aantal jaren van kracht, maar niet ieder bedrijfspand valt eronder — en wie er wel onder valt, heeft vaak meerdere routes om te voldoen. De eerste stap is simpel: weten waar uw pand nu staat, en wat daarna het meest voor de hand ligt.',
        ],
      },
    ],
    cta: {
      label: 'Start de gratis energie-indicatie',
      to: ROUTES.energieIndicatie,
      text: 'Wilt u weten waar uw bedrijfspand nu staat, en welke stappen relevant zijn richting energielabel C? Onze gratis energie-indicatie geeft een eerste beeld.',
    },
  },
  {
    slug: 'netcongestie-hoeksche-waard',
    category: 'Energienet',
    title: 'Netcongestie in de Hoeksche Waard: wat betekent dit voor uw bedrijfspand?',
    excerpt:
      'Het stroomnet in de Hoeksche Waard zit vol. Wat betekent netcongestie concreet voor uw bedrijfspand, en wat kunt u er zelf aan doen?',
    date: '20 augustus 2026',
    isoDate: '2026-08-20',
    readTime: '7 min',
    bodyAvailable: true,
    sections: [
      {
        type: 'p',
        parts: [
          'Het stroomnet in de Hoeksche Waard zit vol. Voor ondernemers die willen verduurzamen, elektrificeren of uitbreiden roept dat een directe vraag op: kan dat nog wel? Dit artikel legt uit wat netcongestie precies betekent, wat de actuele situatie in de regio is, en wat u er als eigenaar van een bedrijfspand zelf aan kunt doen.',
        ],
      },
      { type: 'h2', text: 'Wat is netcongestie precies?' },
      {
        type: 'p',
        parts: [
          'Netcongestie ontstaat wanneer de vraag naar transport van elektriciteit op een bepaald moment groter is dan het elektriciteitsnet aankan. Dat kan spelen bij afname (het verbruiken van stroom) én bij teruglevering (bijvoorbeeld het invoeden van stroom uit zonnepanelen). Zodra een deel van het net vol zit, moet de netbeheerder — in de Hoeksche Waard is dat Stedin — nieuwe of zwaardere aanvragen voor transportcapaciteit tijdelijk op een wachtlijst zetten.',
        ],
      },
      {
        type: 'p',
        parts: [
          'Belangrijk om te weten: netcongestie raakt in de eerste plaats nieuwe of zwaardere aansluitingen. Een bestaande aansluiting die al werkt, blijft gewoon werken — congestie betekent niet dat de stroom bij u wordt afgesloten.',
        ],
      },
      { type: 'h2', text: 'De situatie in de Hoeksche Waard' },
      {
        type: 'p',
        parts: [
          'Netbeheerder Stedin meldde in februari 2024 congestie voor teruglevering, en in december 2024 ook voor afname door grootverbruikers (aansluitingen groter dan 3×80 ampère) in het gebied ',
          { text: 'Hoeksche Waard en Zuidelijk Dordrecht', to: ROUTES.werkgebied },
          '. Die situatie werd destijds ook formeel gemeld bij de Autoriteit Consument & Markt, als onderdeel van een bredere melding voor vrijwel heel Zuid-Holland.',
        ],
      },
      {
        type: 'p',
        parts: [
          'Er wordt wel gewerkt aan uitbreiding. In 2025 is een nieuw, circa 13 kilometer lang middenspanningstracé tussen Klaaswaal en Puttershoek in gebruik genomen, met een capaciteit die ongeveer gelijkstaat aan het verbruik van 8.000 huishoudens. Dat tracé gaf twaalf bedrijven die op de wachtlijst stonden alsnog een aansluiting. Daarnaast bereiden Stedin en landelijk netbeheerder TenneT, samen met de gemeente, de bouw voor van een nieuw ',
          {
            text: 'hoogspanningsstation in de Hoeksche Waard',
            href: 'https://www.stedin.net/over-stedin/wat-doet-stedin/projecten-in-uw-regio/hoogspanningsstation-hoeksche-waard',
          },
          '. De gemeente nam in 2026 een principebesluit over de voorkeurslocatie; de bouw is voorzien voor 2028-2029, met oplevering rond 2030-2031. Dat station moet structureel meer transportcapaciteit voor de regio opleveren — een oplossing voor de langere termijn, niet voor morgen.',
        ],
      },
      { type: 'h2', text: 'Wat betekent dit voor uw bedrijfspand?' },
      {
        type: 'p',
        parts: [
          'Of en hoe u netcongestie merkt, hangt sterk af van uw situatie. Er is een belangrijk onderscheid tussen afname (stroom verbruiken) en teruglevering (stroom terugleveren, bijvoorbeeld met zonnepanelen), en tussen grootverbruik (doorgaans aansluitingen groter dan 3×80 ampère) en kleinverbruik (de meeste kleinere bedrijfspanden).',
        ],
      },
      {
        type: 'p',
        parts: [
          'Tot voor kort raakte de wachtlijst voor nieuwe of zwaardere aansluitingen vooral grootverbruikers. Vanaf 1 juli 2026 geldt deze wachtlijst in de Hoeksche Waard ook voor kleinverbruikers — dus ook voor kleinere bedrijfspanden die een nieuwe aansluiting willen of hun bestaande aansluiting willen verzwaren.',
        ],
      },
      {
        type: 'p',
        parts: [
          'Heeft u nu al een werkende aansluiting en wilt u die niet uitbreiden? Dan verandert er in de praktijk weinig. Wilt u wél een nieuwe aansluiting, een zwaardere aansluiting, of extra teruglevercapaciteit — bijvoorbeeld voor een groter zonnepanelenveld — dan is een langere wachttijd op dit moment reëel. Hoe dit precies voor uw pand uitpakt, is altijd afhankelijk van uw specifieke aansluiting en de actuele netcapaciteit op dat moment.',
        ],
      },
      { type: 'h2', text: 'Kunt u nog verduurzamen ondanks netcongestie?' },
      {
        type: 'p',
        parts: [
          'Ja, voor de meeste maatregelen wel — maar niet elke maatregel wordt op dezelfde manier geraakt.',
        ],
      },
      {
        type: 'ul',
        items: [
          [
            'Maatregelen die alleen uw verbruik verlagen, zoals ',
            { text: 'dakisolatie', to: ROUTES.blogPost('dakisolatie-voor-uw-bedrijfspand') },
            ' en ',
            { text: 'LED-verlichting', to: ROUTES.blogPost('led-verlichting-snelste-stap') },
            ', raken de netcapaciteit niet negatief — integendeel, ze verkleinen juist de kans dat u tegen een grens aanloopt.',
          ],
          [
            'Een ',
            { text: 'warmtepomp', to: ROUTES.blogPost('warmtepomp-in-het-mkb') },
            ' vraagt meer capaciteit van uw aansluiting; of dat een probleem is, hangt af van uw huidige aansluiting en of u die moet verzwaren.',
          ],
          'Zonnepanelen die u vooral zelf gebruikt lopen minder snel tegen congestie aan dan een systeem dat is bedoeld om fors terug te leveren aan het net.',
          'Laadpalen voor elektrische voertuigen vragen, net als een warmtepomp, extra capaciteit — vooral bij meerdere laadpunten tegelijk.',
        ],
      },
      {
        type: 'p',
        parts: [
          'De enige manier om dit voor uw eigen pand zeker te weten, is uw huidige aansluiting en verbruiksprofiel laten doorrekenen — en zo nodig bij Stedin navragen wat er nog mogelijk is voordat u investeert.',
        ],
      },
      { type: 'h2', text: 'Wat u zelf kunt doen' },
      {
        type: 'p',
        parts: [
          'RVO onderscheidt voor bedrijven in een congestiegebied meerdere oplossingsrichtingen. Geen ervan is een garantie op extra capaciteit — het zijn manieren om de ruimte die er wél is, beter te benutten.',
        ],
      },
      { type: 'h3', text: 'Energiebesparing' },
      {
        type: 'p',
        parts: [
          'De eerste en goedkoopste stap is vaak simpelweg minder piekvraag creëren: isolatie, efficiëntere apparatuur en LED-verlichting verlagen uw maximale vermogen en geven zo vaker ruimte binnen uw bestaande aansluiting.',
        ],
      },
      { type: 'h3', text: 'Energiesturing' },
      {
        type: 'p',
        parts: [
          'Met een energiebeheersysteem stuurt u het verbruik van bijvoorbeeld laadpalen of productieprocessen actief bij: apparatuur gaat aan op momenten dat er ruimte is, en uit op piekmomenten. Dit vraagt inzicht in uw verbruik en werkt vooral als uw bedrijfsproces daadwerkelijk flexibel is.',
        ],
      },
      { type: 'h3', text: 'Batterijopslag' },
      {
        type: 'p',
        parts: [
          'Een batterij slaat overtollige elektriciteit — bijvoorbeeld van eigen zonnepanelen — op voor later gebruik, en kan tijdelijk extra vermogen leveren bovenop uw aansluiting. Dat helpt in specifieke situaties, maar is geen automatische oplossing voor iedereen: het vraagt ruimte, brandveiligheidseisen en een investering die per situatie fors kan verschillen.',
        ],
      },
      { type: 'h3', text: 'Capaciteitsbeperkend contract' },
      {
        type: 'p',
        parts: [
          'Met dit type contract spreekt u met de netbeheerder af dat u op aangegeven piekmomenten tijdelijk minder stroom afneemt of teruglevert, in ruil voor een vergoeding. Dit is vooral interessant als uw bedrijfsproces op die momenten daadwerkelijk kan worden bijgestuurd. Het is geen garantie dat er extra capaciteit vrijkomt, maar een manier om bestaande restruimte beter te benutten.',
        ],
      },
      { type: 'h3', text: 'Samenwerken met andere bedrijven' },
      {
        type: 'p',
        parts: [
          'Op een bedrijventerrein kan het lonen om samen met buurbedrijven capaciteit te delen — bijvoorbeeld via cable pooling (één aansluiting voor meerdere opwekbronnen) of een gezamenlijk contract, ook wel een energiehub genoemd. Dit soort collectieve oplossingen staat nog volop in ontwikkeling en vraagt afstemming met meerdere partijen, maar kan juist op een bedrijventerrein in de Hoeksche Waard kansrijk zijn. RVO beschrijft deze en andere opties, met praktijkvoorbeelden en indicatieve kosten, in het ',
          {
            text: 'factsheet over oplossingen bij netcongestie',
            href: 'https://www.rvo.nl/sites/default/files/2024-07/Factsheets-oplossingen-netcongestie-bedrijven-versie-2.pdf',
          },
          '.',
        ],
      },
      {
        type: 'p',
        parts: [
          'Overweegt u een investering zoals een batterij of energiebeheersysteem? Kijk ook naar de mogelijke fiscale voordelen in ons overzicht van ',
          { text: 'EIA, ISDE en SDE++', to: ROUTES.blogPost('eia-isde-sde-subsidies') },
          '.',
        ],
      },
      { type: 'h2', text: 'Wanneer neemt u contact op met Stedin?' },
      {
        type: 'p',
        parts: [
          'Twijfelt u of uw postcode te maken heeft met congestie? Stedin biedt een ',
          {
            text: 'congestiechecker',
            href: 'https://www.stedin.net/zakelijk/energietransitie/beschikbare-netcapaciteit/congestie',
          },
          ' waarmee u dat kunt nagaan. Neem in ieder geval vroeg contact op met Stedin zodra u concrete plannen heeft voor een nieuwe aansluiting, een zwaardere aansluiting, of een grotere teruglevercapaciteit — hoe eerder u dit weet, hoe beter u uw planning daarop kunt afstemmen.',
        ],
      },
      { type: 'h2', text: 'Wat SMV Advies wel en niet voor u kan betekenen' },
      {
        type: 'p',
        parts: [
          'SMV Advies kan helpen om het energiegebruik en de verduurzamingsmogelijkheden van uw bedrijfspand in kaart te brengen en maatregelen te beoordelen. SMV kan echter geen netcapaciteit toewijzen of een aansluiting bij Stedin regelen — dat is en blijft aan de netbeheerder.',
        ],
      },
      {
        type: 'p',
        parts: [
          'Wat wij wél doen: in een ',
          { text: 'QuickScan of Premium-analyse', to: ROUTES.pakketten },
          ' meenemen wat uw huidige aansluiting toelaat, en samen met u bepalen welke maatregelen, in welke volgorde, het meeste opleveren binnen die grenzen. Hoe dat traject eruitziet, leest u in onze ',
          { text: 'werkwijze', to: ROUTES.werkwijze },
          '.',
        ],
      },
      { type: 'h2', text: 'Conclusie' },
      {
        type: 'p',
        parts: [
          'Netcongestie is geen reden om verduurzaming helemaal te laten liggen, maar wel een reden om slimmer te plannen: begin met de maatregelen die uw verbruik verlagen, denk vroeg na over uw aansluiting bij grotere stappen, en vraag tijdig bij Stedin na wat er mogelijk is. Zo voorkomt u vertraging op het moment dat u juist wilt doorpakken.',
        ],
      },
    ],
    cta: {
      label: 'Start de gratis energie-indicatie',
      to: ROUTES.energieIndicatie,
      text: 'Wilt u weten waar de grootste kansen liggen voor uw pand, rekening houdend met uw huidige aansluiting? Onze gratis energie-indicatie geeft een eerste beeld.',
    },
  },
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
      {
        type: 'p',
        parts: [
          'Welke isolatiewaarde daarbij verplicht is, hangt af van de omvang van de werkzaamheden. Vervangt u alleen de isolatielaag van het dak, dan geldt een minimale Rc-waarde van 2,1 m²K/W (Bbl artikel 5.20 lid 2). Wordt de renovatie ingrijpender — meer dan een kwart van de gebouwschil wordt vernieuwd — dan gelden de eisen die ook voor nieuwbouw gelden (Bbl artikel 5.20 lid 4); voor het dak van een utiliteitsgebouw is dat een Rc-waarde van minimaal 6,3 m²K/W (Bbl artikel 4.152). Welke situatie op uw pand van toepassing is, hangt af van de precieze omvang en aard van de werkzaamheden — uw uitvoerende partij kan dit voor uw project beoordelen.',
        ],
      },
      {
        type: 'p',
        parts: [
          'Vanuit verduurzamingsoogpunt kan het interessant zijn om bij een toch al geplande dakvervanging verder te kijken dan het wettelijke minimum, en de isolatiekeuze in samenhang met de rest van de dakopbouw te bekijken. Of dat voor uw pand financieel aantrekkelijk is, hangt af van de concrete situatie — dat is geen vaste regel, maar een afweging per project.',
        ],
      },
      { type: 'h2', text: 'Wat het oplevert, naast een lagere energierekening' },
      {
        type: 'p',
        parts: [
          'Een beter geïsoleerd dak merkt u het hele jaar: minder warmteverlies in de winter, maar ook minder hitteopbouw in de zomer — vooral in kantoren en winkels vaak het verschil tussen een prettig en een onwerkbaar binnenklimaat. Voor personeel en klanten is dat comfortverschil in de praktijk net zo waardevol als de besparing op de energierekening. Bekijk in onze ',
          { text: 'cases', to: ROUTES.cases },
          ' vergelijkbare voorbeelden uit de praktijk.',
        ],
      },
      { type: 'h2', text: 'Waar u op moet letten' },
      {
        type: 'ul',
        items: [
          'Thermische bruggen: aansluitingen bij dakranden, lichtkoepels en doorvoeren blijven vaak de zwakke plekken, ook ná isolatie.',
          'Dampopen of dampdicht: de juiste opbouw voorkomt vochtproblemen in de dakconstructie — een detail voor een gespecialiseerde dakdekker.',
          'Draagvermogen van de bestaande constructie: extra isolatie en eventuele ballast wegen mee, met name bij oudere hallen.',
          'Bouwregelgeving: bij gedeeltelijke vervanging van de dakisolatie geldt een minimale Rc-waarde van 2,1 m²K/W; bij een ingrijpende renovatie (meer dan een kwart van de gebouwschil) gelden de nieuwbouweisen, voor een utiliteitsgebouw Rc ≥ 6,3 m²K/W (Bbl art. 5.20 en 4.152). Uw uitvoerende partij kan beoordelen welke eis voor uw specifieke project geldt.',
          'Toekomstplannen voor zonnepanelen: overweegt u op termijn zonnepanelen op het dak? Dan is het de moeite waard om de dakopbouw en de isolatiewerkzaamheden in samenhang te bekijken, zodat werkzaamheden niet onnodig dubbel worden uitgevoerd.',
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
          'Qua terugverdientijd hoort dakisolatie vaak bij de maatregelen met de kortste terugverdientijd van alle bouwkundige ingrepen, juist omdat de meerkosten bij een toch al geplande dakvervanging beperkt zijn. De exacte terugverdientijd hangt af van uw huidige situatie, het type dak en de energieprijzen — iets wat we in een ',
          { text: 'QuickScan', to: ROUTES.pakketten },
          ' concreet voor uw pand berekenen.',
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
    readTime: '8 min',
    bodyAvailable: true,
    sections: [
      {
        type: 'p',
        parts: [
          'Subsidies en fiscale regelingen kunnen de terugverdientijd van een verduurzamingsmaatregel flink verkorten, maar het landschap van EIA, ISDE, SDE++ en KIA is voor de meeste ondernemers verwarrend. Dit artikel legt de belangrijkste regelingen op hoofdlijnen uit, inclusief de vraag of u ze kunt combineren. Percentages, drempelbedragen en voorwaarden wijzigen jaarlijks, dus controleer de actuele voorwaarden altijd bij RVO.nl of vraag het ons na.',
        ],
      },
      { type: 'h2', text: 'EIA — Energie-investeringsaftrek' },
      {
        type: 'p',
        parts: [
          'De EIA is geen subsidie in de vorm van een uitkering, maar een fiscaal voordeel: u mag een percentage van het investeringsbedrag extra aftrekken van de winst, bovenop de normale afschrijving. In 2026 bedraagt dit percentage 40%, met een minimum van € 2.500 per bedrijfsmiddel. Dat levert alleen voordeel op als de investering ook daadwerkelijk op de jaarlijkse Energielijst van RVO staat — een lijst met technische maatregelen die per jaar wordt vastgesteld. De melding bij RVO moet binnen 3 maanden na het aangaan van de investeringsverplichting worden gedaan, dus vóórdat u definitief tekent bij een leverancier of installateur. Ook ',
          { text: 'LED-verlichting', to: ROUTES.blogPost('led-verlichting-snelste-stap') },
          ' kan, afhankelijk van het type en de toepassing, op deze lijst staan. De EIA is bovendien te combineren met de kleinschaligheidsinvesteringsaftrek (KIA, zie verderop).',
        ],
      },
      { type: 'h2', text: 'ISDE — Investeringssubsidie duurzame energie en energiebesparing' },
      {
        type: 'p',
        parts: [
          'De ISDE is wél een directe subsidie-uitkering, geen belastingaftrek. Voor mkb-bedrijfspanden is deze regeling met name relevant voor ',
          { text: 'warmtepompen', to: ROUTES.blogPost('warmtepomp-in-het-mkb') },
          ', en daarnaast voor zonneboilers en kleinschalige windturbines. Isolatiemaatregelen komen voor zakelijke gebruikers niet in aanmerking voor de ISDE. Voor zakelijke zonnepanelen is de ISDE inmiddels afgeschaft — daar resteren voor zonnepanelen vooral fiscale voordelen zoals de EIA en de kleinschaligheidsinvesteringsaftrek (KIA). Voor warmtepompen geldt de ISDE nog wel, met een subsidiebedrag dat afhangt van het vermogen en type installatie; voor warmtepompen tot 70 kW geldt sinds 2024 een minimaal energielabel A++. Belangrijk: u vraagt de subsidie aan vóórdat u akkoord geeft op de offerte van de installateur, niet achteraf.',
        ],
      },
      { type: 'h2', text: 'SDE++ — Stimulering Duurzame Energieproductie en Klimaattransitie' },
      {
        type: 'p',
        parts: [
          'De SDE++ is primair bedoeld voor grootschalige of energie-intensieve investeringen die een aanzienlijke CO₂-reductie opleveren, en kent een aanvraagproces dat is toegesneden op dat soort projecten. Voor een individueel mkb-bedrijfspand van bescheiden omvang is deze regeling meestal minder relevant. Zodra het gaat om een grotere installatie, bijvoorbeeld een omvangrijk warmtepompsysteem of een groot zonnepanelenveld, kan het de moeite waard zijn om te laten checken of de SDE++ alsnog in beeld komt.',
        ],
      },
      { type: 'h2', text: 'KIA — kleinschaligheidsinvesteringsaftrek naast EIA' },
      {
        type: 'p',
        parts: [
          'Naast de EIA bestaat de kleinschaligheidsinvesteringsaftrek (KIA): een algemene fiscale aftrek voor bedrijfsinvesteringen, niet specifiek gericht op verduurzaming. Het aftrekpercentage hangt af van uw totale investeringsbedrag in een jaar en loopt in 2026 op tot 28% in de laagste schijf, met een aflopend voordeel bij hogere investeringsbedragen. Volgens de Belastingdienst is de KIA te combineren met de EIA. Omdat de exacte schijven en drempelbedragen jaarlijks worden vastgesteld en de KIA breder is dan alleen verduurzaming, raden we aan de actuele bedragen bij de Belastingdienst te checken of dit met uw boekhouder te bespreken.',
        ],
      },
      { type: 'h2', text: 'Kunt u deze regelingen combineren?' },
      {
        type: 'p',
        parts: [
          'EIA en KIA zijn volgens de Belastingdienst te combineren. Voor de combinatie van EIA met ISDE of met SDE++ op dezelfde investering geeft de officiële informatie geen eenduidig antwoord — controleer daarom vóór aanvraag altijd de actuele voorwaarden voor samenloop bij RVO, of laat dit voor uw specifieke situatie nagaan.',
        ],
      },
      {
        type: 'table',
        headers: ['Regeling', 'Type', 'Voor wie', 'Waarvoor', 'Aandachtspunt'],
        rows: [
          [
            'EIA',
            'Fiscale aftrek',
            'Ondernemers (IB/Vpb-plichtig)',
            'Bedrijfsmiddelen op de jaarlijkse Energielijst',
            'Meld binnen 3 maanden na de investeringsverplichting, vóór ondertekening',
          ],
          [
            'ISDE (zakelijk)',
            'Directe subsidie',
            'Zakelijke gebruikers',
            'Warmtepomp, zonneboiler, kleinschalige windturbine — geen isolatie',
            'Vraag aan vóórdat u akkoord geeft op de offerte',
          ],
          [
            'SDE++',
            'Exploitatiesubsidie',
            'Bedrijven/non-profits met doorgaans een grootverbruikersaansluiting',
            'Grootschalige duurzame energieproductie of CO₂-reductie',
            'Meestal niet relevant voor een individueel mkb-bedrijfspand van bescheiden omvang',
          ],
          [
            'KIA',
            'Fiscale aftrek (algemeen)',
            'Ondernemers met bedrijfsinvesteringen',
            'Bedrijfsmiddelen in het algemeen',
            'Percentage hangt af van totale jaarinvestering; combineerbaar met EIA',
          ],
        ],
      },
      { type: 'h2', text: 'Welke regeling past bij welke maatregel?' },
      {
        type: 'p',
        parts: [
          'Welke regeling relevant is, hangt sterk af van de maatregel zelf. ',
          { text: 'Dakisolatie', to: ROUTES.blogPost('dakisolatie-voor-uw-bedrijfspand') },
          ' komt voor zakelijke gebruikers niet in aanmerking voor de ISDE, maar kan onder voorwaarden in aanmerking komen voor de EIA als de precieze uitvoering op de Energielijst staat. Datzelfde geldt voor maatregelen die u neemt om te voldoen aan de ',
          { text: 'energielabel C-verplichting', to: ROUTES.blogPost('energielabel-c-verplicht-bedrijfspand') },
          ': die kunnen soms óók op de Energielijst staan, maar dat is geen automatisme — de exacte technische omschrijving is bepalend. Voor een warmtepomp is doorgaans de ISDE het eerste aanknopingspunt; of de EIA daarnaast van toepassing kan zijn op dezelfde investering, hangt af van de actuele samenloopvoorwaarden (zie hierboven).',
        ],
      },
      { type: 'h2', text: 'Subsidie voor het advies zelf: de SVM-regeling' },
      {
        type: 'p',
        parts: [
          'Minder bekend, maar voor de eerste stap juist relevant: er bestaat een regeling gericht op het verduurzamingsadvies zelf, de Subsidieregeling Verduurzaming MKB (SVM), die een deel van de advieskosten kan vergoeden. De precieze voorwaarden en het openstaande budget wisselen, dus vraag ons gerust of uw traject hiervoor in aanmerking komt.',
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
          'EIA, ISDE, SDE++ en KIA zijn geen keuzemenu waar u zomaar één regeling uit pikt: welke van toepassing zijn, hangt af van het type maatregel, de schaal van de investering en het moment waarop u aanvraagt — en soms is meer dan één regeling tegelijk relevant. De grootste winst zit vaak niet in het kennen van de regelingen zelf, maar in het op tijd checken vóórdat u een investering vastlegt.',
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
          'Naast het pand zelf speelt ook het elektriciteitsnet een rol. Een warmtepomp (en al helemaal in combinatie met zonnepanelen of laadpalen) vraagt meer capaciteit van uw aansluiting. Is een zwaardere aansluiting nodig, dan kan die aanvraag terechtkomen op een wachtlijst als er in uw gebied netcongestie speelt — in de Hoeksche Waard is dat sinds kort ook voor kleinere aansluitingen het geval. Wat dit precies betekent en wat u eraan kunt doen, leest u in ons artikel over ',
          { text: 'netcongestie in de Hoeksche Waard', to: ROUTES.blogPost('netcongestie-hoeksche-waard') },
          '. Neem dit vroeg in het traject mee, zodat het niet pas bij de uitvoering als verrassing naar voren komt.',
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
          'Een warmtepomp is voor veel bedrijfspanden een goede stap, maar het rendement staat of valt met de staat van het pand en de beschikbare aansluitcapaciteit. Een gedegen doorrekening vooraf voorkomt dat u investeert in een installatie die onder haar mogelijkheden blijft presteren. Onze ',
          { text: 'pakketten', to: ROUTES.pakketten },
          ' bieden zo’n doorrekening, van een eerste QuickScan tot een volledige analyse.',
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
          '. Bekijk in onze ',
          { text: 'cases', to: ROUTES.cases },
          ' een voorbeeld van wat dat in de praktijk oplevert.',
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
          'De meeste bedrijfspanden hebben één energiemeter voor het hele pand. Zonder uitsplitsing per functie — verlichting, verwarming, productieapparatuur — ziet u alleen de totale rekening, niet waar het verbruik precies vandaan komt. Dat maakt het lastig om zelf te bepalen waar de winst zit. Bekijk in onze ',
          { text: 'cases', to: ROUTES.cases },
          ' een voorbeeld waarin dit concreet naar boven kwam.',
        ],
      },
      {
        type: 'callout',
        title: 'De eerste stap is inzicht',
        text: [
          'Een ',
          { text: 'QuickScan', to: ROUTES.pakketten },
          ' brengt deze verspillers concreet in kaart voor uw eigen pand, inclusief een inschatting van wat oplossen ervan oplevert.',
        ],
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
