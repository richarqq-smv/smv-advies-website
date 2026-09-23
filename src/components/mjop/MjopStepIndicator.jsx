import { cn } from '../../lib/cn'
import { STEPS } from '../../hooks/useMjopBuilding'

export function MjopStepIndicator({ currentStep, onStepClick }) {
  return (
    <nav aria-label="Voortgang door de MJOP-tool" className="mb-10">
      <ol className="flex items-center gap-1.5 sm:gap-2.5">
        {STEPS.map((step) => {
          const done = step.n < currentStep
          const active = step.n === currentStep
          return (
            <li key={step.n} className="flex-1">
              <button
                type="button"
                onClick={() => onStepClick?.(step.n)}
                aria-current={active ? 'step' : undefined}
                className="group flex w-full flex-col gap-2 text-left"
              >
                <span
                  className={cn(
                    'h-1 overflow-hidden rounded-full bg-border',
                    (done || active) && 'bg-accent',
                  )}
                />
                <span
                  className={cn(
                    'hidden text-[0.7rem] leading-tight font-medium sm:block',
                    done || active ? 'text-primary' : 'text-foreground-muted',
                  )}
                >
                  {step.n}. {step.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
