# SMV Advies — projectnotities voor Claude

## E-mail / domeinconfiguratie (Porkbun)

- `contact@smv-advies.nl` en `info@smv-advies.nl` zijn **forwards** (Porkbun Email Forwarding) naar `richard@smv-advies.nl` — geen eigen postbus. Mail naar een van beide komt dus altijd in de inbox van `richard@smv-advies.nl` terecht.
- `richard@smv-advies.nl` is een echte gehoste mailbox (Porkbun Email Hosting).
- Praktisch gevolg: het maakt voor waar interne meldingen (bv. EmailJS "To Email") uiteindelijk landen niet uit of je `contact@smv-advies.nl`, `info@smv-advies.nl` of direct `richard@smv-advies.nl` invult — alle drie komen bij Richard terecht. Gebruik voor consistentie met de rest van de code (`COMPANY.contactEmail` in `src/data/company.js`) bij voorkeur `contact@smv-advies.nl`.

## EmailJS

- `src/lib/emailjs.js` is de ene, herbruikte low-level sender (`sendEmail(templateId, params, publicKey?)`) voor alle EmailJS-verzendingen in dit project (energie-indicatie, MJOP, contactformulier).
- **Twee EmailJS-accounts, let hier altijd op bij een nieuw template**: het hoofdaccount (`EMAILJS_PUBLIC_KEY`/`EMAILJS_SERVICE_ID`, energie-indicatie-templates) en Richards persoonlijke account (`EMAILJS_PUBLIC_KEY_MJOP` — naam is historisch, ondertussen gedeeld door zowel MJOP áls het contactformulier). De service-ID-tekst `service_oit2hux` bestaat toevallig onder beide accounts, dus dat onderscheidt ze niet. Een template dat in Richards dashboard staat, moet de publicKey-override (3e argument van `sendEmail()`) krijgen — anders zoekt EmailJS het in het verkeerde account en faalt de verzending stilzwijgend ("Verzenden is niet gelukt"), precies zoals bij zowel MJOP als het contactformulier gebeurde. **Controleer dus altijd in welk EmailJS-dashboard een nieuw template daadwerkelijk is aangemaakt voordat je aanneemt welke publicKey erbij hoort.**
- `ONTBREKEND_`-prefix op een template-ID is de bestaande conventie voor "nog geen echt EmailJS-template aangemaakt" — geeft een nette Nederlandse foutmelding i.p.v. een valse succesmelding. Nooit een verzonnen/geraden template-ID invullen; altijd navragen of een echt ID bestaat.
- Contactformulier-template: `EMAILJS_TEMPLATE_CONTACT = 'template_w7aknuu'` (dashboardnaam "Contactformulier", Richards account — gebruikt `EMAILJS_PUBLIC_KEY_MJOP` als override).
