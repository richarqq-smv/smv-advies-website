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
}
