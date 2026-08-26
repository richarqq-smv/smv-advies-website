/**
 * Row values are ordered to match PACKAGES (Basis, Premium, Gold) from
 * ../data/packages. Carried over from the client's existing published
 * comparison table, not invented here.
 */
export const COMPARISON_ROWS = [
  { label: 'Locatiebezoek', values: [false, true, true] },
  { label: 'Maatregelenoverzicht', values: ['Top 5', 'Volledig (10)', 'Volledig (10) + planning'] },
  { label: 'Financieel overzicht', values: ['Indicatie', "Met scenario's", "Met scenario's + financiering"] },
  { label: 'Offertes opvragen / vergelijken', values: [false, false, true] },
  { label: 'Begeleiding tot oplevering', values: [false, false, true] },
]

export const COMPARISON_NOTE =
  'Alle prijzen zijn indicatieve bandbreedtes exclusief btw; de definitieve prijs hangt af van de omvang van uw pand.'
