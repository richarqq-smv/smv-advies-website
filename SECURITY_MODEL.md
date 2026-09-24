# Security-model

Status: **ontworpen en adversarieel gereviewd (zie "Reviewgeschiedenis" onderaan), nog niet uitgevoerd tegen een levende database.** Alles hieronder beschrijft het model in `supabase/migrations/0001_init.sql` — geen enkele regel is al live getest, omdat er nog geen Supabase-project bestaat.

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

## Reviewgeschiedenis

Een eerdere versie van dit schema bevatte twee bevestigde kwetsbaarheden, gevonden in een expliciete adversariële review vóórdat er iets werd uitgevoerd:

1. **Rolescalatie via `profiles.role`** — de UPDATE-policy controleerde alleen *welke rij* mocht worden aangepast, niet *welke kolommen*; een customer had zichzelf admin kunnen maken. Opgelost door rol naar de volledig afgeschermde `user_roles`-tabel te verplaatsen.
2. **Een Auth Hook-functie was publiek aanroepbaar** — `EXECUTE` was niet expliciet ingetrokken van `public`/`authenticated` (Postgres geeft dat standaard wél uit), waardoor elke klant de functie rechtstreeks via het REST/RPC-endpoint had kunnen aanroepen. Opgelost door het hele mechanisme te vervangen door `is_admin()`.

Dit schema (v2, in `0001_init.sql`) is de gecorrigeerde versie — niet de oorspronkelijke.
