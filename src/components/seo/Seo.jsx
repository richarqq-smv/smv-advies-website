import { useEffect } from 'react'
import { setLastSeo } from './seoRegistry'
import { getOrganizationSchema, getWebsiteSchema } from '../../lib/structuredData'

const SITE_NAME = 'SMV Advies'

function setMetaByAttr(attr, key, content) {
  if (!content) return
  let tag = document.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

function setStructuredData(blocks) {
  document.querySelectorAll('script[data-seo-ld]').forEach((el) => el.remove())
  blocks.forEach((block) => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seoLd = 'true'
    script.textContent = JSON.stringify(block)
    document.head.appendChild(script)
  })
}

/**
 * Sets title, description, canonical, robots and basic Open Graph tags
 * for the current route. Lightweight foundation for a client-rendered
 * SPA; if the site later moves to SSR/SSG this can be swapped for real
 * per-route <head> rendering without changing how pages call it.
 *
 * `robots` is always set explicitly (not just when noindex is true) —
 * this is a client-side router, so a stale meta tag from a previous page
 * would otherwise leak into the next one.
 */
export function Seo({ title, description, noindex = false, structuredData = [] }) {
  // Organization + WebSite are the same on every page, so every caller
  // gets them for free; page-specific schema (breadcrumbs, FAQPage,
  // BlogPosting) comes in via the `structuredData` prop and is appended.
  const allStructuredData = [getOrganizationSchema(), getWebsiteSchema(), ...structuredData]
  setLastSeo({ title, description, noindex, structuredData: allStructuredData })

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`

    document.title = fullTitle

    setMetaByAttr('name', 'description', description)
    setMetaByAttr('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setMetaByAttr('property', 'og:title', fullTitle)
    setMetaByAttr('property', 'og:description', description)
    setMetaByAttr('property', 'og:type', 'website')
    setMetaByAttr('property', 'og:site_name', SITE_NAME)
    setMetaByAttr('property', 'og:url', canonicalUrl)
    setCanonical(canonicalUrl)
    setStructuredData([getOrganizationSchema(), getWebsiteSchema(), ...structuredData])
  }, [title, description, noindex, structuredData])

  return null
}
