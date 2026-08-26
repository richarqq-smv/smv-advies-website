/**
 * Titles, excerpts, categories, dates and read times are carried over
 * verbatim from the client's existing published blog overview (verified
 * during the site analysis). Full article bodies were not available on
 * the live site during that research and are NOT invented here — see
 * `bodyAvailable` below, checked by the blog detail page.
 */
export const BLOG_POSTS = [
  {
    slug: 'dakisolatie-voor-uw-bedrijfspand',
    category: 'Isolatie',
    title: 'Dakisolatie voor uw bedrijfspand: waar het echt verschil maakt',
    excerpt:
      'Het dak is vaak de grootste warmteverliezer van een bedrijfspand. Hoe u kansen herkent, wat het oplevert en waar u op moet letten.',
    date: '18 juli 2026',
    readTime: '6 min',
    bodyAvailable: false,
  },
  {
    slug: 'eia-isde-sde-subsidies',
    category: 'Subsidies',
    title: 'EIA, ISDE en SDE++: welke subsidie past bij uw verduurzaming?',
    excerpt:
      'Subsidies kunnen de terugverdientijd van maatregelen fors verkorten. Een overzicht van de belangrijkste regelingen en wanneer ze van toepassing zijn.',
    date: '4 juli 2026',
    readTime: '7 min',
    bodyAvailable: false,
  },
  {
    slug: 'warmtepomp-in-het-mkb',
    category: 'Installaties',
    title: 'De warmtepomp in het mkb: wanneer is het de juiste stap?',
    excerpt:
      'Een warmtepomp is duurzaam, maar alleen slim als uw pand er klaar voor is. Lees wanneer het werkt en wat u vooraf moet regelen.',
    date: '20 juni 2026',
    readTime: '6 min',
    bodyAvailable: false,
  },
  {
    slug: 'led-verlichting-snelste-stap',
    category: 'Efficiëntie',
    title: 'LED-verlichting: de snelste verduurzamingsstap die er is',
    excerpt: 'Verlichting is zichtbaar, meetbaar en snel terug te verdienen. Waarom LED voor veel bedrijven de ideale eerste stap is.',
    date: '5 juni 2026',
    readTime: '4 min',
    bodyAvailable: false,
  },
  {
    slug: 'verborgen-energieverspillers',
    category: 'Inzicht',
    title: 'Verborgen energieverspillers in uw bedrijfspand',
    excerpt: 'Soms zijn het de onopvallende dingen die jaarlijks veel kosten. Vijf verspillers die in een QuickScan vaak boven water komen.',
    date: '22 mei 2026',
    readTime: '5 min',
    bodyAvailable: false,
  },
]

export function getBlogPostBySlug(slug) {
  return BLOG_POSTS.find((post) => post.slug === slug)
}
