import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  FACTUUR_STATUSSEN,
  magFactuurOvergangNaar,
  isFactuurVervallen,
  berekenFactuurRegel,
  berekenFactuurTotalen,
  standaardVervaldatum,
  bouwFactuurKlantSnapshot,
  bouwFactuurRegelsVanuitOfferte,
  valideerFactuurRegel,
  valideerNieuweFactuur,
  buildFactuurMailto,
  afgeleidBetreft,
  afgeleidBtwPercentage,
} from './factuur.js'

test('FACTUUR_STATUSSEN bevat exact de vijf vaste statussen', () => {
  assert.deepEqual(
    FACTUUR_STATUSSEN.map((s) => s.id),
    ['concept', 'verzonden', 'betaald', 'vervallen', 'geannuleerd'],
  )
})

// --- magFactuurOvergangNaar --------------------------------------------------

test('magFactuurOvergangNaar: concept mag naar verzonden of geannuleerd', () => {
  assert.equal(magFactuurOvergangNaar('concept', 'verzonden'), true)
  assert.equal(magFactuurOvergangNaar('concept', 'geannuleerd'), true)
  assert.equal(magFactuurOvergangNaar('concept', 'betaald'), false)
})

test('magFactuurOvergangNaar: verzonden mag naar betaald, vervallen of geannuleerd', () => {
  assert.equal(magFactuurOvergangNaar('verzonden', 'betaald'), true)
  assert.equal(magFactuurOvergangNaar('verzonden', 'vervallen'), true)
  assert.equal(magFactuurOvergangNaar('verzonden', 'geannuleerd'), true)
  assert.equal(magFactuurOvergangNaar('verzonden', 'concept'), false)
})

test('magFactuurOvergangNaar: betaald mag uitsluitend terug naar verzonden (betaling corrigeren)', () => {
  assert.equal(magFactuurOvergangNaar('betaald', 'verzonden'), true)
  assert.equal(magFactuurOvergangNaar('betaald', 'geannuleerd'), false)
  assert.equal(magFactuurOvergangNaar('betaald', 'vervallen'), false)
})

test('magFactuurOvergangNaar: geannuleerd is volledig terminaal', () => {
  assert.equal(magFactuurOvergangNaar('geannuleerd', 'concept'), false)
  assert.equal(magFactuurOvergangNaar('geannuleerd', 'verzonden'), false)
})

test('magFactuurOvergangNaar: vervallen mag naar betaald of geannuleerd', () => {
  assert.equal(magFactuurOvergangNaar('vervallen', 'betaald'), true)
  assert.equal(magFactuurOvergangNaar('vervallen', 'geannuleerd'), true)
  assert.equal(magFactuurOvergangNaar('vervallen', 'concept'), false)
})

// --- isFactuurVervallen --------------------------------------------------

test('isFactuurVervallen: een verzonden factuur met verstreken vervaldatum is vervallen', () => {
  assert.equal(isFactuurVervallen({ status: 'verzonden', vervaldatum: '2026-09-01' }, '2026-09-28'), true)
})

test('isFactuurVervallen: een verzonden factuur binnen de termijn is niet vervallen', () => {
  assert.equal(isFactuurVervallen({ status: 'verzonden', vervaldatum: '2026-10-15' }, '2026-09-28'), false)
})

test('isFactuurVervallen: nooit true voor concept/betaald/geannuleerd, ook niet met een verstreken datum', () => {
  assert.equal(isFactuurVervallen({ status: 'concept', vervaldatum: '2026-01-01' }, '2026-09-28'), false)
  assert.equal(isFactuurVervallen({ status: 'betaald', vervaldatum: '2026-01-01' }, '2026-09-28'), false)
  assert.equal(isFactuurVervallen({ status: 'geannuleerd', vervaldatum: '2026-01-01' }, '2026-09-28'), false)
})

test('isFactuurVervallen: wijzigt nooit de status zelf — puur een afgeleid signaal', () => {
  const factuur = { status: 'verzonden', vervaldatum: '2026-01-01' }
  isFactuurVervallen(factuur, '2026-09-28')
  assert.equal(factuur.status, 'verzonden')
})

// --- berekenFactuurRegel / berekenFactuurTotalen --------------------------------------------------

test('berekenFactuurRegel: standaardberekening met 21% btw', () => {
  const regel = berekenFactuurRegel({ aantal: 2, prijsExclBtw: 100, btwPercentage: 21 })
  assert.equal(regel.regelbedragExclBtw, 200)
  assert.equal(regel.btwBedrag, 42)
  assert.equal(regel.regelbedragInclBtw, 242)
})

