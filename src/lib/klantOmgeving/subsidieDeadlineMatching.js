/**
 * Pure logica voor subsidie-deadline-signalering (projectplan
 * "Klantwaarde-uitbreidingen", Fase 7 — #7, ronde 2026-10-19). Matcht
 * een bevestigde regeling-brede deadline/budgetstatus (subsidie_deadlines)
 * tegen de bestaande, per-dossier subsidietrajecten (dossier_subsidies) —
 * nooit andersom afgeleid, nooit een eigen gok naar welke dossiers
 * "relevant" zijn.
 */
const AFGESLOTEN_STATUSSEN = new Set(['toegekend', 'afgewezen', 'verantwoord'])

/**
 * `dossierSubsidie.regeling_naam` is vrije tekst (zie 0035_dossier_
 * subsidies.sql) — een losse, hoofdletterongevoelige "bevat"-check is
 * hier bewust ruim: een dossier dat hierdoor ten onrechte wordt
 * meegenomen is onschuldig (de adviseur bekijkt en verstuurt zelf per
 * dossier, zie AdminSubsidies.jsx), een gemist dossier zou echt een
 * kans missen.
 */
export function bouwGeraakteDossiers(deadline, alleDossierSubsidies) {
  if (!deadline) return []
  const regelingLower = deadline.regeling.toLowerCase()
  return (alleDossierSubsidies ?? []).filter(
    (ds) =>
      typeof ds.regeling_naam === 'string' &&
      ds.regeling_naam.toLowerCase().includes(regelingLower) &&
      !AFGESLOTEN_STATUSSEN.has(ds.status) &&
      ds.dossiers?.status === 'open',
  )
}

/**
 * Randvoorwaarde uit het projectplan: een periodieke zelfcontrole, bv.
 * elke 1-2 maanden. Hier als pure "is het weer tijd om te controleren"-
 * check i.p.v. een cron/Edge Function — er bestaat geen betrouwbare,
 * machineleesbare bron om automatisch te controleren (zie de migratie),
 * dus de daadwerkelijke controle blijft mensenwerk; dit berekent alleen
 * wannéér die herinnering moet verschijnen.
 */
export const CONTROLE_DREMPEL_DAGEN = 60

export function controleIsVerouderd(gecontroleerdOp, nu = new Date()) {
  if (!gecontroleerdOp) return true
  const verschilMs = nu.getTime() - new Date(gecontroleerdOp).getTime()
  const verschilDagen = verschilMs / (24 * 60 * 60 * 1000)
  return verschilDagen >= CONTROLE_DREMPEL_DAGEN
}

/** Meest recente `gecontroleerd_op` van alle ACTIEVE deadlines, of `null` als er nog geen enkele actieve deadline is. */
export function laatsteControleDatum(deadlines) {
  const actief = (deadlines ?? []).filter((d) => d.actief)
  if (actief.length === 0) return null
  return actief.reduce((laatste, d) => (new Date(d.gecontroleerd_op) > new Date(laatste) ? d.gecontroleerd_op : laatste), actief[0].gecontroleerd_op)
}
