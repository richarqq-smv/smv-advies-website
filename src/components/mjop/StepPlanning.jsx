import { useMemo } from 'react'
import { Button } from '../ui/Button'
import { Timeline } from './Timeline'
import { buildTimeline } from '../../lib/mjop/linking'

export function StepPlanning({ insights, onNext, onBack }) {
  const timeline = useMemo(() => buildTimeline(insights), [insights])

  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Stap 6 van 7</p>
      <h2 className="text-2xl text-primary sm:text-3xl">Planning</h2>
      <p className="mt-2 mb-8 text-sm text-foreground-muted">
        Een overzicht in de tijd van de verwachte onderhouds- en vervangingsmomenten, met de verduurzamingsopties die
        daar mogelijk bij aansluiten.
      </p>

      <Timeline years={timeline.years} unknown={timeline.unknown} />

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
