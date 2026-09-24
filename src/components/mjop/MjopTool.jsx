import { useEffect, useRef } from 'react'
import { useMjopBuilding, STEPS } from '../../hooks/useMjopBuilding'
import { BuildingManager } from './BuildingManager'
import { MjopStepIndicator } from './MjopStepIndicator'
import { StepPandgegevens } from './StepPandgegevens'
import { StepEnergie } from './StepEnergie'
import { StepBouwdelen } from './StepBouwdelen'
import { StepOnderhoud } from './StepOnderhoud'
import { StepKoppeling } from './StepKoppeling'
import { StepPlanning } from './StepPlanning'
import { StepAdvies } from './StepAdvies'
import { Toast } from '../energieIndicatie/Toast'

export function MjopTool() {
  const mjop = useMjopBuilding()
  const cardRef = useRef(null)
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [mjop.step])

  const goNext = () => mjop.goToStep(Math.min(mjop.step + 1, STEPS.length))
  const goBack = () => mjop.goToStep(Math.max(mjop.step - 1, 1))

  return (
    <div ref={cardRef}>
      <BuildingManager
        onExport={mjop.exportJson}
        onImportText={mjop.importJson}
        onReset={mjop.resetAll}
        onLoadTestBuilding={mjop.loadTestBuilding}
      />

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm print:border-none print:p-0 print:shadow-none sm:p-10">
        <div className="print:hidden">
          <MjopStepIndicator currentStep={mjop.step} onStepClick={mjop.goToStep} />
        </div>

        {mjop.step === 1 ? (
          <StepPandgegevens building={mjop.building} setBuildingField={mjop.setBuildingField} onNext={goNext} />
        ) : null}
        {mjop.step === 2 ? (
          <StepEnergie building={mjop.building} setEnergyField={mjop.setEnergyField} onNext={goNext} onBack={goBack} />
        ) : null}
        {mjop.step === 3 ? (
          <StepBouwdelen
            building={mjop.building}
            addComponent={mjop.addComponent}
            updateComponent={mjop.updateComponent}
            removeComponent={mjop.removeComponent}
            onNext={goNext}
            onBack={goBack}
          />
        ) : null}
        {mjop.step === 4 ? (
          <StepOnderhoud building={mjop.building} updateComponent={mjop.updateComponent} onNext={goNext} onBack={goBack} />
        ) : null}
        {mjop.step === 5 ? <StepKoppeling insights={mjop.insights} onNext={goNext} onBack={goBack} /> : null}
        {mjop.step === 6 ? <StepPlanning insights={mjop.insights} onNext={goNext} onBack={goBack} /> : null}
        {mjop.step === 7 ? (
          <StepAdvies
            building={mjop.building}
            insights={mjop.insights}
            onExport={mjop.exportJson}
            onSend={mjop.sendAnalysis}
            sendStatus={mjop.sendStatus}
            onSaveMjop={mjop.saveMjopSnapshot}
            saveMjopStatus={mjop.saveMjopStatus}
            setContactField={mjop.setContactField}
            onBack={goBack}
          />
        ) : null}
      </div>

      <Toast message={mjop.toast} />
    </div>
  )
}
