import { Writable } from 'node:stream'
import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App.jsx'
import { getLastSeo } from './components/seo/seoRegistry'

/**
 * Build-time-only entry point used by scripts/prerender.mjs to render each
 * known route to static HTML, so GitHub Pages serves a real file (and a
 * real 200) for every route instead of only the client-rendered "/".
 * Never shipped to the browser — main.jsx is the actual client entry, and
 * every route/component it renders is identical either way.
 *
 * Every non-home page is React.lazy()-loaded (see App.jsx) to keep the
 * client bundle split, which means the lazy import must resolve before
 * there's any page content to render. renderToString can't wait for that —
 * it has no Suspense support and aborts to an empty fallback. Waiting for
 * onAllReady from renderToPipeableStream is what actually resolves the
 * lazy import before collecting the HTML.
 */
export function render(url) {
  return new Promise((resolve, reject) => {
    let html = ''
    const { pipe } = renderToPipeableStream(
      <StaticRouter location={url}>
        <App />
      </StaticRouter>,
      {
        onAllReady() {
          const collector = new Writable({
            write(chunk, _encoding, callback) {
              html += chunk
              callback()
            },
            final(callback) {
              resolve({ html, seo: getLastSeo() })
              callback()
            },
          })
          pipe(collector)
        },
        onError(error) {
          reject(error)
        },
      },
    )
  })
}
