import { OptionGrid } from './OptionGrid'
import { SegmentedControl } from './SegmentedControl'
import { NumberField } from './NumberField'
import { StepHead } from './StepHead'
import { Button } from '../ui/Button'
import { PANDTYPE_OPTIONS, BOUWJAAR_OPTIONS, VERDIEPINGEN_OPTIONS } from '../../lib/energieScan/fieldOptions'

export function StepBasisgegevens({ values, errors, setValue, onNext }) {
  return (
    <div>
      <StepHead eyebrow="Stap 1 van 4" title="Vertel ons over uw pand" description="Een paar basisgegevens, zodat we de juiste vuistregels kunnen toepassen." />

      <OptionGrid
        id="pandtype"
        label="Type pand"
        options={PANDTYPE_OPTIONS}
        value={values.pandtype}
        onChange={(v) => setValue('pandtype', v)}
        error={errors.pandtype}
      />

      <OptionGrid
        id="bouwjaar"
        label="Bouwjaar"
        options={BOUWJAAR_OPTIONS}
        value={values.bouwjaar}
        onChange={(v) => setValue('bouwjaar', v)}
        error={errors.bouwjaar}
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <NumberField
          id="oppervlakte"
          label="Gebruiksoppervlakte"
          unit="m²"
          placeholder="Bijv. 450"
          value={values.oppervlakte}
          onChange={(v) => setValue('oppervlakte', v)}
          error={errors.oppervlakte}
        />
        <SegmentedControl
          id="verdiepingen"
          label="Aantal verdiepingen"
          options={VERDIEPINGEN_OPTIONS}
          value={values.verdiepingen}
          onChange={(v) => setValue('verdiepingen', v)}
          error={errors.verdiepingen}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onNext}>
          Volgende
        </Button>
      </div>
    </div>
  )
}
