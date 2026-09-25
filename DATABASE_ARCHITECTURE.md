# Databasearchitectuur

Status: **geïmplementeerd en getest tegen een levende database.** Project `cdthrbflmuqblydggszf` (regio eu-west-1), migraties `0001_init.sql` t/m `0004_grant_helper_functions_to_anon.sql` toegepast via de Supabase MCP-koppeling op 2026-09-24. Twee reële problemen zijn tijdens dat proces gevonden en gecorrigeerd — zie "Correcties na live testen" hieronder en SECURITY_MODEL.md.

## Waarom Supabase

De site draait als statische React/Vite-app op GitHub Pages: geen eigen server, geen runtime backend. Supabase's auth/database-toegang werkt volledig via een publieke project-URL + publieke ("anon") sleutel die veilig in de frontend mag staan — de beveiliging zit in PostgreSQL zelf (Row Level Security), niet in geheimhouding van die sleutel. Dat past exact bij GitHub Pages, zonder dat er een tweede hostingomgeving bij hoeft te komen.

## Bron van waarheid

`supabase/migrations/0001_init.sql` is het volledige, definitieve schema — dit document vat het samen en legt de *waarom* uit, maar bij een verschil is de migration leidend.

## Tabellen

| Tabel | Komt overeen met | Doel |
|---|---|---|
| `profiles` | — (nieuw) | Persoonsinformatie van een geauthenticeerd account. Identiteit komt uit `auth.users.id`, nooit uit localStorage. |
| `user_roles` | — (nieuw) | Uitsluitend `role` ('customer'/'admin'). Volledig afgeschermd van de client — zie SECURITY_MODEL.md. |
| `klanten` | bestaand "Klant"-model (`src/lib/dossier/klant.js`) | Bedrijfs-/klantcontext. |
| `contactpersonen` | bestaand "Contactpersoon"-model | Persoon gekoppeld aan een Klant, optioneel gekoppeld aan een account via `account_id`. |
| `panden` | bestaand "Pand"-model (`src/lib/dossier/pand.js`) | Fysieke/technische eenheid — blijft bewust klant-agnostisch, zoals in het bestaande Pand-basismodel al ontworpen. |
| `klant_pand_relaties` | bestaand model (`src/lib/dossier/klantPandRelatie.js`) | Expliciete koppeltabel tussen Klant en Pand. |
| `dossiers` | bestaand "Dossier"-model (`src/lib/dossier/dossier.js`) | Adviescontext: `pand_snapshot`/`contactpersoon_snapshot`/`mjop_snapshot` als JSONB, `status` open/afgerond. |
| `adviespunten` | bestaand "Adviespunt"-model (`src/lib/dossier/adviespunt.js`) | Concrete adviesregel binnen een Dossier: `herkomst`, `signaal_bevroren`, `advies_status` (de bestaande vijf statussen), `toelichting`, `herbeoordelen_bij`. |

Geen parallel datamodel — elke kolom is een direct, relationeel equivalent van een bestaand JS-domeinveld.

## Wat blijft bevroren/immutable

- Een Dossier met `status = 'afgerond'` kan niet meer worden bijgewerkt — afgedwongen door zowel een RLS-policy (`... and status = 'open'`) als een onafhankelijke trigger (`bewaak_dossier_integriteit`).
- Adviespunten van een afgerond Dossier zijn eveneens onwijzigbaar — RLS én een eigen trigger (`bewaak_adviespunt_integriteit`).
- `klant_id`/`pand_id` van een Dossier zijn na aanmaken nooit meer te wijzigen (trigger) — een Dossier kan niet naar een andere Klant/Pand "verplaatst" worden.

## Atomaire RPC's

Twee databasefuncties bestaan specifiek om een race condition of cross-tenant-koppeling onmogelijk te maken, niet alleen onwaarschijnlijk:

