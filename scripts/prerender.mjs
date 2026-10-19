// Runs after both `vite build` (client, -> dist/) and
// `vite build --ssr src/entry-server.jsx --outDir dist-ssr` (server bundle).
// For each known route — including "/" — server-renders the exact same
// App/route tree the browser would, and writes it as a real static file, so
// GitHub Pages — a static host with no rewrite rules — has actual content
// to serve (with a real 200) for every route. The dist-ssr/ server bundle
// is deleted at the end so it never reaches the deployed site.
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { ROUTES as ROUTE_PATHS } from '../src/lib/routes.js'
import { BLOG_POSTS } from '../src/data/blogPosts.js'
import { WERKGEBIED_PLAATSEN } from '../src/data/werkgebiedPlaatsen.js'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const distDir = path.join(rootDir, 'dist')
const ssrDir = path.join(rootDir, 'dist-ssr')
const ssrEntry = path.join(ssrDir, 'entry-server.js')

const SITE_ORIGIN = 'https://smv-advies.nl'
const SITE_NAME = 'SMV Advies'

// Derived from src/lib/routes.js and src/data/blogPosts.js instead of a
// hand-maintained duplicate list, so a route added there is automatically
// prerendered here too — this is what keeps prerendering stable across
// future builds instead of silently missing a new page.
const ROUTES = [
  ROUTE_PATHS.home,
  ROUTE_PATHS.pakketten,
  ROUTE_PATHS.energieIndicatie,
  ROUTE_PATHS.over,
  ROUTE_PATHS.werkwijze,
  ROUTE_PATHS.werkgebied,
  ...WERKGEBIED_PLAATSEN.map((plaats) => ROUTE_PATHS.werkgebiedPlaats(plaats.slug)),
  ROUTE_PATHS.cases,
  ROUTE_PATHS.blog,
  ...BLOG_POSTS.map((post) => ROUTE_PATHS.blogPost(post.slug)),
  ROUTE_PATHS.faq,
  // Trustpilot-ronde (2026-10-14): wel een echt statisch bestand nodig
  // voor een directe load/refresh op GitHub Pages, net als elke andere
  // route hier — zie routes.js voor de noindex-/sitemap-afweging per pad.
  ROUTE_PATHS.trustpilot,
  ROUTE_PATHS.beoordelingen,
  ROUTE_PATHS.recensies,
  ROUTE_PATHS.contact,
  ROUTE_PATHS.privacy,
  ROUTE_PATHS.voorwaarden,
  // Intern, verborgen adviesinstrument — technisch een echte prerendered
  // route (zodat de directe URL en een refresh op GitHub Pages werken),
  // maar bewust niet in NAV_ITEMS of sitemap.xml, en geserveerd met
  // noindex via Seo (zie src/pages/MjopTool.jsx).
  ROUTE_PATHS.mjopTool,
  // Accountroutes: zelfde reden als mjopTool hierboven — een directe
  // load/refresh op GitHub Pages heeft een echt bestand nodig, en de
  // formulieren bevatten geen klantdata om te lekken. Ook noindex.
  ROUTE_PATHS.inloggen,
  ROUTE_PATHS.registreren,
  ROUTE_PATHS.wachtwoordVergeten,
  ROUTE_PATHS.wachtwoordHerstellen,
  // /account en /admin zijn achter RequireAuth/RequireAdmin (client-side
  // guards, zie App.jsx) altijd lege shells bij een niet-ingelogde SSR-
  // render — zelfde soort statische bestand nodig voor een directe
  // load/refresh op GitHub Pages als de routes hierboven. /dossier/:id
  // is bewust NIET hier opgenomen: dossier-ID's bestaan pas na aanmaken
  // in de database (geen vooraf bekende lijst, zoals BLOG_POSTS) en de
  // inhoud is per definitie klant-specifiek — geen statisch bestand,
  // werkt alleen via client-side routing (zie routes.js).
  ROUTE_PATHS.account,
  ROUTE_PATHS.admin,
  // Zelfde reden als /admin hierboven: een statisch pad zonder parameter,
  // achter RequireAuth/RequireAdmin, dat een echt bestand nodig heeft voor
  // een directe load/refresh op GitHub Pages (werkfase Fase 8).
  ROUTE_PATHS.watKanWachten,
  // Zelfde reden als watKanWachten hierboven (admin-feature, 2026-09-28).
  ROUTE_PATHS.archief,
  // Admin-ronde (2026-09-28): drie nieuwe statische admin-paden zonder
  // parameter, zelfde reden als hierboven.
  ROUTE_PATHS.adminDossiers,
  ROUTE_PATHS.adminPlanning,
  ROUTE_PATHS.adminKansen,
  // Opties-paneel (Fase 6, #10 — projectplan "Klantwaarde-uitbreidingen"),
  // zelfde reden als adminKansen hierboven.
  ROUTE_PATHS.adminOpties,
  ROUTE_PATHS.adminSubsidies,
  // Administratie-uitbreiding (2026-09-28): zelfde reden als hierboven —
  // statische paden zonder parameter, achter RequireAuth/RequireAdmin.
  // adminFactuurDetail (/admin/facturen/:id) staat hier bewust NIET in:
  // dat bestaat pas na het aanmaken van een factuur, per definitie
  // factuurspecifiek (zelfde reden als /dossier/:id hierboven).
  ROUTE_PATHS.adminOffertes,
  ROUTE_PATHS.adminFacturen,
  ROUTE_PATHS.adminAdministratie,
  // Klantomgeving-/Administratie-detailronde (2026-09-28): drie nieuwe
  // statische admin-paden zonder parameter, zelfde reden als hierboven.
  // /account/facturen/:id staat hier bewust NIET in — zelfde reden als
  // adminFactuurDetail hierboven, factuurspecifiek.
  ROUTE_PATHS.adminOmzet,
  ROUTE_PATHS.adminOpenstaand,
  ROUTE_PATHS.adminResultaat,
  ROUTE_PATHS.adminKosten,
  ROUTE_PATHS.adminBtw,
  ROUTE_PATHS.adminInstellingen,
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
  // `url` is null for the 404 fallback page (see main()) — it's served by
  // GitHub Pages for every unmatched path, not one specific URL, so it must
  // not claim any single path as its canonical.
  const canonical = url ? `${SITE_ORIGIN}${url}` : null

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
  // gets them client-side today) — add them for every prerendered route
  // that has one (every real route does; the 404 fallback doesn't).
  if (canonical) {
    html = html.replace(
      /<meta property="og:locale" content="nl_NL" \/>/,
      `<meta property="og:locale" content="nl_NL" />\n    <meta property="og:url" content="${canonical}" />\n    <link rel="canonical" href="${canonical}" />`,
    )
  }
  if (seo?.structuredData?.length) {
    // data-seo-ld matches the attribute Seo.jsx looks for on hydration to
    // remove these prerendered blocks before adding its own — without it,
    // the client-side copy is added alongside instead of replacing them.
    const scripts = seo.structuredData
      .map(
        (block) =>
          `<script type="application/ld+json" data-seo-ld="true">${escapeForInlineScript(JSON.stringify(block))}</script>`,
      )
      .join('\n    ')
    html = html.replace('</head>', `    ${scripts}\n  </head>`)
  }
  return html
}

