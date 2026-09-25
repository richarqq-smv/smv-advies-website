/**
 * Autorisatie van de advieslaag, getest tegen de echte migrations (zie
 * testDatabase.js). Uitgangspunt: een klant kan informatie aanleveren en
 * zijn eigen data bekijken, maar advies (adviespunten, adviesstatus,
 * afronden) en de dossierinhoud (snapshots) zijn uitsluitend werk van de
 * adviseur/admin. Klantisolatie tussen klanten moet ongewijzigd blijven.
 */
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { maakTestDatabase, alsGebruiker, maakAccount } from './testDatabase.js'

const KLANT_A = '00000000-0000-0000-0000-00000000000a'
const KLANT_B = '00000000-0000-0000-0000-00000000000b'
const ADMIN = '00000000-0000-0000-0000-0000000000ad'

let db
const ids = {}

async function verwachtRlsWeigering(belofte) {
  await assert.rejects(belofte, (err) => {
    assert.match(String(err.message), /row-level security|permission denied/)
    return true
  })
}

async function maakKlantMetPand(uid, naam) {
  return alsGebruiker(db, uid, async () => {
    const klantId = (await db.query(`select public.registreer_klant($1, $2, null, null) as id`, [naam, `${naam} BV`])).rows[0].id
    const pandId = (await db.query(`select public.maak_pand_en_koppel($1, $2::jsonb) as id`, [klantId, JSON.stringify({ omschrijving: `Pand ${naam}` })])).rows[0].id
    return { klantId, pandId }
  })
}

async function maakDossierAlsAdmin(klantId, pandId, mjopSnapshot = null) {
  return alsGebruiker(db, ADMIN, async () =>
    (
      await db.query(
        `insert into public.dossiers (klant_id, pand_id, pand_snapshot, mjop_snapshot) values ($1, $2, '{}'::jsonb, $3::jsonb) returning dossier_id`,
        [klantId, pandId, mjopSnapshot ? JSON.stringify(mjopSnapshot) : null],
      )
    ).rows[0].dossier_id,
  )
}

async function voegAdviespuntToeAlsAdmin(dossierId) {
  return alsGebruiker(db, ADMIN, async () =>
    (
      await db.query(
        `insert into public.adviespunten (dossier_id, onderwerp, herkomst, advies_status, toelichting)
         values ($1, 'Dak', 'handmatig', 'nu_onderzoeken', 'Toelichting van de adviseur') returning adviespunt_id`,
        [dossierId],
      )
    ).rows[0].adviespunt_id,
  )
}

before(async () => {
  db = await maakTestDatabase()
  await maakAccount(db, { id: KLANT_A, email: 'a@test.nl' })
  await maakAccount(db, { id: KLANT_B, email: 'b@test.nl' })
  await maakAccount(db, { id: ADMIN, email: 'admin@test.nl', admin: true })

  Object.assign(ids, { a: await maakKlantMetPand(KLANT_A, 'A'), b: await maakKlantMetPand(KLANT_B, 'B') })
  ids.dossierA = await maakDossierAlsAdmin(ids.a.klantId, ids.a.pandId, { components: [] })
  ids.adviespuntA = await voegAdviespuntToeAlsAdmin(ids.dossierA)
})

// --- Klant: geen advies schrijven -------------------------------------------

test('klant kan geen adviespunt aanmaken in zijn eigen open dossier', async () => {
  await alsGebruiker(db, KLANT_A, () =>
    verwachtRlsWeigering(
      db.query(
        `insert into public.adviespunten (dossier_id, onderwerp, herkomst, advies_status, toelichting)
         values ($1, 'Zelf bedacht', 'handmatig', 'geen_actie_nodig', 'x')`,
        [ids.dossierA],
      ),
    ),
  )
})

test('klant kan geen automatisch signaal fabriceren (adviespunt met herkomst automatisch)', async () => {
  await alsGebruiker(db, KLANT_A, () =>
    verwachtRlsWeigering(
      db.query(
        `insert into public.adviespunten (dossier_id, onderwerp, herkomst, signaal_bevroren, advies_status, toelichting)
         values ($1, 'Verzonnen', 'automatisch', '{"componentId":"dak"}'::jsonb, 'nu_onderzoeken', 'x')`,
        [ids.dossierA],
      ),
    ),
  )
})

test('klant kan geen adviespunt wijzigen, ook niet de adviesstatus', async () => {
  const resultaat = await alsGebruiker(db, KLANT_A, () =>
    db.query(`update public.adviespunten set advies_status = 'geen_actie_nodig', toelichting = 'gewijzigd' where adviespunt_id = $1`, [ids.adviespuntA]),
  )
  assert.equal(resultaat.affectedRows, 0)
  const rij = (await db.query(`select advies_status, toelichting from public.adviespunten where adviespunt_id = $1`, [ids.adviespuntA])).rows[0]
  assert.deepEqual(rij, { advies_status: 'nu_onderzoeken', toelichting: 'Toelichting van de adviseur' })
})

