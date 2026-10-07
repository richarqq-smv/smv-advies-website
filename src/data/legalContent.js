import { COMPANY } from './company'

/**
 * Content for /privacy and /voorwaarden.
 *
 * PRIVACY_CONTENT: source is the client's definitive Privacyverklaring.docx
 * (2026-08-26), reproduced as supplied — nothing added or reworded — except:
 *  - the document's own [adres]/[postcode]/[telefoonnummer] placeholders,
 *    filled in with the same values already published elsewhere on this
 *    site (COMPANY, below);
 *  - the document's own [KvK-nummer] placeholder, which is conditionally
 *    included only once COMPANY.kvk is filled in (matches the Footer's
 *    existing behavior — no fake-looking placeholder shown meanwhile);
 *  - two sentences (marked below) corrected to match how the energy scan
 *    actually behaves, per explicit instruction that the tool is leading
 *    over descriptive text.
 *
 * VOORWAARDEN_CONTENT: the original source was the client's Algemene
 * Voorwaarden.docx (2026-08-26). This round (zie VOORWAARDEN_LAST_UPDATED)
 * substantially rewrote/expanded that text on explicit client instruction
 * — a legal aanscherping, not a reproduction — to cover: SMV Advies'
 * rol als advies-/begeleidingsbureau (geen aannemer/installateur);
 * subsidies/fiscale regelingen; het onderscheid brongegevens/afgeleide
 * gegevens/aannames in berekeningen; een uitgebreidere aansprakelijkheids-
 * paragraaf; derden; wijzigingen in wet- en regelgeving; en scope/meerwerk.
 * Prijzen, pakketgrenzen en het meerwerktarief komen uitsluitend uit
 * src/data/packages.js / src/lib/klantOmgeving/offerte.js (geen tweede
 * bron voor diezelfde cijfers) — deze tekst verwijst daar beschrijvend
 * naar in plaats van bedragen/aantallen te herhalen.
 *
 * Privacy en Voorwaarden zijn onafhankelijke documenten met elk hun eigen
 * revisiedatum — vandaar twee losse *_LAST_UPDATED-constanten in plaats
 * van één gedeelde: het bijwerken van de ene tekst mag nooit stilzwijgend
 * ook de "laatst bijgewerkt"-datum van de andere tekst laten meeveranderen.
 */

const KVK_CLAUSE = COMPANY.kvk ? `, ingeschreven bij de Kamer van Koophandel onder nummer ${COMPANY.kvk}` : ''
const KVK_BYLINE = COMPANY.kvk ? ` — KvK ${COMPANY.kvk}` : ''
const ADDRESS_LINE = `${COMPANY.address.street}, ${COMPANY.address.postalCode} ${COMPANY.address.city}`

export const PRIVACY_LAST_UPDATED = '7 oktober 2026'

// Geëxporteerd (niet alleen module-lokaal) zodat de offertefunctionaliteit
// dezelfde versie-aanduiding in een offerte-snapshot kan vastleggen zonder
// een tweede plek te creëren waar deze datum zou moeten kloppen — zie
// VOORWAARDEN_VERSIE in src/components/klantOmgeving/OfferteEditor.jsx en
// bouwOfferteSnapshot() in src/lib/klantOmgeving/offerte.js. Een al
// aangemaakte offerte bevat de datum die hier gold op het moment van
// aanmaken (bevroren in de snapshot) en verandert dus nooit mee als deze
// constante later wordt bijgewerkt.
export const VOORWAARDEN_LAST_UPDATED = '6 oktober 2026'

