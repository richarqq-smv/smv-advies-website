/**
 * Supabase-backed data-toegang voor de echte klantomgeving (/account,
 * /dossier/:id) en het adminoverzicht (/admin). Losstaand van
 * src/lib/dossier/ (dat blijft de localStorage-gebaseerde interne
 * MJOP-Tool-flow, ongewijzigd) — dit is de nieuwe laag die tegen de
 * echte, RLS-beveiligde Supabase-database praat.
 *
 * Elke functie hier is een dunne wrapper om precies één Supabase-call.
 * RLS in de database is de echte beveiligingsgrens (zie
 * supabase/migrations/*.sql en SECURITY_MODEL.md) — deze module voegt
 * geen eigen autorisatielogica toe, alleen dataverkeer.
 */
import { supabase } from '../supabaseClient'

function throwOnError({ data, error }) {
  if (error) throw error
  return data
}

// --- Eigen profiel/klant -------------------------------------------------

/** Mijn profiel (naam/telefoon/email) — bestaat altijd na inloggen (handle_new_user-trigger). */
export async function getMijnProfiel() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return throwOnError(await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle())
}

/**
 * Mijn Klant, via mijn eigen Contactpersoon-rij (account_id = ik). `null`
 * als ik nog geen Klant heb geregistreerd. Eén contactpersoon per account
 * in dit self-service-pad (afgedwongen door registreer_klant()).
 */
export async function getMijnKlant() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const contactpersoon = throwOnError(
    await supabase.from('contactpersonen').select('*, klanten(*)').eq('account_id', user.id).maybeSingle(),
  )
  if (!contactpersoon) return null
  return { klant: contactpersoon.klanten, contactpersoon }
}

/** Registreert (eenmalig) een Klant + mijzelf als eigenaar-Contactpersoon. Atomair, zie 0001_init.sql. */
export async function registreerKlant({ naam, bedrijfsnaam, email, telefoon }) {
  return throwOnError(
    await supabase.rpc('registreer_klant', { p_naam: naam, p_bedrijfsnaam: bedrijfsnaam, p_email: email, p_telefoon: telefoon }),
  )
}

// --- Pand ------------------------------------------------------------------

export async function listPandenVoorKlant(klantId) {
  const rows = throwOnError(
    await supabase.from('klant_pand_relaties').select('pand_id, panden(*)').eq('klant_id', klantId).order('aangemaakt_op', { ascending: false }),
  )
  return (rows ?? []).map((r) => r.panden)
}

/**
 * Maakt een nieuw Pand aan en koppelt het atomair aan de Klant. Kan nooit aan
 * een bestaand Pand koppelen (zie 0001_init.sql). Uitvoerbaar door een lid
 * van de klant én (sinds 0006) door een admin voor elke klant.
 */
export async function maakPandEnKoppel(klantId, pandInput) {
  const pandId = throwOnError(await supabase.rpc('maak_pand_en_koppel', { p_klant_id: klantId, p_pand: pandInput }))
  return throwOnError(await supabase.from('panden').select('*').eq('pand_id', pandId).single())
}

/**
 * Werkt een al bestaand, al aan de Klant gekoppeld Pand bij — bijv. wanneer
 * dezelfde MJOP-building opnieuw wordt opgeslagen (zelfde regel als de
 * bestaande lib/dossier/mjopKoppeling.js: "update in plaats van dupliceren"
 * bij een tweede opslag voor dezelfde building). Toegestaan via de
 * panden_update-policy (is_member_of_klant via klant_pand_relaties) —
 * geen aparte RPC nodig, dit is geen aanmaak- maar een wijzigactie.
 *
 * Neemt bewust hetzelfde camelCase `pandInput`-formaat als
 * maak_pand_en_koppel()'s `p_pand`-parameter (zie 0001_init.sql en
 * lib/dossier/mjopAdapter.js's buildingToPandInput()) — dezelfde
 * aanroeper kan dus zonder omzetting tussen "nieuw pand" en "bestaand
 * pand bijwerken" kiezen. De snake_case-vertaling gebeurt hier, niet bij
 * de aanroeper.
 */
