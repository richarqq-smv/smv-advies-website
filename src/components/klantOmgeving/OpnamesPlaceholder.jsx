/**
 * Placeholder-navigatiepunt voor de toekomstige Opnames-sectie (mobiele-
 * adminronde, 2026-09-30) — de databasetabel `opnames` bestaat al
 * (0029_opnames.sql), maar de inhoudelijke opnameflow wacht nog op de
 * originele checklist/formulieren van de klant. Dit is bewust een
 * volledig statische kaart: geen data-aanroep, geen formulier, geen
 * opnamevelden — puur zodat de plek in de dossierpagina al bestaat en
 * later zonder layoutwijziging ingevuld kan worden. Admin-only, zelfde
 * plek in de flow als het architectuurvoorstel: Opname hoort tussen de
 * bouwkundige analyse en de rapportage in.
 */
export function OpnamesPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Opnames</p>
      <h3 className="mb-2 text-xl text-primary">Binnenkort beschikbaar</h3>
      <p className="text-sm text-foreground-muted">
        Deze sectie komt beschikbaar zodra de opnamechecklist is aangeleverd en verwerkt. De technische basis (een opname per dossier, gekoppeld aan
        eventuele foto's/documenten) staat al klaar.
      </p>
    </div>
  )
}
