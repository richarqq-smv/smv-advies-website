/**
 * Google Analytics (GA4) loader, gated on cookie consent.
 *
 * GA_MEASUREMENT_ID is deliberately a placeholder — the client will
 * create the real GA4 property and provide the ID once the site is live.
 * loadAnalytics() no-ops until it's replaced, so no script is ever
 * injected and no ID (fake or otherwise) is ever sent anywhere.
 */
export const GA_MEASUREMENT_ID = 'REPLACE_WITH_GA_MEASUREMENT_ID'

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
