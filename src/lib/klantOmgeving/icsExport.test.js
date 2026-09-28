import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwHerbeoordelingenIcs } from './icsExport.js'

test('bouwHerbeoordelingenIcs: geeft null bij geen items met een datum', () => {
  assert.equal(bouwHerbeoordelingenIcs([]), null)
  assert.equal(bouwHerbeoordelingenIcs([{ adviespuntId: 'a', onderwerp: 'X', herbeoordelenDatum: null }]), null)
})

test('bouwHerbeoordelingenIcs: items zonder datum worden overgeslagen, niet geraden', () => {
  const items = [
    { adviespuntId: 'a', onderwerp: 'Dak', herbeoordelenDatum: '2027-03-15', toelichting: 'Isolatie bekijken' },
    { adviespuntId: 'b', onderwerp: 'Cv-ketel', herbeoordelenDatum: null, toelichting: 'Over twee jaar (vrije tekst, geen datum)' },
  ]
  const ics = bouwHerbeoordelingenIcs(items)
  assert.match(ics, /Dak/)
  assert.doesNotMatch(ics, /Cv-ketel/)
})

test('bouwHerbeoordelingenIcs: geldige VCALENDAR-structuur met één VEVENT per item', () => {
  const items = [
    { adviespuntId: 'a', onderwerp: 'Dak', herbeoordelenDatum: '2027-03-15', toelichting: 'Isolatie bekijken', klantNaam: 'Jansen BV', pandNaam: 'Hoofdkantoor' },
  ]
  const ics = bouwHerbeoordelingenIcs(items)
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/)
  assert.match(ics, /VERSION:2\.0\r\n/)
  assert.match(ics, /BEGIN:VEVENT\r\n/)
  assert.match(ics, /UID:herbeoordeling-a@smv-advies\.nl\r\n/)
  assert.match(ics, /DTSTART;VALUE=DATE:20270315\r\n/)
  assert.match(ics, /SUMMARY:Herbeoordelen: Dak\r\n/)
  assert.match(ics, /DESCRIPTION:Jansen BV — Hoofdkantoor — Isolatie bekijken\r\n/)
  assert.match(ics, /END:VEVENT\r\n/)
  assert.match(ics, /END:VCALENDAR\r\n$/)
})

test('bouwHerbeoordelingenIcs: escapet komma\'s, puntkomma\'s en newlines in tekstvelden (RFC5545)', () => {
  const items = [{ adviespuntId: 'a', onderwerp: 'Dak, gevel; isolatie', herbeoordelenDatum: '2027-01-01', toelichting: 'Regel 1\nRegel 2' }]
  const ics = bouwHerbeoordelingenIcs(items)
  assert.match(ics, /SUMMARY:Herbeoordelen: Dak\\, gevel\\; isolatie\r\n/)
  assert.match(ics, /DESCRIPTION:Regel 1\\nRegel 2\r\n/)
})

test('bouwHerbeoordelingenIcs: meerdere items met datum geven meerdere VEVENT-blokken', () => {
  const items = [
    { adviespuntId: 'a', onderwerp: 'Dak', herbeoordelenDatum: '2027-01-01' },
    { adviespuntId: 'b', onderwerp: 'Gevel', herbeoordelenDatum: '2027-06-01' },
  ]
  const ics = bouwHerbeoordelingenIcs(items)
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 2)
  assert.equal((ics.match(/END:VEVENT/g) ?? []).length, 2)
})
