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
import { isValidEnergieSnapshot } from '../dossier/energieAdapter.js'

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

/** Maakt een nieuw Pand aan en koppelt het atomair aan de Klant. Kan nooit aan een bestaand Pand koppelen (zie 0001_init.sql). */
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
 */
export async function openOfHergebruikDossier({ klantId, pandId, pand, primaireContactpersoonId = null, mjopSnapshot = null, pakketId = null }) {
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
        // Productworkflow-ronde (0025_dossiers_pakket_id.sql): optioneel,
        // "nog te bepalen" (null) blijft mogelijk — zie moduledoc daar.
        pakket_id: pakketId,
      })
      .select('*, panden(*)')
      .single(),
  )
  return { dossier, hergebruikt: false }
}

/**
 * Uitsluitend admin: het pakket wordt na dossieraanmaak bron van waarheid
 * voor workflow/rapportkeuze/pakketgrenzen (0025_dossiers_pakket_id.sql).
 * bewaak_dossier_integriteit() staat een niet-admin sowieso alleen
 * energie_snapshot toe, dus dit werkt voor een klant nooit — de UI toont
 * deze actie daarom uitsluitend bij magBeheren.
 */
export async function updateDossierPakket(dossierId, pakketId) {
  if (!dossierId) throw new Error('updateDossierPakket vereist een geldig dossier-ID.')
  return throwOnError(
    await supabase.from('dossiers').update({ pakket_id: pakketId }).eq('dossier_id', dossierId).select('*, panden(*)').single(),
  )
}

/**
 * Uitsluitend admin: Rc/U-waarden voor de bouwkundige analyse
 * (0027_dossiers_bouwkundige_analyse.sql) — vakinhoudelijk door de
 * adviseur ingevuld, nooit berekend. `analyse` is het volledige object
 * (alle 4 bouwdelen tegelijk), geen los-veld-patch: de adviseur bewerkt
 * dit altijd als geheel vanuit één formulier.
 */
export async function updateDossierBouwkundigeAnalyse(dossierId, analyse) {
  if (!dossierId) throw new Error('updateDossierBouwkundigeAnalyse vereist een geldig dossier-ID.')
  return throwOnError(
    await supabase.from('dossiers').update({ bouwkundige_analyse: analyse }).eq('dossier_id', dossierId).select('*, panden(*)').single(),
  )
}

/** Uitsluitend admin sinds de security-hardeningsronde (2026-09-28, adviespunten_insert/update/delete): alleen SMV zet een signaal om naar definitief advies. UI toont deze actie alleen bij magBeheren (zie DossierWerkruimte.jsx). */
export async function addAdviespunt(
  dossierId,
  {
    onderwerp,
    herkomst,
    adviesStatus,
    toelichting,
    herbeoordelenBij = null,
    herbeoordelenDatum = null,
    signaalBevroren = null,
    investeringLaag = null,
    investeringHoog = null,
    besparingEuro = null,
    terugverdientijdJaren = null,
    prioriteit = null,
  },
) {
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
        // Werkfase Fase 9: los, optioneel structureel datumveld naast de
        // bestaande vrije tekst — zie 0008_adviespunt_herbeoordelen_datum.sql.
        // Nooit uit herbeoordelenBij afgeleid: dat zou precies het gokken
        // zijn dat de migratie bewust vermijdt.
        herbeoordelen_datum: herbeoordelenDatum || null,
        signaal_bevroren: signaalBevroren,
        // Adviesrapport-ronde (0024_adviespunten_financiele_indicatie.sql):
        // altijd optioneel, nooit een verzonnen bedrag — zie moduledoc daar.
        investering_laag: investeringLaag,
        investering_hoog: investeringHoog,
        besparing_euro: besparingEuro,
        terugverdientijd_jaren: terugverdientijdJaren,
        prioriteit,
      })
      .select('*')
      .single(),
  )
}

export async function updateAdviespunt(
  adviespuntId,
  { onderwerp, adviesStatus, toelichting, herbeoordelenBij, herbeoordelenDatum, investeringLaag, investeringHoog, besparingEuro, terugverdientijdJaren, prioriteit },
) {
  const changes = {}
  if (onderwerp !== undefined) changes.onderwerp = onderwerp.trim()
  if (adviesStatus !== undefined) changes.advies_status = adviesStatus
  if (toelichting !== undefined) changes.toelichting = toelichting.trim()
  if (herbeoordelenBij !== undefined) changes.herbeoordelen_bij = herbeoordelenBij?.trim() || null
  if (herbeoordelenDatum !== undefined) changes.herbeoordelen_datum = herbeoordelenDatum || null
  if (investeringLaag !== undefined) changes.investering_laag = investeringLaag
  if (investeringHoog !== undefined) changes.investering_hoog = investeringHoog
  if (besparingEuro !== undefined) changes.besparing_euro = besparingEuro
  if (terugverdientijdJaren !== undefined) changes.terugverdientijd_jaren = terugverdientijdJaren
  if (prioriteit !== undefined) changes.prioriteit = prioriteit
  return throwOnError(await supabase.from('adviespunten').update(changes).eq('adviespunt_id', adviespuntId).select('*').single())
}

export async function removeAdviespunt(adviespuntId) {
  const { error } = await supabase.from('adviespunten').delete().eq('adviespunt_id', adviespuntId)
  if (error) throw error
}

/**
 * ============================================================
 * DOSSIER_TAKEN (0026_dossier_taken.sql) — generieke taakstructuur voor
 * subsidiebegeleiding en opleveringchecklist. Volledig admin-only (RLS),
 * zelfde patroon als planning_afspraken/dossier_commerciele_kansen.
 * ============================================================
 */

export async function listDossierTaken(dossierId) {
  return throwOnError(
    await supabase.from('dossier_taken').select('*').eq('dossier_id', dossierId).order('categorie').order('volgorde'),
  )
}

export async function addDossierTaak(dossierId, { adviespuntId = null, categorie, omschrijving, verantwoordelijke = null, deadline = null, volgorde = 0 }) {
  return throwOnError(
    await supabase
      .from('dossier_taken')
      .insert({
        dossier_id: dossierId,
        adviespunt_id: adviespuntId,
        categorie,
        omschrijving: omschrijving.trim(),
        verantwoordelijke: verantwoordelijke?.trim() || null,
        deadline: deadline || null,
        volgorde,
      })
      .select('*')
      .single(),
  )
}

