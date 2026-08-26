import { ROUTES } from '../lib/routes'

/**
 * Prices and package contents are the client's existing published figures
 * (carried over from the current live site), not invented here.
 */
export const PACKAGES = [
  {
    id: 'basis',
    name: 'Basis Pakket',
    subtitle: 'QuickScan · op afstand',
    price: '€ 495 - € 795',
    priceNote: 'excl. btw · indicatieve bandbreedte',
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
    name: 'Premium Pakket',
    subtitle: 'Volledige analyse · met locatiebezoek',
    price: '€ 895 - € 1.495',
    priceNote: 'excl. btw · indicatieve bandbreedte',
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
    badge: 'Meest gekozen',
  },
  {
    id: 'gold',
    name: 'Gold Pakket',
    subtitle: 'A tot Z · volledige ontzorging',
    price: '€ 1.495 - € 2.495',
    priceNote: 'excl. btw · indicatieve bandbreedte',
    description: 'Volledig ontzorgd: van analyse tot en met de oplevering van de laatste maatregel.',
    features: [
      'Alles uit het Premium Pakket',
      'Offertes opvragen en vergelijken bij meerdere installateurs',
      'Volledige subsidiebegeleiding (EIA, ISDE en overige regelingen)',
      'Eén vast aanspreekpunt tot en met oplevering',
    ],
    cta: 'Gold traject aanvragen',
    ctaTo: ROUTES.contact,
    featured: false,
  },
]
