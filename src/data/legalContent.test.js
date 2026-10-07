import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * legalContent.js importeert zelf `from './company'` zonder extensie (net
 * als packages.js/calculations.js elders in dit project) — onoplosbaar voor
 * de kale Node-testrunner (zelfde, herhaaldelijk aangetroffen beperking,
 * zie packages.test.js). Daarom hier dezelfde Broncontrole-methode: de
 * brontekst zelf controleren in plaats van de module te importeren.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))
const BRON = readFileSync(path.join(HIER, 'legalContent.js'), 'utf8')

function sectie(titel) {
  // Pakt de array-literal van één sectie: van `title: 'X'` tot aan de
  // volgende `{` die een nieuwe sectie opent (of het einde van de array).
  const match = BRON.match(new RegExp(`title: '${titel.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}',\\s*content: \\[([\\s\\S]*?)\\],\\s*\\},`))
  if (!match) throw new Error(`Sectie "${titel}" niet gevonden in de brontekst`)
  return match[1]
}

// --- Versiebeheer (Fase: AV-aanscherping) -----------------------------------

test('Privacy en Voorwaarden hebben elk hun eigen, losse "laatst bijgewerkt"-export', () => {
  assert.match(BRON, /export const PRIVACY_LAST_UPDATED = '[^']+'/)
  assert.match(BRON, /export const VOORWAARDEN_LAST_UPDATED = '[^']+'/)
})

test('VOORWAARDEN_CONTENT.intro gebruikt VOORWAARDEN_LAST_UPDATED als enige versiebron (geen los tweede, hardcoded datumgetal)', () => {
  assert.match(BRON, /Versie \$\{VOORWAARDEN_LAST_UPDATED\}/)
  // Geen oude, losse "Versie <maand> <jaar>"-tekst meer naast de constante.
  assert.equal(/Versie september 2026/.test(BRON), false)
})

test('PRIVACY_CONTENT.intro gebruikt PRIVACY_LAST_UPDATED, niet de Voorwaarden-datum', () => {
  assert.match(BRON, /Laatst bijgewerkt: \$\{PRIVACY_LAST_UPDATED\}/)
})

// --- K. Privacy: marketing/opvolgend contact & internationale doorgifte ----
// (Fase: Privacy-aanscherping, 2026-10-07)

test('Met welk doel en op welke rechtsgrondslag: directe aanvraagopvolging is duidelijk onderscheiden van direct marketing', () => {
  const tekst = sectie('Met welk doel en op welke rechtsgrondslag gegevens worden verwerkt')
  assert.match(tekst, /concrete aanvraag, offerteaanvraag of lopende klantrelatie rechtstreeks op te volgen/)
  assert.match(tekst, /geen algemene direct marketing/)
})

test('Met welk doel en op welke rechtsgrondslag: elektronische commerciële berichten vereisen voorafgaande toestemming (voor zover de wet dat vereist)', () => {
  const tekst = sectie('Met welk doel en op welke rechtsgrondslag gegevens worden verwerkt')
  assert.match(tekst, /elektronisch commercieel bericht/)
  assert.match(tekst, /alleen wanneer u daarvoor voorafgaand toestemming heeft gegeven/)
  assert.match(tekst, /voor zover de toepasselijke wetgeving die toestemming vereist/)
  assert.match(tekst, /te allen tijde intrekken/)
  assert.match(tekst, /laat de rechtmatigheid van de verwerking vóór de intrekking onverlet/)
  assert.match(tekst, /altijd het recht bezwaar te maken tegen verwerking van uw gegevens voor direct marketing/)
})

test('Geen van de privacy-secties claimt dat er al een marketing-opt-in-checkbox bestaat', () => {
  assert.equal(/checkbox/i.test(BRON), false)
  assert.equal(/opt-in/i.test(BRON), false)
  assert.equal(/aanvinken/i.test(BRON), false)
})

test('De rechten van betrokkenen: bezwaar tegen direct marketing blijft expliciet staan, plus het recht op intrekking van toestemming', () => {
  const tekst = sectie('De rechten van betrokkenen en hoe die uit te oefenen')
  assert.match(tekst, /bezwaar te maken tegen verwerking van uw gegevens voor direct marketing/)
  assert.match(tekst, /Recht om een gegeven toestemming/)
  assert.match(tekst, /te allen tijde in te trekken/)
})

