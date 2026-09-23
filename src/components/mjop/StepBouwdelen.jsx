import { Plus, Trash, Buildings, Wrench } from '@phosphor-icons/react'
import { NumberField } from '../energieIndicatie/NumberField'
import { TextField } from '../ui/TextField'
import { TextAreaField } from './fields'
import { Button } from '../ui/Button'
import { ComponentCard } from './ComponentCard'
import { PresenceToggle } from './PresenceToggle'
import { getComponentTypeLabel, STANDARD_COMPONENT_TYPES } from '../../lib/mjop/constants'

const BOUWKUNDIG_IDS = STANDARD_COMPONENT_TYPES.filter((t) => t.category === 'bouwkundig').map((t) => t.id)
const INSTALLATIE_IDS = STANDARD_COMPONENT_TYPES.filter((t) => t.category === 'installatie').map((t) => t.id)

function StandardCard({ component, label, updateComponent }) {
  return (
    <ComponentCard
      label={label}
      present={component.present}
      presenceControl={
        <PresenceToggle
          id={`mjop-present-${component.id}`}
          value={component.present}
          onChange={(v) => updateComponent(component.id, { present: v })}
        />
      }
    >
      <TextAreaField
        id={`mjop-situatie-${component.id}`}
        label="Huidige situatie"
        rows={2}
        value={component.currentSituation}
        onChange={(v) => updateComponent(component.id, { currentSituation: v })}
        placeholder="Bijv. originele staat, deels vervangen, recent onderhouden..."
      />
      <div className="max-w-[220px]">
        <NumberField
          id={`mjop-installyear-${component.id}`}
          label="Bouwjaar / plaatsingsjaar"
          value={component.installationYear ?? ''}
          onChange={(v) => updateComponent(component.id, { installationYear: v === '' ? null : Number(v) })}
          optional
        />
      </div>
    </ComponentCard>
  )
}

function CustomCard({ component, updateComponent, removeComponent }) {
  return (
    <ComponentCard
      label={getComponentTypeLabel(component.typeId, component.customLabel) || 'Anders'}
      present={component.present}
      presenceControl={
        <PresenceToggle
          id={`mjop-present-${component.id}`}
          value={component.present}
          onChange={(v) => updateComponent(component.id, { present: v })}
        />
      }
      removeControl={
        <button
          type="button"
          onClick={() => removeComponent(component.id)}
          aria-label="Onderdeel verwijderen"
          className="shrink-0 rounded-md p-1.5 text-foreground-muted hover:bg-error-bg hover:text-error"
        >
          <Trash size={17} />
        </button>
      }
    >
      <TextField
        id={`mjop-custom-${component.id}`}
        label="Naam onderdeel"
        value={component.customLabel}
        onChange={(v) => updateComponent(component.id, { customLabel: v })}
      />
      <TextAreaField
        id={`mjop-situatie-${component.id}`}
        label="Huidige situatie"
        rows={2}
        value={component.currentSituation}
        onChange={(v) => updateComponent(component.id, { currentSituation: v })}
      />
      <div className="max-w-[220px]">
        <NumberField
          id={`mjop-installyear-${component.id}`}
          label="Bouwjaar / plaatsingsjaar"
          value={component.installationYear ?? ''}
          onChange={(v) => updateComponent(component.id, { installationYear: v === '' ? null : Number(v) })}
          optional
        />
      </div>
    </ComponentCard>
  )
}

export function StepBouwdelen({ building, addComponent, updateComponent, removeComponent, onNext, onBack }) {
  const bouwkundig = building.components.filter((c) => BOUWKUNDIG_IDS.includes(c.typeId))
  const installaties = building.components.filter((c) => INSTALLATIE_IDS.includes(c.typeId))
  const custom = building.components.filter((c) => c.typeId === 'anders')

  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Stap 3 van 7</p>
      <h2 className="text-2xl text-primary sm:text-3xl">Bouwdelen & installaties</h2>
      <p className="mt-2 mb-8 text-sm text-foreground-muted">
        Loop het pand langs en vul in wat u weet. Geef bij ieder onderdeel aan of het aanwezig is. Is iets niet van
        toepassing, kies dan gewoon "Nee". Weet u het niet, dan blijft "Onbekend" gewoon staan en gaat u door.
      </p>

      <div className="flex flex-col gap-8">
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <Buildings size={17} className="text-accent" /> Bouwkundig
          </p>
          <div className="flex flex-col gap-4">
            {bouwkundig.map((component) => (
              <StandardCard
                key={component.id}
                component={component}
                label={getComponentTypeLabel(component.typeId, component.customLabel)}
                updateComponent={updateComponent}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <Wrench size={17} className="text-accent" /> Installaties
          </p>
          <div className="flex flex-col gap-4">
            {installaties.map((component) => (
              <StandardCard
                key={component.id}
                component={component}
                label={getComponentTypeLabel(component.typeId, component.customLabel)}
                updateComponent={updateComponent}
              />
            ))}
          </div>
        </div>

        {custom.length > 0 ? (
          <div>
            <p className="mb-3 text-sm font-semibold text-primary">Overige onderdelen</p>
            <div className="flex flex-col gap-4">
              {custom.map((component) => (
                <CustomCard
                  key={component.id}
                  component={component}
                  updateComponent={updateComponent}
                  removeComponent={removeComponent}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <button
            type="button"
            onClick={() => addComponent('anders')}
            className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3.5 py-2.5 text-sm font-medium text-foreground-muted transition-colors duration-200 ease-default hover:border-accent/50 hover:text-primary"
          >
            <Plus size={16} weight="bold" className="shrink-0 text-accent" />
            Nog een onderdeel toevoegen
          </button>
        </div>
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
