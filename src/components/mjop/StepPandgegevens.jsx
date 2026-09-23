import { TextField } from '../ui/TextField'
import { NumberField } from '../energieIndicatie/NumberField'
import { SelectField, TextAreaField } from './fields'
import { Button } from '../ui/Button'
import { BUILDING_USE_OPTIONS } from '../../lib/mjop/constants'
import { validateBuildingFields } from '../../lib/mjop/validation'

export function StepPandgegevens({ building, setBuildingField, onNext }) {
  const handleNext = () => {
    const { isValid } = validateBuildingFields(building)
    if (isValid) onNext()
  }

  const { errors } = validateBuildingFields(building)

  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Stap 1 van 7</p>
      <h2 className="text-2xl text-primary sm:text-3xl">Pandgegevens</h2>
      <p className="mt-2 mb-8 text-sm text-foreground-muted">
        Algemene gegevens over het pand. Wat u nog niet weet, kunt u leeg laten.
      </p>

      <div className="flex flex-col gap-6">
        <TextField
          id="mjop-name"
          label="Naam / omschrijving pand"
          placeholder="Bijv. Bedrijfspand Frans Halsstraat"
          value={building.name}
          onChange={(v) => setBuildingField('name', v)}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            id="mjop-location"
            label="Plaats"
            placeholder="Bijv. Oud-Beijerland"
            value={building.location}
            onChange={(v) => setBuildingField('location', v)}
          />
          <NumberField
            id="mjop-constructionYear"
            label="Bouwjaar"
            value={building.constructionYear ?? ''}
            onChange={(v) => setBuildingField('constructionYear', v === '' ? null : Number(v))}
            error={errors.constructionYear}
            optional
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            id="mjop-buildingUse"
            label="Gebruikstype"
            options={BUILDING_USE_OPTIONS}
            value={building.buildingUse}
            onChange={(v) => setBuildingField('buildingUse', v)}
            optional
          />
          <NumberField
            id="mjop-floorArea"
            label="Bruto vloeroppervlak"
            unit="m²"
            value={building.floorArea ?? ''}
            onChange={(v) => setBuildingField('floorArea', v === '' ? null : Number(v))}
            error={errors.floorArea}
            optional
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <NumberField
            id="mjop-floors"
            label="Aantal verdiepingen"
            value={building.floors ?? ''}
            onChange={(v) => setBuildingField('floors', v === '' ? null : Number(v))}
            error={errors.floors}
            optional
          />
          <NumberField
            id="mjop-occupants"
            label="Aantal gebruikers"
            value={building.occupants ?? ''}
            onChange={(v) => setBuildingField('occupants', v === '' ? null : Number(v))}
            error={errors.occupants}
            optional
          />
        </div>

        <TextAreaField
          id="mjop-notes"
          label="Opmerkingen"
          value={building.notes}
          onChange={(v) => setBuildingField('notes', v)}
          placeholder="Overige relevante informatie over het pand."
        />
      </div>

      <div className="mt-8 flex justify-end">
        <Button type="button" onClick={handleNext}>
          Volgende
        </Button>
      </div>
    </div>
  )
}
