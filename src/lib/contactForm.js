/**
 * Pure validatie/datavoorbereiding voor het contactformulier (/contact,
 * websiteoptimalisatieronde 2026-10-02) — zelfde opzet als
 * energieScan/validation.js: geen I/O, alleen afleidingen uit de
 * ingevulde waarden, zodat ContactForm.jsx en de tests dezelfde, enige
 * bron van waarheid gebruiken. Bedrijfsnaam, plaats en telefoon zijn
 * bewust optioneel (minimale drempel, zie masterprompt §21) — alleen
 * naam, e-mail en de vraag zelf zijn verplicht.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Geeft een `{ veld: foutmelding }`-object terug; leeg object = geldig. */
export function validateContactForm(values) {
  const errors = {}
  if (!values.naam?.trim()) errors.naam = 'Vul uw naam in.'
  if (!EMAIL_RE.test(values.email?.trim() ?? '')) errors.email = 'Vul een geldig e-mailadres in.'
  if (!values.vraag?.trim()) errors.vraag = 'Vul uw vraag in.'
  return errors
}

/** Bouwt de merge-velden voor de EmailJS-template — lege optionele velden worden '-' (leesbaar in het mailtemplate, geen `undefined`). `verzonden_op` volgt hetzelfde patroon als `ingevuld_op` bij de energie-indicatietool (zie lib/energieScan/emailParams.js). */
export function buildContactEmailParams(values) {
  return {
    naam: values.naam.trim(),
    bedrijfsnaam: values.bedrijfsnaam?.trim() || '-',
    plaats: values.plaats?.trim() || '-',
    email: values.email.trim(),
    telefoon: values.telefoon?.trim() || '-',
    vraag: values.vraag.trim(),
    verzonden_op: new Date().toLocaleString('nl-NL'),
  }
}
