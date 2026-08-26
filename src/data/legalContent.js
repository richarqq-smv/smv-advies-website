import { COMPANY } from './company'

/**
 * Content for /privacy and /voorwaarden.
 *
 * Source: the client's definitive Privacyverklaring.docx and Algemene
 * Voorwaarden.docx (2026-08-26). Text is reproduced as supplied — nothing
 * added or reworded — except:
 *  - the documents' own [adres]/[postcode]/[telefoonnummer] placeholders,
 *    filled in with the same values already published elsewhere on this
 *    site (COMPANY, below);
 *  - the documents' own [KvK-nummer] placeholder, which is conditionally
 *    included only once COMPANY.kvk is filled in (matches the Footer's
 *    existing behavior — no fake-looking placeholder shown meanwhile);
 *  - two sentences (marked below) corrected to match how the energy scan
 *    actually behaves, per explicit instruction that the tool is leading
 *    over descriptive text.
 *
 * "Laatst bijgewerkt" / "Versie" dates were blank in the source documents
 * ([datum] / [maand jaar]) — set here to the date this text was published
 * to the site. Confirm this is acceptable, or supply a different date.
 */

const KVK_CLAUSE = COMPANY.kvk ? `, ingeschreven bij de Kamer van Koophandel onder nummer ${COMPANY.kvk}` : ''
const KVK_BYLINE = COMPANY.kvk ? ` — KvK ${COMPANY.kvk}` : ''
const ADDRESS_LINE = `${COMPANY.address.street}, ${COMPANY.address.postalCode} ${COMPANY.address.city}`
const LAST_UPDATED = '26 augustus 2026'

