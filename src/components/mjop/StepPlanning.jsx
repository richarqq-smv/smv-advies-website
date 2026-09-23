import { useMemo } from 'react'
import { Button } from '../ui/Button'
import { Timeline } from './Timeline'
import { buildTimeline, groupByPlanningBucket } from '../../lib/mjop/linking'

const BUCKETS = [
  { id: 'nu', title: 'Nu', description: 'Wat is relevant om te onderzoeken?' },
  { id: 'binnenkort', title: 'Binnenkort', description: 'Welke vervanging of welk onderhoud kan een logisch moment zijn?' },
  { id: 'later', title: 'Later', description: 'Welke maatregelen kunnen worden meegenomen wanneer een onderdeel toch wordt vervangen?' },
  { id: 'onbekend', title: 'Nog onbekend', description: 'Waar ontbreekt nog informatie?' },
]

function BucketSection({ bucket, items }) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="text-lg font-semibold text-primary">{bucket.title}</h3>
      <p className="mt-1 mb-3 text-sm text-foreground-muted">{bucket.description}</p>
      <ul className="flex flex-col gap-2">
        {items.map((insight) => (
          <li key={insight.componentId} className="rounded-lg border border-border bg-white px-4 py-3">
            <p className="text-sm font-medium text-primary">
              {insight.componentLabel}
              {insight.relevantYear ? <span className="ml-2 font-normal text-foreground-muted">({insight.relevantYear})</span> : null}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StepPlanning({ insights, onNext, onBack }) {
  const buckets = useMemo(() => groupByPlanningBucket(insights), [insights])
  const timeline = useMemo(() => buildTimeline(insights), [insights])

  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Stap 6 van 7</p>
      <h2 className="text-2xl text-primary sm:text-3xl">Planning</h2>
      <p className="mt-2 mb-8 text-sm text-foreground-muted">
        Automatisch opgebouwd uit de bekende onderhouds- en vervangingsmomenten en de daarbij relevante
        verduurzamingsmogelijkheden.
      </p>

      <div className="flex flex-col gap-8">
        {BUCKETS.map((bucket) => (
          <BucketSection key={bucket.id} bucket={bucket} items={buckets[bucket.id]} />
        ))}
      </div>

      <div className="mt-10">
        <h3 className="mb-1 text-lg font-semibold text-primary">Jaaroverzicht</h3>
        <p className="mb-4 text-sm text-foreground-muted">Dezelfde momenten, dit keer chronologisch op jaartal.</p>
        <Timeline years={timeline.years} unknown={timeline.unknown} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Terug
        </Button>
        <Button type="button" onClick={onNext}>
          Volgende
        </Button>
      </div>
    </div>
  )
}
