import { Link } from 'react-router-dom'
import { NumberField } from '../energieIndicatie/NumberField'
import { SelectField } from './fields'
import { Button } from '../ui/Button'
import { ROUTES } from '../../lib/routes'
import { ENERGY_SOURCE_OPTIONS, HEATING_SYSTEM_OPTIONS, ENERGY_LABEL_OPTIONS } from '../../lib/mjop/constants'
import { validateEnergyFields } from '../../lib/mjop/validation'

const LINK_CLASSNAME = 'font-medium text-accent underline underline-offset-2 hover:text-secondary'

export function StepEnergie({ building, setEnergyField, onNext, onBack }) {
  const { energy } = building
  const { errors } = validateEnergyFields(energy)

  const handleNext = () => {
    const { isValid } = validateEnergyFields(energy)
    if (isValid) onNext()
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Stap 2 van 7</p>
      <h2 className="text-2xl text-primary sm:text-3xl">Energie</h2>
      <p className="mt-2 mb-8 text-sm text-foreground-muted">
        Deze gegevens overlappen met onze{' '}
        <Link to={ROUTES.energieIndicatie} className={LINK_CLASSNAME}>
          energie-indicatie
        </Link>
        . Heeft u die al doorlopen? Vul de bekende waarden hier gewoon opnieuw in: een automatische koppeling is er in
        deze versie nog niet.
      </p>

      <div className="flex flex-col gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <NumberField
            id="mjop-gas"
            label="Gasverbruik per jaar"
            unit="m³"
            value={energy.gasConsumption ?? ''}
            onChange={(v) => setEnergyField('gasConsumption', v === '' ? null : Number(v))}
            error={errors.gasConsumption}
            optional
          />
          <NumberField
            id="mjop-elek"
            label="Elektriciteitsverbruik per jaar"
            unit="kWh"
            value={energy.electricityConsumption ?? ''}
            onChange={(v) => setEnergyField('electricityConsumption', v === '' ? null : Number(v))}
            error={errors.electricityConsumption}
            optional
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            id="mjop-energySource"
            label="Energiebron"
            options={ENERGY_SOURCE_OPTIONS}
            value={energy.energySource}
            onChange={(v) => setEnergyField('energySource', v)}
            optional
          />
          <SelectField
            id="mjop-heatingSystem"
            label="Verwarmingssysteem"
            options={HEATING_SYSTEM_OPTIONS}
            value={energy.heatingSystem}
            onChange={(v) => setEnergyField('heatingSystem', v)}
            optional
          />
        </div>

        <SelectField
          id="mjop-energyLabel"
          label="Energielabel, indien bekend"
          options={ENERGY_LABEL_OPTIONS}
          value={energy.energyLabel}
          onChange={(v) => setEnergyField('energyLabel', v)}
          optional
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Terug
        </Button>
        <Button type="button" onClick={handleNext}>
          Volgende
        </Button>
      </div>
    </div>
  )
}