- **`registreer_klant(naam, bedrijfsnaam, email, telefoon)`** — maakt een Klant + de eerste Contactpersoon (gekoppeld aan `auth.uid()`) atomair aan. Weigert als het account al gekoppeld is.
- **`maak_pand_en_koppel(klant_id, pand)`** — maakt een Pand + de koppeling naar een Klant atomair aan. Accepteert nooit een bestaand `pand_id` — er is dus geen route om jezelf aan andermans bestaande Pand te koppelen.

Beide zijn `SECURITY DEFINER` (nodig omdat de onderliggende tabellen geen open INSERT-policy voor gewone gebruikers hebben), met `search_path = ''` en uitsluitend `EXECUTE`-rechten voor `authenticated` — nooit voor `anon` of `public`. Zie SECURITY_MODEL.md voor de volledige redenering.

## Admin bootstrap (eenmalige, menselijke actie)

Er is bewust geen publiek admin-registratieformulier en geen `if (email === 'richard@smv-advies.nl')`-achtige check. De rol komt uitsluitend uit `user_roles`, die de client nooit kan schrijven. Om Richard admin te maken:

1. Richard registreert zich als gewone gebruiker met `richard@smv-advies.nl` (of wordt handmatig aangemaakt via Dashboard → Authentication → Users).
2. Eenmalig, in de Supabase SQL Editor (nooit vanuit de app):
   ```sql
   update public.user_roles
   set role = 'admin'
   where user_id = (select id from auth.users where email = 'richard@smv-advies.nl');
   ```

## Migraties toepassen

`supabase/migrations/0001_init.sql` bevat het complete schema in uitvoervolgorde. Eenmalig plakken in de Supabase SQL Editor van een schoon project, of via de Supabase CLI (`supabase db push`) zodra dat is ingericht. Toekomstige wijzigingen horen als nieuwe, genummerde bestanden in dezelfde map (`0002_...sql`, enz.) — nooit door `0001_init.sql` achteraf te wijzigen zodra die al is toegepast.

## Correcties na live testen

Twee problemen kwamen pas aan het licht bij het daadwerkelijk uitvoeren van een A/B-klantisolatietest tegen de echte database (niet vindbaar via statische review alleen):

1. **`is_member_of_klant()` veroorzaakte oneindige recursie** (`0003_fix_is_member_of_klant_recursion.sql`) — de functie was `SECURITY INVOKER` en las `contactpersonen`, waarvan de eigen SELECT-policy op zijn beurt weer `is_member_of_klant()` aanriep. Dit trof elke actie buiten de twee atomaire RPC's om (die dit toevallig omzeilden doordat ze als tabel-eigenaar draaien). Fix: net als `is_admin()` is deze functie nu `SECURITY DEFINER`.
2. **Anonieme requests kregen een rauwe Postgres-foutmelding** in plaats van een schone afwijzing (`0004_grant_helper_functions_to_anon.sql`) — `anon` had geen `EXECUTE` op `is_admin()`/`is_member_of_klant()`, dus RLS-evaluatie crashte met "permission denied for function" in plaats van gewoon `false` op te leveren. Geen databeveiligingslek (nul toegang bleef nul toegang), wel gecorrigeerd voor een nette API-respons.

Zie SECURITY_MODEL.md, "Reviewgeschiedenis", voor de volledige toedracht en de testresultaten.

## Klantomgeving en adminoverzicht (geïmplementeerd)

`src/lib/klantOmgeving/api.js` is de Supabase-backed datalaag voor de échte klant-self-service-flow (`/account`, `/dossier/:id`) en het adminoverzicht (`/admin`) — losstaand van `src/lib/dossier/` (localStorage), dat ongewijzigd blijft als het interne MJOP-Tool-prototype van Richard.

Belangrijk architectuurverschil met de oude localStorage-flow: `klant_pand_relaties` staat geen directe `INSERT` toe voor `authenticated` (zie SECURITY_MODEL.md) — een klant koppelt zich dus nooit aan een bestaand Pand, alleen aan een nieuw aangemaakt Pand via `maak_pand_en_koppel()`. Eén account = precies één Klant (afgedwongen door `registreer_klant()`). Dit maakt de oude, Richard-gerichte "zoek of maak willekeurige Klant, koppel willekeurig Pand"-flow (`KlantDossierFlow.jsx`) architectuurincompatibel met de RLS-beveiligde self-service-flow — vandaar dat die twee flows bewust naast elkaar bestaan in plaats van samengevoegd te zijn.

