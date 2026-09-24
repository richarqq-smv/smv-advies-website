# Auth-architectuur

Status: **ontworpen, nog niet geïmplementeerd.** Er bestaat geen Supabase-project, dus er is nog geen `@supabase/supabase-js` in de dependencies, geen `.env`, geen login/registratiepagina en geen auth-provider in de React-boom. Dit document is het blauwdruk voor de eerstvolgende implementatiestap, zodra het project in `.env.local` staat (zie `.env.example`).

## Waarom Supabase Auth

Zie DATABASE_ARCHITECTURE.md — dezelfde reden: past bij een statische GitHub Pages-frontend zonder eigen server. Supabase Auth beheert wachtwoordhashing, sessies, tokenbeheer en wachtwoordherstel zelf; er wordt niets daarvan zelfgebouwd.

## Identiteit, niet localStorage

De primaire identiteit is `auth.users.id` (een UUID), beheerd door Supabase Auth. `localStorage` wordt na deze stap nooit meer gebruikt om "ingelogd" te representeren — geen `localStorage.loggedIn`, geen los bewaarde gebruikers-ID. De Supabase-clientlibrary beheert de echte sessie (in de browser, via zijn eigen, beveiligde opslagmechanisme), en de React-app leest de sessiestatus uitsluitend via de Supabase-auth-state-listener.

## Geplande routes

Voortbouwend op de bestaande `src/lib/routes.js`-conventie (één bron van waarheid voor paden):

| Route | Doel | Publiek/privé |
|---|---|---|
| `/inloggen` | E-mail + wachtwoord, "wachtwoord vergeten"-link | Publiek bereikbaar, redirect naar klantomgeving als al ingelogd |
| `/registreren` | Naam, e-mail, wachtwoord, wachtwoordbevestiging, evt. bedrijfsnaam | Publiek bereikbaar |
| `/wachtwoord-vergeten` | E-mail invoeren, reset-link via Supabase | Publiek bereikbaar |
| `/MJOP-Tool` | Bestaande interne tool | Krijgt een inlogvereiste (zie hieronder) — blijft dezelfde route, geen URL-wijziging |
| `/admin` | Adminomgeving voor Richard | Uitsluitend voor `role = 'admin'`, database-afgedwongen (zie SECURITY_MODEL.md) |

Bestaande publieke marketingroutes (homepage, `/pakketten`, `/energie-indicatie`, `/werkwijze`, `/blog`, enz.) blijven ongewijzigd publiek en geprerenderd — deze auth-laag komt er bovenop, niet in de plaats van.

## Sessiegedrag

- **Bij laden van de app:** een auth-state-listener (Supabase's `onAuthStateChange`) haalt de bestaande sessie op, zodat een refresh niet uitlogt.
- **Bij inloggen/registreren:** Supabase's eigen `signInWithPassword`/`signUp` — geen zelfgebouwde wachtwoordlogica.
- **Bij uitloggen:** `signOut()`, sessie wordt serverside en lokaal ongeldig gemaakt.
- **Protected routes:** een route-wrapper die wacht op de sessiestatus (met een expliciete laadstatus, nooit een flits van beschermde inhoud vóór de check klaar is) en doorstuurt naar `/inloggen` zonder geldige sessie, of naar een "geen toegang"-pagina zonder de juiste rol. Dit is UX, geen beveiligingsgrens — de echte grens is RLS (SECURITY_MODEL.md).

## Foutafhandeling (Nederlands, geen ruwe Supabase-fouten)

Elke auth-actie krijgt een eigen, begrijpelijke Nederlandse melding in plaats van de ruwe Supabase-foutmelding (die soms informatie lekt over of een e-mailadres al bestaat, of technisch jargon bevat):

| Situatie | Melding |
|---|---|
| Onjuiste combinatie e-mail/wachtwoord | "E-mailadres of wachtwoord onjuist." (bewust niet specifiek welke van de twee — voorkomt account-enumeratie) |
| Account bestaat al bij registratie | "Er bestaat al een account met dit e-mailadres." |
| Wachtwoord te zwak | Supabase's eigen minimumeis, met een duidelijke Nederlandse uitleg wat ontbreekt |
| Sessie verlopen | "Uw sessie is verlopen. Log opnieuw in." + redirect naar `/inloggen` |
| Netwerkfout | "Er ging iets mis. Probeer het opnieuw." |
| Geen toegang (verkeerde rol) | Een aparte "geen toegang"-pagina, geen technische 403-tekst |

Nooit tonen: rauwe Supabase-foutobjecten, stack traces, of interne identifiers in de UI. Logging blijft beperkt tot wat nodig is voor debugging — nooit wachtwoorden, tokens of volledige klantdata in `console.log`.

## Registratie → onboarding

Na een succesvolle registratie komt de gebruiker niet in een lege, technische omgeving terecht:

```
Account aanmaken (naam, e-mail, wachtwoord, evt. bedrijfsnaam)
  ↓
(e-mailbevestiging, indien in het Supabase-project ingeschakeld)
  ↓
registreer_klant() — atomaire Klant + eerste Contactpersoon (zie DATABASE_ARCHITECTURE.md)
  ↓
Eerste Pand aanmaken (maak_pand_en_koppel())
  ↓
MJOP/Energie invullen, Dossier openen, Advies
```

Gebruikt de bestaande RPC's uit `0001_init.sql` — geen tweede, parallelle aanmaakroute naast wat de database al veilig ondersteunt.

## Wat hier expliciet niet gebeurt

Geen fake auth, geen `isAdmin`-boolean in frontend-state als beveiliging, geen verborgen route als enige bescherming voor `/admin`, geen `service_role`-sleutel in de frontend. De React-laag hierboven is gebruikerservaring; SECURITY_MODEL.md beschrijft de laag die het daadwerkelijk afdwingt.

## Openstaande implementatiestap

Zodra `.env.local` met een echte `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` bestaat: `@supabase/supabase-js` toevoegen, een `supabaseClient.js`, de auth-provider/context, en de bovenstaande routes/componenten daadwerkelijk bouwen en testen tegen de echte database.
