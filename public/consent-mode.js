// Consent Mode v2 default — must run unconditionally on every page load,
// before the Google tag itself (which loads only after the cookiebanner's
// "Accepteren", see src/lib/analytics.js). This is the one and only place
// 'consent','default' is declared. Extracted from an inline <script> in
// index.html (2026-10-12, security-implementatieronde) zodat de pagina
// een CSP zonder script-src 'unsafe-inline' kan gebruiken.
window.dataLayer = window.dataLayer || []
function gtag() {
  dataLayer.push(arguments)
}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
})
