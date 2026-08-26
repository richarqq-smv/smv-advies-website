import { OptionGrid } from './OptionGrid'
import { StepHead } from './StepHead'
import { Button } from '../ui/Button'
import { BEGLAZING_OPTIONS, ISOLATIE_OPTIONS, VERWARMING_OPTIONS } from '../../lib/energieScan/fieldOptions'

export function StepStaatVanHetPand({ values, errors, setValue, onNext, onBack }) {
  return (
    <div>
      <StepHead
        eyebrow="Stap 2 van 4"
        title="Huidige staat van het pand"
        description='Geen idee? Kies gerust "Weet ik niet" — we rekenen dan conservatief, zodat de indicatie betrouwbaar blijft.'
      />

      <OptionGrid
        id="beglazing"
        label="Beglazing"
        options={BEGLAZING_OPTIONS}
        value={values.beglazing}
        onChange={(v) => setValue('beglazing', v)}
        error={errors.beglazing}
      />
      <OptionGrid
        id="isolatie_gevel"
        label="Isolatie gevel"
        options={ISOLATIE_OPTIONS}
        value={values.isolatie_gevel}
        onChange={(v) => setValue('isolatie_gevel', v)}
        error={errors.isolatie_gevel}
      />
      <OptionGrid
        id="isolatie_dak"
        label="Isolatie dak"
        options={ISOLATIE_OPTIONS}
        value={values.isolatie_dak}
        onChange={(v) => setValue('isolatie_dak', v)}
        error={errors.isolatie_dak}
      />
      <OptionGrid
        id="isolatie_vloer"
        label="Isolatie vloer"
        options={ISOLATIE_OPTIONS}
        value={values.isolatie_vloer}
        onChange={(v) => setValue('isolatie_vloer', v)}
        error={errors.isolatie_vloer}
      />
      <OptionGrid
        id="verwarming"
        label="Verwarmingssysteem"
        options={VERWARMING_OPTIONS}
        value={values.verwarming}
        onChange={(v) => setValue('verwarming', v)}
        error={errors.verwarming}
      />

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Vorige
        </Button>
        <Button type="button" onClick={onNext}>
          Volgende
        </Button>
      </div>
    </div>
  )
}
