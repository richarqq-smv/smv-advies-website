import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Verificatieronde 2026-10-15: supabase/functions/send-email/index.ts
 * dispatchte mailtypes via een plain object-literal (`BUILDERS[body.type]`).
 * Omdat `body.type` rechtstreeks uit de aanroeper-gestuurde request komt,
 * kon een waarde als "constructor" via JS' eigen prototypeketen resolven
 * naar de ingebouwde `Object`-functie i.p.v. `undefined` — en
 * `Object(body.params)` op een plain object retourneert het ongewijzigd,
 * dus `message = body.params`: een aanroeper kon zo `to`/`subject`/`html`/
 * `reply_to` vrij zelf instellen (open mailrelay via SMV's eigen Resend-
 * account). `type: "__proto__"` gaf een onafgevangen crash. Dit bestand
 * draait als Deno Edge Function (jsr:-imports, Deno-globals) en is daarom
 * niet rechtstreeks met de kale Node-testrunner uit te voeren — zelfde,
 * herhaaldelijk aangetroffen beperking als elders in dit project.
 * Statische broncontrole + een losstaande functionele reproductie van het
 * dispatch-patroon zelf (geen importeren van het echte bestand nodig,
 * want het Map-patroon is generiek en zelfstandig te verifiëren).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))
const EDGE_FUNCTION = readFileSync(path.join(HIER, '..', '..', 'supabase', 'functions', 'send-email', 'index.ts'), 'utf8')

test('send-email/index.ts: BUILDERS is een Map, geen plain object-literal (prototypeketen-veilig)', () => {
  assert.match(EDGE_FUNCTION, /const BUILDERS = new Map</)
})

test('send-email/index.ts: de mailtype-lookup gebruikt Map.get(), geen bracket-property-access', () => {
  const lookupRegel = EDGE_FUNCTION.match(/const builder = .*$/m)[0]
  assert.match(lookupRegel, /BUILDERS\.get\(body\.type\)/)
  assert.doesNotMatch(lookupRegel, /BUILDERS\[body\.type\]/)
})

test('send-email/index.ts: de mailtype-lookup controleert expliciet dat body.type een string is', () => {
  assert.match(EDGE_FUNCTION, /typeof body\.type === 'string' \? BUILDERS\.get\(body\.type\) : undefined/)
})

test('Map-dispatch (generieke reproductie): "constructor" als sleutel geeft nooit toegang tot ingebouwde Object-functie', () => {
  const builders = new Map([['contact', () => ({ to: 'echte-builder' })]])
  const type = 'constructor'
  const builder = typeof type === 'string' ? builders.get(type) : undefined
  assert.equal(builder, undefined)
})

test('Map-dispatch (generieke reproductie): "__proto__" als sleutel crasht niet en geeft geen builder terug', () => {
  const builders = new Map([['contact', () => ({ to: 'echte-builder' })]])
  const type = '__proto__'
  assert.doesNotThrow(() => {
    const builder = typeof type === 'string' ? builders.get(type) : undefined
    assert.equal(builder, undefined)
  })
})

test('Ter vergelijking: een plain object-literal ALS dispatch-map is wél kwetsbaar voor "constructor" (bewijst waarom de Map-fix nodig was)', () => {
  const vulnerableBuilders = { contact: () => ({ to: 'echte-builder' }) }
  const type = 'constructor'
  // eslint-disable-next-line security/detect-object-injection -- opzettelijk: dit demonstreert de kwetsbaarheid die is gefixt, geen levende code.
  const builder = type ? vulnerableBuilders[type] : undefined
  assert.equal(typeof builder, 'function') // Object.prototype.constructor === Object
  const attackerParams = { to: 'attacker@evil.com', subject: 'pwned', html: '<b>arbitrary</b>' }
  const message = builder(attackerParams)
  assert.equal(message.to, 'attacker@evil.com') // bewijst de open-mailrelay-route die de Map-fix sluit
})