export const PRIVACY_CONTENT = {
  intro:
    'SMV Advies (Steen en Mortel Verbetering) respecteert de privacy van iedereen die contact met ons heeft — via onze website, onze gratis energie-indicatietool, of als klant. In deze verklaring leest u welke persoonsgegevens wij verwerken, waarom, en welke rechten u heeft. ' +
    `Laatst bijgewerkt: ${LAST_UPDATED}. Deze verklaring is van toepassing op www.smv-advies.nl en alle diensten van SMV Advies.`,
  sections: [
    {
      title: 'Wie is de verwerkingsverantwoordelijke',
      content: [
        `SMV Advies, gevestigd te ${ADDRESS_LINE}${KVK_CLAUSE}, is de verwerkingsverantwoordelijke voor de persoonsgegevens die in deze verklaring worden beschreven.`,
        `Contactgegevens: ${ADDRESS_LINE} — ${COMPANY.phone} — ${COMPANY.email}.`,
      ],
    },
    {
      title: 'Welke persoonsgegevens SMV Advies verzamelt',
      content: [
        'Afhankelijk van hoe u met ons in contact komt, verwerken wij de volgende gegevens:',
        'Contactgegevens: naam, bedrijfsnaam, functie, telefoonnummer, e-mailadres, adresgegevens van uw bedrijfspand.',
        // Corrected: the source document said name/email/phone for the
        // energy scan are given "indien u deze invult" (optional). In the
        // live tool, naam, bedrijfsnaam, e-mailadres én telefoonnummer
        // zijn alle vier verplicht voordat het resultaat wordt getoond —
        // zie src/lib/energieScan/validation.js (validateStep4). Tekst
        // hieronder aangepast aan die daadwerkelijke werking.
        'Gegevens uit de gratis energie-indicatietool: de door u ingevoerde pandkenmerken (oppervlakte, bouwjaar, isolatieniveau, verwarmingssysteem e.d.), en uw naam, bedrijfsnaam, e-mailadres en telefoonnummer — deze contactgegevens zijn verplicht om de indicatie te kunnen berekenen en aan u toe te sturen.',
        "Energie- en pandgegevens: jaarafrekeningen gas/elektra, energielabel, bouwkundige en installatietechnische gegevens die u aanlevert of die tijdens een locatiebezoek worden vastgelegd (inclusief foto's van het pand).",
        'Gegevens uit offertes en opdrachten: gekozen pakket, prijsafspraken, facturatiegegevens.',
        'Technische gegevens over uw websitebezoek: zie het hoofdstuk Cookies hieronder.',
        'Wij verzamelen geen bijzondere persoonsgegevens (zoals gezondheids- of financiële gegevens van privépersonen) en vragen hier ook niet naar.',
      ],
    },
    {
      title: 'Met welk doel en op welke rechtsgrondslag gegevens worden verwerkt',
      content: [
        'Om een offerte op te stellen en een opdracht uit te voeren — grondslag: uitvoering van de overeenkomst (of de te sluiten overeenkomst).',
        'Om de gratis energie-indicatie te berekenen en aan u toe te sturen — grondslag: uitvoering van de overeenkomst / uw uitdrukkelijke verzoek.',
        'Om contact met u op te nemen naar aanleiding van een aanvraag, offerte of lopend project — grondslag: uitvoering van de overeenkomst of gerechtvaardigd belang (opvolgen van een concrete aanvraag).',
        'Om te voldoen aan wettelijke verplichtingen, zoals onze fiscale bewaarplicht — grondslag: wettelijke verplichting.',
        'Om, na een aanvraag via de energie-indicatietool, opvolgend contact op te nemen met een passend aanbod — grondslag: gerechtvaardigd belang. U kunt hiertegen te allen tijde bezwaar maken (zie het hoofdstuk Uw rechten).',
        'Wij gebruiken uw gegevens niet voor geautomatiseerde besluitvorming met rechtsgevolgen en verkopen uw gegevens niet aan derden.',
      ],
    },
    {
      title: 'Hoe lang gegevens worden bewaard',
      content: [
        'Klant- en projectgegevens (offertes, opdrachten, rapporten, facturen): 7 jaar na afronding van de opdracht, conform de fiscale bewaarplicht.',
        'Gegevens uit de gratis energie-indicatietool zonder vervolgopdracht: maximaal 2 jaar na het laatste contact, tenzij u eerder om verwijdering vraagt.',
        'Contactgegevens van aanvragen die niet tot een opdracht leiden: maximaal 2 jaar na het laatste contact.',
        'Na afloop van de bewaartermijn worden uw gegevens verwijderd of geanonimiseerd, tenzij een wettelijke verplichting langere bewaring vereist.',
      ],
    },
    {
      title: 'Met wie gegevens eventueel worden gedeeld',
      content: [
        'SMV Advies deelt uw gegevens uitsluitend voor zover noodzakelijk voor de uitvoering van de opdracht of om aan wettelijke verplichtingen te voldoen:',
        'Met installateurs en aannemers, uitsluitend bij het Gold Pakket en alleen na uw akkoord, voor het opvragen van offertes.',
        'Met onze accountant of boekhouder, voor de financiële administratie.',
        'Met IT-dienstverleners (bijv. hosting, e-mail, agenda- en CRM-software) die als verwerker voor ons optreden, op basis van een verwerkersovereenkomst.',
        'Met overheidsinstanties (zoals RVO), uitsluitend indien u ons daartoe opdracht geeft in het kader van een subsidieaanvraag.',
        'Wij delen uw gegevens niet met derden voor commerciële doeleinden en verkopen geen persoonsgegevens.',
      ],
    },
    {
      title: 'De rechten van betrokkenen en hoe die uit te oefenen',
      content: [
        'U heeft op grond van de AVG de volgende rechten met betrekking tot uw persoonsgegevens:',
        'Recht op inzage in de gegevens die wij van u verwerken.',
        'Recht op correctie van onjuiste of onvolledige gegevens.',
        "Recht op verwijdering ('recht op vergetelheid'), voor zover geen wettelijke bewaarplicht van toepassing is.",
        'Recht op beperking van de verwerking.',
        'Recht op overdraagbaarheid (dataportabiliteit) van de gegevens die u zelf aan ons heeft verstrekt.',
        'Recht van bezwaar tegen verwerking op basis van gerechtvaardigd belang, waaronder opvolgend contact na de gratis energie-indicatie.',
        `U kunt een verzoek indienen via ${COMPANY.email}. Wij reageren binnen 4 weken. Daarnaast heeft u het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).`,
      ],
    },
    {
      title: 'Beveiliging',
      content: [
        'SMV Advies neemt passende technische en organisatorische maatregelen om uw persoonsgegevens te beschermen tegen verlies, misbruik en onbevoegde toegang, waaronder beveiligde opslag, toegangsbeperking en het gebruik van verwerkersovereenkomsten met dienstverleners die namens ons gegevens verwerken.',
        'Mocht er ondanks deze maatregelen sprake zijn van een datalek dat een risico vormt voor uw rechten en vrijheden, dan melden wij dit conform de wettelijke verplichtingen bij de Autoriteit Persoonsgegevens en, indien vereist, aan u.',
      ],
    },
    {
      title: 'Welk cookiebeleid geldt',
      content: [
        'De website van SMV Advies gebruikt functionele en analytische cookies om de website goed te laten werken en het gebruik ervan te begrijpen.',
        'Functionele cookies: noodzakelijk voor de werking van de website en de energie-indicatietool. Hiervoor is geen toestemming vereist.',
        'Analytische cookies: gebruikt om bezoekersstatistieken te verzamelen (bijv. Google Analytics), waar mogelijk privacyvriendelijk ingesteld.',
        'Marketing-/trackingcookies: worden alleen geplaatst na uw uitdrukkelijke toestemming via de cookiebanner.',
        'U kunt cookies te allen tijde weigeren of verwijderen via uw browserinstellingen. Dit kan de werking van (delen van) de website beïnvloeden.',
      ],
    },
    {
      title: 'Contact bij privacyvragen',
      content: [
        `Voor vragen, verzoeken of klachten over deze privacyverklaring of de verwerking van uw persoonsgegevens kunt u contact opnemen met: SMV Advies — ${ADDRESS_LINE} — ${COMPANY.email} — ${COMPANY.phone}.`,
        'Deze privacyverklaring kan worden gewijzigd, bijvoorbeeld bij wijzigingen in onze dienstverlening of wet- en regelgeving. De meest actuele versie is altijd te vinden op www.smv-advies.nl/privacy.',
        `SMV Advies — ${COMPANY.address.city}${KVK_BYLINE}`,
      ],
    },
  ],
}

