// Runs after both `vite build` (client, -> dist/) and
// `vite build --ssr src/entry-server.jsx --outDir dist-ssr` (server bundle).
// For each known route, server-renders the exact same App/route tree the
// browser would, and writes it as a real dist/<route>/index.html file, so
// GitHub Pages — a static host with no rewrite rules — has an actual file
// to serve (with a real 200) for every route, not just "/". The dist-ssr/
// server bundle is deleted at the end so it never reaches the deployed site.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const distDir = path.join(rootDir, 'dist')
const ssrDir = path.join(rootDir, 'dist-ssr')
const ssrEntry = path.join(ssrDir, 'entry-server.js')

const SITE_ORIGIN = 'https://smv-advies.nl'
const SITE_NAME = 'SMV Advies'

// Every route in App.jsx except "/" — the homepage already builds and
// serves correctly as dist/index.html and is left untouched.
const ROUTES = [
  '/pakketten',
  '/energie-indicatie',
  '/over',
  '/werkwijze',
  '/cases',
  '/blog',
  '/blog/dakisolatie-voor-uw-bedrijfspand',
  '/blog/eia-isde-sde-subsidies',
  '/blog/warmtepomp-in-het-mkb',
  '/blog/led-verlichting-snelste-stap',
  '/blog/verborgen-energieverspillers',
  '/faq',
  '/contact',
  '/privacy',
  '/voorwaarden',
]

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHead(template, url, seo) {
  const fullTitle = seo?.title ? `${seo.title} | ${SITE_NAME}` : SITE_NAME
  const description = seo?.description || ''
  const robots = seo?.noindex ? 'noindex, nofollow' : 'index, follow'
  const canonical = `${SITE_ORIGIN}${url}`

  let html = template
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(fullTitle)}</title>`)
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeHtml(description)}" />`,
  )
  html = html.replace(
    /<meta name="robots" content="[^"]*" \/>/,
    `<meta name="robots" content="${robots}" />`,
  )
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
  )
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
  )
  // og:url and canonical don't exist in the static template (the homepage
  // gets them client-side today) — add them for every prerendered route.
  html = html.replace(
    /<meta property="og:locale" content="nl_NL" \/>/,
    `<meta property="og:locale" content="nl_NL" />\n    <meta property="og:url" content="${canonical}" />\n    <link rel="canonical" href="${canonical}" />`,
  )
  return html
}

async function main() {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf-8')
  const { render } = await import(`file://${ssrEntry.replace(/\\/g, '/')}`)

  for (const url of ROUTES) {
    const { html: appHtml, seo } = await render(url)
    const pageHtml = buildHead(template, url, seo).replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`,
    )
    const outDir = path.join(distDir, url)
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'index.html'), pageHtml, 'utf-8')
    console.log(`prerendered ${url} -> dist${url}/index.html`)
  }

  await rm(ssrDir, { recursive: true, force: true })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
