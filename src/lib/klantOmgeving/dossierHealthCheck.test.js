import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwDossierHealthCheck, HEALTH_STATUS } from './dossierHealthCheck.js'
import { ROUTES } from '../routes.js'

function volledigeFixture() {
  return {
    klant: { naam: 'Jan Jansen', bedrijfsnaam: 'Jansen BV' },
    contactpersoon: { naam: 'Jan Jansen', email: 'jan@jansenbv.test', telefoon: '0612345678' },
    pand: { adres: 'Teststraat 1', postcode: '1234 AB', plaats: 'Teststad', gebruikstype: 'kantoor' },
    energieSnapshot: { versie: 1 },
    mjopSnapshot: { components: [{ id: 'c1' }] },
    adviespunten: [{ adviespunt_id: 'a1' }],
    offertes: [{ id: 'o1', status: 'verstuurd' }],
    openSignalenAantal: 0,
  }
}

test('bouwDossierHealthCheck: een volledig dossier is op elke categorie gereed, algemeen ook gereed', () => {
  const { categorieen, algemeen } = bouwDossierHealthCheck(volledigeFixture())
  for (const categorie of Object.values(categorieen)) {
    assert.equal(categorie.status, HEALTH_STATUS.GEREED)
  }
  assert.equal(algemeen, HEALTH_STATUS.GEREED)
})

test('bouwDossierHealthCheck: een volledig leeg dossier ontbreekt overal, algemeen ook ontbreekt', () => {
  const { categorieen, algemeen } = bouwDossierHealthCheck({})
  for (const categorie of Object.values(categorieen)) {
    assert.equal(categorie.status, HEALTH_STATUS.ONTBREEKT)
  }
  assert.equal(algemeen, HEALTH_STATUS.ONTBREEKT)
})

test('KLANT: alleen naam/bedrijfsnaam zonder contactpersoon is aandacht, niet ontbreekt', () => {
  const { categorieen } = bouwDossierHealthCheck({ ...volledigeFixture(), contactpersoon: null })
  assert.equal(categorieen.klant.status, HEALTH_STATUS.AANDACHT)
})

test('KLANT: contactpersoon zonder e-mail én telefoon is aandacht', () => {
  const fixture = volledigeFixture()
  fixture.contactpersoon = { naam: 'Jan Jansen', email: null, telefoon: null }
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.equal(categorieen.klant.status, HEALTH_STATUS.AANDACHT)
})

test('PAND: gedeeltelijk adres zonder gebruikstype is aandacht, niet gereed', () => {
  const fixture = volledigeFixture()
  fixture.pand = { adres: 'Teststraat 1', postcode: null, plaats: null, gebruikstype: null }
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.equal(categorieen.pand.status, HEALTH_STATUS.AANDACHT)
})

test('ENERGIE: geen tussenstap mogelijk — snapshot aanwezig is altijd gereed, afwezig altijd ontbreekt', () => {
  const metSnapshot = bouwDossierHealthCheck({ ...volledigeFixture(), energieSnapshot: { versie: 1 } })
  const zonderSnapshot = bouwDossierHealthCheck({ ...volledigeFixture(), energieSnapshot: null })
  assert.equal(metSnapshot.categorieen.energie.status, HEALTH_STATUS.GEREED)
  assert.equal(zonderSnapshot.categorieen.energie.status, HEALTH_STATUS.ONTBREEKT)
})

test('MJOP: snapshot aanwezig zonder components is aandacht, niet gereed', () => {
  const fixture = volledigeFixture()
  fixture.mjopSnapshot = { components: [] }
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.equal(categorieen.mjop.status, HEALTH_STATUS.AANDACHT)
})

test('ADVIES: adviespunten aanwezig maar openSignalenAantal > 0 is aandacht, niet gereed', () => {
  const fixture = volledigeFixture()
  fixture.openSignalenAantal = 2
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.equal(categorieen.advies.status, HEALTH_STATUS.AANDACHT)
  assert.match(categorieen.advies.reden, /2 automatische/)
})

test('ADVIES: openSignalenAantal null (niet geëvalueerd) telt niet mee — alleen aanwezigheid van adviespunten telt', () => {
  const fixture = volledigeFixture()
  fixture.openSignalenAantal = null
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.equal(categorieen.advies.status, HEALTH_STATUS.GEREED)
})

test('OFFERTE: alleen concept-offertes is aandacht, niet gereed', () => {
  const fixture = volledigeFixture()
  fixture.offertes = [{ id: 'o1', status: 'concept' }]
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.equal(categorieen.offerte.status, HEALTH_STATUS.AANDACHT)
})