export async function updatePand(pandId, pandInput) {
  const changes = {
    omschrijving: pandInput.omschrijving,
    adres: pandInput.adres,
    postcode: pandInput.postcode,
    plaats: pandInput.plaats,
    bouwjaar: pandInput.bouwjaar,
    gebruikstype: pandInput.gebruikstype,
    vloeroppervlak: pandInput.vloeroppervlak,
    bouwlagen: pandInput.bouwlagen,
    gebruikers: pandInput.gebruikers,
    energiebron: pandInput.energiebron,
    verwarmingssysteem_type: pandInput.verwarmingssysteemType,
    energielabel: pandInput.energielabel,
    opmerkingen: pandInput.opmerkingen,
  }
  Object.keys(changes).forEach((key) => changes[key] === undefined && delete changes[key])
  return throwOnError(await supabase.from('panden').update(changes).eq('pand_id', pandId).select('*').single())
}

// --- Dossier + advieslaag ---------------------------------------------------

export async function listDossiersVoorKlant(klantId) {
  return throwOnError(
    await supabase.from('dossiers').select('*, panden(*)').eq('klant_id', klantId).order('created_at', { ascending: false }),
  )
}

export async function getDossier(dossierId) {
  return throwOnError(
    await supabase.from('dossiers').select('*, panden(*), klanten(*), contactpersonen(*)').eq('dossier_id', dossierId).single(),
  )
}

export async function listAdviespunten(dossierId) {
  return throwOnError(
    await supabase.from('adviespunten').select('*').eq('dossier_id', dossierId).order('created_at', { ascending: true }),
  )
}

/** Het al bestaande open Dossier voor deze Klant + dit Pand, of `null`. */
async function vindOpenDossier(klantId, pandId) {
  return throwOnError(
    await supabase.from('dossiers').select('*, panden(*)').eq('klant_id', klantId).eq('pand_id', pandId).eq('status', 'open').maybeSingle(),
  )
}

/**
 * Opent een Adviesdossier voor een Klant + Pand — of hergebruikt een al
 * bestaand open Dossier voor exact deze combinatie (zelfde regel als de
 * bestaande interne flow, lib/dossier/openDossier.js). Retourneert
 * `{ dossier, hergebruikt }`.
 *
 * `mjopSnapshot` (optioneel) is het resultaat van
 * lib/dossier/mjopAdapter.js's createMjopSnapshotFromBuilding() —
 * dezelfde bevroren, onafhankelijke momentopname als de bestaande
 * localStorage-flow al gebruikt, hier alleen naar `dossiers.mjop_snapshot`
 * geschreven in plaats van naar een localStorage-koppelrecord. Bij een
 * hergebruikt (al bestaand) Dossier wordt de snapshot NIET overschreven —
 * zie DATABASE_ARCHITECTURE.md, "MJOP-snapshot en immutabiliteit": een
 * Dossier legt vast wat gold toen het werd geopend, niet wat er later
 * verandert aan het Pand of de MJOP-data.
 *
 * Sinds migration 0006 alleen uitvoerbaar door een admin: een dossier is
 * een SMV-product en ontstaat pas als SMV met een traject aan de slag gaat.
 * Hetzelfde geldt voor alle schrijfacties hieronder (adviespunten en
 * completeDossier) — een klant krijgt daarop een RLS-weigering.
 */
