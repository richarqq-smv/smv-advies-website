# Security-model

Status: **geïmplementeerd, adversarieel gereviewd vóór uitvoering, en nadien live A/B-getest tegen de echte database** (project `cdthrbflmuqblydggszf`, 2026-09-24). Zie "Live testresultaten" en "Reviewgeschiedenis" onderaan voor de volledige toedracht, inclusief één kritieke bug die pas via echte databasetests aan het licht kwam (niet via statische review).

## Kernprincipe

> De frontend is geen security boundary. React-routebescherming is UX, geen beveiliging. De echte grens is Row Level Security in PostgreSQL — die geldt voor élk verzoek, of het nu van de React-app komt, van een rechtstreeks REST/RPC-verzoek, of van iemand die de anon-sleutel uit de browserbundel haalt en zelf `curl` gebruikt.

## Rollen

Twee rollen: `customer` en `admin`, vastgelegd in `user_roles.role` — **niet** in `profiles`, **niet** als een boolean in frontend-state, **niet** via een e-mailadres-vergelijking.

`user_roles` heeft geen enkele RLS-policy voor `authenticated`/`anon`. Zodra RLS aan staat en er geen policy geldt voor de aanroepende rol, is de tabel voor die rol volledig ontoegankelijk — geen `SELECT`, geen `UPDATE`. Dit is de kern van de anti-escalatiegarantie: er is structureel geen route waarmee een customer zijn eigen rol kan lezen of wijzigen, laat staan naar `admin`.

Admin-checks in elke policy lopen via `is_admin()` — een `SECURITY DEFINER`-functie die alléén een boolean teruggeeft over de aanroeper zelf (`auth.uid()`, geen parameter), dus nooit te gebruiken om de rol van een ander account op te vragen.

## Klantisolatie

Elke tabel met klantgebonden data (`klanten`, `contactpersonen`, `panden`, `dossiers`, `adviespunten`) wordt afgeschermd via `is_member_of_klant(klant_id)` — een `SECURITY INVOKER`-functie die controleert of er een `contactpersonen`-rij bestaat met dat `klant_id` én `account_id = auth.uid()`. Het kennen van een UUID (`dossier_id`, `pand_id`, …) is nooit voldoende — autorisatie wordt op elke query opnieuw afgeleid uit de auth.uid()-naar-klant-koppeling, nooit uit het feit dat een ID bekend is (bescherming tegen IDOR).

`panden` is een bijzonder geval: het model houdt Pand bewust klant-agnostisch (bestaande architectuurbeslissing), dus de check loopt via een `EXISTS`-subquery op `klant_pand_relaties`.

## Waarom een klant zich nooit aan andermans Pand kan koppelen

`klant_pand_relaties` heeft geen `INSERT`-policy voor `authenticated` — de enige manier om een rij toe te voegen is via `maak_pand_en_koppel()`, en die functie accepteert nooit een bestaand `pand_id`: ze maakt altíjd een nieuw Pand aan binnen dezelfde transactie als de koppeling. Er is dus geen enkele combinatie van toegestane acties waarmee een customer zichzelf aan een reeds bestaand Pand van een andere Klant kan koppelen.

## Waarom een Dossier niet met andermans data kan worden aangemaakt

De `WITH CHECK` op `dossiers` (zowel `INSERT` als `UPDATE`) verifieert de volledige combinatie in één keer: `klant_id` moet van de aanroeper zijn, `pand_id` moet daadwerkelijk aan die Klant gekoppeld zijn via `klant_pand_relaties`, en `primaire_contactpersoon_id` (indien opgegeven) moet bij diezelfde Klant horen. Drie losse, niet bij elkaar passende ID's combineren om jezelf toegang te geven faalt op minstens één voorwaarde.

## Waarom een afgerond Dossier echt immutable is

Twee onafhankelijke lagen:

1. RLS: de `UPDATE`-policy vereist `status = 'open'` — een afgerond Dossier komt de policy al niet door.
2. Trigger `bewaak_dossier_integriteit`: weigert elke `UPDATE` zodra `OLD.status = 'afgerond'`, onafhankelijk van RLS — een vangnet mocht een toekomstige policy-wijziging per ongeluk te ruim worden.

Adviespunten van een afgerond Dossier: dezelfde dubbele aanpak (RLS-policy die de status van het gekoppelde Dossier checkt, plus een eigen trigger `bewaak_adviespunt_integriteit`).

## SECURITY DEFINER-inventaris

