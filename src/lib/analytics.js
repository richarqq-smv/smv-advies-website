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

/**
 * Trustpilot TrustBox-bootstrapscript (verificatieronde 2026-10-15).
 *
 * In tegenstelling tot gtag.js hierboven heeft Trustpilot geen eigen
 * Consent-Mode-achtig mechanisme dat laden vóór toestemming "veilig"
 * maakt — en de reden om gtag.js niet dynamisch te injecteren (het
 * getest-gebroken interne consent/measurement-gedrag) is vendor-
 * specifiek en gaat niet op voor dit script. Daarom wordt dit script,
 * anders dan gtag.js, pas na "Accepteren" dynamisch toegevoegd, exact
 * zoals de Privacyverklaring voor marketing-/trackingcookies belooft.
 * De widget-div zelf staat al statisch in Footer.jsx (sitewide,
 * geprerenderd), dus het script vindt 'm zodra het laadt, ongeacht
 * timing.
 */
let trustpilotLoaded = false

export function loadTrustpilot() {
  if (trustpilotLoaded || typeof document === 'undefined') return
  trustpilotLoaded = true

  const script = document.createElement('script')
  script.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js'
  script.async = true
  document.head.appendChild(script)
}

/**
 * Trekt een eerder gegeven toestemming in (zie Privacy.jsx: "Cookie-
 * instellingen wijzigen"). Zet analytics_storage terug naar denied en
 * reset de granted-guard, zodat een latere, nieuwe loadAnalytics()-aanroep
 * (na opnieuw accepteren) weer werkt i.p.v. stil niets te doen.
 */
export function revokeAnalytics() {
  granted = false
  if (typeof window.gtag !== 'function') return

  window.gtag('consent', 'update', { analytics_storage: 'denied' })
}
