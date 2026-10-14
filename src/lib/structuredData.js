import { COMPANY } from '../data/company.js'
import { ROUTES } from './routes.js'

/**
 * JSON-LD builders. Every value comes from data already published on the
 * site (COMPANY, FAQ_CATEGORIES, blog post fields) — nothing here is
 * invented, so there are no ratings, reviews or certifications to add
 * until the business actually has them.
 */
const SITE_ORIGIN = 'https://smv-advies.nl'

function toUrl(path) {
  return `${SITE_ORIGIN}${path}`
}

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: COMPANY.name,
    alternateName: COMPANY.legalName,
    url: toUrl(ROUTES.home),
    image: toUrl('/logo.png'),
    telephone: COMPANY.phoneHref.replace('tel:', ''),
    email: COMPANY.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.address.street,
      postalCode: COMPANY.address.postalCode,
      addressLocality: COMPANY.address.city,
      addressCountry: 'NL',
    },
    areaServed: {
      '@type': 'Place',
      name: COMPANY.region,
    },
    description: 'Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in de Hoeksche Waard.',
  }
}

export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: COMPANY.name,
    url: toUrl(ROUTES.home),
  }
}

/**
 * `trail` is the list of crumbs after Home, e.g. [{ name: 'Pakketten', path: ROUTES.pakketten }].
 */
export function getBreadcrumbSchema(trail) {
  const items = [{ name: 'Home', path: ROUTES.home }, ...trail]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toUrl(item.path),
    })),
  }
}

export function getFaqSchema(categories) {
  const items = categories.flatMap((group) => group.items)
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

/**
 * Eén Service-schema per pakket uit PACKAGES (src/data/packages.js) —
 * uitsluitend velden die al op de Pakketten-pagina zelf zichtbaar zijn
 * (naam, omschrijving, startprijs uit de eerste priceTier). Geen aparte
 * Product-markup: dit zijn adviesdiensten, geen fysieke producten.
 */
export function getServiceSchema(packages) {
  return packages.map((pkg) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: `${pkg.name} verduurzamingsadvies`,
    name: `${pkg.name} verduurzamingsadvies voor bedrijfspanden`,
    description: pkg.description,
    provider: {
      '@type': 'ProfessionalService',
      name: COMPANY.name,
      url: toUrl(ROUTES.home),
    },
    areaServed: {
      '@type': 'Place',
      name: COMPANY.region,
    },
    url: toUrl(ROUTES.pakketAnchor(pkg.id)),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: pkg.priceTiers?.[0]?.prijs,
      description: pkg.priceNote,
    },
  }))
}

export function getBlogPostingSchema(post) {
  const url = toUrl(ROUTES.blogPost(post.slug))
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.isoDate,
    url,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: COMPANY.name },
    publisher: {
      '@type': 'Organization',
      name: COMPANY.name,
      logo: { '@type': 'ImageObject', url: toUrl('/logo.png') },
    },
  }
}