// Standard safeguard for embedding JSON inside an inline <script> tag: a
// literal "</" in a string value could otherwise be read by the HTML
// parser as closing the script early.
function escapeForInlineScript(json) {
  return json.replace(/</g, '\\u003c')
}

async function listHtmlFiles(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await listHtmlFiles(p)))
    else if (entry.name.endsWith('.html')) out.push(p)
  }
  return out
}

// Matcht elk <script>-element en onderscheidt "echt extern" (heeft een
// src-attribuut) van "inline" (de tekst ertussen is de payload) — alleen
// de laatste categorie heeft een CSP script-src-hash nodig.
const SCRIPT_TAG_RE = /<script([^>]*)>([\s\S]*?)<\/script>/g

function verzamelInlineScriptHashes(html, hashes) {
  SCRIPT_TAG_RE.lastIndex = 0
  let match
  while ((match = SCRIPT_TAG_RE.exec(html))) {
    const [, attrs, content] = match
    if (/\bsrc\s*=/.test(attrs)) continue
    if (content.trim() === '') continue
    hashes.add(createHash('sha256').update(content, 'utf8').digest('base64'))
  }
}

/**
 * Beveiligingsronde (2026-10-12): voegt een Content-Security-Policy-
 * meta-tag toe aan elk gegenereerd dist/*.html-bestand — NIET aan de
 * brontemplate (index.html), want die wordt ook rechtstreeks door
 * `vite dev` geserveerd en Vite's eigen React-Refresh/HMR-client
 * gebruikt zelf inline scripts die een strikte CSP zou blokkeren.
 *
 * script-src staat op 'self' + het Google-tag-domein, zonder
 * 'unsafe-inline': de overgebleven inline scripts in de uitvoer zijn
 * stuk voor stuk build-time gegenereerd en nooit gebaseerd op
 * gebruikersinvoer (JSON-LD structured-data uit Seo.jsx/structuredData.js,
 * en React's eigen SSR/streaming-hydratiescripts) — die worden daarom
 * via hun exacte sha256-hash toegestaan in plaats van met 'unsafe-inline'
 * blanco vertrouwd. Een echt geïnjecteerd aanvallersscript heeft nooit
 * een van deze hashes en wordt dus alsnog geblokkeerd. Twee builds na
 * elkaar kunnen een ander Vite-asset-bestandsnaam-hash opleveren, maar
 * nooit een andere SCRIPT-inhoud, dus dit blijft stabiel per build.
 *
 * X-Frame-Options/frame-ancestors kunnen hier bewust niet mee: die
 * werken alleen als echte HTTP-responseheader, nooit via een meta-tag
 * (CSP-spec) — dat vereist een hostingwijziging, zie eindrapport.
 */
