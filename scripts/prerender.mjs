// Runs after both `vite build` (client, -> dist/) and
// `vite build --ssr src/entry-server.jsx --outDir dist-ssr` (server bundle).
// For each known route — including "/" — server-renders the exact same
// App/route tree the browser would, and writes it as a real static file, so
// GitHub Pages — a static host with no rewrite rules — has actual content
// to serve (with a real 200) for every route. The dist-ssr/ server bundle
// is deleted at the end so it never reaches the deployed site.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { ROUTES as ROUTE_PATHS } from '../src/lib/routes.js'
import { BLOG_POSTS } from '../src/data/blogPosts.js'

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
  ROUTE_PATHS.cases,
  ROUTE_PATHS.blog,
  ...BLOG_POSTS.map((post) => ROUTE_PATHS.blogPost(post.slug)),
  ROUTE_PATHS.faq,
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

  await rm(ssrDir, { recursive: true, force: true })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