/** Voegt de standaardset (bouwStandaardTaken() in lib/dossier/dossierTaken.js) in één keer toe — de aanroeper bepaalt zelf of dat zinvol is (bijv. alleen als de categorie nog leeg is), deze functie voegt gewoon toe wat wordt meegegeven. */
export async function addDossierTakenBulk(dossierId, taken) {
  if (!taken || taken.length === 0) return []
  return throwOnError(
    await supabase
      .from('dossier_taken')
      .insert(taken.map((t) => ({ dossier_id: dossierId, categorie: t.categorie, omschrijving: t.omschrijving, verantwoordelijke: t.verantwoordelijke, volgorde: t.volgorde })))
      .select('*'),
  )
}

export async function updateDossierTaak(taakId, { omschrijving, verantwoordelijke, deadline, status, notitie, documentId }) {
  const changes = {}
  if (omschrijving !== undefined) changes.omschrijving = omschrijving.trim()
  if (verantwoordelijke !== undefined) changes.verantwoordelijke = verantwoordelijke?.trim() || null
  if (deadline !== undefined) changes.deadline = deadline || null
  if (status !== undefined) changes.status = status
  if (notitie !== undefined) changes.notitie = notitie?.trim() || null
  if (documentId !== undefined) changes.document_id = documentId
  return throwOnError(await supabase.from('dossier_taken').update(changes).eq('taak_id', taakId).select('*').single())
}

export async function removeDossierTaak(taakId) {
  const { error } = await supabase.from('dossier_taken').delete().eq('taak_id', taakId)
  if (error) throw error
}

/** Uitsluitend admin: sinds de security-hardeningsronde (2026-09-28) blokkeert bewaak_dossier_integriteit() een statuswijziging door een niet-admin, ook al zou dossiers_update de rij zelf toestaan. De UI toont "Dossier afronden" alleen bij magBeheren (zie DossierWerkruimte.jsx). */
export async function completeDossier(dossierId) {
  return throwOnError(await supabase.from('dossiers').update({ status: 'afgerond' }).eq('dossier_id', dossierId).select('*, panden(*)').single())
}

/**
 * Archiveert een Dossier — geen delete, uitsluitend het losse
 * `gearchiveerd_op`-tijdstip zetten (0010_dossier_archief.sql), orthogonaal
 * aan `status`. `.is('gearchiveerd_op', null)` voorkomt een dubbele
 * archivering (en dus een verrassende gearchiveerd_op-overschrijving).
 * RLS (dossiers_update) is de enige echte toegangsgrens: een admin kan elk
 * dossier archiveren, een klant alleen een eigen open dossier — maar de UI
 * toont deze actie uitsluitend in de adminomgeving (zie Admin.jsx). Een
 * al-afgerond Dossier wordt hier niet apart gecontroleerd:
 * bewaak_dossier_integriteit() blokkeert sowieso elke wijziging zodra
 * status='afgerond', dus archiveren is structureel al beperkt tot actieve
 * (open) dossiers — precies zoals bedoeld.
 */
export async function archiveerDossier(dossierId) {
  if (!dossierId) throw new Error('archiveerDossier vereist een geldig dossier-ID.')
  return throwOnError(
    await supabase
      .from('dossiers')
      .update({ gearchiveerd_op: new Date().toISOString() })
      .eq('dossier_id', dossierId)
      .is('gearchiveerd_op', null)
      .select('*, panden(*)')
      .single(),
  )
}

/** Herstelt een gearchiveerd Dossier — zet `gearchiveerd_op` terug naar null, `status` blijft ongewijzigd (zie archiveerDossier hierboven). */
export async function herstelDossier(dossierId) {
  if (!dossierId) throw new Error('herstelDossier vereist een geldig dossier-ID.')
  return throwOnError(
    await supabase
      .from('dossiers')
      .update({ gearchiveerd_op: null })
      .eq('dossier_id', dossierId)
      .not('gearchiveerd_op', 'is', null)
      .select('*, panden(*)')
      .single(),
  )
}

/**
 * Archiveert een Klant EN cascade al zijn actieve dossiers mee (expliciete
 * productbeslissing, 0031_klant_archief.sql) — geen delete, alleen
 * `gearchiveerd_op`-tijdstippen zetten. Volgorde is bewust eerst de
 * dossiers, dan pas de klant: als de dossier-cascade onverhoopt faalt,
 * gooien we vóórdat de klant zelf gearchiveerd wordt, zodat er nooit een
 * tussenstaat "klant gearchiveerd, dossiers nog actief" blijft staan. Een
 * dossier dat al los was gearchiveerd (`.is('gearchiveerd_op', null)`) of
 * waarvan status='afgerond' is (bewaak_dossier_integriteit() blokkeert
 * elke wijziging op zo'n dossier sowieso) wordt bewust NIET meegenomen —
 * `gearchiveerd_via_klant: true` markeert alleen de dossiers die
 * daadwerkelijk via deze cascade zijn gearchiveerd, zodat herstelKlant()
 * hieronder weet welke dossiers bij het herstellen horen.
 */
export async function archiveerKlant(klantId) {
  if (!klantId) throw new Error('archiveerKlant vereist een geldig klant-ID.')
  const nu = new Date().toISOString()
  const { error: dossiersError } = await supabase
    .from('dossiers')
    .update({ gearchiveerd_op: nu, gearchiveerd_via_klant: true })
    .eq('klant_id', klantId)
    .eq('status', 'open')
    .is('gearchiveerd_op', null)
  if (dossiersError) throw dossiersError
  return throwOnError(
    await supabase.from('klanten').update({ gearchiveerd_op: nu }).eq('klant_id', klantId).is('gearchiveerd_op', null).select('*').single(),
  )
}

/**
 * Herstelt een gearchiveerde Klant — spiegelbeeld van archiveerKlant()
 * hierboven. Herstelt uitsluitend de dossiers die via déze klant-cascade
 * zijn gearchiveerd (`gearchiveerd_via_klant = true`); een dossier dat al
 * vóór of los van de klant-archivering apart was gearchiveerd
 * (archiveerDossier(), `gearchiveerd_via_klant` blijft daar `false`) blijft
 * gewoon gearchiveerd — dat was nooit onderdeel van deze actie.
 */
export async function herstelKlant(klantId) {
  if (!klantId) throw new Error('herstelKlant vereist een geldig klant-ID.')
  const { error: dossiersError } = await supabase
    .from('dossiers')
    .update({ gearchiveerd_op: null, gearchiveerd_via_klant: false })
    .eq('klant_id', klantId)
    .eq('gearchiveerd_via_klant', true)
  if (dossiersError) throw dossiersError
  return throwOnError(
    await supabase.from('klanten').update({ gearchiveerd_op: null }).eq('klant_id', klantId).not('gearchiveerd_op', 'is', null).select('*').single(),
  )
}

