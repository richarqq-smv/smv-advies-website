// Holds whatever <Seo> most recently rendered. scripts/prerender.mjs reads
// this right after server-rendering each route (a single-pass, single-
// threaded Node build script — not the browser) so the prerendered HTML's
// <head> gets the exact title/description/noindex that page actually
// passed in, without duplicating that text in a second place. Unused
// client-side; harmless there.
let lastSeo = null

export function setLastSeo(seo) {
  lastSeo = seo
}

export function getLastSeo() {
  return lastSeo
}
