/**
 * Gedeelde kaartvorm voor een standaardonderdeel in stap 3 en 4. Staat de
 * kaart op "niet aanwezig", dan klapt de inhoud samen tot één regel: er
 * valt dan niets in te vullen, en dat houdt de pagina compact op mobiel
 * (sectie 13) in plaats van 12 volledig uitgeklapte kaarten te tonen.
 */
export function ComponentCard({ label, present, presenceControl, statusBadge, removeControl, children }) {
  const collapsed = present === 'nee'

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-semibold text-primary">{label}</p>
        <div className="flex items-center gap-2">
          {statusBadge}
          {presenceControl}
          {removeControl}
        </div>
      </div>
      {collapsed ? (
        <p className="mt-2 text-sm text-foreground-muted">Niet aanwezig in dit pand.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">{children}</div>
      )}
    </div>
  )
}
