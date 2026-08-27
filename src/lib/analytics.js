/**
 * Google Analytics (GA4) loader, gated on cookie consent.
 *
 * loadAnalytics() is only ever called from CookieBanner after consent is
 * either already stored as 'accepted' or just given — the gtag.js script
 * is never injected before that, so no measurement happens pre-consent.
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
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
}
