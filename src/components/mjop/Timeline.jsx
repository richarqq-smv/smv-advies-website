import { StatusBadge } from './StatusBadge'

/**
 * Verticale tijdlijn — leest even goed op mobiel als op desktop, zonder de
 * complexiteit van een Gantt-chart (zie opdracht sectie 17).
 */
export function Timeline({ years, unknown }) {
  if (years.length === 0 && unknown.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-5 py-8 text-center text-sm text-foreground-muted">
        Nog geen gegevens om een planning uit op te bouwen.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {years.map(({ year, items }) => (
        <div key={year} className="relative pl-8">
          <span className="absolute top-0.5 left-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            •
          </span>
          <span className="absolute top-7 bottom-[-2rem] left-[11px] w-px bg-border" aria-hidden="true" />
          <p className="mb-3 text-lg font-semibold text-primary">{year}</p>
          <div className="flex flex-col gap-3">
            {items.map((insight, i) => (
              <div key={`${insight.componentId}-${i}`} className="rounded-lg border border-border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">{insight.componentLabel}</p>
                  <StatusBadge status={insight.status} />
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                  {insight.recommendations[0]?.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {unknown.length > 0 ? (
        <div className="relative pl-8">
          <span className="absolute top-0.5 left-0 flex h-6 w-6 items-center justify-center rounded-full bg-border text-xs font-bold text-foreground-muted">
            •
          </span>
          <p className="mb-3 text-lg font-semibold text-primary">Nog onbekend</p>
          <div className="flex flex-col gap-3">
            {unknown.map((insight) => (
              <div key={insight.componentId} className="rounded-lg border border-dashed border-border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">{insight.componentLabel}</p>
                  <StatusBadge status={insight.status} />
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                  {insight.recommendations[0]?.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
