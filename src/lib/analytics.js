/**
 * Google Analytics (GA4) loader, gated on cookie consent.
 *
 * loadAnalytics() is only ever called from CookieBanner after consent is
 * either already stored as 'accepted' or just given — the gtag.js script
 * is never injected before that, so no measurement happens pre-consent.
 *
 * Consent Mode v2's 'default' (denied baseline) is declared unconditionally
 * in index.html, on every page load, before this ever runs — see the inline
 * script in <head>. This only ever needs to send the 'update' grant, since
 * this site uses GA4 only (no Ads/remarketing).
 */
export const GA_MEASUREMENT_ID = 'G-CE0DFH59Z9'

let loaded = false

export function loadAnalytics() {
  if (loaded || !GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.startsWith('REPLACE_WITH_')) return
  loaded = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(...args) {
    window.dataLayer.push(args)
  }
  window.gtag = gtag

  gtag('consent', 'update', { analytics_storage: 'granted' })

  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
}