export const VOORWAARDEN_CONTENT = {
  intro:
    `SMV Advies (Steen en Mortel Verbetering), eenmanszaak gevestigd te ${COMPANY.address.city}${KVK_CLAUSE}. Versie augustus 2026. ` +
    'Deze voorwaarden zijn geschreven voor een advies- en begeleidingsbureau — SMV Advies voert zelf geen bouwkundige of installatietechnische werkzaamheden uit; die worden verricht door de klant of via SMV Advies gecontracteerde installateurs en aannemers.',
  sections: [
    {
      title: 'Definities',
      content: [
        `SMV Advies: de eenmanszaak SMV Advies (Steen en Mortel Verbetering), gevestigd te ${COMPANY.address.city}${KVK_CLAUSE}.`,
        'Klant: de natuurlijke of rechtspersoon die aan SMV Advies opdracht geeft tot het verrichten van diensten.',
        'Opdracht: de overeenkomst tussen SMV Advies en de klant tot het verrichten van advies-, analyse- en/of begeleidingswerkzaamheden op het gebied van verduurzaming van bedrijfspanden.',
        'Rapport: het door SMV Advies opgeleverde advies- of analysedocument (o.a. QuickScan, Premium- of Gold-rapportage).',
        'Derde partijen: installateurs, aannemers, leveranciers of andere uitvoerende partijen die door de klant of via SMV Advies worden ingeschakeld voor de daadwerkelijke uitvoering van maatregelen.',
      ],
    },
    {
      title: 'Toepasselijkheid',
      content: [
        'Deze Algemene Voorwaarden zijn van toepassing op alle offertes, opdrachtbevestigingen en overeenkomsten tussen SMV Advies en de klant, tenzij partijen schriftelijk anders overeenkomen.',
        'Eventuele inkoop- of andere voorwaarden van de klant worden uitdrukkelijk van de hand gewezen.',
        'Afwijkingen van deze voorwaarden zijn alleen geldig indien schriftelijk overeengekomen tussen SMV Advies en de klant.',
      ],
    },
    {
      title: 'Offertes en totstandkoming van de overeenkomst',
      content: [
        'Alle offertes van SMV Advies zijn vrijblijvend en geldig gedurende de in de offerte genoemde termijn, bij gebreke waarvan een termijn van 30 dagen geldt.',
        'De overeenkomst komt tot stand op het moment dat de klant een offerte schriftelijk (waaronder per e-mail) accepteert, of zodra SMV Advies feitelijk met de uitvoering van de opdracht start met instemming van de klant.',
        'SMV Advies bevestigt de opdracht schriftelijk middels een opdrachtbevestiging waarin de omvang van de dienstverlening, de prijs en de planning zijn vastgelegd.',
        'Kennelijke fouten of vergissingen in offertes en rapportages van SMV Advies binden SMV Advies niet.',
      ],
    },
    {
      title: 'Prijzen en betaling',
      content: [
        'Alle door SMV Advies genoemde prijzen zijn exclusief btw, tenzij uitdrukkelijk anders vermeld.',
        'Betaling vindt plaats binnen 14 dagen na factuurdatum, tenzij schriftelijk anders overeengekomen in de opdrachtbevestiging.',
        'Bij overschrijding van de betalingstermijn is de klant van rechtswege in verzuim en is de wettelijke handelsrente verschuldigd over het openstaande bedrag, onverminderd het recht van SMV Advies op vergoeding van buitengerechtelijke incassokosten.',
        'SMV Advies is gerechtigd werkzaamheden op te schorten indien de klant met betaling in gebreke blijft.',
        'Meerwerk — werkzaamheden die buiten de in de offerte of opdrachtbevestiging omschreven omvang vallen — wordt alleen uitgevoerd na voorafgaand schriftelijk akkoord van de klant en afzonderlijk in rekening gebracht.',
      ],
    },
    {
      title: 'Uitvoering van de opdracht',
      content: [
        'SMV Advies voert de opdracht naar beste inzicht, kennis en kunde uit, conform de eisen van goed vakmanschap, op basis van een inspanningsverplichting.',
        'De in rapporten genoemde bedragen (investeringen, besparingen, terugverdientijden) zijn indicatief en gebaseerd op kentallen, aangeleverde gegevens en/of een visuele opname. Hieraan kunnen geen rechten worden ontleend; voor een sluitend uitvoeringsbudget zijn offertes van uitvoerende partijen noodzakelijk.',
        'SMV Advies voert zelf geen bouwkundige, installatietechnische of andere uitvoerende werkzaamheden uit. Bij het Gold Pakket begeleidt SMV Advies de klant bij het opvragen, vergelijken en beoordelen van offertes van derde partijen en bij de kwaliteitscontrole tijdens uitvoering, maar de daadwerkelijke uitvoering en de contractuele relatie met de uitvoerende partij komen tot stand tussen de klant en die derde partij.',
        'Genoemde termijnen (levertijd rapport, doorlooptijd project) zijn indicatief en gelden niet als fatale termijn, tenzij uitdrukkelijk schriftelijk anders overeengekomen.',
      ],
    },
    {
      title: 'Verplichtingen van de klant',
      content: [
        'Tijdig en volledig verstrekken van de voor de opdracht benodigde gegevens (o.a. jaarafrekeningen, tekeningen, toegang tot het pand).',
        'Toegang verlenen tot het pand en de relevante technische ruimtes op de afgesproken datum en tijdstip.',
        'SMV Advies tijdig informeren over wijzigingen die relevant zijn voor de opdracht (bijv. geplande verbouwingen, eigendomswijziging).',
        'Bij onjuiste, onvolledige of te laat verstrekte gegevens is SMV Advies niet aansprakelijk voor eventuele afwijkingen in het rapport of vertraging in de levering.',
      ],
    },
    {
      title: 'Aansprakelijkheid',
      content: [
        'De aansprakelijkheid van SMV Advies voor schade voortvloeiend uit of verband houdend met de uitvoering van de opdracht is beperkt tot het bedrag dat in het desbetreffende geval door de beroeps- of bedrijfsaansprakelijkheidsverzekering van SMV Advies wordt uitgekeerd, vermeerderd met het eigen risico.',
        'Indien om welke reden dan ook geen uitkering krachtens die verzekering plaatsvindt, is de aansprakelijkheid van SMV Advies beperkt tot maximaal het bedrag van de voor de betreffende opdracht overeengekomen prijs (excl. btw), met een maximum van € 5.000.',
        'SMV Advies is niet aansprakelijk voor schade die voortvloeit uit de uitvoering van maatregelen door derde partijen (installateurs, aannemers), noch voor de kwaliteit, planning of nakoming van door de klant of via SMV Advies gecontracteerde derde partijen.',
        'SMV Advies is niet aansprakelijk voor indirecte schade, waaronder gevolgschade, gederfde winst, gemiste besparingen of schade door bedrijfsstagnatie.',
        'De in dit artikel opgenomen beperkingen gelden niet voor zover schade het gevolg is van opzet of bewuste roekeloosheid van SMV Advies.',
        'Elke vordering tot schadevergoeding vervalt indien deze niet binnen 12 maanden nadat de klant bekend werd of redelijkerwijs bekend had kunnen zijn met de schade, schriftelijk bij SMV Advies is ingediend.',
      ],
    },
    {
      title: 'Intellectueel eigendom van rapportages',
      content: [
        'Alle door SMV Advies opgestelde rapporten, adviezen, berekeningen en overige documenten blijven eigendom van SMV Advies wat betreft de intellectuele eigendomsrechten, ook na betaling van de opdracht.',
        'De klant verkrijgt een niet-exclusief, niet-overdraagbaar gebruiksrecht op het rapport voor het doel waarvoor het is opgesteld: het eigen verduurzamingstraject van het betreffende pand.',
        'Het is de klant niet toegestaan rapporten van SMV Advies zonder voorafgaande schriftelijke toestemming te verveelvoudigen, openbaar te maken of aan derden ter beschikking te stellen, anders dan noodzakelijk voor het opvragen van offertes bij installateurs in het kader van dezelfde opdracht.',
      ],
    },
    {
      title: 'Geheimhouding',
      content: [
        'Beide partijen verplichten zich tot geheimhouding van alle vertrouwelijke informatie die zij in het kader van de opdracht van elkaar hebben verkregen.',
        'Informatie geldt in ieder geval als vertrouwelijk indien dit door de andere partij is medegedeeld of dit voortvloeit uit de aard van de informatie, waaronder bedrijfsgegevens, energieverbruik en pandinformatie van de klant.',
        'Deze geheimhoudingsverplichting geldt niet voor zover openbaarmaking wettelijk verplicht is.',
      ],
    },
    {
      title: 'Klachtenregeling',
      content: [
        'Klachten over de dienstverlening dienen zo spoedig mogelijk, doch uiterlijk binnen 30 dagen na constatering, schriftelijk en gemotiveerd bij SMV Advies te worden ingediend.',
        'Een klacht schort de betalingsverplichting van de klant niet op.',
        'SMV Advies reageert binnen 14 dagen op een ingediende klacht en zal zich inspannen om in onderling overleg tot een oplossing te komen.',
      ],
    },
    {
      title: 'Overmacht',
      content: [
        'SMV Advies is niet gehouden tot nakoming van enige verplichting indien zij daartoe verhinderd is als gevolg van overmacht, waaronder mede begrepen: ziekte, arbeidsongeschiktheid, storingen in de bedrijfsvoering, en het uitblijven van benodigde medewerking of gegevens van de klant of van derde partijen.',
        'Tijdens overmacht worden de verplichtingen van SMV Advies opgeschort. Duurt de overmachtsperiode langer dan 60 dagen, dan zijn beide partijen gerechtigd de overeenkomst geheel of gedeeltelijk te ontbinden, zonder gehoudenheid tot vergoeding van schade.',
      ],
    },
    {
      title: 'Beëindiging',
      content: [
        'Beide partijen kunnen de overeenkomst schriftelijk opzeggen met inachtneming van een redelijke termijn, tenzij in de opdrachtbevestiging anders is overeengekomen.',
        'SMV Advies is gerechtigd de overeenkomst met onmiddellijke ingang te beëindigen indien de klant surseance van betaling aanvraagt, in staat van faillissement wordt verklaard, of anderszins niet meer in staat is aan zijn verplichtingen te voldoen.',
        'Bij tussentijdse beëindiging is de klant gehouden tot betaling van de tot dan toe verrichte werkzaamheden, naar rato van de voortgang van de opdracht.',
      ],
    },
    {
      title: 'Toepasselijk recht en geschillenregeling',
      content: [
        'Op alle overeenkomsten tussen SMV Advies en de klant is uitsluitend Nederlands recht van toepassing.',
        'Geschillen die niet in onderling overleg kunnen worden opgelost, worden voorgelegd aan de bevoegde rechter in het arrondissement waar SMV Advies is gevestigd, tenzij dwingend recht anders voorschrijft.',
        `SMV Advies — ${COMPANY.address.city}${KVK_BYLINE}`,
      ],
    },
  ],
}