test('Met wie gegevens eventueel worden gedeeld: bevat de internationale-doorgiftepassage met EER, AVG-waarborgen, SCC en EU-US Data Privacy Framework', () => {
  const tekst = sectie('Met wie gegevens eventueel worden gedeeld')
  assert.match(tekst, /Internationale doorgifte/)
  assert.match(tekst, /Europese Economische Ruimte \(EER\)/)
  assert.match(tekst, /passende waarborgen zoals vereist door de AVG/)
  assert.match(tekst, /Standard Contractual Clauses/)
  assert.match(tekst, /EU-US Data Privacy Framework/)
})

test('Privacy: geen KvK-wijziging door deze ronde (KVK_CLAUSE-logica ongewijzigd)', () => {
  assert.match(BRON, /const KVK_CLAUSE = COMPANY\.kvk \? `, ingeschreven bij de Kamer van Koophandel onder nummer \$\{COMPANY\.kvk\}` : ''/)
})

// --- A. Rol van SMV Advies ---------------------------------------------------

test('Rol van SMV Advies: maakt ondubbelzinnig duidelijk dat SMV Advies geen aannemer/installateur/uitvoerend bouwbedrijf is', () => {
  const tekst = sectie('Rol van SMV Advies')
  assert.match(tekst, /geen aannemer, installateur of uitvoerend bouwbedrijf/)
})

test('Rol van SMV Advies: somt de niet-verantwoordelijkheden op', () => {
  const tekst = sectie('Rol van SMV Advies')
  ;['daadwerkelijke uitvoering', 'bouwkundige of installatietechnische kwaliteit', 'constructieve veiligheid', 'wettelijke voorschriften', 'planning, levertijd', 'garanties van leveranciers', 'gebreken in producten'].forEach((deel) => {
    assert.match(tekst, new RegExp(deel), `verwacht "${deel}" in Rol van SMV Advies`)
  })
})

test('Rol van SMV Advies: contact namens/samen met klant maakt SMV Advies geen uitvoerende partij en neemt geen aansprakelijkheid over', () => {
  const tekst = sectie('Rol van SMV Advies')
  assert.match(tekst, /niet tot uitvoerende partij/)
  assert.match(tekst, /neemt SMV Advies daarmee niet de aansprakelijkheid van die derde partij over/)
})

// --- B. Gold-pakket / begeleiding / oplevering ------------------------------

test('Uitvoering van de opdracht: beschrijft de Gold-begeleiding', () => {
  const tekst = sectie('Uitvoering van de opdracht')
  ;['opvragen van offertes', 'vergelijken van offertes', 'op hoofdlijnen inhoudelijk beoordelen', 'contactmomenten', 'kickoffgesprek', 'oplevercheck'].forEach((deel) => {
    assert.match(tekst, new RegExp(deel), `verwacht "${deel}" in Uitvoering van de opdracht`)
  })
})

test('Uitvoering van de opdracht: expliciet geen keuring/inspectie/toezicht/garantie/vrijwaring/aansprakelijkheidsovername', () => {
  const tekst = sectie('Uitvoering van de opdracht')
  ;['geen technische keuring', 'geen bouwkundige inspectie', 'geen constructieve inspectie', 'geen installatietechnische keuring', 'geen toezicht op de uitvoering', 'geen garantie op de uitvoeringskwaliteit', 'geen vrijwaring van de uitvoerende partij', 'niet de aansprakelijkheid van de aannemer'].forEach((deel) => {
    assert.match(tekst, new RegExp(deel), `verwacht "${deel}" in Uitvoering van de opdracht`)
  })
  assert.match(tekst, /uitvoerende partij blijft zelf volledig verantwoordelijk/)
})

// --- C. Subsidies en fiscale regelingen -------------------------------------

