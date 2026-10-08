import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwDossierHealthCheck, bouwWorkflowStappen, bepaalVolgendeStap, HEALTH_STATUS } from './dossierHealthCheck.js'
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
    opnames: [{ opname_id: 'op-1', status: 'afgerond' }],
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

// --- OPNAME (UX-herontwerp, 2026-10-08) -------------------------------------

test('OPNAME: geen opnames is ontbreekt', () => {
  const { categorieen } = bouwDossierHealthCheck({ ...volledigeFixture(), opnames: [] })
  assert.equal(categorieen.opname.status, HEALTH_STATUS.ONTBREEKT)
})

test('OPNAME: opname gestart maar geen enkele afgerond is aandacht', () => {
  const { categorieen } = bouwDossierHealthCheck({ ...volledigeFixture(), opnames: [{ opname_id: 'op-1', status: 'concept' }] })
  assert.equal(categorieen.opname.status, HEALTH_STATUS.AANDACHT)
})

test('OPNAME: minstens één afgeronde opname tussen meerdere is gereed', () => {
  const { categorieen } = bouwDossierHealthCheck({
    ...volledigeFixture(),
    opnames: [{ opname_id: 'op-1', status: 'concept' }, { opname_id: 'op-2', status: 'afgerond' }],
  })
  assert.equal(categorieen.opname.status, HEALTH_STATUS.GEREED)
})

test('ACTIE: opname-actie is een anchor op dezelfde pagina', () => {
  const { categorieen } = bouwDossierHealthCheck({ ...volledigeFixture(), opnames: [] })
  assert.deepEqual(categorieen.opname.actie, { label: 'Opname starten/openen', href: '#opnames-sectie' })
})

// --- SUBSIDIES (UX-herontwerp, 2026-10-08) ----------------------------------

test('SUBSIDIES: telt alleen mee als eigen categorie als de aanroeper subsidiesZichtbaar=true meegeeft (pakket-onafhankelijk — aanroeper bepaalt dit op basis van rol/pakket)', () => {
  const nietZichtbaar = bouwDossierHealthCheck({ ...volledigeFixture(), subsidiesZichtbaar: false })
  assert.equal('subsidies' in nietZichtbaar.categorieen, false)
  const zichtbaar = bouwDossierHealthCheck({ ...volledigeFixture(), subsidiesZichtbaar: true, subsidies: [] })
  assert.equal('subsidies' in zichtbaar.categorieen, true)
})

test('SUBSIDIES: geen subsidies vastgelegd is ontbreekt', () => {
  const { categorieen } = bouwDossierHealthCheck({ ...volledigeFixture(), subsidiesZichtbaar: true, subsidies: [] })
  assert.equal(categorieen.subsidies.status, HEALTH_STATUS.ONTBREEKT)
})

test('SUBSIDIES: traject in voorbereiding/ingediend is aandacht', () => {
  const { categorieen } = bouwDossierHealthCheck({
    ...volledigeFixture(),
    subsidiesZichtbaar: true,
    subsidies: [{ subsidie_id: 's1', status: 'ingediend' }],
  })
  assert.equal(categorieen.subsidies.status, HEALTH_STATUS.AANDACHT)
})

test('SUBSIDIES: traject toegekend/afgewezen/verantwoord is gereed', () => {
  const { categorieen } = bouwDossierHealthCheck({
    ...volledigeFixture(),
    subsidiesZichtbaar: true,
    subsidies: [{ subsidie_id: 's1', status: 'toegekend' }],
  })
  assert.equal(categorieen.subsidies.status, HEALTH_STATUS.GEREED)
})

// --- WORKFLOW-STAPPEN / VOLGENDE STAP (UX-herontwerp, 2026-10-08) ----------

test('bouwWorkflowStappen: Gegevens combineert klant+pand tot één stap, altijd Rapport+Afronden erbij', () => {
  const { categorieen } = bouwDossierHealthCheck(volledigeFixture())
  const stappen = bouwWorkflowStappen({ categorieen, dossierStatus: 'open' })
  assert.deepEqual(stappen.map((s) => s.key), ['gegevens', 'opname', 'mjop', 'energie', 'advies', 'rapport', 'afronden'])
})

test('bouwWorkflowStappen: Subsidies-stap verschijnt alleen als de categorie bestaat (subsidiesZichtbaar=true)', () => {
  const { categorieen } = bouwDossierHealthCheck({ ...volledigeFixture(), subsidiesZichtbaar: true, subsidies: [{ subsidie_id: 's1', status: 'toegekend' }] })
  const stappen = bouwWorkflowStappen({ categorieen, dossierStatus: 'open' })
  assert.ok(stappen.some((s) => s.key === 'subsidies'))
})

test('bouwWorkflowStappen: Gegevens-stap neemt de slechtste status van klant/pand over', () => {
  const { categorieen } = bouwDossierHealthCheck({ ...volledigeFixture(), pand: {} }) // pand ontbreekt
  const stappen = bouwWorkflowStappen({ categorieen, dossierStatus: 'open' })
  const gegevens = stappen.find((s) => s.key === 'gegevens')
  assert.equal(gegevens.status, HEALTH_STATUS.ONTBREEKT)
})

test('bouwWorkflowStappen: Rapport en Afronden krijgen nooit een verzonnen gereed/ontbreekt-status', () => {
  const { categorieen } = bouwDossierHealthCheck(volledigeFixture())
  const stappen = bouwWorkflowStappen({ categorieen, dossierStatus: 'open' })
  assert.equal(stappen.find((s) => s.key === 'rapport').status, null)
  assert.equal(stappen.find((s) => s.key === 'afronden').status, null)
})

test('bouwWorkflowStappen: Afronden toont wél de echte dossierstatus zodra het dossier is afgerond', () => {
  const { categorieen } = bouwDossierHealthCheck(volledigeFixture())
  const stappen = bouwWorkflowStappen({ categorieen, dossierStatus: 'afgerond' })
  assert.equal(stappen.find((s) => s.key === 'afronden').status, HEALTH_STATUS.GEREED)
})

test('bepaalVolgendeStap: wijst naar de eerste niet-gereed stap in de workflowvolgorde', () => {
  const { categorieen } = bouwDossierHealthCheck({ ...volledigeFixture(), mjopSnapshot: null }) // mjop ontbreekt
  const stap = bepaalVolgendeStap({ categorieen, dossierStatus: 'open' })
  assert.equal(stap.titel, 'Volgende stap: MJOP')
  assert.ok(stap.actie)
})

test('bepaalVolgendeStap: alles gereed en dossier nog open wijst naar het rapport', () => {
  const { categorieen } = bouwDossierHealthCheck(volledigeFixture())
  const stap = bepaalVolgendeStap({ categorieen, dossierStatus: 'open' })
  assert.equal(stap.titel, 'Alles compleet — rapport kan worden opgesteld')
  assert.deepEqual(stap.actie, { label: 'Rapport maken', href: '#rapport-sectie' })
})

test('bepaalVolgendeStap: een afgerond dossier heeft geen volgende stap meer', () => {
  const { categorieen } = bouwDossierHealthCheck(volledigeFixture())
  const stap = bepaalVolgendeStap({ categorieen, dossierStatus: 'afgerond' })
  assert.equal(stap.titel, 'Dossier is afgerond')
  assert.equal(stap.actie, null)
})