export async function openOfHergebruikDossier({ klantId, pandId, pand, primaireContactpersoonId = null, mjopSnapshot = null }) {
  const bestaand = await vindOpenDossier(klantId, pandId)
  if (bestaand) return { dossier: bestaand, hergebruikt: true }

  const pandSnapshot = {
    bouwjaar: pand.bouwjaar ?? null,
    gebruikstype: pand.gebruikstype ?? null,
    vloeroppervlak: pand.vloeroppervlak ?? null,
    bouwlagen: pand.bouwlagen ?? null,
    gebruikers: pand.gebruikers ?? null,
    energiebron: pand.energiebron ?? null,
    verwarmingssysteemType: pand.verwarmingssysteem_type ?? null,
    energielabel: pand.energielabel ?? null,
  }
  const dossier = throwOnError(
    await supabase
      .from('dossiers')
      .insert({
        klant_id: klantId,
        pand_id: pandId,
        primaire_contactpersoon_id: primaireContactpersoonId,
        pand_snapshot: pandSnapshot,
        mjop_snapshot: mjopSnapshot,
      })
      .select('*, panden(*)')
      .single(),
  )
  return { dossier, hergebruikt: false }
}

/**
 * Legt een MJOP-momentopname vast op een al bestaand, open Dossier — maar
 * uitsluitend als dat Dossier er nog geen heeft (`mjop_snapshot is null`).
 * Een bestaande snapshot wordt nooit overschreven: dat is vastgelegde
 * historie. Geeft het bijgewerkte Dossier terug, of `null` als er niets is
 * vastgelegd (er stond al een snapshot, of het Dossier is niet open).
 * Alleen een admin mag dit (RLS dossiers_update_admin, migration 0006).
 */
export async function legMjopSnapshotVastAlsLeeg(dossierId, mjopSnapshot) {
  const rijen = throwOnError(
    await supabase
      .from('dossiers')
      .update({ mjop_snapshot: mjopSnapshot })
      .eq('dossier_id', dossierId)
      .eq('status', 'open')
      .is('mjop_snapshot', null)
      .select('*, panden(*)'),
  )
  return rijen?.[0] ?? null
}

export async function addAdviespunt(dossierId, { onderwerp, herkomst, adviesStatus, toelichting, herbeoordelenBij = null, signaalBevroren = null }) {
  return throwOnError(
    await supabase
      .from('adviespunten')
      .insert({
        dossier_id: dossierId,
        onderwerp: onderwerp.trim(),
        herkomst,
        advies_status: adviesStatus,
        toelichting: toelichting.trim(),
        herbeoordelen_bij: herbeoordelenBij?.trim() || null,
        signaal_bevroren: signaalBevroren,
      })
      .select('*')
      .single(),
  )
}

export async function updateAdviespunt(adviespuntId, { onderwerp, adviesStatus, toelichting, herbeoordelenBij }) {
  const changes = {}
  if (onderwerp !== undefined) changes.onderwerp = onderwerp.trim()
  if (adviesStatus !== undefined) changes.advies_status = adviesStatus
  if (toelichting !== undefined) changes.toelichting = toelichting.trim()
  if (herbeoordelenBij !== undefined) changes.herbeoordelen_bij = herbeoordelenBij?.trim() || null
  return throwOnError(await supabase.from('adviespunten').update(changes).eq('adviespunt_id', adviespuntId).select('*').single())
}

export async function removeAdviespunt(adviespuntId) {
  const { error } = await supabase.from('adviespunten').delete().eq('adviespunt_id', adviespuntId)
  if (error) throw error
}

export async function completeDossier(dossierId) {
  return throwOnError(await supabase.from('dossiers').update({ status: 'afgerond' }).eq('dossier_id', dossierId).select('*, panden(*)').single())
}

