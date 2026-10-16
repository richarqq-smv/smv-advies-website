import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  koppelcodeActiviteiten,
  accountKoppelingActiviteiten,
  documentActiviteiten,
  pandActiviteiten,
  mailActiviteiten,
  mergeActiviteitenFeed,
  formatTijdstipNl,
} from './activiteitenFeed.js'

test('koppelcodeActiviteiten: alleen rijen met gebruikt_op gezet tellen mee', () => {
  const rows = [
    { koppelcode_id: 'a', gebruikt_op: '2026-10-16T10:00:00Z', klanten: { naam: 'Jansen BV' } },
    { koppelcode_id: 'b', gebruikt_op: null, klanten: { naam: 'Pietersen BV' } },
  ]
  const result = koppelcodeActiviteiten(rows)
  assert.equal(result.length, 1)
  assert.match(result[0].tekst, /Jansen BV.*koppelcode verzilverd/)
  assert.equal(result[0].tijdstip, '2026-10-16T10:00:00Z')
})

test('koppelcodeActiviteiten: ontbrekende klantnaam valt terug op bedrijfsnaam, dan "Onbekende klant"', () => {
  const rows = [{ koppelcode_id: 'a', gebruikt_op: '2026-10-16T10:00:00Z', klanten: { bedrijfsnaam: 'ACME' } }]
  assert.match(koppelcodeActiviteiten(rows)[0].tekst, /ACME/)
  const zonderKlant = koppelcodeActiviteiten([{ koppelcode_id: 'b', gebruikt_op: '2026-10-16T10:00:00Z', klanten: null }])
  assert.match(zonderKlant[0].tekst, /Onbekende klant/)
})

test('accountKoppelingActiviteiten: alleen contactpersonen met account_id tellen mee', () => {
  const rows = [
    { contactpersoon_id: 'c1', naam: 'Dennis', account_id: 'u1', created_at: '2026-10-16T09:00:00Z', klanten: { naam: 'Dennis BV' } },
    { contactpersoon_id: 'c2', naam: 'Zonder account', account_id: null, created_at: '2026-10-16T08:00:00Z', klanten: { naam: 'X' } },
  ]
  const result = accountKoppelingActiviteiten(rows)
  assert.equal(result.length, 1)
  assert.match(result[0].tekst, /Dennis heeft een account gekoppeld bij Dennis BV/)
})

test('documentActiviteiten: alleen uploads door een bekend klant-account, niet verwijderd', () => {
  const documenten = [
    { document_id: 'd1', bestandsnaam: 'factuur.pdf', geupload_door: 'klant-uid', created_at: '2026-10-16T11:00:00Z', verwijderd_op: null, klanten: { naam: 'Jansen BV' } },
    { document_id: 'd2', bestandsnaam: 'intern.pdf', geupload_door: 'admin-uid', created_at: '2026-10-16T11:00:00Z', verwijderd_op: null, klanten: { naam: 'Jansen BV' } },
    { document_id: 'd3', bestandsnaam: 'oud.pdf', geupload_door: 'klant-uid', created_at: '2026-10-16T11:00:00Z', verwijderd_op: '2026-10-16T12:00:00Z', klanten: { naam: 'Jansen BV' } },
  ]
  const result = documentActiviteiten(documenten, ['klant-uid'])
  assert.equal(result.length, 1)
  assert.match(result[0].tekst, /Jansen BV.*factuur\.pdf/)
})

test('pandActiviteiten: panden via admin-intake (ontstaan_via "intake") tellen niet mee', () => {
  const relaties = [
    { relatie_id: 'r1', aangemaakt_op: '2026-10-16T07:00:00Z', klanten: { naam: 'Klant Zelf' }, panden: { adres: 'Kerkstraat 1', ontstaan_via: null } },
    { relatie_id: 'r2', aangemaakt_op: '2026-10-16T06:00:00Z', klanten: { naam: 'Admin Klant' }, panden: { adres: 'Dorpsstraat 2', ontstaan_via: 'intake' } },
  ]
  const result = pandActiviteiten(relaties)
  assert.equal(result.length, 1)
  assert.match(result[0].tekst, /Klant Zelf.*Kerkstraat 1/)
})

test('mailActiviteiten: onderscheidt gelukt/mislukt en gebruikt het leesbare typelabel', () => {
  const rows = [
    { id: 'm1', type: 'contact', gelukt: true, created_at: '2026-10-16T13:00:00Z' },
    { id: 'm2', type: 'energie-lead', gelukt: false, created_at: '2026-10-16T12:00:00Z' },
    { id: 'm3', type: 'onbekend-type', gelukt: true, created_at: '2026-10-16T11:00:00Z' },
  ]
  const result = mailActiviteiten(rows)
  assert.equal(result[0].type, 'mail-gelukt')
  assert.match(result[0].tekst, /Contactformulier-mail verstuurd/)
  assert.equal(result[1].type, 'mail-mislukt')
  assert.match(result[1].tekst, /Energie-indicatie \(intern\)-mail mislukt/)
  // Onbekend type crasht niet, valt terug op de ruwe typestring.
  assert.match(result[2].tekst, /onbekend-type-mail verstuurd/)
})

test('mergeActiviteitenFeed: sorteert chronologisch aflopend over alle categorieën heen en knipt af op limiet', () => {
  const groepen = [
    [{ id: 'a', tijdstip: '2026-10-16T08:00:00Z' }],
    [{ id: 'b', tijdstip: '2026-10-16T10:00:00Z' }, { id: 'c', tijdstip: '2026-10-16T09:00:00Z' }],
  ]
  const result = mergeActiviteitenFeed(groepen, 2)
  assert.deepEqual(result.map((r) => r.id), ['b', 'c'])
})

test('mergeActiviteitenFeed: items zonder tijdstip worden genegeerd (geen crash op onverwachte lege rij)', () => {
  const result = mergeActiviteitenFeed([[{ id: 'a', tijdstip: null }, { id: 'b', tijdstip: '2026-10-16T08:00:00Z' }]])
  assert.deepEqual(result.map((r) => r.id), ['b'])
})

test('formatTijdstipNl: dd-mm-jjjj uu:mm, en lege invoer geeft lege string (geen crash)', () => {
  assert.equal(formatTijdstipNl(null), '')
  assert.match(formatTijdstipNl('2026-10-16T13:05:00Z'), /^\d{2}-\d{2}-2026 \d{2}:\d{2}$/)
})
