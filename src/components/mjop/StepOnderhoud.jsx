import { NumberField } from '../energieIndicatie/NumberField'
import { TextAreaField } from './fields'
import { Button } from '../ui/Button'
import { StatusBadge } from './StatusBadge'
import { getComponentTypeLabel } from '../../lib/mjop/constants'
import { deriveComponentStatus } from '../../lib/mjop/linking'
import { validateComponentFields } from '../../lib/mjop/validation'

export function StepOnderhoud({ building, updateComponent, onNext, onBack }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Stap 4 van 7</p>
      <h2 className="text-2xl text-primary sm:text-3xl">Onderhoud en vervanging</h2>
      <p className="mt-2 mb-8 text-sm text-foreground-muted">
        Vul in wat u weet over levensduur, onderhoud en vervanging. Onbekend laten kan altijd. De status hiernaast
        wordt automatisch afgeleid uit wat u invult, en is een signalering, geen technische conclusie.
      </p>

      {building.components.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-8 text-center text-sm text-foreground-muted">
          Voeg eerst bouwdelen of installaties toe bij stap 3.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {building.components.map((component) => {
            const { errors } = validateComponentFields(component)
            const { status } = deriveComponentStatus(component)
            return (
              <div key={component.id} className="rounded-lg border border-border bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-primary">
                    {getComponentTypeLabel(component.typeId, component.customLabel)}
                  </p>
                  <StatusBadge status={status} />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <NumberField
                    id={`mjop-lifetime-${component.id}`}
                    label="Verwachte levensduur"
                    unit="jaar"
                    value={component.expectedLifetime ?? ''}
                    onChange={(v) => updateComponent(component.id, { expectedLifetime: v === '' ? null : Number(v) })}
                    error={errors.expectedLifetime}
                    optional
                  />
                  <NumberField
                    id={`mjop-maintenance-${component.id}`}
                    label="Verwacht onderhoudsjaar"
                    value={component.maintenanceYear ?? ''}
                    onChange={(v) => updateComponent(component.id, { maintenanceYear: v === '' ? null : Number(v) })}
                    error={errors.maintenanceYear}
                    optional
                  />
                  <NumberField
                    id={`mjop-replacement-${component.id}`}
                    label="Verwacht vervangingsjaar"
                    value={component.replacementYear ?? ''}
                    onChange={(v) => updateComponent(component.id, { replacementYear: v === '' ? null : Number(v) })}
                    error={errors.replacementYear}
                    optional
                  />
                </div>

                <div className="mt-4">
                  <TextAreaField
                    id={`mjop-notes-${component.id}`}
                    label="Opmerkingen"
                    rows={2}
                    value={component.notes}
                    onChange={(v) => updateComponent(component.id, { notes: v })}
                  />
                </div>
              </div>
            )
          })}
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
