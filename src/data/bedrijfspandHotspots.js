import { ROUTES } from '../lib/routes.js'

/**
 * Interactieve bedrijfspand-doorsnede (/werkwijze, ronde 2026-10-15) — 24
 * punten op bedrijfspand-interactief.png (1513x1040). x/y zijn percentages
 * van de afbeelding, gemeten op de daadwerkelijke blauwe stippen in de
 * illustratie (kleurdrempel + connected-components, niet met het oog
 * geschat) — ze komen (op afronding na) overeen met de doorgegeven
 * conceptposities.
 *
 * Een getekend onderdeel is geen automatische dienst: SMV Advies adviseert,
 * beoordeelt en begeleidt, maar ontwerpt, installeert, onderhoudt of
 * keurt zelf niets (zie "Wat SMV Advies niet doet" op deze pagina) en
 * stelt geen MJOP op. Omschrijvingen hieronder zijn daarom bewust
 * terughoudend: context waar het onderdeel alleen illustratief is, een
 * concrete koppeling naar een bestaand blogartikel waar dat onderwerp
 * daadwerkelijk in het advies terugkomt.
 */
export const BEDRIJFSPAND_HOTSPOTS = [
  {
    id: 'ventilatiekanaal-dakdoorvoer',
    x: 70.4,
    y: 15.1,
    title: 'Ventilatiekanaal en dakdoorvoer',
    category: 'klimaat',
    description:
      'Dakdoorvoeren horen bij het ventilatiesysteem van het pand. Goede ventilatie beïnvloedt zowel het binnenklimaat als het energieverbruik.',
    link: { to: ROUTES.blogPost('ventilatie-in-uw-bedrijfspand'), label: 'Lees over ventilatie' },
  },
  {
    id: 'zonnepanelen',
    x: 59.5,
    y: 21.0,
    title: 'Zonnepanelen',
    category: 'installaties',
    description:
      'We beoordelen of zonnepanelen voor uw dak kansrijk zijn. Dakbelasting, netaansluiting en mogelijke fiscale voordelen (zoals de EIA en de KIA) nemen we daarin mee. SMV ontwerpt of installeert zelf geen zonnepanelen.',
    link: { to: ROUTES.blogPost('zonnepanelen-op-uw-bedrijfspand'), label: 'Lees over zonnepanelen' },
  },
  {
    id: 'dakconstructie',
    x: 45.7,
    y: 22.5,
    title: 'Dak en dakisolatie',
    category: 'gebouwschil',
    description:
      'Het dak is bij veel bedrijfspanden de grootste warmteverliezer, en qua bouwkundige maatregelen vaak die met de kortste terugverdientijd. De exacte terugverdientijd hangt af van het pand, het gebruik en de energieprijzen.',
    link: { to: ROUTES.blogPost('dakisolatie-voor-uw-bedrijfspand'), label: 'Lees over dakisolatie' },
  },
  {
    id: 'ventilatie-bovenverdieping',
    x: 38.2,
    y: 28.9,
    title: 'Ventilatie bovenverdieping',
    category: 'klimaat',
    description: 'Ook op de bovenverdieping bepaalt de ventilatie mede het binnenklimaat en het energiegebruik.',
    link: { to: ROUTES.blogPost('ventilatie-in-uw-bedrijfspand'), label: 'Lees over ventilatie' },
  },
  {
    id: 'klimaatinstallatie-bovenverdieping',
    x: 61.6,
    y: 35.4,
    title: 'Klimaatinstallatie',
    category: 'installaties',
    description:
      'Verwarmings- en koelinstallaties bepalen een groot deel van het energieverbruik. We brengen in kaart of de huidige installatie nog bij het pand past, zonder deze zelf te ontwerpen of installeren.',
    link: { to: ROUTES.blogPost('bedrijfspand-isoleren-of-installatie-eerst'), label: 'Isoleren of installatie eerst?' },
  },
  {
    id: 'terrein-groenvoorziening',
    x: 6.0,
    y: 46.1,
    title: 'Terrein en groenvoorziening',
    category: 'infrastructuur',
    description:
      'De buitenruimte valt buiten een bouwkundig verduurzamingsadvies, maar de ligging en oriëntatie van het pand spelen wel mee, bijvoorbeeld bij zoninstraling.',
    link: null,
  },
  {
    id: 'laadpunt-parkeren',
    x: 11.4,
    y: 61.6,
    title: 'Laadpunt en parkeren',
    category: 'elektriciteit',
    description:
      'Laadpalen op het terrein raken aan de elektrische aansluitcapaciteit van het pand. In delen van de Hoeksche Waard speelt daarbij ook netcongestie een rol.',
    link: { to: ROUTES.blogPost('laadpalen-op-uw-bedrijfsterrein'), label: 'Lees over laadpalen' },
  },
  {
    id: 'entree-gevel',
    x: 18.8,
    y: 63.2,
    title: 'Entree en gevel',
    category: 'gebouwschil',
    description: 'Gevel, kozijnen en glas bepalen samen met het dak de isolatiewaarde van het pand.',
    link: { to: ROUTES.blogPost('verduurzamingsmaatregelen-bedrijfspand'), label: 'Overzicht verduurzamingsmaatregelen' },
  },
  {
    id: 'kantoor-boven-begane-grond',
    x: 31.0,
    y: 42.7,
    title: 'Kantoorruimte (verdieping)',
    category: 'gebruik',
    description:
      'Het gebruik en de indeling van een ruimte spelen mee in de beoordeling: een kantoorverdieping heeft andere eisen dan een opslagruimte.',
    link: null,
  },
  {
    id: 'centrale-kantoor-vergaderruimte',
    x: 49.5,
    y: 45.6,
    title: 'Kantoor- en vergaderruimte',
    category: 'gebruik',
    description: 'Comfort en binnenklimaat in kantoor- en vergaderruimtes wegen mee bij de prioritering van maatregelen.',
    link: null,
  },
  {
    id: 'magazijn-opslag',
    x: 65.7,
    y: 44.3,
    title: 'Magazijn en opslag',
    category: 'gebruik',
    description:
      'Een magazijn heeft doorgaans een andere verwarmings- en verlichtingsbehoefte dan kantoorruimte. Dat is relevant voor advies op maat.',
    link: { to: ROUTES.blogPost('led-verlichting-snelste-stap'), label: 'Lees over LED-verlichting' },
  },
  {
    id: 'gevel-bedrijfshal',
    x: 80.9,
    y: 46.7,
    title: 'Gevel bedrijfshal',
    category: 'gebouwschil',
    description: 'Ook de gevel van een hal draagt bij aan het energieverlies van het pand, net als het dak.',
    link: { to: ROUTES.blogPost('bedrijfspand-isoleren-of-installatie-eerst'), label: 'Isoleren of installatie eerst?' },
  },
  {
    id: 'kantoor-begane-grond',
    x: 31.0,
    y: 58.7,
    title: 'Kantoorruimte (begane grond)',
    category: 'gebruik',
    description: 'Net als op de bovenverdieping spelen gebruik en indeling mee in het advies voor deze ruimte.',
    link: null,
  },
  {
    id: 'centrale-binnenruimte',
    x: 48.6,
    y: 56.7,
    title: 'Centrale binnenruimte',
    category: 'gebruik',
    description: 'Gedeelde binnenruimtes zijn relevant voor zowel comfort als de prioritering van maatregelen.',
    link: null,
  },
  {
    id: 'elektrische-installatie',
    x: 61.8,
    y: 59.1,
    title: 'Elektrische installatie en meterkast',
    category: 'elektriciteit',
    description:
      'De meterkast en elektrische installatie bepalen de aansluitcapaciteit van het pand. Dat is relevant bij bijvoorbeeld zonnepanelen of laadpalen, zeker met netcongestie in delen van de Hoeksche Waard.',
    link: { to: ROUTES.blogPost('netcongestie-hoeksche-waard'), label: 'Lees over netcongestie' },
  },
  {
    id: 'laad-en-loszone',
    x: 84.8,
    y: 58.7,
    title: 'Laad- en loszone',
    category: 'gebruik',
    description: 'De logistieke functie van een pand geeft context bij het advies, maar valt zelf buiten de scope van verduurzamingsadvies.',
    link: null,
  },
  {
    id: 'technische-ruimte-links-onder',
    x: 30.0,
    y: 73.6,
    title: 'Technische ruimte',
    category: 'installaties',
    description:
      'Technische ruimtes met installaties bepalen mede het energieverbruik van het pand. We brengen in kaart wat er staat, zonder zelf te installeren.',
    link: { to: ROUTES.blogPost('verduurzamingsmaatregelen-bedrijfspand'), label: 'Overzicht verduurzamingsmaatregelen' },
  },
  {
    id: 'installaties-onder-centrale-gebouw',
    x: 45.1,
    y: 73.6,
    title: 'Installaties onder het pand',
    category: 'installaties',
    description: 'Ook hier geldt: we beoordelen de bestaande installaties en het energieverbruik, maar ontwerpen of installeren zelf niets.',
    link: { to: ROUTES.blogPost('bedrijfspand-isoleren-of-installatie-eerst'), label: 'Isoleren of installatie eerst?' },
  },
  {
    id: 'centrale-technische-installatie',
    x: 57.2,
    y: 72.1,
    title: 'Centrale technische installatie',
    category: 'installaties',
    description: 'Een centrale verwarmings- of klimaatinstallatie is vaak bepalend voor het energieverbruik van het hele pand.',
    link: { to: ROUTES.blogPost('warmtepomp-in-het-mkb'), label: 'Lees over warmtepompen in het mkb' },
  },
  {
    id: 'technische-kast-rechts-onder',
    x: 68.8,
    y: 72.8,
    title: 'Technische / verdeelkast',
    category: 'elektriciteit',
    description: 'Schakel- en verdeelkasten geven inzicht in de elektrische capaciteit en -verdeling door het pand.',
    link: null,
  },
  {
    id: 'waterbuffer-wateropslag',
    x: 88.1,
    y: 74.2,
    title: 'Waterbuffer / wateropslag',
    category: 'infrastructuur',
    description:
      'Wateropslag of -buffering op het terrein valt buiten verduurzamingsadvies voor het pand zelf, maar hoort bij de bredere gebouwinfrastructuur.',
    link: null,
  },
  {
    id: 'ondergrondse-warmtewisselaar',
    x: 16.6,
    y: 89.8,
    title: 'Ondergrondse warmtewisselaar',
    category: 'installaties',
    description:
      'Bodemlussen horen bij een (hybride) warmtepompsysteem. We beoordelen of dat voor uw pand kansrijk is, inclusief mogelijke ISDE-subsidie. Ontwerp en installatie laten we aan specialisten over.',
    link: { to: ROUTES.blogPost('warmtepomp-bedrijfspand-verstandige-keuze'), label: 'Is een warmtepomp verstandig?' },
  },
  {
    id: 'ondergrondse-leidingen',
    x: 53.3,
    y: 87.2,
    title: 'Ondergrondse leidingen',
    category: 'infrastructuur',
    description: 'Leidingen tussen installaties en aansluitpunten horen bij de technische infrastructuur van het pand.',
    link: null,
  },
  {
    id: 'waterpartij-buiteninfrastructuur',
    x: 94.7,
    y: 67.4,
    title: 'Waterpartij en buiteninfrastructuur',
    category: 'infrastructuur',
    description: 'Ook dit onderdeel is illustratieve context bij het pand en valt buiten de scope van ons verduurzamingsadvies.',
    link: null,
  },
]

export const BEDRIJFSPAND_CATEGORIE_LABELS = {
  gebouwschil: 'Gebouwschil',
  installaties: 'Energie en installaties',
  elektriciteit: 'Elektriciteit',
  klimaat: 'Klimaat en ventilatie',
  gebruik: 'Gebruik van het pand',
  infrastructuur: 'Terrein en infrastructuur',
}