test('OFFERTE: minstens één niet-concept offerte tussen meerdere is gereed', () => {
  const fixture = volledigeFixture()
  fixture.offertes = [
    { id: 'o1', status: 'concept' },
    { id: 'o2', status: 'geaccepteerd' },
  ]
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.equal(categorieen.offerte.status, HEALTH_STATUS.GEREED)
})

test('algemeen: één "aandacht"-categorie zonder enige "ontbreekt" geeft algemeen aandacht', () => {
  const fixture = volledigeFixture()
  fixture.mjopSnapshot = { components: [] } // aandacht
  const { algemeen } = bouwDossierHealthCheck(fixture)
  assert.equal(algemeen, HEALTH_STATUS.AANDACHT)
})

test('algemeen: "ontbreekt" weegt zwaarder dan "aandacht" in de samenvatting', () => {
  const fixture = volledigeFixture()
  fixture.mjopSnapshot = { components: [] } // aandacht
  fixture.energieSnapshot = null // ontbreekt
  const { algemeen } = bouwDossierHealthCheck(fixture)
  assert.equal(algemeen, HEALTH_STATUS.ONTBREEKT)
})

test('geeft nooit een score of percentage terug — alleen categorie-status en een tekstuele reden', () => {
  const { categorieen } = bouwDossierHealthCheck(volledigeFixture())
  for (const categorie of Object.values(categorieen)) {
    assert.equal(typeof categorie.status, 'string')
    assert.equal(typeof categorie.reden, 'string')
    assert.equal('score' in categorie, false)
    assert.equal('percentage' in categorie, false)
  }
})

// --- Acties (Energie/MJOP/Advies-werkronde) ---------------------------------

test('ACTIE: een gereed-categorie krijgt nooit een actie', () => {
  const { categorieen } = bouwDossierHealthCheck({ ...volledigeFixture(), dossierId: 'd-1' })
  for (const categorie of Object.values(categorieen)) {
    assert.equal(categorie.status, HEALTH_STATUS.GEREED)
    assert.equal(categorie.actie, null)
  }
})

test('ACTIE: energie ontbreekt geeft een link naar de Energie-indicatiepagina mét dossiercontext', () => {
  const fixture = { ...volledigeFixture(), energieSnapshot: null, dossierId: 'd-42' }
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.equal(categorieen.energie.status, HEALTH_STATUS.ONTBREEKT)
  assert.deepEqual(categorieen.energie.actie, {
    label: 'Energie-indicatie toevoegen',
    to: `${ROUTES.energieIndicatie}?dossierId=d-42`,
  })
})

test('ACTIE: energie aanwezig geeft geen actie', () => {
  const { categorieen } = bouwDossierHealthCheck({ ...volledigeFixture(), dossierId: 'd-42' })
  assert.equal(categorieen.energie.actie, null)
})

test('ACTIE: zonder dossierId blijft de energie-actie werken, alleen zonder querystring', () => {
  const fixture = { ...volledigeFixture(), energieSnapshot: null, dossierId: null }
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.deepEqual(categorieen.energie.actie, { label: 'Energie-indicatie toevoegen', to: ROUTES.energieIndicatie })
})

test('ACTIE: mjop ontbreekt verwijst naar de MJOP-tool', () => {
  const fixture = { ...volledigeFixture(), mjopSnapshot: null, dossierId: 'd-1' }
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.deepEqual(categorieen.mjop.actie, { label: 'MJOP koppelen', to: `${ROUTES.mjopTool}?dossierId=d-1` })
})

test('ACTIE: klant en pand verwijzen naar bestaande schermen (Account.jsx / MJOP-tool), geen nieuwe route', () => {
  const fixture = { ...volledigeFixture(), contactpersoon: null, pand: {}, dossierId: 'd-1' }
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.equal(categorieen.klant.actie.to, `${ROUTES.account}?dossierId=d-1`)
  assert.equal(categorieen.pand.actie.to, `${ROUTES.mjopTool}?dossierId=d-1`)
})

test('ACTIE: offerte-actie is een anchor op dezelfde pagina, geen routewijziging', () => {
  const fixture = { ...volledigeFixture(), offertes: [{ id: 'o1', status: 'concept' }], dossierId: 'd-1' }
  const { categorieen } = bouwDossierHealthCheck(fixture)
  assert.deepEqual(categorieen.offerte.actie, { label: 'Offerte bekijken', href: '#offertes-sectie' })
})

test('ACTIE: advies krijgt nooit een actie, ook niet als adviespunten ontbreken', () => {
  const { categorieen } = bouwDossierHealthCheck({ ...volledigeFixture(), adviespunten: [], dossierId: 'd-1' })
  assert.equal(categorieen.advies.status, HEALTH_STATUS.ONTBREEKT)
  assert.equal(categorieen.advies.actie, null)
})
