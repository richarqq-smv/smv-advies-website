/**
 * Condensed for the homepage. Figures are the client's existing published
 * results (carried over from the current live site), not invented here.
 *
 * `imageLabel` is shown to every visitor via `ImagePlaceholder` (it's both
 * the visible caption and the a11y label) — it deliberately just names the
 * subject, with no "nog te plaatsen"/"volgt nog" production-status wording,
 * so the placeholder reads as a considered design choice rather than an
 * unfinished page. Real photography is still needed for all three cases
 * (see docs/COMMERCIAL-REVIEW.md for the detailed shot list) — swap
 * `<ImagePlaceholder>` for a real `<img>` once it's available.
 */
export const CASES = [
  {
    id: 'kantoorpand-oud-beijerland',
    package: 'Premium',
    sector: 'Kantoor / diensten',
    location: 'Oud-Beijerland',
    title: 'Kantoorpand Oud-Beijerland',
    description:
      'Een kantoorpand uit 1986 met nauwelijks isolatie. We brachten de kansen in kaart en faseerden de maatregelen.',
    highlights: ['Energielabel G naar B, richting A', 'Dakisolatie, spouwisolatie en triple glas'],
    result: '58% verwachte besparing op de energierekening',
    imageLabel: 'Kantoorpand Oud-Beijerland — voor en na verduurzaming',
  },
  {
    id: 'metaalbewerking-hoeksche-waard',
    package: 'Gold',
    sector: 'Industrie / productie',
    location: 'Hoeksche Waard',
    title: 'Metaalbewerkingsbedrijf',
    description:
      'Een bedrijfspand met hoge warmtevraag door productie. Volledige begeleiding van A tot Z.',
    highlights: ['Infraroodverwarming op werkplekken', 'Zonnepanelen en snelsluitende poorten'],
    result: 'Gasverbruik gehalveerd',
    imageLabel: 'Metaalbewerkingsbedrijf Hoeksche Waard — voor en na verduurzaming',
  },
  {
    id: 'winkel-showroompand',
    package: 'Basis',
    sector: 'Retail',
    location: 'Oud-Beijerland e.o.',
    title: 'Winkel- en showroompand',
    description:
      'Een eigenaar die wilde weten waar hij het beste kon starten. De QuickScan gaf direct richting.',
    highlights: ['LED-verlichting met aanwezigheidsdetectie', 'Advies zonnepanelen op het platte dak'],
    result: '35% lagere lichtrekening',
    imageLabel: 'Winkel- en showroompand — voor en na verduurzaming',
  },
]
