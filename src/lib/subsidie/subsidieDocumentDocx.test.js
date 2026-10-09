import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Document } from 'docx'
import { bouwSubsidieDocumentDocx, genereerSubsidieDocumentDocxBlob, bouwSubsidieDocumentBestandsnaam } from './subsidieDocumentDocx.js'
import { bouwSubsidieDocumentData } from './subsidieDocumentData.js'

const DOSSIER = {
  dossier_id: 'd-123',
  klanten: { bedrijfsnaam: 'Bakkerij De Korenbloem' },
  panden: { adres: 'Voorstraat 1', postcode: '3261 AB', plaats: 'Oud-Beijerland', gebruikstype: 'horeca' },
}

function compleetData() {
  return bouwSubsidieDocumentData({
    dossier: DOSSIER,
    uitvoeringsjaar: 2026,
    datum: '2026-10-15',
    adviseurNaam: 'Richard Schipper',
    specificatiesPerMaatregel: {
      dakisolatie: { oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
      gevelisolatie: { oppervlakteM2: 60, technischeWaarde: 3.5, meldcode: 'KA31000', isolatieBevestigd: 'ja' },
    },
    mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Dakisolatie vervangen' }] }],
  })
}

test('bouwSubsidieDocumentDocx() geeft een echte docx.Document terug, voor zowel lege als complete data', () => {
  const leeg = bouwSubsidieDocumentData({})
  assert.ok(bouwSubsidieDocumentDocx(leeg) instanceof Document)
  assert.ok(bouwSubsidieDocumentDocx(compleetData()) instanceof Document)
})

test('genereerSubsidieDocumentDocxBlob() levert een niet-leeg Blob met het juiste Word-mimetype, voor lege en complete data', async () => {
  const legeBlob = await genereerSubsidieDocumentDocxBlob(bouwSubsidieDocumentData({}))
  assert.ok(legeBlob.size > 0)
  assert.equal(legeBlob.type, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

  const volleBlob = await genereerSubsidieDocumentDocxBlob(compleetData())
  assert.ok(volleBlob.size > legeBlob.size, 'het document met maatregelen/fiscale regelingen moet groter zijn dan het lege document')
})

test('genereerSubsidieDocumentDocxBlob() crasht niet op XML-onveilige tekens in klantnaam (geen HTML-escaping nodig, docx escaped zelf)', async () => {
  const data = bouwSubsidieDocumentData({ dossier: { ...DOSSIER, klanten: { bedrijfsnaam: '<script>alert(1)</script> & "quotes" \'apostrof\'' } } })
  const blob = await genereerSubsidieDocumentDocxBlob(data)
  assert.ok(blob.size > 0)
})

test('bouwSubsidieDocumentBestandsnaam() geeft een veilige .docx-bestandsnaam met datum, geen rare tekens', () => {
  const naam = bouwSubsidieDocumentBestandsnaam(compleetData())
  assert.match(naam, /^SMV-Subsidieadvies-[a-zA-Z0-9-]+-\d{4}-\d{2}-\d{2}\.docx$/)
})

test('bouwSubsidieDocumentBestandsnaam() crasht niet zonder klantnaam/dossierId (valt terug op "dossier")', () => {
  const naam = bouwSubsidieDocumentBestandsnaam({ meta: {} })
  assert.match(naam, /^SMV-Subsidieadvies-dossier-\d{4}-\d{2}-\d{2}\.docx$/)
})

test('met fiscale aanleiding (zakelijk pand + MJOP-signaal) genereert het document zonder te crashen en is substantieel groter dan zonder', async () => {
  const zonderFiscaal = await genereerSubsidieDocumentDocxBlob(bouwSubsidieDocumentData({ dossier: DOSSIER, uitvoeringsjaar: 2026 }))
  const metFiscaal = await genereerSubsidieDocumentDocxBlob(compleetData())
  assert.ok(metFiscaal.size > zonderFiscaal.size)
})

test('fiscale sectie koppelt een al ingevulde ISDE-oppervlakte (dakisolatie) — document is groter dan zonder die specificatie, zelfde fiscale aanleiding', async () => {
  const zonderOppervlakte = await genereerSubsidieDocumentDocxBlob(
    bouwSubsidieDocumentData({ dossier: DOSSIER, uitvoeringsjaar: 2026, mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Dakisolatie vervangen' }] }] }),
  )
  const metOppervlakte = await genereerSubsidieDocumentDocxBlob(
    bouwSubsidieDocumentData({
      dossier: DOSSIER,
      uitvoeringsjaar: 2026,
      mjopInsights: [{ componentId: 'c1', recommendations: [{ measureName: 'Dakisolatie vervangen' }] }],
      specificatiesPerMaatregel: { dakisolatie: { oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' } },
    }),
  )
  assert.ok(metOppervlakte.size > zonderOppervlakte.size)
})
