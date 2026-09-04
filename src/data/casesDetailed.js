import { ROUTES } from '../lib/routes.js'

/**
 * Full case content, carried over verbatim from the client's existing
 * published cases (verified during the site analysis), not invented here.
 *
 * `relatedArticles` is the one addition on top of that verbatim content:
 * links to the existing blog articles covering measures this case
 * actually names in `na`/`resultaat` — added editorially, not part of
 * the client's original case text.
 */
export const CASES_DETAILED = [
  {
    id: 'kantoorpand-oud-beijerland',
    package: 'Premium',
    sector: 'Kantoor / diensten',
    location: 'Oud-Beijerland',
    title: 'Kantoorpand Oud-Beijerland',
    description:
      'Een kantoorpand uit 1986 met nauwelijks isolatie. We brachten de kansen in kaart en faseerden de maatregelen.',
    relatedArticles: [
      { label: 'Dakisolatie', to: ROUTES.blogPost('dakisolatie-voor-uw-bedrijfspand') },
      { label: 'De warmtepomp in het mkb', to: ROUTES.blogPost('warmtepomp-in-het-mkb') },
      { label: 'Zonnepanelen op uw bedrijfspand', to: ROUTES.blogPost('zonnepanelen-op-uw-bedrijfspand') },
    ],
    voor: [
      'Energielabel G',
      'Dakisolatie afwezig',
      'Enkel glas / verouderde HR++',
      'Gasgestookte cv-ketel (1998)',
      'Jaarlijkse energielasten: € 18.500',
    ],
    na: [
      'Energielabel B richting A',
      'Dakisolatie + spouwisolatie',
      'HR++ glas vervangen door triple',
      'Hybride warmtepomp + zonnepanelen',
      'Verwachte besparing: 58% op de energierekening',
    ],
    resultaat: 'Verwachte besparing van € 10.700 per jaar. Terugverdientijd met subsidies onder de 7 jaar.',
    imageLabel: 'Foto: kantoorpand Oud-Beijerland (voor/na) - nog te plaatsen',
  },
  {
    id: 'metaalbewerking-hoeksche-waard',
    package: 'Gold',
    sector: 'Industrie / productie',
    location: 'Hoeksche Waard',
    title: 'Metaalbewerkingsbedrijf Hoeksche Waard',
    description: 'Een bedrijfspand met hoge warmtevraag door productie. Volledige begeleiding van A tot Z.',
    relatedArticles: [
      { label: 'Zonnepanelen op uw bedrijfspand', to: ROUTES.blogPost('zonnepanelen-op-uw-bedrijfspand') },
      { label: 'EIA, ISDE en SDE++', to: ROUTES.blogPost('eia-isde-sde-subsidies') },
    ],
    voor: [
      'Hoge gasrekening door verwarmde hal',
      'Verouderde luchtverwarming',
      'Geen zonnepanelen',
      'Veel warmteverlies via poorten',
    ],
    na: [
      'Infraroodverwarming gericht op werkplekken',
      'Zonnepanelen op dakhelft',
      'Poortdoeken & snelsluitende poorten',
      'Subsidie ISDE aangevraagd en toegekend',
    ],
    resultaat: 'Begeleiding bij 3 offertes, keuze voor lokale installateur. Gasverbruik gehalveerd.',
    imageLabel: 'Foto: metaalbewerkingsbedrijf Hoeksche Waard (voor/na) - nog te plaatsen',
  },
  {
    id: 'winkel-showroompand',
    package: 'Basis',
    sector: 'Retail',
    location: 'Oud-Beijerland e.o.',
    title: 'Winkel- en showroompand',
    description: 'Een eigenaar die wilde weten waar hij het beste kon starten. De QuickScan gaf direct richting.',
    relatedArticles: [
      { label: 'LED-verlichting: de snelste verduurzamingsstap', to: ROUTES.blogPost('led-verlichting-snelste-stap') },
      { label: 'Zonnepanelen op uw bedrijfspand', to: ROUTES.blogPost('zonnepanelen-op-uw-bedrijfspand') },
    ],
    voor: ['Onbekend energieverbruik per functie', 'Verouderde verlichting (TL)', 'Hete showroom in de zomer'],
    na: [
      'LED-verlichting met aanwezigheidsdetectie',
      'Advies zonnepanelen op het platte dak',
      'Prioritering voor 2 jaar',
    ],
    resultaat: 'Snelle winst met LED: 35% lagere lichtrekening. Duidelijk pad voor vervolgstappen.',
    imageLabel: 'Foto: winkel- en showroompand (voor/na) - nog te plaatsen',
  },
]