/**
 * Slaat een Energie-indicatie-snapshot op bij een bestaand Dossier
 * (Energie-indicatie Fase 2). Kale update van precies één kolom — nooit
 * ongecontroleerde extra velden, geen live calculator-state. RLS
 * (dossiers_update, 0001_init.sql) is de enige toegangsgrens: dezelfde
 * regel als voor elke andere Dossier-wijziging (eigen klant + open
 * Dossier, of admin). Een afgerond Dossier wordt hier niet apart
 * gecontroleerd — bewaak_dossier_integriteit() blokkeert dat al voor élke
 * kolom, dus deze functie hoeft die regel niet te dupliceren.
 */
export async function saveEnergieSnapshot(dossierId, snapshot) {
  if (!dossierId) throw new Error('saveEnergieSnapshot vereist een geldig dossier-ID.')
  if (!isValidEnergieSnapshot(snapshot)) {
    throw new Error('saveEnergieSnapshot vereist een geldige Energie-snapshot (versie, invoer, resultaat).')
  }
  return throwOnError(
    await supabase.from('dossiers').update({ energie_snapshot: snapshot }).eq('dossier_id', dossierId).select('*, panden(*)').single(),
  )
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
// Expliciete kolomselectie (Security-hardeningsronde, 2026-09-28): dekt
// precies wat OfferteDocument.jsx/OffertesHistorie.jsx tonen — `aangemaakt_
// door` (een interne auth.users-uuid, nooit gerenderd; dossierExport.js
// sluit deze kolom om dezelfde reden al uit een export) staat er bewust
// niet in. Deze functies zijn zichtbaar voor zowel admin als de eigen
// klant (offertes_select_klant, 0007_offertes_klant_select.sql).
const OFFERTE_KOLOMMEN =
  'id, klant_id, pand_id, dossier_id, offerte_nummer, status, offerte_datum, geldig_tot, verzonden_op, pakket_id, bedrag, meerwerk, subtotaal, btw_percentage, btw_bedrag, totaal, opmerkingen, snapshot, created_at, updated_at'

export async function getOfferte(offerteId) {
  return throwOnError(await supabase.from('offertes').select(OFFERTE_KOLOMMEN).eq('id', offerteId).single())
}

/** Offertehistorie van één Dossier (Fase 4), nieuwste eerst — zelfde `offertes_select_admin`/`offertes_select_klant`-policy als getOfferte(). */
export async function getOffertesVoorDossier(dossierId) {
  return throwOnError(
    await supabase.from('offertes').select(OFFERTE_KOLOMMEN).eq('dossier_id', dossierId).order('created_at', { ascending: false }),
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

/**
 * Wijzigt uitsluitend de `status`-kolom van een offerte. Nooit gecombineerd
 * met een inhoudelijke wijziging in dezelfde aanroep: de trigger
 * `bewaak_offerte_integriteit` staat dat sowieso niet toe (een
 * statusovergang bevriest bedrag/meerwerk/snapshot/etc. op hetzelfde
 * moment) — vandaar dat dit `.update()` uitsluitend `status` meestuurt,
 * zodat alle overige kolommen ongewijzigd blijven (NEW = OLD) en de trigger
 * nooit ten onrechte "inhoud + status tegelijk gewijzigd" ziet.
 *
 * Een ongeldige overgang (bijv. concept → geaccepteerd, of een overgang
 * vanuit een terminale status) geeft geen rij terug — RLS' `offertes_
 * update_admin` laat de UPDATE door (admin mag altijd proberen), maar de
 * `WITH CHECK`/trigger-combinatie wijst 'm af met een Postgres-foutmelding
 * (`raise exception`), die hier als gewone `error` naar boven komt.
 */
export async function updateOfferteStatus(offerteId, nieuweStatus) {
  return throwOnError(
    await supabase.from('offertes').update({ status: nieuweStatus }).eq('id', offerteId).select('*').single(),
  )
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

/**
 * Alleen actieve (niet-gearchiveerde) klanten — zelfde `.is(...)`-filter als
 * adminListDossiers() hieronder, nu op `klanten.gearchiveerd_op`
 * (0031_klant_archief.sql). Een gearchiveerde klant staat uitsluitend nog
 * in adminListGearchiveerdeKlanten() — dit is ook de klantenlijst die
 * AdminPlanning.jsx gebruikt om een afspraak aan te koppelen, dus een
 * gearchiveerde klant verschijnt daar terecht niet meer als keuze.
 */
export async function adminListKlanten() {
  return throwOnError(
    await supabase.from('klanten').select('*, contactpersonen(count), dossiers(count)').is('gearchiveerd_op', null).order('created_at', { ascending: false }),
  )
}

/** Spiegelbeeld van adminListKlanten() hierboven — uitsluitend voor de Archiefpagina (Archief.jsx). */
export async function adminListGearchiveerdeKlanten() {
  return throwOnError(
    await supabase
      .from('klanten')
      .select('*, contactpersonen(count), dossiers(count)')
      .not('gearchiveerd_op', 'is', null)
      .order('gearchiveerd_op', { ascending: false }),
  )
}

/**
 * Alleen actieve (niet-gearchiveerde) dossiers — het admin-overzicht op
 * /admin ("Klanten en dossiers"), en daarmee ook alles dat op die lijst
 * bouwt (VandaagOverzicht.jsx). Een gearchiveerd dossier staat uitsluitend
 * nog in adminListGearchiveerdeDossiers() hieronder — nooit in allebei
 * tegelijk, want `.is('gearchiveerd_op', null)` en `.not(...)` zijn elkaars
 * exacte tegenpolen op precies dezelfde kolom.
 */
export async function adminListDossiers() {
  return throwOnError(
    // `adviespunten(count)` (werkfase Fase 5 — "Vandaag voor SMV"): een
    // PostgREST-embedded aggregaat, geen aparte query per dossier (geen
    // N+1) — nodig om feitelijk te kunnen zeggen of een open dossier al
    // enig adviespunt heeft, zonder de volledige adviespunten-inhoud van
    // ieder dossier mee te moeten sturen.
    await supabase
      .from('dossiers')
      .select('*, klanten(naam, bedrijfsnaam), panden(*), adviespunten(count)')
      .is('gearchiveerd_op', null)
      .order('created_at', { ascending: false }),
  )
}

/** Spiegelbeeld van adminListDossiers() hierboven — uitsluitend voor de Archiefpagina (Archief.jsx). */
export async function adminListGearchiveerdeDossiers() {
  return throwOnError(
    await supabase
      .from('dossiers')
      .select('*, klanten(naam, bedrijfsnaam), panden(*), adviespunten(count)')
      .not('gearchiveerd_op', 'is', null)
      .order('gearchiveerd_op', { ascending: false }),
  )
}

/**
 * Alle offertes, admin-breed (werkfase Fase 5 — "Vandaag voor SMV" en Fase
 * 10 — offerte-opvolging). Zelfde `offertes_select_admin`-policy als de
 * bestaande per-dossier `getOffertesVoorDossier()`, hier zonder
 * `dossier_id`-filter. Embedt net genoeg dossier/klant/pand-context om een
 * regel in het overzicht te kunnen tonen en doorklikken, zonder een tweede
 * ronde queries per offerte.
 */
export async function adminListOffertes() {
  return throwOnError(
    await supabase
      .from('offertes')
      .select('*, dossiers(dossier_id, klanten(naam, bedrijfsnaam), panden(omschrijving, adres))')
      .order('created_at', { ascending: false }),
  )
}

/**
 * Alle adviespunten, admin-breed (werkfase Fase 8 — "Wat kan wachten?" als
 * dossier-overstijgende SMV-functie). Zelfde `adviespunten_select`-policy
 * (0001_init.sql, staat ook `is_admin()` toe) als de bestaande per-dossier
 * `listAdviespunten()`, hier zonder `dossier_id`-filter. Filtering op
 * "alleen open dossiers" gebeurt bewust client-side (in
 * WatKanWachten.jsx) — geen embedded-filter op een geneste relatie nodig
 * voor dit datavolume, en dit houdt de query zelf eenvoudig.
 */
export async function adminListAdviespunten() {
  return throwOnError(
    await supabase
      .from('adviespunten')
      .select('*, dossiers(dossier_id, status, klanten(naam, bedrijfsnaam), panden(omschrijving, adres))')
      .order('created_at', { ascending: true }),
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

// --- Admin-planning (2026-09-28) ---------------------------------------------
//
// Volledig admin-only: planning_afspraken heeft uitsluitend admin-only
// RLS-policies (0011_admin_planning.sql, geen enkele policy voor een
// klant) — deze functies voegen zelf geen extra autorisatie toe, RLS is
// de enige echte grens, precies zoals de rest van dit bestand.

/**
 * Afspraken binnen een datumbereik (inclusief), met net genoeg
 * klant-/dossier-/pandcontext om een blok in de weekplanning te kunnen
 * tonen (naam/pand) en door te klikken naar het bestaande dossier — geen
 * tweede dossierweergave.
 */
export async function listAfspraken({ vanaf, tot }) {
  return throwOnError(
    await supabase
      .from('planning_afspraken')
      .select('*, klanten(naam, bedrijfsnaam), dossiers(dossier_id, panden(omschrijving, adres))')
      .gte('datum', vanaf)
      .lte('datum', tot)
      .order('datum', { ascending: true })
      .order('starttijd', { ascending: true }),
  )
}

export async function createAfspraak({ onderwerp, type, datum, starttijd, eindtijd, klantId = null, dossierId = null, notitie = null }) {
  return throwOnError(
    await supabase
      .from('planning_afspraken')
      .insert({
        onderwerp: onderwerp.trim(),
        type,
        datum,
        starttijd,
        eindtijd,
        klant_id: klantId,
        dossier_id: dossierId,
        notitie: notitie?.trim() || null,
      })
      .select('*, klanten(naam, bedrijfsnaam), dossiers(dossier_id, panden(omschrijving, adres))')
      .single(),
  )
}

export async function updateAfspraak(
  afspraakId,
  { onderwerp, type, datum, starttijd, eindtijd, status, klantId, dossierId, notitie },
) {
  const changes = { updated_at: new Date().toISOString() }
  if (onderwerp !== undefined) changes.onderwerp = onderwerp.trim()
  if (type !== undefined) changes.type = type
  if (datum !== undefined) changes.datum = datum
  if (starttijd !== undefined) changes.starttijd = starttijd
  if (eindtijd !== undefined) changes.eindtijd = eindtijd
  if (status !== undefined) changes.status = status
  if (klantId !== undefined) changes.klant_id = klantId
  if (dossierId !== undefined) changes.dossier_id = dossierId
  if (notitie !== undefined) changes.notitie = notitie?.trim() || null
  return throwOnError(
    await supabase
      .from('planning_afspraken')
      .update(changes)
      .eq('afspraak_id', afspraakId)
      .select('*, klanten(naam, bedrijfsnaam), dossiers(dossier_id, panden(omschrijving, adres))')
      .single(),
  )
}

/** Verwijdert uitsluitend de afspraak zelf — geen cascade, klant/dossierdata blijft altijd onaangeroerd (er is ook geen enkele FK die die kant op wijst). */
export async function verwijderAfspraak(afspraakId) {
  const { error } = await supabase.from('planning_afspraken').delete().eq('afspraak_id', afspraakId)
  if (error) throw error
}

// --- Telefonische-afspraakplanner voor de klant (2026-10-05) ----------------
//
// Alle drie onderstaande functies zijn dunne wrappers om de gelijknamige
// SECURITY DEFINER-RPC's uit migratie 0032_telefonische_afspraak_planner.sql
// — geen eigen autorisatielogica hier, exact zoals de rest van dit bestand.
// Er is bewust GEEN directe `.from('planning_afspraken')`-query voor de
// klant: die tabel heeft uitsluitend admin-only RLS-policies (0011), dus
// elke klanttoegang loopt via deze drie functies.

/** Beschikbare starttijden op `datumIso` ("YYYY-MM-DD") voor de klant — uitsluitend een lijst "HH:MM"-starttijden, nooit onderliggende afspraakgegevens van anderen. */
export async function getBeschikbareMomenten(datumIso) {
  const rijen = throwOnError(await supabase.rpc('beschikbare_momenten', { p_datum: datumIso }))
  return (rijen ?? []).map((r) => r.starttijd.slice(0, 5))
}

/** Mijn eigen telefonische adviesgesprek(ken) voor dit dossier (meest recente eerst), of `null` als er nog geen is. */
export async function getMijnTelefonischeAfspraak(dossierId) {
  const rijen = throwOnError(await supabase.rpc('mijn_telefonische_afspraak', { p_dossier_id: dossierId }))
  return rijen?.[0] ?? null
}

/**
 * Boekt een telefonisch adviesgesprek van 30 minuten op `datumIso`/`starttijd`
 * ("HH:MM") voor dit dossier. Alle autorisatie/validatie/overlapcontrole
 * gebeurt server-side in de RPC — zie migratie 0032 voor de volledige lijst
 * controles. Gooit een leesbare Nederlandse foutmelding door bij een
 * conflict (race condition) of een geweigerde boeking, nooit een rauwe
 * Postgres-foutcode richting de UI.
 */
export async function boekTelefonischeAfspraak(dossierId, datumIso, starttijd) {
  const { data, error } = await supabase.rpc('boek_telefonische_afspraak', {
    p_dossier_id: dossierId,
    p_datum: datumIso,
    p_starttijd: starttijd,
  })
  if (error) {
    if (error.code === '23P01') throw new Error('Dit moment is net niet meer beschikbaar. Kies een ander moment.')
    throw new Error('Boeken is niet gelukt. Probeer het opnieuw.')
  }
  return data?.[0] ?? null
}

// --- Interne commerciële kans per dossier (2026-09-28) -----------------------
//
// Volledig admin-only, zelfde reden als hierboven — zie
// 0012_dossier_commerciele_kansen.sql. Bewust een losse tabel i.p.v. een
// kolom op `dossiers`: getDossier() hieronder is een `select('*', ...)`
// die zowel een klant als een admin gebruikt, dus een veld op `dossiers`
// zelf zou met elke klant-fetch meekomen. Deze tabel wordt nooit vanuit
// een klantpad aangeroepen.

/** De vastgelegde commerciële kans van één dossier, of `null` als er nog nooit iets is opgeslagen. */
export async function getCommercieleKans(dossierId) {
  const { data, error } = await supabase.from('dossier_commerciele_kansen').select('*').eq('dossier_id', dossierId).maybeSingle()
  if (error) throw error
  return data
}

/**
 * Slaat de commerciële kans van een dossier op — upsert, want er is
 * precies één rij per dossier (dossier_id is de primary key). Nooit een
 * automatische waarde: `vervolgstap`/`notitie` komen altijd van een
 * expliciete admin-keuze in DossierDetail.jsx, nooit hier bepaald.
 */
export async function saveCommercieleKans(dossierId, { vervolgstap, notitie }) {
  if (!dossierId) throw new Error('saveCommercieleKans vereist een geldig dossier-ID.')
  return throwOnError(
    await supabase
      .from('dossier_commerciele_kansen')
      .upsert({ dossier_id: dossierId, vervolgstap, notitie: notitie?.trim() || null, updated_at: new Date().toISOString() })
      .select('*')
      .single(),
  )
}

/** Alle dossiers met een vastgelegde commerciële kans (admin-overzicht /admin/kansen), standaard op laatste wijziging. */
export async function adminListCommercieleKansen() {
  return throwOnError(
    await supabase
      .from('dossier_commerciele_kansen')
      .select('*, dossiers(dossier_id, status, klanten(naam, bedrijfsnaam), panden(omschrijving, adres))')
      .order('updated_at', { ascending: false }),
  )
}

// --- Facturen (Administratie-uitbreiding, 2026-09-28) -------------------------
//
// Volledig admin-only: `facturen` heeft uitsluitend admin-only
// RLS-policies (0014_facturen.sql, geen enkele policy voor een klant) —
// deze functies voegen zelf geen extra autorisatie toe, RLS is de enige
// echte grens, precies zoals de rest van dit bestand.

/**
 * Alle facturen, optioneel gefilterd op status (/admin/facturen se
 * filterknoppen) en/of een factuurdatum-bereik (BTW-overzicht). Embedt
 * net genoeg klant-/dossier-/offertecontext om een rij te tonen en door
 * te klikken naar het bestaande dossier — geen tweede dossierweergave.
 */
export async function adminListFacturen({ status, vanaf, tot } = {}) {
  let query = supabase
    .from('facturen')
    .select('*, klanten(naam, bedrijfsnaam), dossiers(dossier_id, panden(omschrijving, adres)), offertes(id, offerte_nummer)')
    .order('factuurdatum', { ascending: false })
  if (status) query = query.eq('status', status)
  if (vanaf) query = query.gte('factuurdatum', vanaf)
  if (tot) query = query.lte('factuurdatum', tot)
  return throwOnError(await query)
}

// Expliciete kolomselectie (Security-hardeningsronde, 2026-09-28): deze
// kolommenlijst dekt precies wat FactuurDocument.jsx/FactuurDetail.jsx
// tonen (aan admin én, sinds de klantomgeving-ronde, aan de eigen klant op
// /account/facturen/:id) — `aangemaakt_door` (een interne auth.users-uuid,
// nooit gerenderd, zie dossierExport.js voor hetzelfde uitgangspunt bij
// offertes) staat er bewust NIET in. `notitie` blijft wel meekomen (admin
// heeft die nodig); FactuurDocument.jsx verbergt hem voor een klant zelf
// via de `toonNotitie`-prop — dit is de kolomgrens, dat is de rendergrens.
const FACTUUR_KOLOMMEN =
  'factuur_id, klant_id, dossier_id, offerte_id, factuurnummer, status, factuurdatum, vervaldatum, verzonden_op, betaalde_op, subtotaal_excl_btw, btw_bedrag, totaal_incl_btw, klant_snapshot, regels, notitie, created_at, updated_at'

/** Eén factuur, voor de detail-/printweergave. RLS (facturen_select_admin/facturen_select_klant) is de enige toegangsgrens — deze functie is een kale select. */
export async function getFactuur(factuurId) {
  return throwOnError(
    await supabase
      .from('facturen')
      .select(`${FACTUUR_KOLOMMEN}, klanten(naam, bedrijfsnaam), dossiers(dossier_id, panden(omschrijving, adres)), offertes(id, offerte_nummer)`)
      .eq('factuur_id', factuurId)
      .single(),
  )
}

/** Facturen die al voor deze offerte zijn gemaakt (offerteweergave "Bekijk factuur", zie OffertesHistorie.jsx — zichtbaar voor admin én de eigen klant) — nieuwste eerst. Alleen wat een link nodig heeft, geen interne velden. */
export async function getFacturenVoorOfferte(offerteId) {
  return throwOnError(
    await supabase.from('facturen').select('factuur_id, factuurnummer, offerte_id').eq('offerte_id', offerteId).order('created_at', { ascending: false }),
  )
}

/**
 * Alle facturen van één Dossier — zichtbaar voor admin én de eigen klant
 * (RLS: facturen_select_admin/facturen_select_klant). Twee aanroeppunten:
 * OffertesHistorie.jsx (alleen offerte_id nodig, om "Factuur maken" te
 * verbergen zodra er al een factuur is) en DossierDetail.jsx (toont de
 * factuur zelf, dus de volledige klantveilige kolomset nodig — zelfde
 * kolommen als getFacturenVoorKlant(), hier alleen anders gefilterd).
 */
export async function getFacturenVoorDossier(dossierId) {
  return throwOnError(
    await supabase
      .from('facturen')
      .select('factuur_id, factuurnummer, offerte_id, status, factuurdatum, vervaldatum, totaal_incl_btw')
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false }),
  )
}

/** Documenten van één Dossier ("Mijn documenten" op /account laat een document optioneel aan een dossier koppelen — dit toont die koppeling terug op de dossierpagina zelf). RLS (documenten_select) is de enige toegangsgrens, zelfde tabel/kolommen als getMijnDocumenten(). */
export async function getDocumentenVoorDossier(dossierId) {
  return throwOnError(
    await supabase.from('documenten').select('*').eq('dossier_id', dossierId).order('created_at', { ascending: false }),
  )
}

// --- Opnames (mobiele opnameflow, 0029/0030) --------------------------------
// Admin-only door de hele keten (RLS), dunne wrappers zoals de rest van deze
// module — zie src/lib/klantOmgeving/opname.js voor de checklist-/onderdeel-
// content en de pure compleetheids-/statuslogica.

export async function listOpnamesVoorDossier(dossierId) {
  return throwOnError(
    await supabase.from('opnames').select('*').eq('dossier_id', dossierId).order('created_at', { ascending: false }),
  )
}

export async function getOpname(opnameId) {
  return throwOnError(await supabase.from('opnames').select('*').eq('opname_id', opnameId).single())
}

export async function createOpname(dossierId, { planningAfspraakId = null, opnameDatum = null } = {}) {
  return throwOnError(
    await supabase
      .from('opnames')
      .insert({ dossier_id: dossierId, planning_afspraak_id: planningAfspraakId, opname_datum: opnameDatum })
      .select('*')
      .single(),
  )
}

/**
 * Basisgegevens/algemene-opmerkingen bijwerken (autosave vanuit de
 * Basisgegevens- en Afronden-stap). Faalt met de database-integriteitsfout
 * als de opname al is afgerond (bewaak_opname_integriteit) — de UI moet dan
 * eerst expliciet heropenen (updateOpnameStatus), geen stille val-through.
 */
export async function updateOpname(opnameId, { opnameDatum, notitie } = {}) {
  const changes = {}
  if (opnameDatum !== undefined) changes.opname_datum = opnameDatum || null
  if (notitie !== undefined) changes.notitie = notitie?.trim() || null
  if (Object.keys(changes).length === 0) return null
  return throwOnError(await supabase.from('opnames').update(changes).eq('opname_id', opnameId).select('*').single())
}

/** Statusovergang (concept/opgeslagen/afgerond) — ook het expliciete "heropenen"-pad (afgerond -> opgeslagen), zie 0030-migratie voor de trigger die dit toestaat/afdwingt. */
export async function updateOpnameStatus(opnameId, status) {
  return throwOnError(await supabase.from('opnames').update({ status }).eq('opname_id', opnameId).select('*').single())
}

export async function listOpnameWaarnemingen(opnameId) {
  return throwOnError(
    await supabase.from('opname_waarnemingen').select('*').eq('opname_id', opnameId).order('created_at', { ascending: true }),
  )
}

export async function addOpnameWaarneming(opnameId, onderdeel) {
  return throwOnError(
    await supabase.from('opname_waarnemingen').insert({ opname_id: opnameId, onderdeel }).select('*').single(),
  )
}

const OPNAME_WAARNEMING_VELDEN = ['huidige_situatie', 'beoordeling', 'maatvoering', 'aandachtspunt', 'mogelijke_maatregel', 'opmerkingen']

/** Autosave van één waarnemingsregel — alleen de daadwerkelijk meegegeven velden worden gewijzigd, precies zoals updateDossierTaak dat al doet. */
export async function updateOpnameWaarneming(waarnemingId, velden) {
  const changes = {}
  OPNAME_WAARNEMING_VELDEN.forEach((veld) => {
    if (velden[veld] !== undefined) changes[veld] = velden[veld]?.trim() || null
  })
  if (Object.keys(changes).length === 0) return null
  return throwOnError(await supabase.from('opname_waarnemingen').update(changes).eq('waarneming_id', waarnemingId).select('*').single())
}

export async function removeOpnameWaarneming(waarnemingId) {
  const { error } = await supabase.from('opname_waarnemingen').delete().eq('waarneming_id', waarnemingId)
  if (error) throw error
}

export async function listOpnameChecklistItems(opnameId) {
  return throwOnError(
    await supabase.from('opname_checklist_items').select('*').eq('opname_id', opnameId),
  )
}

/** Vinkt een checklist-item aan/uit — upsert op (opname_id, item_code), zodat de eerste keer aanvinken geen aparte "rij bestaat al?"-check nodig heeft. */
export async function setOpnameChecklistItem(opnameId, itemCode, afgevinkt) {
  return throwOnError(
    await supabase
      .from('opname_checklist_items')
      .upsert(
        { opname_id: opnameId, item_code: itemCode, afgevinkt, afgevinkt_op: afgevinkt ? new Date().toISOString() : null },
        { onConflict: 'opname_id,item_code' },
      )
      .select('*')
      .single(),
  )
}

/** Documenten (foto's/bijlagen) van één Opname — opname-breed, ongeacht of ze aan een specifieke waarneming hangen. */
export async function getDocumentenVoorOpname(opnameId) {
  return throwOnError(
    await supabase.from('documenten').select('*').eq('opname_id', opnameId).order('created_at', { ascending: false }),
  )
}

/**
 * Maakt een nieuwe factuur aan. `factuurnummer` wordt nooit meegegeven —
 * die komt altijd uit de kolom-DEFAULT (genereer_factuur_nummer()), dus
 * een niet-opgeslagen formulier verbruikt nooit een nummer, en
 * gelijktijdige admin-acties kunnen nooit hetzelfde nummer krijgen. Alle
 * berekeningen (subtotaal/btw/totaal) en de snapshot zelf worden door de
 * aanroeper aangeleverd — deze functie is een dunne insert, zie
 * lib/klantOmgeving/factuur.js voor de berekenings-/snapshotlogica.
 */
export async function createFactuur({
  klantId,
  dossierId = null,
  offerteId = null,
  vervaldatum,
  regels,
  subtotaalExclBtw,
  btwBedrag,
  totaalInclBtw,
  klantSnapshot,
  notitie = null,
}) {
  return throwOnError(
    await supabase
      .from('facturen')
      .insert({
        klant_id: klantId,
        dossier_id: dossierId,
        offerte_id: offerteId,
        vervaldatum,
        regels,
        subtotaal_excl_btw: subtotaalExclBtw,
        btw_bedrag: btwBedrag,
        totaal_incl_btw: totaalInclBtw,
        klant_snapshot: klantSnapshot,
        notitie: notitie?.trim() || null,
      })
      .select('*')
      .single(),
  )
}

/**
 * Wijzigt uitsluitend de `status`-kolom van een factuur (plus het
 * bijbehorende tijdstip: `verzonden_op` bij een overgang naar verzonden,
 * `betaalde_op` bij een overgang naar betaald) — nooit gecombineerd met
 * een inhoudelijke wijziging in dezelfde aanroep, exact dezelfde reden
 * als updateOfferteStatus() hierboven: bewaak_factuur_integriteit()
 * (0014_facturen.sql) bevriest de rest van de factuur al op het moment
 * van een statusovergang. Een ongeldige overgang geeft een databasefout
 * terug (net als bij offertes), geen stille no-op.
 */
export async function updateFactuurStatus(factuurId, nieuweStatus) {
  const changes = { status: nieuweStatus }
  if (nieuweStatus === 'verzonden') changes.verzonden_op = new Date().toISOString()
  if (nieuweStatus === 'betaald') changes.betaalde_op = new Date().toISOString()
  return throwOnError(await supabase.from('facturen').update(changes).eq('factuur_id', factuurId).select('*').single())
}

/**
 * "Betaling corrigeren" — een expliciete, losse actie (géén vrije
 * statuskiezer) die een per ongeluk als betaald gemarkeerde factuur
 * terugzet naar verzonden en `betaalde_op` weer leegt. Toegestaan door
 * bewaak_factuur_integriteit() (betaald -> verzonden is de enige
 * uitgaande overgang vanuit "betaald"), maar in de UI altijd apart
 * getoond van de normale statusknoppen (zie FactuurDetail.jsx) zodat het
 * nooit per ongeluk wordt aangeklikt in plaats van "Markeer als betaald".
 */
export async function corrigeerFactuurBetaling(factuurId) {
  return throwOnError(
    await supabase.from('facturen').update({ status: 'verzonden', betaalde_op: null }).eq('factuur_id', factuurId).select('*').single(),
  )
}

/** Verwijdert één factuur. Alleen een concept kan hierdoor daadwerkelijk verdwijnen — zelfde patroon/reden als deleteOfferte() hierboven (audit-trail voor elke uitgestuurde factuur). */
export async function deleteFactuur(factuurId) {
  const { data, error } = await supabase.from('facturen').delete().eq('factuur_id', factuurId).select('factuur_id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Verwijderen is niet toegestaan voor deze factuur.')
}

// --- Kosten (Administratie-uitbreiding, 2026-09-28) ---------------------------
//
// Volledig admin-only, zelfde reden als facturen hierboven — zie
// 0015_kosten.sql. Geen immutability-trigger op deze tabel: een
// kostenregistratie is geen extern/juridisch document zoals een
// verstuurde factuur, de admin mag een typefout altijd corrigeren.

export async function adminListKosten({ vanaf, tot } = {}) {
  let query = supabase.from('kosten').select('*').order('datum', { ascending: false })
  if (vanaf) query = query.gte('datum', vanaf)
  if (tot) query = query.lte('datum', tot)
  return throwOnError(await query)
}

export async function createKostenpost({
  datum,
  leverancier,
  omschrijving,
  categorie,
  bedragExclBtw,
  btwPercentage,
  btwBedrag,
  totaalInclBtw,
  notitie = null,
  documentUrl = null,
}) {
  return throwOnError(
    await supabase
      .from('kosten')
      .insert({
        datum,
        leverancier: leverancier.trim(),
        omschrijving: omschrijving.trim(),
        categorie,
        bedrag_excl_btw: bedragExclBtw,
        btw_percentage: btwPercentage,
        btw_bedrag: btwBedrag,
        totaal_incl_btw: totaalInclBtw,
        notitie: notitie?.trim() || null,
        document_url: documentUrl?.trim() || null,
      })
      .select('*')
      .single(),
  )
}

/** Zet een kostenpost tussen 'open' en 'betaald' — losse, kleine wijziging, geen volledig bewerkformulier nodig voor uitsluitend de betaalstatus. */
export async function updateKostenpostStatus(kostenId, status) {
  return throwOnError(
    await supabase.from('kosten').update({ status, updated_at: new Date().toISOString() }).eq('kosten_id', kostenId).select('*').single(),
  )
}

export async function verwijderKostenpost(kostenId) {
  const { error } = await supabase.from('kosten').delete().eq('kosten_id', kostenId)
  if (error) throw error
}

// --- Factuurinstellingen (Administratie-uitbreiding, 2026-09-28) --------------
//
// Eén centrale configuratiebron (0013_factuur_instellingen.sql, singleton-
// tabel — `id` is altijd 1) voor bedrijfs-/betaalgegevens op een factuur.
// Nooit hardcoded verspreid door React-componenten. Lezen mag sinds de
// factuursjabloon-ronde (0021) door elke ingelogde gebruiker (een klant
// moet dit ook kunnen lezen om zijn eigen factuur — incl. IBAN/
// betalingsvoorwaarden — te kunnen bekijken/printen, zie FactuurDetail.jsx/
// FactuurDocument.jsx); wijzigen (updateFactuurInstellingen hieronder)
// blijft uitsluitend admin (0013's update-policy, ongewijzigd).

export async function getFactuurInstellingen() {
  return throwOnError(await supabase.from('factuur_instellingen').select('*').eq('id', 1).single())
}

export async function updateFactuurInstellingen({
  bedrijfsnaam,
  adres,
  postcode,
  plaats,
  email,
  telefoon,
  kvkNummer,
  btwId,
  iban,
  tenaamstelling,
  betalingsvoorwaarden,
  standaardBetalingstermijnDagen,
  factuurprefix,
  standaardBtwPercentage,
}) {
  return throwOnError(
    await supabase
      .from('factuur_instellingen')
      .update({
        bedrijfsnaam,
        adres,
        postcode,
        plaats,
        email,
        telefoon,
        kvk_nummer: kvkNummer,
        btw_id: btwId,
        iban,
        tenaamstelling,
        betalingsvoorwaarden,
        standaard_betalingstermijn_dagen: standaardBetalingstermijnDagen,
        factuurprefix,
        standaard_btw_percentage: standaardBtwPercentage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select('*')
      .single(),
  )
}

// --- Klantomgeving (/account) ------------------------------------------------
//
// Alles hieronder is puur dataverkeer voor de eigen Klant van de ingelogde
// sessie. RLS (is_member_of_klant(), 0001_init.sql/0007/0017) is ook hier de
// enige echte toegangsgrens — deze functies filteren zelf op klantId zoals
// de aanroeper (Account.jsx) die al kent via getMijnKlant(), maar vertrouwen
// daar nooit blind op: een poging om een ANDERE klant_id mee te geven wordt
// door de database geweigerd/geeft niets terug, niet door deze laag.

/** Werkt de eigen Contactpersoon-rij bij ("Mijn gegevens") — nooit klant_id of account_id, dat blijven vaste identiteitsvelden. */
export async function updateMijnContactpersoon(contactpersoonId, { naam, email, telefoon, rol }) {
  return throwOnError(
    await supabase.from('contactpersonen').update({ naam, email, telefoon, rol }).eq('contactpersoon_id', contactpersoonId).select('*').single(),
  )
}

/** Werkt de eigen Klant-rij bij ("Mijn bedrijf") — nooit klant_id zelf (dat is de rij-id, geen wijzigbare kolom). */
export async function updateKlant(klantId, { naam, bedrijfsnaam, email, telefoon, adres, postcode, plaats }) {
  return throwOnError(
    await supabase
      .from('klanten')
      .update({ naam, bedrijfsnaam, email, telefoon, adres, postcode, plaats, updated_at: new Date().toISOString() })
      .eq('klant_id', klantId)
      .select('*')
      .single(),
  )
}

/** Alle offertes van deze Klant, over alle dossiers heen ("Mijn offertes"). RLS (offertes_select_klant) is de toegangsgrens. */
export async function getOffertesVoorKlant(klantId) {
  return throwOnError(
    await supabase
      .from('offertes')
      .select(`${OFFERTE_KOLOMMEN}, dossiers(dossier_id, panden(omschrijving, adres))`)
      .eq('klant_id', klantId)
      .order('offerte_datum', { ascending: false }),
  )
}

/**
 * Alle facturen van deze Klant ("Mijn facturen"). Expliciete kolomselectie
 * (geen `select('*')`) — `notitie` en `aangemaakt_door` zijn interne
 * admin-velden die hier bewust nooit worden opgehaald, ook al zou RLS
 * (facturen_select_klant) de rij zelf wel toestaan: RLS is de rijgrens,
 * deze selectie is de kolomgrens voor wat een klantweergave daadwerkelijk
 * nodig heeft (zie opdracht: "klant mag facturen niet wijzigen"/"geen
 * interne notities").
 */
export async function getFacturenVoorKlant(klantId) {
  return throwOnError(
    await supabase
      .from('facturen')
      .select('factuur_id, factuurnummer, factuurdatum, vervaldatum, status, subtotaal_excl_btw, btw_bedrag, totaal_incl_btw, dossier_id, offerte_id')
      .eq('klant_id', klantId)
      .order('factuurdatum', { ascending: false }),
  )
}

/** Documenten van deze Klant ("Mijn documenten"). RLS (documenten_select) is de toegangsgrens. */
export async function getMijnDocumenten(klantId) {
  return throwOnError(await supabase.from('documenten').select('*').eq('klant_id', klantId).order('created_at', { ascending: false }))
}

const DOCUMENTEN_BUCKET = 'klant-documenten'

/**
 * Uploadt een bestand naar de privébucket en legt daarna de metadata vast.
 * Het pad `${klantId}/${uuid}-${bestandsnaam}` bepaalt de Storage-
 * autorisatie (klant_documenten_select/insert/delete, 0018_documenten.sql
 * — het eerste padsegment moet de eigen klant_id zijn), dus een klant kan
 * nooit naar een ander klant_id-pad uploaden (de Storage-policy weigert dat
 * onafhankelijk van wat de client hier verzint). Twee stappen zijn bewust
 * niet in één transactie te vangen (Storage is geen Postgres-tabel) — bij
 * een geslaagde upload maar een falende metadata-insert blijft er een
 * "wees"-bestand in Storage staan zonder rij in `documenten`, onzichtbaar
 * voor iedereen (dezelfde RLS geldt voor de lijst); geen lek, alleen
 * ongebruikte opslag.
 */
/**
 * `opnameId`/`opnameWaarnemingId` (optioneel, mobiele-opnameronde 2026-09-30):
 * een opnamefoto is ook gewoon een document in dezelfde privébucket, met de
 * bestaande `documenten.opname_id`/`opname_waarneming_id`-koppeling erbij —
 * geen aparte foto-opslag (zie opdracht §6). Storage-autorisatie verandert
 * niet: nog steeds hetzelfde `${klantId}/...`-pad, admin uploadt hier altijd
 * onder de klant_id van het dossier waar de opname bij hoort (is_admin()
 * geeft toegang tot elk klant-pad, zie 0018_documenten.sql).
 */
export async function uploadDocument({ klantId, dossierId = null, opnameId = null, opnameWaarnemingId = null, file, omschrijving = null }) {
  const veiligeNaam = file.name.replace(/[^a-zA-Z0-9.\-_]+/g, '-')
  const storagePath = `${klantId}/${crypto.randomUUID()}-${veiligeNaam}`
  const { error: uploadError } = await supabase.storage.from(DOCUMENTEN_BUCKET).upload(storagePath, file)
  if (uploadError) throw uploadError
  return throwOnError(
    await supabase
      .from('documenten')
      .insert({
        klant_id: klantId,
        dossier_id: dossierId,
        opname_id: opnameId,
        opname_waarneming_id: opnameWaarnemingId,
        bestandsnaam: file.name,
        storage_path: storagePath,
        omschrijving: omschrijving?.trim() || null,
        grootte_bytes: file.size,
        content_type: file.type || null,
      })
      .select('*')
      .single(),
  )
}

/** Tijdelijke, ondertekende downloadlink (10 minuten) — de bucket is privé, er bestaat geen voorspelbare/publieke bestands-URL. */
export async function getDocumentDownloadUrl(storagePath) {
  const { data, error } = await supabase.storage.from(DOCUMENTEN_BUCKET).createSignedUrl(storagePath, 600)
  if (error) throw error
  return data.signedUrl
}

/** Verwijdert eerst het Storage-object, dan de metadata-rij — in die volgorde blijft er nooit een rij zonder bestand achter dat een download-poging alsnog zou laten falen. */
export async function verwijderDocument(documentId, storagePath) {
  const { error: storageError } = await supabase.storage.from(DOCUMENTEN_BUCKET).remove([storagePath])
  if (storageError) throw storageError
  const { error } = await supabase.from('documenten').delete().eq('document_id', documentId)
  if (error) throw error
}
