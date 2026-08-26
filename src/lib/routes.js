/**
 * Single source of truth for route paths. Import ROUTES instead of
 * hardcoding path strings so navigation, links and <Route> definitions
 * never drift out of sync.
 */
export const ROUTES = {
  home: '/',
  pakketten: '/pakketten',
  energieIndicatie: '/energie-indicatie',
  over: '/over',
  werkwijze: '/werkwijze',
  cases: '/cases',
  blog: '/blog',
  blogPost: (slug) => `/blog/${slug}`,
  faq: '/faq',
  contact: '/contact',
  privacy: '/privacy',
  voorwaarden: '/voorwaarden',
}