test('berekenFactuurRegel: rondt af op centen', () => {
  const regel = berekenFactuurRegel({ aantal: 3, prijsExclBtw: 33.33, btwPercentage: 21 })
  assert.equal(regel.regelbedragExclBtw, 99.99)
  assert.equal(Number.isInteger(regel.btwBedrag * 100), true)
})

test('berekenFactuurTotalen: telt meerdere regels correct op', () => {
  const regels = [berekenFactuurRegel({ aantal: 1, prijsExclBtw: 100, btwPercentage: 21 }), berekenFactuurRegel({ aantal: 1, prijsExclBtw: 50, btwPercentage: 9 })]
  const totalen = berekenFactuurTotalen(regels)
  assert.equal(totalen.subtotaalExclBtw, 150)
  assert.equal(totalen.btwBedrag, 21 + 4.5)
  assert.equal(totalen.totaalInclBtw, 175.5)
})

test('berekenFactuurTotalen: lege regels-lijst geeft nul terug, geen crash', () => {
  assert.deepEqual(berekenFactuurTotalen([]), { subtotaalExclBtw: 0, btwBedrag: 0, totaalInclBtw: 0 })
  assert.deepEqual(berekenFactuurTotalen(), { subtotaalExclBtw: 0, btwBedrag: 0, totaalInclBtw: 0 })
})

// --- standaardVervaldatum --------------------------------------------------

test('standaardVervaldatum: telt het aantal dagen correct op', () => {
  assert.equal(standaardVervaldatum('2026-09-28', 14), '2026-10-12')
})

// --- bouwFactuurKlantSnapshot --------------------------------------------------

test('bouwFactuurKlantSnapshot: neemt klant- en contactpersoongegevens over als losse waarden', () => {
  const snapshot = bouwFactuurKlantSnapshot({
    klant: { naam: 'Jan', bedrijfsnaam: 'Jansen BV', email: 'jan@jansenbv.test', telefoon: '0612345678' },
    contactpersoon: { naam: 'Jan', rol: 'eigenaar', email: 'jan@jansenbv.test', telefoon: '0612345678' },
  })
  assert.equal(snapshot.klant.bedrijfsnaam, 'Jansen BV')
  assert.equal(snapshot.contactpersoon.rol, 'eigenaar')
})

test('bouwFactuurKlantSnapshot: contactpersoon is null zonder contactpersoon, geen crash', () => {
  const snapshot = bouwFactuurKlantSnapshot({ klant: { naam: 'Jan' }, contactpersoon: null })
  assert.equal(snapshot.contactpersoon, null)
})

// --- validatie --------------------------------------------------

test('valideerFactuurRegel: volledige, geldige regel wordt geaccepteerd', () => {
  assert.deepEqual(valideerFactuurRegel({ omschrijving: 'Advies', aantal: 1, prijsExclBtw: 100, btwPercentage: 21 }), {})
})

test('valideerFactuurRegel: ontbrekende/ongeldige velden worden geweigerd', () => {
  assert.ok(valideerFactuurRegel({ omschrijving: '', aantal: 1, prijsExclBtw: 100, btwPercentage: 21 }).omschrijving)
  assert.ok(valideerFactuurRegel({ omschrijving: 'X', aantal: 0, prijsExclBtw: 100, btwPercentage: 21 }).aantal)
  assert.ok(valideerFactuurRegel({ omschrijving: 'X', aantal: 1, prijsExclBtw: -5, btwPercentage: 21 }).prijsExclBtw)
  assert.ok(valideerFactuurRegel({ omschrijving: 'X', aantal: 1, prijsExclBtw: 100, btwPercentage: -1 }).btwPercentage)
})

test('valideerNieuweFactuur: klant, vervaldatum en minstens één regel zijn verplicht', () => {
  const fouten = valideerNieuweFactuur({})
  assert.ok(fouten.klantId)
  assert.ok(fouten.vervaldatum)
  assert.ok(fouten.regels)
})

test('valideerNieuweFactuur: volledige invoer wordt geaccepteerd', () => {
  const fouten = valideerNieuweFactuur({ klantId: 'k1', vervaldatum: '2026-10-12', regels: [{ omschrijving: 'Advies' }] })
  assert.deepEqual(fouten, {})
})

// --- bouwFactuurRegelsVanuitOfferte --------------------------------------------------

function fictieveOfferte(overrides = {}) {
  return {
    bedrag: 995,
    btw_percentage: 21,
    meerwerk: [],
    snapshot: { pakket: { naam: 'Premium', subtitle: 'Volledige analyse · met locatiebezoek' } },
    ...overrides,
  }
}

test('bouwFactuurRegelsVanuitOfferte: bouwt één regel voor het pakket met het daadwerkelijke offertebedrag', () => {
  const regels = bouwFactuurRegelsVanuitOfferte(fictieveOfferte())
  assert.equal(regels.length, 1)
  assert.match(regels[0].omschrijving, /Premium/)
  assert.equal(regels[0].prijsExclBtw, 995)
  assert.equal(regels[0].regelbedragExclBtw, 995)
})

