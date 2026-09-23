import { Plus, Trash, Buildings, Wrench } from '@phosphor-icons/react'
import { NumberField } from '../energieIndicatie/NumberField'
import { TextField } from '../ui/TextField'
import { TextAreaField } from './fields'
import { Button } from '../ui/Button'
import { COMPONENT_TYPES, getComponentTypeLabel } from '../../lib/mjop/constants'

function ComponentTypeButton({ type, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2.5 text-left text-sm font-medium text-primary transition-colors duration-200 ease-default hover:border-accent/50 hover:bg-accent/5"
    >
      <Plus size={16} weight="bold" className="shrink-0 text-accent" />
      {type.label}
    </button>
  )
}

export function StepBouwdelen({ building, addComponent, updateComponent, removeComponent, onNext, onBack }) {
  const grouped = {
    bouwkundig: COMPONENT_TYPES.filter((t) => t.category === 'bouwkundig'),
    installatie: COMPONENT_TYPES.filter((t) => t.category === 'installatie'),
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Stap 3 van 7</p>
      <h2 className="text-2xl text-primary sm:text-3xl">Bouwdelen & installaties</h2>
      <p className="mt-2 mb-8 text-sm text-foreground-muted">
        Voeg toe wat aanwezig is in het pand. Beschrijf de huidige situatie in eigen woorden. Het plaatsingsjaar mag u
        leeg laten als dat niet bekend is.
      </p>

      <div className="mb-8 flex flex-col gap-5">
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <Buildings size={17} className="text-accent" /> Bouwkundig
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {grouped.bouwkundig.map((type) => (
              <ComponentTypeButton key={type.id} type={type} onClick={() => addComponent(type.id)} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <Wrench size={17} className="text-accent" /> Installaties
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {grouped.installatie.map((type) => (
              <ComponentTypeButton key={type.id} type={type} onClick={() => addComponent(type.id)} />
            ))}
          </div>
        </div>
      </div>

      {building.components.length > 0 ? (
        <div className="flex flex-col gap-4">
          {building.components.map((component) => (
            <div key={component.id} className="rounded-lg border border-border bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <p className="text-base font-semibold text-primary">
                  {getComponentTypeLabel(component.typeId, component.customLabel)}
                </p>
                <button
                  type="button"
                  onClick={() => removeComponent(component.id)}
                  aria-label="Onderdeel verwijderen"
                  className="shrink-0 rounded-md p-1.5 text-foreground-muted hover:bg-error-bg hover:text-error"
                >
                  <Trash size={17} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {component.typeId === 'anders' ? (
                  <TextField
                    id={`mjop-custom-${component.id}`}
                    label="Naam onderdeel"
                    value={component.customLabel}
                    onChange={(v) => updateComponent(component.id, { customLabel: v })}
                  />
                ) : null}

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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-5 py-8 text-center text-sm text-foreground-muted">
          Nog geen bouwdelen of installaties toegevoegd. Kies hierboven wat aanwezig is in het pand.
        </p>
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
