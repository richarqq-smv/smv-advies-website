# Benodigde content van de ondernemer

Praktisch overzicht van wat er nog aangeleverd moet worden, en waar het terechtkomt op de site. Niets hieruit is verzonnen of al ingevuld — dit zijn openstaande punten.

## 1. Bedrijfsgegevens

- **KvK-nummer** — vult zich automatisch overal in zodra bekend (`src/data/company.js`, `kvk: null`). Niet eerder invullen dan het daadwerkelijke nummer.
- Eventuele wijzigingen in telefoonnummer/e-mail/adres — de huidige gegevens in `src/data/company.js` zijn de daadwerkelijke, actuele gegevens; alleen aanpassen als deze veranderen.

## 2. Founder-/portretfoto

**Benodigd**: 1 horizontale foto, 1 portretfoto. Natuurlijke setting (bijv. bij een bedrijfspand of op locatie), geen studio-look verplicht.
**Gebruikt op**: homepage-hero (`Hero.jsx`), `/over` (`Over.jsx`).
**Huidige status**: `ImagePlaceholder`-component, geen echte foto.

## 3. Bedrijfspandfoto voor de hero

**Benodigd**: 1 foto van een representatief bedrijfspand in de Hoeksche Waard (kantoor/hal/winkel), goed belicht, bij voorkeur buitenaanzicht.
**Formaat**: minimaal 1600px breed, zowel een breed (4:3) als staand (3:4) beeldvlak bruikbaar — lever bij voorkeur één foto met voldoende resolutie om beide crops eruit te halen.
**Gebruikt op**: homepage-hero (`Hero.jsx`).

## 4. Inspectiefoto's

**Benodigd**: foto's tijdens een daadwerkelijke inspectie — meterkast, technische ruimte, dak, isolatie, installaties, bedrijfshal. Authentiek, geen stockbeelden.
**Gebruikt op**: `/werkwijze`, mogelijk `/over`, toekomstige cases.

## 5. Eerste praktijkcase

Zodra een adviestraject is afgerond en gepubliceerd mag worden: volg `CASE_TEMPLATE.md` voor de intake, en `REVIEW_TEMPLATE.md` als de klant ook een testimonial wil geven. Pas dan wordt `/cases` uitgebreid met een geverifieerde praktijkcase.

## 6. Alt-tekststrategie

Zodra echte foto's beschikbaar zijn: de bestaande `imageLabel`/`label`-teksten in de code (bijv. "Bedrijfspand in de Hoeksche Waard") zijn al geschikt als `alt`-tekst — geen aparte alt-tekst-exercitie nodig.

## 7. Google Business Profile (na livegang)

Zodra het bedrijf formeel gestart is: NAP (naam/adres/telefoon) consistent houden tussen website en Google Business Profile, juiste categorie kiezen, en pas dán reviews laten binnenkomen — nooit reviews verzinnen of vragen om nep-reviews.

## 8. Voorbeeldrapport (potentiële lead magnet)

Een "voorbeeld verduurzamingsadvies" als download zou een sterke lead magnet kunnen zijn (zie `WEBSITE_STRATEGY.md`), maar bestaat nog niet. Pas bouwen/aanbieden zodra een echt (geanonimiseerd, met toestemming) voorbeeldrapport beschikbaar is.
