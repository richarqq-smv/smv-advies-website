import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole voor implementatieronde 2026-10-12, punt 1: de
 * wachtwoord-vergeten-flow stuurde geen redirectTo mee en er bestond
 * nergens een pagina die de reset-link afrondt met updateUser({password}).
 */
const wachtwoordVergetenJsx = readFileSync('src/pages/WachtwoordVergeten.jsx', 'utf8')
const wachtwoordHerstellenJsx = readFileSync('src/pages/WachtwoordHerstellen.jsx', 'utf8')
const routesJs = readFileSync('src/lib/routes.js', 'utf8')
const appJsx = readFileSync('src/App.jsx', 'utf8')
const prerenderMjs = readFileSync('scripts/prerender.mjs', 'utf8')
const errorsJs = readFileSync('src/lib/auth/errors.js', 'utf8')

test('routes.js: er is een expliciete wachtwoordHerstellen-route', () => {
  assert.match(routesJs, /wachtwoordHerstellen: '\/wachtwoord-herstellen'/)
})

test('WachtwoordVergeten.jsx: resetPasswordForEmail krijgt een redirectTo naar de herstelroute', () => {
  assert.match(wachtwoordVergetenJsx, /resetPasswordForEmail\(email, \{/)
  assert.match(wachtwoordVergetenJsx, /redirectTo: `\$\{window\.location\.origin\}\$\{ROUTES\.wachtwoordHerstellen\}`/)
})

test('WachtwoordHerstellen.jsx: rondt de flow af met supabase.auth.updateUser({ password })', () => {
  assert.match(wachtwoordHerstellenJsx, /supabase\.auth\.updateUser\(\{ password: wachtwoord \}\)/)
})

test('WachtwoordHerstellen.jsx: wacht op de recovery-sessie en toont een expliciete "ongeldig/verlopen"-status i.p.v. een valse succesmelding', () => {
  assert.match(wachtwoordHerstellenJsx, /supabase\.auth\.getSession\(\)/)
  assert.match(wachtwoordHerstellenJsx, /setSessieStatus\(opnieuw\.session \? 'geldig' : 'ongeldig'\)/)
  assert.match(wachtwoordHerstellenJsx, /Deze link is ongeldig of verlopen\./)
  assert.match(wachtwoordHerstellenJsx, /Uw wachtwoord is niet gewijzigd\./)
})

test('WachtwoordHerstellen.jsx: valideert wachtwoordlengte en -bevestiging vóór de updateUser-aanroep, zelfde regel als Registreren.jsx', () => {
  assert.match(wachtwoordHerstellenJsx, /import \{ MIN_WACHTWOORD_LENGTE \} from '\.\.\/lib\/auth\/wachtwoord'/)
  const submitStart = wachtwoordHerstellenJsx.indexOf('async function submit')
  const submitDeel = wachtwoordHerstellenJsx.slice(submitStart, submitStart + 700)
  assert.match(submitDeel, /wachtwoord\.length < MIN_WACHTWOORD_LENGTE/)
  assert.match(submitDeel, /wachtwoord !== wachtwoordBevestiging/)
  const updateIndex = submitDeel.indexOf('updateUser(')
  const guardIndex = submitDeel.indexOf('wachtwoord.length < MIN_WACHTWOORD_LENGTE')
  assert.ok(guardIndex < updateIndex && updateIndex !== -1)
})

test('Registreren.jsx hergebruikt dezelfde MIN_WACHTWOORD_LENGTE-constante, geen eigen afwijkende waarde', () => {
  const registrerenJsx = readFileSync('src/pages/Registreren.jsx', 'utf8')
  assert.match(registrerenJsx, /import \{ MIN_WACHTWOORD_LENGTE \} from '\.\.\/lib\/auth\/wachtwoord'/)
  assert.doesNotMatch(registrerenJsx, /const MIN_WACHTWOORD_LENGTE = 8/)
})

test('App.jsx registreert de nieuwe publieke route naast de andere auth-pagina\'s', () => {
  assert.match(appJsx, /const WachtwoordHerstellen = lazy\(\(\) => import\('\.\/pages\/WachtwoordHerstellen'\)\)/)
  assert.match(appJsx, /<Route path=\{ROUTES\.wachtwoordHerstellen\} element=\{<WachtwoordHerstellen \/>\} \/>/)
})

test('prerender.mjs: de nieuwe route krijgt een statisch bestand (refresh/directe load op GitHub Pages)', () => {
  assert.match(prerenderMjs, /ROUTE_PATHS\.wachtwoordHerstellen,/)
})

test('errors.js: een verlopen/ongeldige/ontbrekende herstelcontext krijgt een eigen Nederlandse melding', () => {
  assert.match(errorsJs, /Email link is invalid or has expired/)
  assert.match(errorsJs, /Deze link is verlopen of al gebruikt\./)
})
