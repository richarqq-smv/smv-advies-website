# SMV Advies — projectnotities voor Claude

## E-mail / domeinconfiguratie (Porkbun)

- `contact@smv-advies.nl` en `info@smv-advies.nl` zijn **forwards** (Porkbun Email Forwarding) naar `richard@smv-advies.nl` — geen eigen postbus. Mail naar een van beide komt dus altijd in de inbox van `richard@smv-advies.nl` terecht.
- `richard@smv-advies.nl` is een echte gehoste mailbox (Porkbun Email Hosting).
- Praktisch gevolg: het maakt voor waar interne meldingen (bv. EmailJS "To Email") uiteindelijk landen niet uit of je `contact@smv-advies.nl`, `info@smv-advies.nl` of direct `richard@smv-advies.nl` invult — alle drie komen bij Richard terecht. Gebruik voor consistentie met de rest van de code (`COMPANY.contactEmail` in `src/data/company.js`) bij voorkeur `contact@smv-advies.nl`.

## E-mailverzending (Resend, via Supabase Edge Function)

- EmailJS is volledig verwijderd (2026-10-14) — geen client-side API-sleutels meer voor mailverzending. `src/lib/emailjs.js` bevat alleen nog de twee adresconstanten (`BUSINESS_EMAIL`, `MJOP_RECIPIENT_EMAIL`).
- Alle verzending loopt nu via `src/lib/sendMail.js` (`sendMail(type, params)`), dat `supabase.functions.invoke('send-email', ...)` aanroept. De Edge Function (`supabase/functions/send-email/index.ts`) bouwt de HTML server-side en post 'm naar Resend; `RESEND_API_KEY` staat alleen als Edge Function secret in Supabase, nooit in de frontend-bundel.
- 4 mailtypes: `energie-lead`, `energie-confirm`, `mjop`, `contact` — elk met een eigen builder-functie in `index.ts` die exact dezelfde navy/goud-huisstijl gebruikt als de (back-up/overzicht-)templates in het Resend-dashboard. Alle dynamische waarden gaan door `escapeHtml()` vóór ze in de HTML komen (ook in `mailto:`-attributen).
- Verzendend domein: `mail.smv-advies.nl` (apart subdomein, DKIM/SPF bij Porkbun geverifieerd) — bewust gescheiden van het hoofddomein zodat de bestaande mailboxen (`info@`/`contact@`/`richard@smv-advies.nl`) ongemoeid blijven.
- De Resend-dashboardtemplates zijn geen actief verzendpad — de Edge Function roept Resend's Template-API niet aan (format kon niet met zekerheid geverifieerd worden), maar bouwt dezelfde HTML zelf. Bij een contentwijziging dus **beide plekken** bijwerken: `index.ts` (het daadwerkelijke verzendpad) én de dashboardtemplates (ter referentie).