// --- Offerte -----------------------------------------------------------------
//
// Uitsluitend admin (RLS: offertes_insert_admin vereist is_admin(), zie
// 0005_offertes.sql). `offerte_nummer` wordt nooit meegegeven — die komt
// altijd uit de kolom-DEFAULT (genereer_offerte_nummer()), dus een niet
// opgeslagen formulier verbruikt nooit een nummer. Alle berekeningen
// (subtotaal/btw/totaal) en de snapshot zelf worden door de aanroeper
// aangeleverd — deze functie is een dunne insert, zie
// lib/klantOmgeving/offerte.js voor de berekenings-/snapshotlogica.
export async function createOfferte({
  klantId,
  pandId,
  dossierId,
  geldigTot,
  pakketId,
  bedrag,
  meerwerk,
  subtotaal,
  btwPercentage,
  btwBedrag,
  totaal,
  opmerkingen,
  snapshot,
}) {
  return throwOnError(
    await supabase
      .from('offertes')
      .insert({
        klant_id: klantId,
        pand_id: pandId,
        dossier_id: dossierId,
        geldig_tot: geldigTot,
        pakket_id: pakketId,
        bedrag,
        meerwerk,
        subtotaal,
        btw_percentage: btwPercentage,
        btw_bedrag: btwBedrag,
        totaal,
        opmerkingen: opmerkingen?.trim() || null,
        snapshot,
      })
      .select('*')
      .single(),
  )
}

/**
 * Eén offerte, voor de preview/printweergave (Fase 3). Geeft de rij zelf
 * terug (incl. `snapshot`) — de render gebruikt uitsluitend `snapshot` voor
 * klant/pand/contactpersoon/pakketinhoud en de top-level financiële kolommen
 * (bedrag/subtotaal/btw_bedrag/totaal/meerwerk) voor de bedragen, nooit
 * live `klanten`/`panden`/`packages.js`-data. RLS (offertes_select_admin)
 * is de enige toegangsgrens — deze functie is een kale select.
 */
export async function getOfferte(offerteId) {
  return throwOnError(await supabase.from('offertes').select('*').eq('id', offerteId).single())
}

/** Offertehistorie van één Dossier (Fase 4), nieuwste eerst — zelfde `offertes_select_admin`-policy als getOfferte(). */
export async function getOffertesVoorDossier(dossierId) {
  return throwOnError(
    await supabase.from('offertes').select('*').eq('dossier_id', dossierId).order('created_at', { ascending: false }),
  )
}

/**
 * Verwijdert één offerte. Alleen een concept kan hierdoor daadwerkelijk
 * verdwijnen — `offertes_delete_admin_concept` (0005_offertes.sql) staat
 * uitsluitend `status = 'concept'` toe. Een DELETE die door RLS'
 * USING-voorwaarde wordt tegengehouden geeft geen `error` terug (dat doet
 * alleen een WITH CHECK-schending bij INSERT/UPDATE) — hij verwijdert
 * gewoon 0 rijen. Vandaar `.select('id')`: alleen als er daadwerkelijk een
 * rij terugkomt, is er ook echt iets verwijderd; anders gooien we zelf een
 * fout, zodat een geblokkeerde verwijdering (niet-concept) in de UI ook
 * echt als mislukt wordt getoond in plaats van stilzwijgend niets te doen.
 */
export async function deleteOfferte(offerteId) {
  const { data, error } = await supabase.from('offertes').delete().eq('id', offerteId).select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Verwijderen is niet toegestaan voor deze offerte.')
}

// --- Admin -------------------------------------------------------------------
//
// Geen aparte adminfuncties nodig voor lezen: elke policy hierboven staat
// ook `public.is_admin()` toe, dus dezelfde SELECT-queries geven een admin
// automatisch alle klanten/panden/dossiers terug. Alleen waar een admin iets
// mag dat een klant niet mag (rechtstreeks een Klant/Pand/koppeling
// aanmaken, buiten de RPC's om — voor de lokale-data-import), staat hieronder
// een eigen functie.

export async function checkIsAdmin() {
  return throwOnError(await supabase.rpc('is_admin'))
}

export async function adminListKlanten() {
  return throwOnError(await supabase.from('klanten').select('*, contactpersonen(count), dossiers(count)').order('created_at', { ascending: false }))
}

export async function adminListDossiers() {
  return throwOnError(
    await supabase.from('dossiers').select('*, klanten(naam, bedrijfsnaam), panden(*)').order('created_at', { ascending: false }),
  )
}