async function injecteerContentSecurityPolicy() {
  const files = await listHtmlFiles(distDir)
  const htmlPerBestand = new Map()
  const hashes = new Set()
  for (const file of files) {
    const html = await readFile(file, 'utf-8')
    htmlPerBestand.set(file, html)
    verzamelInlineScriptHashes(html, hashes)
  }

  const scriptSrcBronnen = [
    "'self'",
    'https://www.googletagmanager.com',
    'https://widget.trustpilot.com',
    // Cloudflare Turnstile (contactformulier/energie-indicatie/MJOP-tool,
    // ronde 2026-10-17): laadt zijn eigen script vanaf dit domein.
    'https://challenges.cloudflare.com',
    ...[...hashes].sort().map((h) => `'sha256-${h}'`),
  ].join(' ')
  const content = [
    "default-src 'self'",
    `script-src ${scriptSrcBronnen}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com https://*.trustpilot.net https://*.trustpilot.com",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://widget.trustpilot.com https://*.trustpilot.com https://challenges.cloudflare.com",
    // De TrustBox-widget rendert zijn inhoud in een iframe, en Turnstile
    // doet dat ook voor de verificatie-uitdaging zelf — zonder deze regel
    // valt frame-src terug op default-src 'self', waardoor zo'n iframe
    // stilletjes geblokkeerd wordt (TrustBox: ontdekt via live screenshot,
    // 2026-10-14; Turnstile: zelfde bug, ontdekt via live screenshot,
    // 2026-10-19 — de verstuurknop bleef permanent uitgeschakeld zonder
    // zichtbare foutmelding, want TurnstileWidget.jsx vangt een mislukte
    // scriptload bewust stil af).
    "frame-src 'self' https://widget.trustpilot.com https://*.trustpilot.com https://challenges.cloudflare.com",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
  const metaTag = `<meta http-equiv="Content-Security-Policy" content="${content}" />`

  for (const [file, html] of htmlPerBestand) {
    const bijgewerkt = html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${metaTag}`)
    await writeFile(file, bijgewerkt, 'utf-8')
  }
  console.log(`CSP geïnjecteerd in ${htmlPerBestand.size} dist/*.html-bestanden (${hashes.size} inline-scripthashes).`)
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
    // A flat "<route>.html" file, not "<route>/index.html" — GitHub Pages
    // resolves an extensionless request straight to a matching .html file,
    // but redirects (301, to add a trailing slash) when the only match is
    // a directory's index.html. That redirect meant the exact requested
    // URL never actually returned 200 itself, which was the whole point.
    // "/" is the one exception: it must overwrite dist/index.html itself
    // (the file GitHub Pages actually serves for the root), not "dist/.html".
    const outPath = url === '/' ? path.join(distDir, 'index.html') : path.join(distDir, `${url}.html`)
    await mkdir(path.dirname(outPath), { recursive: true })
    await writeFile(outPath, pageHtml, 'utf-8')
    console.log(`prerendered ${url} -> ${path.relative(rootDir, outPath).replace(/\\/g, '/')}`)
  }

  // GitHub Pages serves dist/404.html (if present) for any URL that
  // doesn't match a real file, instead of its own generic branded error
  // page. The path below is never a real route — it only exists so
  // StaticRouter falls through to the app's own catch-all ("*") route,
  // which renders NotFound (already marked noindex).
  const { html: notFoundHtml, seo: notFoundSeo } = await render('/__prerender-404-fallback__')
  const notFoundPageHtml = buildHead(template, null, notFoundSeo).replace(
    '<div id="root"></div>',
    `<div id="root">${notFoundHtml}</div>`,
  )
  await writeFile(path.join(distDir, '404.html'), notFoundPageHtml, 'utf-8')
  console.log('prerendered 404 fallback -> dist/404.html')

  await injecteerContentSecurityPolicy()

  await rm(ssrDir, { recursive: true, force: true })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