test('klant kan geen adviespunt verwijderen', async () => {
  const resultaat = await alsGebruiker(db, KLANT_A, () => db.query(`delete from public.adviespunten where adviespunt_id = $1`, [ids.adviespuntA]))
  assert.equal(resultaat.affectedRows, 0)
  assert.equal((await db.query(`select count(*)::int as n from public.adviespunten where adviespunt_id = $1`, [ids.adviespuntA])).rows[0].n, 1)
})

test('klant kan zijn dossier niet afronden', async () => {
  const resultaat = await alsGebruiker(db, KLANT_A, () => db.query(`update public.dossiers set status = 'afgerond' where dossier_id = $1`, [ids.dossierA]))
  assert.equal(resultaat.affectedRows, 0)
  assert.equal((await db.query(`select status from public.dossiers where dossier_id = $1`, [ids.dossierA])).rows[0].status, 'open')
})

test('klant kan de MJOP-snapshot of andere dossierinhoud niet aanpassen', async () => {
  const resultaat = await alsGebruiker(db, KLANT_A, () =>
    db.query(`update public.dossiers set mjop_snapshot = '{"components":["gemanipuleerd"]}'::jsonb, pand_snapshot = '{}'::jsonb where dossier_id = $1`, [ids.dossierA]),
  )
  assert.equal(resultaat.affectedRows, 0)
  assert.deepEqual((await db.query(`select mjop_snapshot from public.dossiers where dossier_id = $1`, [ids.dossierA])).rows[0].mjop_snapshot, { components: [] })
})

test('klant kan niet zelf een dossier starten', async () => {
  await alsGebruiker(db, KLANT_A, () =>
    verwachtRlsWeigering(
      db.query(`insert into public.dossiers (klant_id, pand_id, pand_snapshot) values ($1, $2, '{}'::jsonb)`, [ids.a.klantId, ids.a.pandId]),
    ),
  )
})

// --- Klant: wel eigen data bekijken, nooit die van een ander ----------------

test('klant ziet zijn eigen dossier, maar nog geen adviespunten zolang het advies niet is afgerond', async () => {
  const { dossiers, adviespunten } = await alsGebruiker(db, KLANT_A, async () => ({
    dossiers: (await db.query(`select dossier_id from public.dossiers`)).rows,
    adviespunten: (await db.query(`select adviespunt_id from public.adviespunten`)).rows,
  }))
  assert.deepEqual(dossiers.map((d) => d.dossier_id), [ids.dossierA])
  assert.equal(adviespunten.length, 0)
})

test('klant ziet de adviespunten van zijn dossier zodra de adviseur het heeft afgerond', async () => {
  const dossierId = await maakDossierAlsAdmin(ids.a.klantId, ids.a.pandId)
  const adviespuntId = await voegAdviespuntToeAlsAdmin(dossierId)
  await alsGebruiker(db, ADMIN, () => db.query(`update public.dossiers set status = 'afgerond' where dossier_id = $1`, [dossierId]))

  const zichtbaar = await alsGebruiker(db, KLANT_A, async () => (await db.query(`select adviespunt_id from public.adviespunten where dossier_id = $1`, [dossierId])).rows)
  assert.deepEqual(zichtbaar.map((r) => r.adviespunt_id), [adviespuntId])
})

test('klant B ziet niets van klant A (klantisolatie blijft intact)', async () => {
  const gezien = await alsGebruiker(db, KLANT_B, async () => ({
    klanten: (await db.query(`select klant_id from public.klanten where klant_id = $1`, [ids.a.klantId])).rows.length,
    dossiers: (await db.query(`select dossier_id from public.dossiers where klant_id = $1`, [ids.a.klantId])).rows.length,
    adviespunten: (await db.query(`select adviespunt_id from public.adviespunten`)).rows.length,
  }))
  assert.deepEqual(gezien, { klanten: 0, dossiers: 0, adviespunten: 0 })
})

test('een anonieme bezoeker ziet geen dossiers of adviespunten', async () => {
  const gezien = await alsGebruiker(db, null, async () => ({
    dossiers: (await db.query(`select 1 from public.dossiers`)).rows.length,
    adviespunten: (await db.query(`select 1 from public.adviespunten`)).rows.length,
  }))
  assert.deepEqual(gezien, { dossiers: 0, adviespunten: 0 })
})

