import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Statische bron-controles (geen jsdom/React-router-testrunner in dit
 * project) voor "MJOP-tool achter login": /MJOP-Tool moet binnen de
 * bestaande <RequireAuth />-boom in App.jsx staan, en RequireAuth moet
 * het huidige pad+querystring (incl. ?dossierId=...) als redirect-state
 * meegeven zodat Inloggen.jsx (ongewijzigd, leest al location.state?.van)
 * na een geslaagde login op exact dezelfde plek teruglandt.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const APP = lees('..', '..', 'App.jsx')
const REQUIRE_AUTH = lees('RequireAuth.jsx')
const INLOGGEN = lees('..', '..', 'pages', 'Inloggen.jsx')

// App.jsx heeft twee losse <Route element={<RequireAuth />}> blokken (de
// offerte-preview/klantgesprek-tak staat apart boven de hoofd-routeboom) —
// de MJOP/account/dossier-routes horen bij het TWEEDE blok, dus knip de
// brontekst daar expliciet op af in plaats van een regex te laten gokken
// welk blok bedoeld is.
const TWEEDE_REQUIRE_AUTH_INDEX = APP.indexOf('<Route element={<RequireAuth />}>', APP.indexOf('<Route element={<RequireAuth />}>') + 1)
const requireAuthBlok = APP.slice(TWEEDE_REQUIRE_AUTH_INDEX, APP.indexOf('<Route path="*"', TWEEDE_REQUIRE_AUTH_INDEX))

test('App.jsx: de MJOP-tool-route staat binnen de <RequireAuth />-boom, niet meer bij de publieke routes', () => {
  assert.ok(TWEEDE_REQUIRE_AUTH_INDEX > 0)
  assert.match(requireAuthBlok, /<Route path=\{ROUTES\.mjopTool\} element=\{<MjopTool \/>\} \/>/)
})

test('App.jsx: de MJOP-route komt maar één keer voor (geen dubbele/publieke variant ernaast overgebleven)', () => {
  const matches = APP.match(/path=\{ROUTES\.mjopTool\}/g) ?? []
  assert.equal(matches.length, 1)
})

test('App.jsx: /dossier/:dossierId en /account staan nog steeds in dezelfde RequireAuth-boom (regressie, geen aparte nieuwe guard-laag gebouwd)', () => {
  assert.match(requireAuthBlok, /path=\{ROUTES\.account\}/)
  assert.match(requireAuthBlok, /path="\/dossier\/:dossierId"/)
})

test('RequireAuth.jsx: geeft location.pathname + location.search mee als redirect-state (behoudt querystring, incl. dossierId)', () => {
  assert.match(REQUIRE_AUTH, /useLocation/)
  assert.match(REQUIRE_AUTH, /<Navigate to=\{ROUTES\.inloggen\} replace state=\{\{ van: location\.pathname \+ location\.search \}\} \/>/)
})

test('RequireAuth.jsx: wacht op het laden van de auth-status vóór een redirect-beslissing (regressie)', () => {
  const fnBody = REQUIRE_AUTH.match(/export function RequireAuth\(\) \{[\s\S]*?\n\}/)[0]
  assert.match(fnBody, /if \(laden\) return null/)
  // De "laden"-check moet vóór de redirect-check staan, anders zou een
  // nog-niet-bekende auth-status alvast naar /inloggen kunnen sturen.
  assert.ok(fnBody.indexOf('if (laden) return null') < fnBody.indexOf('Navigate'))
})

test('Inloggen.jsx: navigeert na een geslaagde login terug naar location.state?.van (bestaande, hier alleen eindelijk gevulde architectuur — geen nieuwe bouwen)', () => {
  assert.match(INLOGGEN, /navigate\(location\.state\?\.van \?\? ROUTES\.home\)/)
})

test('MjopTool.jsx: blijft de dossierId-query-param lezen via searchParams, ongewijzigd door de auth-verhuizing', () => {
  const mjopTool = lees('..', '..', 'pages', 'MjopTool.jsx')
  assert.match(mjopTool, /leesDossierContext\(searchParams\)/)
})
