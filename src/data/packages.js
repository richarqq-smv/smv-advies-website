import { ROUTES } from '../lib/routes'
import { MEERWERK_UURTARIEF } from '../lib/klantOmgeving/offerte'

/**
 * Commerciële waarheid (Fase 6 — commerciële productimplementatie).
 * `priceTiers` is de enige bron voor prijsberekeningen (zie
 * lib/klantOmgeving/offerte.js's bepaalPrijsTier()): elke tier heeft een
 * `maxOppervlak` (het pand valt in de eerste tier waarvan de oppervlakte
 * niet groter is dan `maxOppervlak`) of `null` voor "op aanvraag" (geen
 * vast bedrag — de adviseur stelt de prijs zelf vast, zie OfferteEditor).
 * `priceDisplay`/`priceNote` zijn uitsluitend leesbare tekst voor de
 * website en worden nooit gebruikt om een bedrag uit af te leiden.
 */
export const PACKAGES = [
  {
    id: 'basis',
    name: 'Basis',
    mindset: 'Oriënteren',
    tagline: 'Waar moet ik beginnen?',
    subtitle: 'QuickScan · op afstand',
    priceTiers: [
      { id: 'tot-1000m2', label: 'Tot 1.000 m²', maxOppervlak: 1000, prijs: 495 },
      { id: '1000-2500m2', label: '1.000 – 2.500 m²', maxOppervlak: 2500, prijs: 695 },
      { id: 'op-aanvraag', label: 'Groter of complexer pand', maxOppervlak: null, prijs: null },
    ],
    priceDisplay: 'Vanaf € 495',
    priceNote: 'excl. btw · afhankelijk van oppervlakte',
    description: 'Een snelle, betrouwbare eerste indicatie, op afstand, zonder locatiebezoek.',
    features: [
      'Overzicht van de huidige situatie op basis van aangeleverde gegevens',
      'De belangrijkste knelpunten in het pand',
      'Top 5 maatregelen met investering, besparing en terugverdientijd',
      'Indicatie van EIA/ISDE-subsidiemogelijkheden',
    ],
    cta: 'QuickScan aanvragen',
    ctaTo: ROUTES.contact,
    featured: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    mindset: 'Beslissen',
    tagline: 'Wat moet ik nu doen, wat kan wachten en waarom?',
    subtitle: 'Volledige analyse · met locatiebezoek',
    priceTiers: [
      { id: 'tot-1000m2', label: 'Tot 1.000 m²', maxOppervlak: 1000, prijs: 995 },
      { id: '1000-2500m2', label: '1.000 – 2.500 m²', maxOppervlak: 2500, prijs: 1295 },
      { id: 'op-aanvraag', label: 'Groter of complexer pand', maxOppervlak: null, prijs: null },
    ],
    priceDisplay: 'Vanaf € 995',
    priceNote: 'excl. btw · afhankelijk van oppervlakte',
    description: 'Een volledig onderbouwd plan, gebaseerd op een fysieke opname van uw pand.',
    features: [
      'Alles uit het Basis Pakket',
      'Fysieke opname ter plaatse',
      'Bouwkundige en installatietechnische analyse in detail',
      'Stappenplan met fasering en financieel overzicht',
    ],
    cta: 'Premium advies aanvragen',
    ctaTo: ROUTES.contact,
    featured: true,
    badge: 'Aanbevolen',
  },
  {
    id: 'gold',
    name: 'Gold',
    mindset: 'Ontzorgd worden',
    tagline: 'Kunnen jullie mij helpen het geregeld te krijgen?',
    subtitle: 'Begeleiding tot en met oplevering',
    priceTiers: [
      { id: 'tot-1000m2', label: 'Tot 1.000 m²', maxOppervlak: 1000, prijs: 2495 },
      { id: '1000-2500m2', label: '1.000 – 2.500 m²', maxOppervlak: 2500, prijs: 2995 },
      { id: 'op-aanvraag', label: 'Groter of complexer pand', maxOppervlak: null, prijs: null },
    ],
    priceDisplay: 'Vanaf € 2.495',
    priceNote: 'excl. btw · afhankelijk van oppervlakte',
    description: 'Volledig ontzorgd, binnen een vooraf afgebakende scope: van maatregelkeuze tot en met oplevering.',
    // Vaste, expliciete grenzen (i.p.v. "volledig"/"tot en met oplevering"
    // zonder afbakening) — alles buiten deze scope is meerwerk (zie
    // MEERWERK_UURTARIEF in lib/klantOmgeving/offerte.js).
    features: [
      'Alles uit het Premium Pakket',
      'Maximaal 3 geselecteerde maatregelen',
      'Offertes bij maximaal 3 aanbieders per maatregel, in 1 offerteronde',
      '3 klantcontactmomenten en 1 startoverleg met de uitvoerder',
      'Ondersteuning bij de EIA/ISDE-aanvraag',
      '1 visuele opleveringscheck (op basis van beschikbare documenten — geen technische keuring, geen bouwkundige inspectie, geen garantie op uitvoeringskwaliteit)',
      'Begeleiding tot maximaal 12 maanden na start',
    ],
    // Alleen op Gold van toepassing (het enige pakket met een vooraf
    // afgebakende scope) — PricingCard.jsx toont dit veld alleen als het
    // aanwezig is.
    scopeNote: `Werkzaamheden buiten deze scope voeren we als meerwerk uit, tegen € ${MEERWERK_UURTARIEF} excl. btw per uur.`,
    cta: 'Gold traject aanvragen',
    ctaTo: ROUTES.contact,
    featured: false,
  },
]
