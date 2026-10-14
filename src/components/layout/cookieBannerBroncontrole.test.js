import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Statische bron-controles (geen jsdom/React-testrunner in dit project,
 * zie andere *Broncontrole.test.js-bestanden) voor de toestemmingsflow
 * van CookieBanner.jsx: het daadwerkelijke granted/denied-gedrag wordt al
 * behandeld in analytics.test.js en consent.test.js (echte functieaan-
 * roepen met een gestubde window.gtag/localStorage) — deze controleert
 * dat de component die functies ook daadwerkelijk op de juiste plek
 * aanroept, en dat "Cookie-instellingen wijzigen" op de privacypagina
 * naar dezelfde component doorverbonden is.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const COOKIE_BANNER = lees('CookieBanner.jsx')
const PRIVACY = lees('..', '..', 'pages', 'Privacy.jsx')
const CONSENT = lees('..', '..', 'lib', 'consent.js')

test('CookieBanner.jsx: start zichtbaar alleen als er nog geen opgeslagen keuze is', () => {
  assert.match(COOKIE_BANNER, /useState\(\(\) => getStoredConsent\(\) === null\)/)
})

test('CookieBanner.jsx: laadt analytics bij mount alleen als de opgeslagen keuze al "accepted" is', () => {
  const mountEffect = COOKIE_BANNER.slice(
    COOKIE_BANNER.indexOf('useEffect(() => {\n    if (getStoredConsent()'),
    COOKIE_BANNER.indexOf('}, [])', COOKIE_BANNER.indexOf('useEffect(() => {\n    if (getStoredConsent()')),
  )
  assert.match(mountEffect, /getStoredConsent\(\) === 'accepted'/)
  assert.match(mountEffect, /loadAnalytics\(\)/)
})

test('CookieBanner.jsx: handleAccept slaat "accepted" op, laadt analytics en verbergt de banner', () => {
  const blok = COOKIE_BANNER.slice(COOKIE_BANNER.indexOf('function handleAccept'), COOKIE_BANNER.indexOf('function handleDecline'))
  assert.match(blok, /storeConsent\('accepted'\)/)
  assert.match(blok, /loadAnalytics\(\)/)
  assert.match(blok, /setVisible\(false\)/)
})

test('CookieBanner.jsx: handleDecline slaat "declined" op, verbergt de banner, en laadt geen analytics', () => {
  const blok = COOKIE_BANNER.slice(COOKIE_BANNER.indexOf('function handleDecline'), COOKIE_BANNER.indexOf('if (!visible)'))
  assert.match(blok, /storeConsent\('declined'\)/)
  assert.match(blok, /setVisible\(false\)/)
  assert.doesNotMatch(blok, /loadAnalytics\(\)/)
})

test('CookieBanner.jsx: luistert op COOKIE_SETTINGS_EVENT en trekt toestemming dan volledig in (revoke + clear + opnieuw tonen)', () => {
  assert.match(COOKIE_BANNER, /addEventListener\(COOKIE_SETTINGS_EVENT, handleReopen\)/)
  assert.match(COOKIE_BANNER, /removeEventListener\(COOKIE_SETTINGS_EVENT, handleReopen\)/)
  const handler = COOKIE_BANNER.slice(COOKIE_BANNER.indexOf('function handleReopen'), COOKIE_BANNER.indexOf('window.addEventListener'))
  assert.match(handler, /revokeAnalytics\(\)/)
  assert.match(handler, /clearConsent\(\)/)
  assert.match(handler, /setVisible\(true\)/)
})

test('Privacy.jsx: "Cookie-instellingen wijzigen"-knop stuurt hetzelfde COOKIE_SETTINGS_EVENT dat CookieBanner.jsx beluistert', () => {
  assert.match(PRIVACY, /window\.dispatchEvent\(new Event\(COOKIE_SETTINGS_EVENT\)\)/)
  assert.match(PRIVACY, /import \{ COOKIE_SETTINGS_EVENT \} from '\.\.\/lib\/consent'/)
})

test("consent.js: COOKIE_SETTINGS_EVENT is de enige bron van de eventnaam (geen los magic string elders)", () => {
  assert.match(CONSENT, /export const COOKIE_SETTINGS_EVENT = '[\w-]+'/)
  const eventNaamMatch = CONSENT.match(/export const COOKIE_SETTINGS_EVENT = '([\w-]+)'/)
  assert.ok(eventNaamMatch)
  assert.match(COOKIE_BANNER, /COOKIE_SETTINGS_EVENT/)
  assert.doesNotMatch(COOKIE_BANNER, new RegExp(`'${eventNaamMatch[1]}'`))
})