test('Subsidies en fiscale regelingen: noemt EIA/ISDE/MIA/Vamil en geeft geen garantie op toekenning', () => {
  const tekst = sectie('Subsidies en fiscale regelingen')
  ;['EIA', 'ISDE', 'MIA', 'Vamil'].forEach((regeling) => assert.match(tekst, new RegExp(regeling)))
  assert.match(tekst, /geen garantie dat een subsidie of fiscale faciliteit wordt toegekend/)
  assert.match(tekst, /niet verantwoordelijk voor wijzigingen in wet- en regelgeving/)
  assert.match(tekst, /afwijzing, vertraging of vermindering van een aanvraag door RVO/)
})

test('Subsidies en fiscale regelingen: klant blijft verantwoordelijk, tenzij SMV Advies een concrete handeling schriftelijk op zich neemt', () => {
  const tekst = sectie('Subsidies en fiscale regelingen')
  assert.match(tekst, /klant blijft verantwoordelijk voor het tijdig aanleveren/)
  assert.match(tekst, /tenzij SMV Advies een concrete administratieve handeling/)
  assert.match(tekst, /schriftelijk op zich heeft genomen/)
})

// --- D. Berekeningen en prognoses -------------------------------------------

test('Berekeningen en prognoses: somt alle genoemde grootheden op en stelt dat ze indicatief zijn, geen garantie op resultaat', () => {
  const tekst = sectie('Berekeningen en prognoses')
  ;['investeringsbedragen', 'besparingen', 'energieverbruiken', 'terugverdientijden', 'rendementen', 'toekomstige energiekosten', 'energielabels'].forEach((deel) => {
    assert.match(tekst, new RegExp(deel), `verwacht "${deel}" in Berekeningen en prognoses`)
  })
  assert.match(tekst, /geen garantie op een bepaald financieel of energetisch resultaat/)
})

test('Berekeningen en prognoses: onderscheidt brongegevens, afgeleide gegevens en aannames/prognoses', () => {
  const tekst = sectie('Berekeningen en prognoses')
  assert.match(tekst, /brongegevens/)
  assert.match(tekst, /berekende of afgeleide gegevens/)
  assert.match(tekst, /aannames of prognoses/)
})

// --- E. Klantgegevens --------------------------------------------------------

test('Verplichtingen van de klant: SMV Advies mag uitgaan van juistheid tenzij duidelijke aanleiding tot twijfel', () => {
  const tekst = sectie('Verplichtingen van de klant')
  assert.match(tekst, /mag uitgaan van de juistheid en volledigheid/)
  assert.match(tekst, /tenzij er een duidelijke aanleiding bestaat om daaraan te twijfelen/)
})

// --- F. Aansprakelijkheid ----------------------------------------------------

test('Aansprakelijkheid: dekt de volledige, gevraagde schadelijst', () => {
  const tekst = sectie('Aansprakelijkheid')
  ;['gederfde winst', 'gemiste besparingen', 'gemiste subsidies of fiscale voordelen', 'bedrijfsstagnatie', 'productieverlies', 'reputatieschade', 'duurzaamheidsdoelen', 'energielabel', 'zuivere vermogensschade'].forEach((deel) => {
    assert.match(tekst, new RegExp(deel), `verwacht "${deel}" in Aansprakelijkheid`)
  })
})

test('Aansprakelijkheid: behoudt de verzekeringsclausule, het maximumbedrag en de opzet/bewuste-roekeloosheid-uitsluiting', () => {
  const tekst = sectie('Aansprakelijkheid')
  assert.match(tekst, /beroeps- of bedrijfsaansprakelijkheidsverzekering/)
  assert.match(tekst, /€ 5\.000/)
  assert.match(tekst, /gelden niet voor zover schade het gevolg is van opzet of bewuste roekeloosheid/)
})

test('Aansprakelijkheid: vervaltermijn van 12 maanden na (redelijkerwijs kunnen) ontdekken, schriftelijk en gemotiveerd', () => {
  const tekst = sectie('Aansprakelijkheid')
  assert.match(tekst, /12 maanden/)
  assert.match(tekst, /ontdekt of redelijkerwijs had kunnen ontdekken/)
  assert.match(tekst, /schriftelijk en gemotiveerd/)
})

// --- G. Klachten en vervaltermijn -------------------------------------------