| Functie | DEFINER? | Reden |
|---|---|---|
| `is_member_of_klant()` | Nee (invoker) | Leunt op een policy-tak die de aanroeper toch al mag lezen — minst mogelijke privilege. |
| `is_admin()` | Ja | `user_roles` heeft geen policy voor `authenticated`; zonder DEFINER zou dit altijd `false` teruggeven. Geen parameter, dus niet te misbruiken voor andermans rol. |
| `registreer_klant()` | Ja | `klanten`/`contactpersonen` hebben geen open INSERT voor customers. Gebruikt uitsluitend `auth.uid()`, nooit een meegegeven account-parameter. |
| `maak_pand_en_koppel()` | Ja | Zelfde reden; controleert `is_member_of_klant()` vóór elke insert. |
| `handle_new_user()` (trigger op `auth.users`) | Ja | Moet `profiles`/`user_roles` kunnen vullen bij registratie, vóór er enige policy-context is. Alleen aangeroepen door Postgres zelf. |
| `bewaak_dossier_integriteit()` / `bewaak_adviespunt_integriteit()` (triggers) | Nee (invoker) | Moeten juist binnen de al door RLS beperkte context van de uitvoerende actie blijven. |

Elke `SECURITY DEFINER`-functie: `set search_path = ''` (leeg — de striktste vorm, voorkomt search_path-kaping volledig) met overal volledig gekwalificeerde `public.tabelnaam`-verwijzingen, plus een expliciete `revoke all ... from public, anon` gevolgd door een gerichte `grant execute ... to authenticated`.

## Wat NIET is gebruikt, en waarom

- **Geen Auth Hook / custom JWT-claim voor de rol.** Eerder overwogen, maar losgelaten: het voegt een aanvalsoppervlak toe (een functie die specifiek voor `supabase_auth_admin` bereikbaar moet zijn én afgeschermd voor iedereen anders — zie Reviewgeschiedenis) en JWT-veroudering (een rolwijziging werkt pas na tokenverversing) zonder dat dit voor dit platform iets oplevert wat `is_admin()` niet al goedkoper en robuuster doet.
- **Geen `profiles.role`.** Zie Reviewgeschiedenis, Bevinding 1.

## Testmethode voor klantisolatie

In de Supabase SQL Editor kan een specifieke ingelogde gebruiker gesimuleerd worden:

```sql
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub": "<uuid-klant-a>", "role": "authenticated"}';

select * from klanten;                                        -- alleen klant A
select * from dossiers where klant_id = '<klant-b-id>';        -- 0 rijen
update dossiers set status = 'afgerond' where klant_id = '<klant-b-id>'; -- 0 rows updated
update user_roles set role = 'admin' where user_id = '<uuid-klant-a>';  -- permission denied

rollback; -- nooit committen
```

Herhaal symmetrisch voor klant B tegen klant A's data, en nogmaals met een admin-account (verwacht: wél toegang tot beide).

## Live testresultaten (2026-09-24)

Bovenstaande testmethode is daadwerkelijk uitgevoerd tegen de echte database, met twee echte testaccounts (Klant A, Klant B), elk met een eigen Klant/Pand/Dossier/Adviespunt, aangemaakt via de echte RPC's/insert-policies onder gesimuleerde `auth.uid()`-context. Resultaten:

| Test | Verwacht | Resultaat |
|---|---|---|
| A leest Klant B / Pand B / Dossier B / Adviespunt B / Contactpersoon B | 0 rijen | ✅ 0 rijen (alle vijf) |
| A wijzigt Klant B (`bedrijfsnaam`) | 0 rijen gewijzigd | ✅ 0 |
| A verwijdert Adviespunt B | 0 rijen verwijderd | ✅ 0 |
| A koppelt zichzelf als Contactpersoon aan Klant B (account-hijack) | RLS-weigering | ✅ geweigerd (42501) |
| A koppelt Pand B rechtstreeks aan zijn eigen Klant via `klant_pand_relaties` (buiten de RPC om) | RLS-weigering | ✅ geweigerd (42501) |
| A wijzigt `user_roles` naar `admin` voor zichzelf | 0 rijen gewijzigd | ✅ 0 |
| Anonieme sessie leest elke tabel (klanten/dossiers/adviespunten/profiles/user_roles/panden/contactpersonen) | 0 rijen, geen interne foutmelding | ✅ 0 rijen, schoon (na fix, zie DATABASE_ARCHITECTURE.md) |
| Anonieme sessie probeert een Klant aan te maken | RLS-weigering | ✅ geweigerd (42501) |
| Admin (tijdelijk gepromoot testaccount) leest alle Klanten/Dossiers, incl. Klant B specifiek | Volledige toegang | ✅ 2/2 klanten, 2/2 dossiers, Klant B zichtbaar |
| Dossier afronden, daarna wijzigen (ook door de eigenaar zelf) | Geweigerd, ook voor de eigenaar | ✅ 0 rijen gewijzigd |

Tijdens het opzetten van deze test (vóór bovenstaande resultaten) werd de kritieke recursiebug (zie Reviewgeschiedenis, Bevinding 3) ontdekt en gecorrigeerd — de tabel hierboven is het resultaat ná die fix. Alle testdata is na afloop verwijderd (`delete`, met tijdelijk uitgeschakelde integriteitstriggers om de test-fixture zelf — inclusief een bewust afgerond testdossier — te kunnen opruimen).

