import { useEffect, useRef } from 'react'
import { useEnergieScan } from '../../hooks/useEnergieScan'
import { StepIndicator } from './StepIndicator'
import { StepBasisgegevens } from './StepBasisgegevens'
import { StepStaatVanHetPand } from './StepStaatVanHetPand'
import { StepEnergieverbruik } from './StepEnergieverbruik'
import { StepContact } from './StepContact'
import { ResultsView } from './ResultsView'
import { Toast } from './Toast'

export function EnergieScanTool() {
  const scan = useEnergieScan()
  const cardRef = useRef(null)
  const hasMounted = useRef(false)

  // Scroll the card into view on every step change, but not on first
  // paint (matches the source tool: navigation scrolls, initial load
  // doesn't jump).
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [scan.step, scan.result])

  return (
    <div ref={cardRef} className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-10">
      {scan.result ? (
        <ResultsView result={scan.result} values={scan.values} leadStatus={scan.leadStatus} onRestart={scan.restart} />
      ) : (
        <>
          <StepIndicator currentStep={scan.step} />

          {scan.step === 1 ? (
            <StepBasisgegevens values={scan.values} errors={scan.errors} setValue={scan.setValue} onNext={scan.goNext} />
          ) : null}
          {scan.step === 2 ? (
            <StepStaatVanHetPand
              values={scan.values}
              errors={scan.errors}
              setValue={scan.setValue}
              onNext={scan.goNext}
              onBack={() => scan.goToStep(1)}
            />
          ) : null}
          {scan.step === 3 ? (
            <StepEnergieverbruik values={scan.values} setValue={scan.setValue} onNext={scan.goNext} onBack={() => scan.goToStep(2)} />
          ) : null}
          {scan.step === 4 ? (
            <StepContact
              values={scan.values}
              errors={scan.errors}
              setValue={scan.setValue}
              onSubmit={scan.submit}
              onBack={() => scan.goToStep(3)}
              isSubmitting={scan.isSubmitting}
            />
          ) : null}
        </>
      )}

      <Toast message={scan.toast} />
    </div>
  )
}
