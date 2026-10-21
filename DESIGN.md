# DESIGN.md — SMV Advies

Ontwerpkader voor de publieke website van SMV Advies (Steen en Mortel Verbetering), opgezet in de
indeling van [awesome-design-md](https://github.com/VoltAgent/awesome-design-md). Bron van waarheid
voor de waarden hieronder is `src/index.css` (`@theme`); dit document legt uit *hoe* ze gebruikt
worden. Bij een tegenstrijdigheid wint de code; werk dan dit document bij.

## Overview

Onafhankelijk verduurzamings- en bouwkundig advies voor mkb-bedrijfspanden in de Hoeksche Waard.
De site moet lezen als een deskundig adviesbureau: rustig, concreet, eerlijk over wat wel en niet
geleverd wordt. Geen hype, geen template-uitstraling. Eén dominant element per scherm, links
uitgelijnd, volle inkt voor lopende tekst, en ruimte in plaats van lijntjes en kaartjes.

Modus per oppervlak (naar impeccable): de marketingpagina's zijn **Persuade**, blog/FAQ/juridisch
zijn **Read**, de energie-indicatie en de klant-/adminomgeving zijn **Operate**.

## Colors

### Brand & Accent
| Token | Waarde | Gebruik |
| --- | --- | --- |
| `--color-primary` | `#16293a` | Navy. Koppen, inkt op lichte vlakken, footer, uitgelicht pakket. |
| `--color-secondary` | `#2c4a63` | Toonstap van navy: afsluitende CTA-band boven de footer, hover op navy knoppen. |
| `--color-accent` | `#8a681c` | Goud. Primaire knop, actieve navigatie, links. 5.15:1 op wit (WCAG AA). |
| `--color-accent-dark` | `#6e5216` | Hover van de primaire knop. |
| `--color-accent-light` | `#c79d55` | Goud *op navy* (5.93:1). Nooit op wit. |

Het accent verschijnt op de actie en hooguit één detail per scherm. Geen nieuwe tinten, geen
gradients, geen glow.

### Surface
`--color-background` `#ffffff` (grond) en `--color-muted` `#f1f4f6` (toonstap). Secties wisselen wit
en muted af; twee gelijke tonen direct onder elkaar krijgen geen dubbele padding (`noTopPadding`).
Kaarten/blokken worden gedefinieerd door hun vlak (muted op wit, wit op muted), niet door een rand.

### Text
`--color-foreground` `#1a1a1a` voor alle lopende tekst. `--color-foreground-muted` `#52606d` alleen
voor secundaire notities (prijsvoetnoot, duur, adresregel). Op navy: wit, met `white/80` voor
secundair.

### Hairlines & Borders
Alleen in echte tabellen, formuliervelden, de outline-knop en overlays (menu, cookiebanner). Geen
scheidingslijnen tussen secties of boven lijstitems.

## Typography

### Font Family
Fraunces Variable (koppen, `--font-heading`) en Inter Variable (tekst, `--font-body`), beide
self-hosted via `@fontsource-variable`. Geen derde letter.

### Hierarchy
| Rol | Grootte | Zetting |
| --- | --- | --- |
| Display (home-H1) | 36 → 48 → 80px | Fraunces 500, leading 1.05, tracking -0.025em, max. twee regels op desktop |
| Paginatitel (PageHero-H1) | 36 → 48px | Fraunces 500, leading 1.08, tracking -0.02em |
| Sectiekop (H2) | 30 → 36px (48px voor een statement) | Fraunces 500 |
| Tussenkop (H3) | 24px | Fraunces 500 |
| Lead | 18–20px | Inter, leading 1.6 |
| Body | 16px | Inter, leading 1.6, max. 60–70 tekens per regel |
| Klein | 14px | Inter; niets dat gelezen moet worden onder 14px |

### Principles
- Geen eyebrows: geen klein (goud) label in hoofdletters boven een kop. Informatie hoort in de kop
  of in de eerste zin.
- Geen hoofdletterlabels met letterspatiëring, geen monospace, geen 01/02/03-nummering. Volgorde via
  een echte `<ol>` of via positie.
- Eén lettertype per kop (geen cursief/gekleurd accentwoord).
- Typografische tekens: “ ” in plaats van " ", … in plaats van ..., `&shy;` bij lange samenstellingen
  in koppen.

## Layout

### Grid & Container
`Container` (max. 1200px, 16/24/32px marge) met een 12-koloms grid. Eén paar buitenmarges; alle
secties delen dezelfde linkerrand. Splits: kop 5 kolommen, inhoud 7.

### Spacing
`Section`: 64 / 80 / 112px verticaal. Ruimte tussen secties is altijd groter dan binnen een sectie.

### Whitespace
Ruimte vervangt lijnen en kaarten. Eén bewuste rustplek per pagina; geen half scherm leegte naast
een smalle kolom.

## Elevation & Depth
Geen schaduw op elementen in rust. Schaduw alleen op wat echt zweeft: vaste header, mobiele
actiebalk, contactknop, menu's, dialogen.

## Shapes
Radiusschaal in `src/index.css`: `sm` focusring, `md` knoppen/velden, `lg`/`xl` vlakken. Foto's
recht (geen ronde hoeken, geen rand).

## Components
- **Header**: logo, navigatie, telefoonnummer, één actie (Contact). Lichte schaduw, geen rand.
- **Buttons**: `primary` (goud), `secondary` (navy), `outline`, `ghost`. Eén primaire actie per scherm.
- **PricingCard**: vlak in toon (muted; aanbevolen = navy), naam als kop, prijs als dominant getal
  (`tabular-nums`), "Aanbevolen" als tekst in de kaart, geen badge erboven.
- **PageHero**: H1, optionele contextregel direct eronder, beschrijving. Geen label boven de H1.
- **Footer**: navy; kolomkoppen in zinsopbouw (Inter, 16px, semibold). Gescheiden van de CTA-band
  door een toonstap (`secondary` → `primary`), niet door een lijn.

## Motion
`Reveal`: alleen opacity, 500ms, `--ease-default`, en uitsluitend voor content die bij het laden
nog onder de vouw staat (content is standaard zichtbaar, ook zonder JS). UI-overgangen 150–250ms.
`prefers-reduced-motion` wordt sitebreed gerespecteerd (`src/index.css`).

## Imagery
Nu één eigen foto (hero) en een portret. Doel: vier tot acht echte foto's van het werk zelf
(opnames op locatie, details van gevels/daken/installaties, de Hoeksche Waard). Nooit stockfoto's
die als eigen werk gepresenteerd worden; nooit gegenereerde "projecten".

## Do's and Don'ts

### Do
- Begin bij de inhoud: wat moet de bezoeker hier weten of doen?
- Lopende tekst in volle inkt, 16px of groter.
- Controleer elke wijziging met `taste-skill` (`lint.mjs` + `inspect.mjs`) en de pro-design-
  verificatieronde (1440 en 390px).

### Don't
- Geen eyebrows, micro-labels, 01/02/03, icoon-boven-kaart-rijen, gradients, glas, glow.
- Geen gecentreerde blokken als standaard (één gecentreerd moment per pagina: het citaat).
- Geen verzonnen klantlogo's, reviews, cijfers of cases.