test('bouwFactuurRegelsVanuitOfferte: voegt per meerwerkregel een aparte factuurregel toe', () => {
  const offerte = fictieveOfferte({ meerwerk: [{ omschrijving: 'Extra opname', aantal: 2, eenheidsprijs: 95, totaal: 190 }] })
  const regels = bouwFactuurRegelsVanuitOfferte(offerte)
  assert.equal(regels.length, 2)
  assert.equal(regels[1].omschrijving, 'Extra opname')
  assert.equal(regels[1].regelbedragExclBtw, 190)
})

test('bouwFactuurRegelsVanuitOfferte: gebruikt het btw-percentage van de offerte zelf, niet een aparte constante', () => {
  const regels = bouwFactuurRegelsVanuitOfferte(fictieveOfferte({ btw_percentage: 9 }))
  assert.equal(regels[0].btwPercentage, 9)
  assert.equal(regels[0].btwBedrag, 89.55)
})

test('bouwFactuurRegelsVanuitOfferte: valt terug op een neutrale omschrijving zonder pakketnaam', () => {
  const regels = bouwFactuurRegelsVanuitOfferte(fictieveOfferte({ snapshot: {} }))
  assert.equal(regels[0].omschrijving, 'Dienstverlening SMV Advies')
})

// --- buildFactuurMailto --------------------------------------------------

function fictieveFactuur(overrides = {}) {
  return {
    factuurnummer: 'SMV-FAC-2026-0004',
    vervaldatum: '2026-10-12',
    totaal_incl_btw: 1203.95,
    klant_snapshot: { klant: { naam: 'Jan', bedrijfsnaam: 'Jansen BV', email: 'jan@jansenbv.test' }, contactpersoon: null },
    ...overrides,
  }
}

function fictieveInstellingen(overrides = {}) {
  return {
    bedrijfsnaam: 'SMV Advies',
    iban: 'NL00BANK0123456789',
    tenaamstelling: 'SMV Advies',
    betalingsvoorwaarden: 'Standaard betalingsvoorwaarden.',
    ...overrides,
  }
}

test('buildFactuurMailto: stuurt naar het klant-e-mailadres uit de snapshot', () => {
  const href = buildFactuurMailto(fictieveFactuur(), fictieveInstellingen())
  assert.match(href, /^mailto:jan@jansenbv\.test\?/)
})

test('buildFactuurMailto: bevat factuurnummer en bedrag, geen interne velden', () => {
  const href = buildFactuurMailto(fictieveFactuur(), fictieveInstellingen())
  const decoded = decodeURIComponent(href)
  assert.match(decoded, /SMV-FAC-2026-0004/)
  assert.match(decoded, /1\.203,95/)
  assert.doesNotMatch(decoded, /dossier_id/)
  assert.doesNotMatch(decoded, /commerci/i)
})

// --- afgeleidBetreft / afgeleidBtwPercentage (factuursjabloon-ronde) --------------------------------------------------

test('afgeleidBetreft: neemt de omschrijving van de eerste regel over (de hoofdregel)', () => {
  const regels = bouwFactuurRegelsVanuitOfferte(fictieveOfferte({ meerwerk: [{ omschrijving: 'Extra opname', aantal: 1, eenheidsprijs: 95, totaal: 95 }] }))
  assert.match(afgeleidBetreft(regels), /Premium/)
})

test('afgeleidBetreft: null bij lege regel-lijst, geen crash', () => {
  assert.equal(afgeleidBetreft([]), null)
  assert.equal(afgeleidBetreft(), null)
})

test('afgeleidBtwPercentage: geeft het gedeelde percentage terug als alle regels hetzelfde tarief hanteren', () => {
  const regels = bouwFactuurRegelsVanuitOfferte(fictieveOfferte({ meerwerk: [{ omschrijving: 'Extra opname', aantal: 1, eenheidsprijs: 95, totaal: 95 }] }))
  assert.equal(afgeleidBtwPercentage(regels), 21)
})

test('afgeleidBtwPercentage: null bij afwijkende percentages tussen regels — verzint nooit een gemiddelde', () => {
  const regels = [
    { omschrijving: 'A', btwPercentage: 21 },
    { omschrijving: 'B', btwPercentage: 9 },
  ]
  assert.equal(afgeleidBtwPercentage(regels), null)
})

test('afgeleidBtwPercentage: null bij lege regel-lijst, geen crash', () => {
  assert.equal(afgeleidBtwPercentage([]), null)
  assert.equal(afgeleidBtwPercentage(), null)
})