test('klant kan nog steeds zelf informatie aanleveren: een pand toevoegen aan zijn eigen klant', async () => {
  const pandId = await alsGebruiker(db, KLANT_A, async () =>
    (await db.query(`select public.maak_pand_en_koppel($1, '{"omschrijving":"Tweede pand"}'::jsonb) as id`, [ids.a.klantId])).rows[0].id,
  )
  assert.ok(pandId)
})

// --- Adviseur/admin: behoudt alle adviesrechten ------------------------------

test('admin kan een dossier aanmaken, adviespunten maken, wijzigen en verwijderen, en afronden', async () => {
  const dossierId = await maakDossierAlsAdmin(ids.b.klantId, ids.b.pandId)
  await alsGebruiker(db, ADMIN, async () => {
    const adviespuntId = (
      await db.query(
        `insert into public.adviespunten (dossier_id, onderwerp, herkomst, signaal_bevroren, advies_status, toelichting)
         values ($1, 'Cv', 'automatisch', '{"componentId":"verwarming"}'::jsonb, 'meenemen_bij_vervanging', 'Bij vervanging meenemen') returning adviespunt_id`,
        [dossierId],
      )
    ).rows[0].adviespunt_id
    assert.equal((await db.query(`update public.adviespunten set advies_status = 'later_beoordelen' where adviespunt_id = $1`, [adviespuntId])).affectedRows, 1)
    const tweede = await db.query(
      `insert into public.adviespunten (dossier_id, onderwerp, herkomst, advies_status, toelichting) values ($1, 'Tijdelijk', 'handmatig', 'geen_actie_nodig', 'x') returning adviespunt_id`,
      [dossierId],
    )
    assert.equal((await db.query(`delete from public.adviespunten where adviespunt_id = $1`, [tweede.rows[0].adviespunt_id])).affectedRows, 1)
    assert.equal((await db.query(`update public.dossiers set status = 'afgerond' where dossier_id = $1`, [dossierId])).affectedRows, 1)
  })
})

test('admin kan geen dossier aanmaken voor een pand dat niet aan die klant is gekoppeld', async () => {
  await alsGebruiker(db, ADMIN, () =>
    verwachtRlsWeigering(db.query(`insert into public.dossiers (klant_id, pand_id, pand_snapshot) values ($1, $2, '{}'::jsonb)`, [ids.a.klantId, ids.b.pandId])),
  )
})

test('admin kan voor een klant een pand aanmaken en koppelen via maak_pand_en_koppel', async () => {
  const pandId = await alsGebruiker(db, ADMIN, async () =>
    (await db.query(`select public.maak_pand_en_koppel($1, '{"omschrijving":"Door SMV aangemaakt"}'::jsonb) as id`, [ids.b.klantId])).rows[0].id,
  )
  const gekoppeld = await db.query(`select 1 from public.klant_pand_relaties where klant_id = $1 and pand_id = $2`, [ids.b.klantId, pandId])
  assert.equal(gekoppeld.rows.length, 1)
})

// --- Afgerond dossier blijft afgerond ----------------------------------------

test('een afgerond dossier kan door niemand meer worden gewijzigd, ook niet door de admin', async () => {
  const dossierId = await maakDossierAlsAdmin(ids.b.klantId, ids.b.pandId)
  await alsGebruiker(db, ADMIN, async () => {
    await db.query(`update public.dossiers set status = 'afgerond' where dossier_id = $1`, [dossierId])
    await assert.rejects(db.query(`update public.dossiers set mjop_snapshot = '{}'::jsonb where dossier_id = $1`, [dossierId]), /afgerond Dossier/)
    await assert.rejects(
      db.query(`insert into public.adviespunten (dossier_id, onderwerp, herkomst, advies_status, toelichting) values ($1, 'Te laat', 'handmatig', 'geen_actie_nodig', 'x')`, [dossierId]),
      /afgerond Dossier/,
    )
  })
})

test('een adviespunt kan niet uit een afgerond dossier worden verplaatst naar een open dossier', async () => {
  const afgerondId = await maakDossierAlsAdmin(ids.b.klantId, ids.b.pandId)
  const adviespuntId = await voegAdviespuntToeAlsAdmin(afgerondId)
  await alsGebruiker(db, ADMIN, () => db.query(`update public.dossiers set status = 'afgerond' where dossier_id = $1`, [afgerondId]))
  const openId = await maakDossierAlsAdmin(ids.b.klantId, ids.b.pandId)

  await alsGebruiker(db, ADMIN, () =>
    assert.rejects(db.query(`update public.adviespunten set dossier_id = $1 where adviespunt_id = $2`, [openId, adviespuntId]), /afgerond Dossier/),
  )
  assert.equal((await db.query(`select dossier_id from public.adviespunten where adviespunt_id = $1`, [adviespuntId])).rows[0].dossier_id, afgerondId)
})
