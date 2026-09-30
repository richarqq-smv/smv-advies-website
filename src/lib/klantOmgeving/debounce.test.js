import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { debounce } from './debounce.js'

test('debounce: roept de functie pas aan na de wachttijd, niet direct', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const fn = mock.fn()
  const d = debounce(fn, 500)
  d('a')
  assert.equal(fn.mock.callCount(), 0)
  mock.timers.tick(499)
  assert.equal(fn.mock.callCount(), 0)
  mock.timers.tick(1)
  assert.equal(fn.mock.callCount(), 1)
  assert.deepEqual(fn.mock.calls[0].arguments, ['a'])
  mock.timers.reset()
})

test('debounce: herhaalde aanroepen binnen de wachttijd resetten de timer, alleen de laatste aanroep telt', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const fn = mock.fn()
  const d = debounce(fn, 500)
  d('eerste')
  mock.timers.tick(300)
  d('tweede')
  mock.timers.tick(300)
  assert.equal(fn.mock.callCount(), 0)
  mock.timers.tick(200)
  assert.equal(fn.mock.callCount(), 1)
  assert.deepEqual(fn.mock.calls[0].arguments, ['tweede'])
  mock.timers.reset()
})

test('debounce: cancel() annuleert een geplande aanroep volledig', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const fn = mock.fn()
  const d = debounce(fn, 500)
  d('a')
  d.cancel()
  mock.timers.tick(1000)
  assert.equal(fn.mock.callCount(), 0)
  mock.timers.reset()
})

test('debounce: flush() voert een geplande aanroep direct uit, zonder te wachten', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const fn = mock.fn()
  const d = debounce(fn, 500)
  d('a')
  d.flush('b')
  assert.equal(fn.mock.callCount(), 1)
  assert.deepEqual(fn.mock.calls[0].arguments, ['b'])
  mock.timers.tick(1000)
  assert.equal(fn.mock.callCount(), 1)
  mock.timers.reset()
})
