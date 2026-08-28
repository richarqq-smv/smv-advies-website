/**
 * Google Analytics (GA4) consent grant.
 *
 * gtag.js itself loads unconditionally on every page load as a static tag
 * in index.html — see the comment there for why (a dynamically-injected
 * script via document.createElement was proven, through an isolated A/B
 * test, to silently break gtag.js's internal consent/measurement
 * processing, even though the script itself loaded and ran fine). The
 * 'consent','default' declared there keeps analytics_storage denied, so
 * no cookie is set and no hit is sent, until this runs.
 *
 * loadAnalytics() is only ever called from CookieBanner after consent is
 * either already stored as 'accepted' or just given — it only needs to
 * grant analytics_storage; 'js'/'config' already ran in index.html.
 */
let granted = false

export function loadAnalytics() {
  if (granted || typeof window.gtag !== 'function') return
  granted = true

  window.gtag('consent', 'update', { analytics_storage: 'granted' })
}