## MJOP → Dossier → Advies (geïmplementeerd, 2026-09-25)

De MJOP-tool zelf (7-staps wizard, `smv_mjop_building_v1` in localStorage) is **ongewijzigd** — dat blijft het interne/prototype-werkdocument, precies zoals het al werkte. Wat nieuw is: een auth-bewuste brug (`src/components/klantOmgeving/MjopKlantKoppeling.jsx`, alleen zichtbaar met een echte sessie) die de HUIDIGE MJOP-building naar de klant-Supabase-flow tilt:

1. Klant kiest "nieuw pand" of een al bestaand eigen Pand.
2. `buildingToPandInput()`/`createMjopSnapshotFromBuilding()` — **dezelfde, ongewijzigde pure adapterfuncties** uit `src/lib/dossier/mjopAdapter.js` die de localStorage-koppeling ook al gebruikte — vertalen de building naar Pand-velden + een bevroren MJOP-momentopname.
3. `maakPandEnKoppel()` (nieuw pand) of `updatePand()` (bestaand pand) schrijft naar Supabase; `openOfHergebruikDossier()` slaat de snapshot op in `dossiers.mjop_snapshot`.
4. Op `/dossier/:id` berekent `DossierWerkruimte.jsx` de automatische signaalkandidaten met `buildInsights()` uit `lib/mjop/linking.js` — **ongewijzigd, pure, regelgebaseerde functie** — toegepast op `dossier.mjop_snapshot.components` (de bevroren snapshot, nooit de actuele MJOP-building). Een gekozen signaal wordt via `createSignaalBevroren()` (ongewijzigd, `lib/dossier/adviespunt.js`) bevroren vastgelegd bij het adviespunt (`herkomst = 'automatisch'`).

**Snapshot-immutabiliteit**: `mjop_snapshot` wordt uitsluitend geschreven bij het aanmaken van een Dossier — er is geen "ververs snapshot"-actie. Een later gewijzigde MJOP-building of Pand raakt een al bestaand Dossier dus nooit, en de bestaande `dossiers_bewaak_integriteit`-trigger blokkeert sowieso elke wijziging aan een afgerond Dossier (getest, zie SECURITY_MODEL.md).

**Waarom geen automatische pre-load van een gekozen Pand terug in de MJOP-wizard**: de MJOP-tool is bewust V1-single-profile (één actieve building per browser, zie `lib/mjop/storage.js`'s eigen ontwerpdocumentatie) — dat per-Pand multi-sessie zou maken is een aparte, grotere architectuurwijziging die niet is gevraagd. `/account` linkt daarom naar `/MJOP-Tool` als losse navigatiestap ("MJOP starten/bekijken"), en de koppeling naar een specifiek Pand gebeurt bewust bij het opslaan (stap 1-3 hierboven), niet bij het openen.

## Lokale-data-migratie (admin-only import)

Bestaande `localStorage`-demodata (`smv_dossier_*_v1`) heeft geen `account_id` — die klanten hebben nooit ingelogd, dus kunnen niet via `registreer_klant()` (dat uitsluitend voor de ingelogde aanroeper zelf werkt) worden geïmporteerd. In plaats daarvan: `adminImporteerKlant()` in `src/lib/klantOmgeving/api.js`, uitsluitend bereikbaar via `/admin` en uitsluitend uitvoerbaar door een admin (`klanten_insert_admin`/`panden_insert_admin`/`kpr_insert_admin` vereisen alle drie `is_admin()`). Kopieert Klant → Contactpersonen → Panden → Dossiers → Adviespunten rechtstreeks naar de database; de lokale data blijft ongewijzigd staan (geen destructieve migratie, wel eenmalig te herhalen zonder duplicaten te controleren — dat is een bewuste, gedocumenteerde beperking: Richard voert dit handmatig, eenmalig per browser uit).