test('Klachtenregeling: meldtermijn gekoppeld aan ontdekking, schriftelijk/gemotiveerd, en laat de vervaltermijn uit Aansprakelijkheid expliciet onverlet', () => {
  const tekst = sectie('Klachtenregeling')
  assert.match(tekst, /ontdekt of redelijkerwijs had kunnen ontdekken/)
  assert.match(tekst, /schriftelijk en gemotiveerd/)
  assert.match(tekst, /laat de vervaltermijn voor vorderingen tot schadevergoeding uit het artikel Aansprakelijkheid onverlet/)
})

// --- H. Derden ---------------------------------------------------------------

test('Derden: onderscheidt klant-ingeschakelde derden, via SMV benaderde derden en de daadwerkelijke contractspartij', () => {
  const tekst = sectie('Derden')
  assert.match(tekst, /klant zelf heeft ingeschakeld/)
  assert.match(tekst, /via SMV Advies zijn benaderd/)
  assert.match(tekst, /blijft die partij zelf verantwoordelijk voor haar eigen prestaties/)
})

// --- I. Wijzigingen wet- en regelgeving --------------------------------------

test('Wijzigingen in wet- en regelgeving: baseert op het moment van opstellen, geen automatische aansprakelijkheid bij latere wijziging', () => {
  const tekst = sectie('Wijzigingen in wet- en regelgeving')
  assert.match(tekst, /gelden op het moment waarop ze worden opgesteld/)
  assert.match(tekst, /leiden niet automatisch tot aansprakelijkheid van SMV Advies/)
})

// --- J. Scope en meerwerk -----------------------------------------------------

test('Scope en meerwerk: alleen overeengekomen werk, Gold-scope, meerwerk vooraf afgestemd — zonder cijfers te dupliceren uit packages.js', () => {
  const tekst = sectie('Scope en meerwerk')
  assert.match(tekst, /Alleen de werkzaamheden die partijen/)
  assert.match(tekst, /Gold Pakket/)
  assert.match(tekst, /zijn meerwerk/)
  assert.match(tekst, /vooraf met de klant afgestemd/)
  // Geen bron-van-waarheid-duplicatie: geen hardcoded aantallen/bedragen die
  // elders (packages.js/offerte.js) al bestaan en hier kunnen gaan afwijken.
  assert.equal(/€\s?\d|maximaal \d|max\. \d/.test(tekst), false)
})

// --- Projectbrede red-flag-check op beide juridische teksten ----------------

const RISICOVOLLE_FRASEN = [
  /wij regelen uw subsidie/i,
  /wij zorgen dat/i,
  /wij keuren/i,
  /gegarandeerde besparing/i,
  /gegarandeerd rendement/i,
  /gegarandeerde terugverdientijd/i,
  /wij zijn verantwoordelijk voor de uitvoering/i,
  /wij voeren uit/i,
  /wij controleren de kwaliteit/i,
  /wij zorgen voor het energielabel/i,
]

test('De volledige legalContent.js-brontekst bevat geen van de projectbreed verboden risicovolle formuleringen', () => {
  RISICOVOLLE_FRASEN.forEach((regex) => {
    assert.equal(regex.test(BRON), false, `onverwachte risicovolle formulering gevonden: ${regex}`)
  })
})

test('Geen van de 19 Voorwaarden-secties staat nog als "Nog aan te leveren" (elke content-array heeft tekst)', () => {
  const titels = [
    'Definities', 'Toepasselijkheid', 'Rol van SMV Advies', 'Offertes en totstandkoming van de overeenkomst',
    'Prijzen en betaling', 'Scope en meerwerk', 'Uitvoering van de opdracht', 'Berekeningen en prognoses',
    'Subsidies en fiscale regelingen', 'Verplichtingen van de klant', 'Wijzigingen in wet- en regelgeving',
    'Aansprakelijkheid', 'Derden', 'Intellectueel eigendom van rapportages', 'Geheimhouding', 'Klachtenregeling',
    'Overmacht', 'Beëindiging', 'Toepasselijk recht en geschillenregeling',
  ]
  titels.forEach((titel) => {
    const tekst = sectie(titel)
    assert.ok(tekst.trim().length > 0, `sectie "${titel}" lijkt leeg`)
  })
})
