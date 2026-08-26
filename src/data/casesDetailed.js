/**
 * Full case content, carried over verbatim from the client's existing
 * published cases (verified during the site analysis), not invented here.
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
