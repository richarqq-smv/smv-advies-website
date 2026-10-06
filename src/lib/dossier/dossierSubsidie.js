/**
 * Pure logica voor dossier_subsidies (0035_dossier_subsidies.sql,
 * Subsidiehulp Fase 2) — statuslabels en sortering, geen database, geen
 * React. Zelfde opzet als dossierTaken.js: de database/RLS blijft de
 * echte bron van waarheid, dit is alleen weergave-/sorteerlogica.
 */
export const SUBSIDIE_STATUSSEN = [
  { value: 'voorbereiding', label: 'Voorbereiding' },
  { value: 'ingediend', label: 'Ingediend' },
  { value: 'toegekend', label: 'Toegekend' },
  { value: 'afgewezen', label: 'Afgewezen' },
  { value: 'verantwoord', label: 'Verantwoord' },
]

/** Sorteert subsidies op aanmaakdatum (oudste eerst) — stabiel, net als dossier_taken. */
export function sorteerSubsidies(subsidies) {
  return [...subsidies].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
}

/** Leesbaar label voor een statuswaarde — onbekende/lege status geeft de ruwe waarde terug, nooit een crash. */
export function subsidieStatusLabel(status) {
  return SUBSIDIE_STATUSSEN.find((s) => s.value === status)?.label ?? status ?? ''
}
