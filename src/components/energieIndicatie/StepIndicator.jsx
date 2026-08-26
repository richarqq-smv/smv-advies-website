import { cn } from '../../lib/cn'

const STEPS = [
  { n: 1, label: 'Basisgegevens' },
  { n: 2, label: 'Staat van het pand' },
  { n: 3, label: 'Energieverbruik' },
  { n: 4, label: 'Uw rapport' },
]

export function StepIndicator({ currentStep }) {
  return (
    <nav aria-label="Voortgang door het formulier" className="mb-10 flex items-center gap-2.5">
      {STEPS.map((step) => {
        const done = step.n < currentStep
        const active = step.n === currentStep
        return (
          <div key={step.n} className="flex flex-1 flex-col gap-2">
            <div className="h-1 overflow-hidden rounded-full bg-border">
              <div
                className={cn(
                  'h-full rounded-full transition-transform duration-500 ease-default',
                  done || active ? 'scale-x-100 bg-accent' : 'scale-x-0 bg-accent',
                )}
                style={{ transformOrigin: 'left' }}
              />
            </div>
            <span
              aria-current={active ? 'step' : undefined}
              className={cn(
                'hidden text-xs font-medium sm:block',
                done || active ? 'text-primary' : 'text-foreground-muted',
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