/**
 * Rechtstreeks (niet via registreer_klant/maak_pand_en_koppel) een Klant +
 * Pand + koppeling + Dossier + adviespunten aanmaken — alleen toegestaan
 * voor een admin (klanten_insert_admin/panden_insert_admin/kpr_insert_admin
 * vereisen allemaal is_admin()). Uitsluitend gebruikt door de
 * lokale-data-import op /admin: historische localStorage-demodata heeft
 * geen bijbehorend account_id (die klanten hebben nooit ingelogd), dus kan
 * niet via het self-service-pad (registreer_klant) worden aangemaakt.
 */
export async function adminImporteerKlant({ klant, panden, dossiers }) {
  const nieuweKlant = throwOnError(
    await supabase.from('klanten').insert({ naam: klant.naam, bedrijfsnaam: klant.bedrijfsnaam, email: klant.email, telefoon: klant.telefoon }).select('*').single(),
  )
  const contactpersoonIdMap = new Map()
  for (const cp of klant.contactpersonen ?? []) {
    const rij = throwOnError(
      await supabase.from('contactpersonen').insert({ klant_id: nieuweKlant.klant_id, naam: cp.naam, email: cp.email, telefoon: cp.telefoon, rol: cp.rol }).select('*').single(),
    )
    contactpersoonIdMap.set(cp.contactpersoonId, rij.contactpersoon_id)
  }

  const pandIdMap = new Map()
  for (const pand of panden) {
    const rij = throwOnError(
      await supabase
        .from('panden')
        .insert({
          omschrijving: pand.omschrijving,
          adres: pand.adres,
          postcode: pand.postcode,
          plaats: pand.plaats,
          bouwjaar: pand.bouwjaar,
          gebruikstype: pand.gebruikstype,
          vloeroppervlak: pand.vloeroppervlak,
          bouwlagen: pand.bouwlagen,
          gebruikers: pand.gebruikers,
          energiebron: pand.energiebron,
          verwarmingssysteem_type: pand.verwarmingssysteemType,
          energielabel: pand.energielabel,
          opmerkingen: pand.opmerkingen,
          ontstaan_via: pand.ontstaanVia,
        })
        .select('*')
        .single(),
    )
    pandIdMap.set(pand.pandId, rij.pand_id)
    await supabase.from('klant_pand_relaties').insert({ klant_id: nieuweKlant.klant_id, pand_id: rij.pand_id })
  }

  for (const dossier of dossiers) {
    const nieuwPandId = pandIdMap.get(dossier.pandId)
    if (!nieuwPandId) continue
    const nieuweContactpersoonId = dossier.primaireContactpersoonId ? contactpersoonIdMap.get(dossier.primaireContactpersoonId) ?? null : null
    const nieuwDossier = throwOnError(
      await supabase
        .from('dossiers')
        .insert({
          klant_id: nieuweKlant.klant_id,
          pand_id: nieuwPandId,
          primaire_contactpersoon_id: nieuweContactpersoonId,
          status: 'open',
          pand_snapshot: dossier.pandSnapshot,
          contactpersoon_snapshot: dossier.contactpersoonSnapshot,
          mjop_snapshot: dossier.mjopSnapshot,
        })
        .select('*')
        .single(),
    )
    for (const advies of dossier.adviespunten ?? []) {
      await supabase.from('adviespunten').insert({
        dossier_id: nieuwDossier.dossier_id,
        onderwerp: advies.onderwerp,
        herkomst: advies.herkomst,
        signaal_bevroren: advies.signaalBevroren,
        advies_status: advies.adviesStatus,
        toelichting: advies.toelichting,
        herbeoordelen_bij: advies.herbeoordelenBij,
      })
    }
    if (dossier.status === 'afgerond') {
      await supabase.from('dossiers').update({ status: 'afgerond' }).eq('dossier_id', nieuwDossier.dossier_id)
    }
  }

  return nieuweKlant
}
