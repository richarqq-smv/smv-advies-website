/**
 * Google Analytics (GA4) loader, gated on cookie consent.
 *
 * loadAnalytics() is only ever called from CookieBanner after consent is
 * either already stored as 'accepted' or just given — the gtag.js script
 * is never injected before that, so no measurement happens pre-consent.
 *
 * Google's tag applies its own default-denied consent state for EEA traffic
 * unless it receives an explicit Consent Mode v2 signal, regardless of
 * whether the tag was loaded after our own consent gate — so the consent
 * commands below are required for GA4 to actually send hits, not optional.
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

  // Consent Mode v2. loadAnalytics() only runs once the visitor has
  // accepted analytics cookies, so: full denied baseline, then immediately
  // grant analytics_storage. This site uses GA4 only (no Ads/remarketing),
  // so the ad_* signals stay denied per the existing Privacyverklaring.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  })
  gtag('consent', 'update', { analytics_storage: 'granted' })

  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
}