export const PRIVACY_CONTENT = {
  intro:
    'SMV Advies (Steen en Mortel Verbetering) respecteert de privacy van iedereen die contact met ons heeft — via onze website, onze gratis energie-indicatietool, of als klant. In deze verklaring leest u welke persoonsgegevens wij verwerken, waarom, en welke rechten u heeft. ' +
    `Laatst bijgewerkt: ${PRIVACY_LAST_UPDATED}. Deze verklaring is van toepassing op www.smv-advies.nl en alle diensten van SMV Advies.`,
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
        'Om een concrete aanvraag, offerteaanvraag of lopende klantrelatie rechtstreeks op te volgen — bijvoorbeeld door te reageren op uw vraag of een passend vervolg op uw aanvraag te bespreken — grondslag: uitvoering van de overeenkomst (of de daaraan voorafgaande precontractuele maatregelen), of, waar passend, gerechtvaardigd belang. Dit is een directe opvolging van uw eigen aanvraag en geen algemene direct marketing.',
        'Gaat opvolgend contact verder dan de directe opvolging van uw concrete aanvraag en kwalificeert dit als een elektronisch commercieel bericht, dan verstuurt SMV Advies dit alleen wanneer u daarvoor voorafgaand toestemming heeft gegeven, voor zover de toepasselijke wetgeving die toestemming vereist. U kunt deze toestemming te allen tijde intrekken; intrekking laat de rechtmatigheid van de verwerking vóór de intrekking onverlet. Ongeacht de gebruikte grondslag heeft u altijd het recht bezwaar te maken tegen verwerking van uw gegevens voor direct marketing (zie het hoofdstuk De rechten van betrokkenen en hoe die uit te oefenen).',
        'Om te voldoen aan wettelijke verplichtingen, zoals onze fiscale bewaarplicht — grondslag: wettelijke verplichting.',
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
        'Internationale doorgifte: uw persoonsgegevens worden in principe binnen de Europese Economische Ruimte (EER) opgeslagen en verwerkt. Indien een IT-dienstverlener persoonsgegevens buiten de EER verwerkt, bijvoorbeeld in de Verenigde Staten, zorgt SMV Advies ervoor dat deze doorgifte uitsluitend plaatsvindt met passende waarborgen zoals vereist door de AVG. Daarbij kan bijvoorbeeld gebruik worden gemaakt van door de Europese Commissie vastgestelde EU-modelcontractbepalingen (Standard Contractual Clauses) of, wanneer van toepassing, het EU-US Data Privacy Framework.',
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
        'Recht van bezwaar tegen verwerking op basis van gerechtvaardigd belang, en in het bijzonder het recht om te allen tijde bezwaar te maken tegen verwerking van uw gegevens voor direct marketing.',
        'Recht om een gegeven toestemming — bijvoorbeeld voor elektronische commerciële berichten — te allen tijde in te trekken. Intrekking laat de rechtmatigheid van de verwerking vóór de intrekking onverlet.',
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
    `SMV Advies (Steen en Mortel Verbetering), eenmanszaak gevestigd te ${COMPANY.address.city}${KVK_CLAUSE}. Versie ${VOORWAARDEN_LAST_UPDATED}. ` +
    'Deze voorwaarden zijn geschreven voor een advies- en begeleidingsbureau: SMV Advies is geen aannemer, installateur of uitvoerend bouwbedrijf en voert zelf geen bouwkundige of installatietechnische werkzaamheden uit; die worden verricht door de klant zelf, of door installateurs en aannemers die de klant zelf of via SMV Advies inschakelt.',
  sections: [
    {
      title: 'Definities',
      content: [
        `SMV Advies: de eenmanszaak SMV Advies (Steen en Mortel Verbetering), gevestigd te ${COMPANY.address.city}${KVK_CLAUSE}.`,
        'Klant: de natuurlijke of rechtspersoon die aan SMV Advies opdracht geeft tot het verrichten van diensten.',
        'Opdracht: de overeenkomst tussen SMV Advies en de klant tot het verrichten van advies-, analyse- en/of begeleidingswerkzaamheden op het gebied van verduurzaming van bedrijfspanden.',
        'Rapport: het door SMV Advies opgeleverde advies- of analysedocument (o.a. QuickScan, Premium- of Gold-rapportage).',
        'Derde partijen: installateurs, aannemers, leveranciers of andere uitvoerende partijen die door de klant of via SMV Advies worden ingeschakeld voor de daadwerkelijke uitvoering van maatregelen.',
        'Subsidie- of fiscale regeling: een subsidie, fiscale faciliteit of vergelijkbare regeling van een overheidsinstantie, waaronder (niet-limitatief) de EIA, ISDE, MIA en Vamil.',
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
      title: 'Rol van SMV Advies',
      content: [
        'SMV Advies is een advies- en begeleidingsbureau op het gebied van verduurzaming van bedrijfspanden. SMV Advies is geen aannemer, installateur of uitvoerend bouwbedrijf en treedt ook niet als zodanig op.',
        'SMV Advies is niet verantwoordelijk voor: de daadwerkelijke uitvoering van maatregelen; de bouwkundige of installatietechnische kwaliteit van werkzaamheden van derden; de constructieve veiligheid van uitgevoerd werk; de naleving van bouw-, installatie-, veiligheids- of andere wettelijke voorschriften door uitvoerende partijen; de planning, levertijd of beschikbaarheid van derden; garanties van leveranciers, installateurs of aannemers; en gebreken in producten of werkzaamheden van derden.',
        'Heeft SMV Advies namens of samen met de klant contact met een derde partij — bijvoorbeeld bij het opvragen van offertes of bij een kickoffgesprek — dan maakt dit SMV Advies niet tot uitvoerende partij en neemt SMV Advies daarmee niet de aansprakelijkheid van die derde partij over.',
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
        'Meerwerk wordt alleen uitgevoerd na voorafgaand schriftelijk akkoord van de klant en afzonderlijk in rekening gebracht — zie het artikel Scope en meerwerk hieronder.',
      ],
    },
    {
      title: 'Scope en meerwerk',
      content: [
        'Alleen de werkzaamheden die partijen in de offerte of opdrachtbevestiging zijn overeengekomen maken onderdeel uit van de opdracht.',
        'Voor pakketten met een vooraf afgebakende scope — in het bijzonder het Gold Pakket — geldt de scope zoals beschreven op www.smv-advies.nl/pakketten en in de offerte, waaronder het aantal maatregelen, offerterondes, klantcontactmomenten en de duur van de begeleiding.',
        'Werkzaamheden, maatregelen, contactmomenten of offertes die buiten deze overeengekomen scope vallen, zijn meerwerk. Meerwerk wordt altijd vooraf met de klant afgestemd en pas uitgevoerd na schriftelijk akkoord van de klant, tegen het daarvoor geldende tarief zoals vermeld in de offerte of opdrachtbevestiging.',
      ],
    },
    {
      title: 'Uitvoering van de opdracht',
      content: [
        'SMV Advies voert de opdracht naar beste inzicht, kennis en kunde uit, conform de eisen van goed vakmanschap, op basis van een inspanningsverplichting.',
        'Bij het Gold Pakket kan de begeleiding van SMV Advies, binnen de overeengekomen scope, onder meer bestaan uit: het opvragen van offertes bij derde partijen; het vergelijken van offertes; het op hoofdlijnen inhoudelijk beoordelen van offertes; contactmomenten met de klant; aanwezigheid bij een kickoffgesprek met de uitvoerende partij; en een visuele, documentaire oplevercheck binnen de afgesproken scope.',
        'Deze begeleiding is geen technische keuring, geen bouwkundige inspectie, geen constructieve inspectie en geen installatietechnische keuring. Het houdt geen toezicht op de uitvoering in, geen garantie op de uitvoeringskwaliteit en geen vrijwaring van de uitvoerende partij. SMV Advies neemt met deze begeleiding niet de aansprakelijkheid van de aannemer, installateur of leverancier over.',
        'De uitvoerende partij blijft zelf volledig verantwoordelijk voor de correcte uitvoering, kwaliteit, veiligheid, wettelijke conformiteit, garanties en oplevering van haar eigen werkzaamheden.',
        'Genoemde termijnen (levertijd rapport, doorlooptijd project) zijn indicatief en gelden niet als fatale termijn, tenzij uitdrukkelijk schriftelijk anders overeengekomen.',
      ],
    },
    {
      title: 'Berekeningen en prognoses',
      content: [
        'Door SMV Advies genoemde investeringsbedragen, besparingen, energieverbruiken, terugverdientijden, rendementen, toekomstige energiekosten, CO₂-besparingen en energielabels of indicaties daarvan zijn, voor zover gebaseerd op aannames, kengetallen, aangeleverde gegevens of ramingen, indicatief. Hieraan kan geen garantie op een bepaald financieel of energetisch resultaat worden ontleend.',
        'SMV Advies onderscheidt daarbij: brongegevens (door de klant aangeleverde of tijdens een opname vastgelegde gegevens, zoals jaarafrekeningen, bouwjaar en pandkenmerken); berekende of afgeleide gegevens (op basis van brongegevens berekende indicaties, zoals besparing en terugverdientijd); en aannames of prognoses (inschattingen voor zover brongegevens ontbreken of onzeker zijn).',
        'Voor een sluitend uitvoeringsbudget zijn offertes van uitvoerende partijen noodzakelijk.',
      ],
    },
    {
      title: 'Subsidies en fiscale regelingen',
      content: [
        'SMV Advies kan de klant informeren over, en begeleiden bij, subsidies en fiscale regelingen (waaronder de EIA, ISDE, MIA en Vamil) door middel van informatie, indicaties, berekeningen of begeleiding bij de aanvraag.',
        'SMV Advies geeft geen garantie dat een subsidie of fiscale faciliteit wordt toegekend, en kan niet garanderen dat een aanvraag voldoet aan alle op het moment van aanvraag geldende voorwaarden, of dat een regeling beschikbaar blijft.',
        'SMV Advies is niet verantwoordelijk voor wijzigingen in wet- en regelgeving of beleidsregels, en niet voor afwijzing, vertraging of vermindering van een aanvraag door RVO of een andere bevoegde instantie.',
        'De klant blijft verantwoordelijk voor het tijdig aanleveren van juiste en volledige gegevens en voor het voldoen aan de formele aanvraagvoorwaarden, tenzij SMV Advies een concrete administratieve handeling (zoals het indienen van een specifieke aanvraag) schriftelijk op zich heeft genomen. In dat geval voert SMV Advies die handeling naar beste inzicht en binnen de daarvoor geldende termijnen uit, zonder dat dit een garantie op toekenning inhoudt.',
      ],
    },
    {
      title: 'Verplichtingen van de klant',
      content: [
        'Tijdig en volledig verstrekken van de voor de opdracht benodigde gegevens (o.a. jaarafrekeningen, tekeningen, toegang tot het pand).',
        'Toegang verlenen tot het pand en de relevante technische ruimtes op de afgesproken datum en tijdstip.',
        'SMV Advies tijdig informeren over wijzigingen die relevant zijn voor de opdracht (bijv. geplande verbouwingen, eigendomswijziging).',
        'SMV Advies mag uitgaan van de juistheid en volledigheid van de door de klant verstrekte informatie, tenzij er een duidelijke aanleiding bestaat om daaraan te twijfelen.',
        'Bij onjuiste, onvolledige of te laat verstrekte gegevens is SMV Advies niet aansprakelijk voor afwijkingen in het rapport, of voor vertraging, die daardoor ontstaan.',
      ],
    },
    {
      title: 'Wijzigingen in wet- en regelgeving',
      content: [
        'Berekeningen, adviezen en informatie over subsidies en fiscale regelingen zijn gebaseerd op de wet- en regelgeving en de overige informatie die gelden op het moment waarop ze worden opgesteld, tenzij schriftelijk anders overeengekomen.',
        'Wijzigingen in wet- en regelgeving, beleidsregels of subsidievoorwaarden na dat moment leiden niet automatisch tot aansprakelijkheid van SMV Advies.',
      ],
    },
    {
      title: 'Aansprakelijkheid',
      content: [
        'De aansprakelijkheid van SMV Advies voor schade voortvloeiend uit of verband houdend met de uitvoering van de opdracht is beperkt tot het bedrag dat in het desbetreffende geval daadwerkelijk door de beroeps- of bedrijfsaansprakelijkheidsverzekering van SMV Advies wordt uitgekeerd, vermeerderd met het onder die verzekering toepasselijke eigen risico.',
        'Indien en voor zover om welke reden dan ook geen uitkering krachtens die verzekering plaatsvindt, is de aansprakelijkheid van SMV Advies beperkt tot maximaal het bedrag van de voor de betreffende opdracht overeengekomen prijs (excl. btw), met een maximum van € 5.000.',
        'SMV Advies is niet aansprakelijk voor schade die voortvloeit uit de uitvoering van maatregelen door derde partijen, noch voor de kwaliteit, planning of nakoming van door de klant of via SMV Advies gecontracteerde derde partijen (zie ook het artikel Rol van SMV Advies).',
        'Voor zover rechtens toegestaan is SMV Advies niet aansprakelijk voor indirecte schade of gevolgschade, waaronder in ieder geval: gederfde winst, gemiste besparingen, gemiste subsidies of fiscale voordelen, bedrijfsstagnatie, productieverlies, reputatieschade, schade door het niet behalen van duurzaamheidsdoelen of een gewenst energielabel, en overige zuivere vermogensschade.',
        'De in dit artikel opgenomen beperkingen en uitsluitingen gelden niet voor zover schade het gevolg is van opzet of bewuste roekeloosheid van SMV Advies.',
        'Elke vordering tot schadevergoeding vervalt indien deze niet binnen 12 maanden nadat de klant de schade heeft ontdekt of redelijkerwijs had kunnen ontdekken, schriftelijk en gemotiveerd bij SMV Advies is ingediend.',
      ],
    },
    {
      title: 'Derden',
      content: [
        'Er wordt onderscheid gemaakt tussen: derde partijen die de klant zelf heeft ingeschakeld; derde partijen die via SMV Advies zijn benaderd (bijvoorbeeld voor een offerte); en de partij die daadwerkelijk contractspartij wordt voor de uitvoering.',
        'Het via SMV Advies benaderen of voordragen van een derde partij maakt SMV Advies geen partij bij de overeenkomst die de klant vervolgens met die derde sluit.',
        'Sluit de klant een overeenkomst met een installateur, aannemer of andere uitvoerende partij, dan blijft die partij zelf verantwoordelijk voor haar eigen prestaties, garanties en nakoming jegens de klant.',
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
        'Klachten over de dienstverlening dienen zo spoedig mogelijk, doch uiterlijk binnen 30 dagen nadat de klant het gebrek heeft ontdekt of redelijkerwijs had kunnen ontdekken, schriftelijk en gemotiveerd bij SMV Advies te worden ingediend.',
        'Een klacht schort de betalingsverplichting van de klant niet op.',
        'SMV Advies reageert binnen 14 dagen op een ingediende klacht en zal zich inspannen om in onderling overleg tot een oplossing te komen.',
        'Deze klachtregeling laat de vervaltermijn voor vorderingen tot schadevergoeding uit het artikel Aansprakelijkheid onverlet.',
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
