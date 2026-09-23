import { NumberField } from '../energieIndicatie/NumberField'
import { TextAreaField } from './fields'
import { Button } from '../ui/Button'
import { StatusBadge } from './StatusBadge'
import { ComponentCard } from './ComponentCard'
import { PresenceToggle } from './PresenceToggle'
import { getComponentTypeLabel } from '../../lib/mjop/constants'
import { deriveComponentStatus } from '../../lib/mjop/linking'
import { validateComponentFields } from '../../lib/mjop/validation'

export function StepOnderhoud({ building, updateComponent, onNext, onBack }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Stap 4 van 7</p>
      <h2 className="text-2xl text-primary sm:text-3xl">Onderhoud en vervanging</h2>
      <p className="mt-2 mb-8 text-sm text-foreground-muted">
        Alles wat u bij stap 3 heeft aangegeven staat hier al klaar. Vul aan wat u weet over levensduur, onderhoud en
        vervanging. Onbekend laten kan altijd. De status hiernaast wordt automatisch afgeleid uit wat u invult, en is
        een signalering, geen technische conclusie.
      </p>

      <div className="flex flex-col gap-4">
        {building.components.map((component) => {
          const { errors } = validateComponentFields(component)
          const { status } = deriveComponentStatus(component)
          const label = getComponentTypeLabel(component.typeId, component.customLabel)

          return (
            <ComponentCard
              key={component.id}
              label={label}
              present={component.present}
              statusBadge={component.present !== 'nee' ? <StatusBadge status={status} /> : null}
              presenceControl={
                <PresenceToggle
                  id={`mjop-onderhoud-present-${component.id}`}
                  value={component.present}
                  onChange={(v) => updateComponent(component.id, { present: v })}
                />
              }
            >
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
              <TextAreaField
                id={`mjop-notes-${component.id}`}
                label="Opmerkingen"
                rows={2}
                value={component.notes}
                onChange={(v) => updateComponent(component.id, { notes: v })}
              />
            </ComponentCard>
          )
        })}
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
