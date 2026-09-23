import { Button } from '../ui/Button'
import { StatusBadge } from './StatusBadge'

export function StepKoppeling({ insights, onNext, onBack }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Stap 5 van 7</p>
      <h2 className="text-2xl text-primary sm:text-3xl">Verduurzamingskoppeling</h2>
      <p className="mt-2 mb-8 text-sm text-foreground-muted">
        Hier ziet u welke verduurzamingsmaatregelen op basis van de ingevoerde gegevens relevant kunnen zijn, per
        onderdeel. Dit zijn signaleringen, geen automatisch advies, en dus ook geen probleem als er voor een
        onderdeel op dit moment niets aan de orde is.
      </p>

      {insights.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-8 text-center text-sm text-foreground-muted">
          Geen aanwezige bouwdelen of installaties om te beoordelen. Ga naar stap 3 om aan te geven wat aanwezig is.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {insights.map((insight) => (
            <div key={insight.componentId} className="rounded-lg border border-border bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-semibold text-primary">{insight.componentLabel}</p>
                <StatusBadge status={insight.status} />
              </div>
              <div className="flex flex-col gap-3">
                {insight.recommendations.map((rec, i) => (
                  <div key={rec.measureId ?? i} className="flex flex-col gap-1">
                    {rec.measureName ? (
                      <p className="text-sm font-medium text-primary">{rec.measureName}</p>
                    ) : null}
                    <p className="text-sm leading-relaxed text-foreground-muted">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