## Live testresultaten: MJOP → Dossier → Advies (2026-09-25)

Volledige keten eerst live doorlopen in de browser (inloggen → `/account` → `registreer_klant()` → `/MJOP-Tool` testdata A laden → `MjopKlantKoppeling` → nieuw Pand + Dossier met echte `mjop_snapshot` → automatisch signaal "Cv / verwarming" overgenomen als adviespunt met `herkomst = 'automatisch'` en bevroren `signaal_bevroren` → Dossier afgerond → `AdviesResultaat`-groepering correct). Daarna dezelfde A/B-aanvalstests specifiek op MJOP-data, met een tweede, eigen Dossier + `mjop_snapshot` voor Klant B:

| Test | Verwacht | Resultaat |
|---|---|---|
| Klant A ziet eigen MJOP-snapshot (eigen Dossier) | Toegang | ✅ `mjop_snapshot` leesbaar |
| Klant A leest Dossier B / Pand B (met MJOP-data) | 0 rijen | ✅ 0 rijen (beide) |
| Klant A wijzigt `mjop_snapshot` van Dossier B | 0 rijen gewijzigd | ✅ 0 |
| Klant A koppelt zich rechtstreeks aan Pand B via `klant_pand_relaties`, of wijzigt Pand B rechtstreeks | RLS-weigering | ✅ geweigerd (42501) / 0 rijen |
| Klant A voegt een adviespunt toe aan Dossier B, of rondt Dossier B af | RLS-weigering / 0 rijen | ✅ geweigerd (42501) / 0 rijen |
| Anonieme sessie leest dossiers met een `mjop_snapshot`, of panden | 0 rijen | ✅ 0 rijen (beide) |
| Admin (tijdelijk gepromoot) leest `mjop_snapshot` van zowel Dossier A als Dossier B | Volledige toegang | ✅ beide zichtbaar |
| Afgerond Dossier A: `mjop_snapshot` wijzigen, ook door de eigenaar zelf | 0 rijen gewijzigd | ✅ 0 |

Alle testdata (twee accounts, klanten, panden, dossiers, adviespunten) na afloop verwijderd.

## Reviewgeschiedenis

Een eerdere versie van dit schema bevatte twee bevestigde kwetsbaarheden, gevonden in een expliciete adversariële review vóórdat er iets werd uitgevoerd:

1. **Rolescalatie via `profiles.role`** — de UPDATE-policy controleerde alleen *welke rij* mocht worden aangepast, niet *welke kolommen*; een customer had zichzelf admin kunnen maken. Opgelost door rol naar de volledig afgeschermde `user_roles`-tabel te verplaatsen.
2. **Een Auth Hook-functie was publiek aanroepbaar** — `EXECUTE` was niet expliciet ingetrokken van `public`/`authenticated` (Postgres geeft dat standaard wél uit), waardoor elke klant de functie rechtstreeks via het REST/RPC-endpoint had kunnen aanroepen. Opgelost door het hele mechanisme te vervangen door `is_admin()`.

Dit schema (v2, in `0001_init.sql`) is de gecorrigeerde versie — niet de oorspronkelijke, en is degene die daadwerkelijk is uitgevoerd.

3. **`is_member_of_klant()`-recursie, gevonden bij live testen (2026-09-24), niet bij de statische adversariële review hierboven.** De functie was `SECURITY INVOKER` en las `public.contactpersonen`; de eigen SELECT-policy van die tabel roept `is_member_of_klant()` opnieuw aan → oneindige recursie (`stack depth limit exceeded`) zodra een échte `authenticated`-sessie (dus niet via een `SECURITY DEFINER`-RPC, die toevallig als tabel-eigenaar draait en zo buiten RLS om leest) een Dossier/Adviespunt/Pand/koppeling/Contactpersoon aanraakte — in de praktijk vrijwel de hele datalaag buiten `registreer_klant()`/`maak_pand_en_koppel()`. Dit demonstreert precies waarom een statische review, hoe grondig ook, nooit vervangt wat alleen écht uitvoeren tegen een levende database aan het licht brengt. Fix in `0003_fix_is_member_of_klant_recursion.sql`: de functie is nu `SECURITY DEFINER`, exact hetzelfde patroon als `is_admin()` — de interne SELECT op `contactpersonen` triggert RLS dan niet meer opnieuw. Geverifieerd door na de fix de volledige A/B-isolatietest opnieuw en met succes te doorlopen (zie "Live testresultaten" hierboven).
4. **Anon kreeg een rauwe Postgres-foutmelding bij elke poging tot toegang**, gevonden tijdens dezelfde live testronde — zie DATABASE_ARCHITECTURE.md, "Correcties na live testen", punt 2. Geen toegangslek, wel gecorrigeerd (`0004_grant_helper_functions_to_anon.sql`).
