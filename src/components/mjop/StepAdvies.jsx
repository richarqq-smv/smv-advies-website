import { useMemo } from 'react'
import { Printer, Download } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { StatusBadge } from './StatusBadge'
import { groupByTimeframe } from '../../lib/mjop/linking'
import { TIMEFRAMES } from '../../lib/mjop/constants'

export function StepAdvies({ building, insights, onExport, onBack }) {
  const groups = useMemo(() => groupByTimeframe(insights), [insights])
  const hasAnything = insights.length > 0

  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase print:hidden">Stap 7 van 7</p>
      <h2 className="text-2xl text-primary sm:text-3xl">Adviesoverzicht</h2>
      <p className="mt-2 mb-2 text-sm text-foreground-muted">
        {building.name || 'Dit pand'}
        {building.location ? `, ${building.location}` : ''}
      </p>
      <p className="mb-8 text-sm text-foreground-muted print:hidden">
        Dit overzicht is bedoeld om samen met een adviseur te bespreken. Het is een signalering op basis van de
        ingevoerde gegevens, geen bindend technisch advies.
      </p>

      {!hasAnything ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-8 text-center text-sm text-foreground-muted">
          Er zijn nog geen bouwdelen of installaties ingevoerd. Ga terug naar stap 3 om te beginnen.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {TIMEFRAMES.map((frame) => {
            const items = groups[frame.id]
            if (!items || items.length === 0) return null
            return (
              <div key={frame.id}>
                <h3 className="mb-4 text-lg font-semibold text-primary">{frame.label}</h3>
                <div className="flex flex-col gap-4">
                  {items.map((insight, index) => (
                    <div key={insight.componentId} className="rounded-lg border border-border bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-base font-semibold text-primary">
                          {index + 1}. {insight.componentLabel}
                          {insight.relevantYear ? (
                            <span className="ml-2 font-normal text-foreground-muted">
                              Verwacht moment: {insight.relevantYear}
                            </span>
                          ) : null}
                        </p>
                        <StatusBadge status={insight.status} />
                      </div>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {insight.recommendations.map((rec, i) => (
                          <p key={rec.measureId ?? i} className="text-sm leading-relaxed text-foreground-muted">
                            {rec.reason}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button type="button" variant="outline" onClick={onBack}>
          Terug
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer size={17} /> Afdrukken / PDF
          </Button>
          <Button type="button" onClick={onExport}>
            <Download size={17} /> JSON exporteren
          </Button>
        </div>
      </div>
    </div>
  )
}
