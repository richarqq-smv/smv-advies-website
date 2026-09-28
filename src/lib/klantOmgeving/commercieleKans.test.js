import { test } from 'node:test'
import assert from 'node:assert/strict'
import { valideerCommercieleKans, VERVOLGSTAP_OPTIES, VERVOLGSTAP_LABELS } from './commercieleKans.js'

test('VERVOLGSTAP_OPTIES bevat exact de zeven vaste opties, in de verwachte volgorde', () => {
  assert.deepEqual(
    VERVOLGSTAP_OPTIES.map((o) => o.id),
    [
      'nog_bepalen',
      'alleen_energie_quickscan',
      'basis_orienteren',
      'premium_beslissen',
      'gold_ontzorgd',
      'meerdere_mogelijkheden',
      'geen_vervolgopdracht',
    ],
  )
})

test('VERVOLGSTAP_LABELS gebruikt de bestaande pakketnamen/mindsets, geen nieuwe naamgeving', () => {
  assert.equal(VERVOLGSTAP_LABELS.basis_orienteren, 'Basis – Oriënteren')
  assert.equal(VERVOLGSTAP_LABELS.premium_beslissen, 'Premium – Beslissen')
  assert.equal(VERVOLGSTAP_LABELS.gold_ontzorgd, 'Gold – Ontzorgd worden')
})

test('valideerCommercieleKans: elke toegestane waarde wordt geaccepteerd', () => {
  for (const { id } of VERVOLGSTAP_OPTIES) {
    assert.deepEqual(valideerCommercieleKans({ vervolgstap: id }), {})
  }
})

test('valideerCommercieleKans: een lege/onbekende waarde wordt geweigerd', () => {
  assert.ok(valideerCommercieleKans({ vervolgstap: '' }).vervolgstap)
  assert.ok(valideerCommercieleKans({ vervolgstap: 'iets-verzonnens' }).vervolgstap)
  assert.ok(valideerCommercieleKans({}).vervolgstap)
  assert.ok(valideerCommercieleKans().vervolgstap)
})
