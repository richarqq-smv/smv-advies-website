# SMV Advies — projectnotities voor Claude

## E-mail / domeinconfiguratie (Porkbun)

- `contact@smv-advies.nl` en `info@smv-advies.nl` zijn **forwards** (Porkbun Email Forwarding) naar `richard@smv-advies.nl` — geen eigen postbus. Mail naar een van beide komt dus altijd in de inbox van `richard@smv-advies.nl` terecht.
- `richard@smv-advies.nl` is een echte gehoste mailbox (Porkbun Email Hosting).
- Praktisch gevolg: het maakt voor waar interne meldingen (bv. EmailJS "To Email") uiteindelijk landen niet uit of je `contact@smv-advies.nl`, `info@smv-advies.nl` of direct `richard@smv-advies.nl` invult — alle drie komen bij Richard terecht. Gebruik voor consistentie met de rest van de code (`COMPANY.contactEmail` in `src/data/company.js`) bij voorkeur `contact@smv-advies.nl`.

## EmailJS

- `src/lib/emailjs.js` is de ene, herbruikte low-level sender (`sendEmail(templateId, params, publicKey?)`) voor alle EmailJS-verzendingen in dit project (energie-indicatie, MJOP, contactformulier).
- Meerdere EmailJS-accounts in gebruik: het hoofdaccount (`EMAILJS_PUBLIC_KEY`/`EMAILJS_SERVICE_ID`, gebruikt door energie-indicatie- én contactformulier-templates) en een apart MJOP-account (`EMAILJS_PUBLIC_KEY_MJOP`, expliciet als 3e argument aan `sendEmail()` meegegeven).
- `ONTBREKEND_`-prefix op een template-ID is de bestaande conventie voor "nog geen echt EmailJS-template aangemaakt" — geeft een nette Nederlandse foutmelding i.p.v. een valse succesmelding. Nooit een verzonnen/geraden template-ID invullen; altijd navragen of een echt ID bestaat.
- Contactformulier-template: `EMAILJS_TEMPLATE_CONTACT = 'template_w7aknuu'` (dashboardnaam "Contactformulier", hoofdaccount).
