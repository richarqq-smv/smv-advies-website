/**
 * Central company/contact info.
 *
 * `kvk` is deliberately `null` — the real KvK number is not yet known.
 * Every place that displays it (currently just the Footer) checks for
 * this and simply omits the line when it's null, so filling in the real
 * number here is the ONLY change needed to make it appear everywhere —
 * no other file needs to be touched.
 *
 * `email` (info@smv-advies.nl) is the general/business address used
 * everywhere except the dedicated /contact page, which uses
 * `contactEmail` instead — this is the definitive three-way split:
 * contact@ for the public contact page, info@ for everything else
 * (including energy-scan leads), richard@ for personal replies (not
 * shown publicly anywhere).
 */
export const COMPANY = {
  name: 'SMV Advies',
  legalName: 'SMV Advies — Steen en Mortel Verbetering',
  tagline: 'Elke Stap Maakt Verschil',
  phone: '06 22 71 33 83',
  phoneHref: 'tel:+31622713383',
  email: 'info@smv-advies.nl',
  contactEmail: 'contact@smv-advies.nl',
  address: {
    street: 'Frans Halsstraat 28',
    postalCode: '3262 HG',
    city: 'Oud-Beijerland',
  },
  kvk: null, // fill in the real KvK number here once known — see comment above
  region: 'Hoeksche Waard',
  responseTime: 'Binnen 1 werkdag reactie',
  // Trustpilot-profiel aangemaakt 17 sep 2026, nog 0 reviews op het
  // moment van bouwen. URL bevestigd uit de echte widget-embedcode die
  // vanuit het Trustpilot-dashboard is gekopieerd (Deel en promoot >
  // Website-widgets > Review Collector), niet geraden.
  trustpilotUrl: 'https://nl.trustpilot.com/review/smv-advies.nl',
  linkedinUrl: 'https://www.linkedin.com/company/smv-advies',
  // Nog geen Instagram-account aangemaakt — zelfde null-conventie als kvk
  // hierboven. Footer.jsx toont de Instagram-knop daarom niet-klikbaar
  // totdat hier een echte URL staat.
  instagramUrl: null,
  // Auteursgegevens voor BlogPosting-schema (structuredData.js) —
  // bevestigd door Richard zelf, overgenomen uit zijn eigen
  // e-mailhandtekening (2026-10-14), niet verzonnen. linkedinUrl hierboven
  // is het bedrijfskanaal; dit is zijn persoonlijke profiel, zelfde link
  // als al op de Over-ons-pagina stond.
  founder: {
    name: 'Richard Schipper',
    jobTitle: 'Oprichter',
    linkedinUrl: 'https://www.linkedin.com/in/richard-schipper/',
  },
}
