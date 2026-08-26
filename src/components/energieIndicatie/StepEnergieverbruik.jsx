import { Info } from '@phosphor-icons/react'
import { NumberField } from './NumberField'
import { StepHead } from './StepHead'
import { Button } from '../ui/Button'

export function StepEnergieverbruik({ values, setValue, onNext, onBack }) {
  return (
    <div>
      <StepHead
        eyebrow="Stap 3 van 4"
        title="Energieverbruik"
        description="Optioneel, maar maakt de indicatie preciezer. Vul in wat u weet — de rest schatten we op basis van uw pand."
      />

      <div className="mb-8 flex items-start gap-2.5 rounded-lg bg-accent/8 px-4 py-3.5 text-sm text-primary">
        <Info size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" />
        <p>Geen idee van uw verbruik? Geen probleem — sla deze stap gerust over. We schatten uw verbruik dan op basis van uw pand.</p>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <NumberField
          id="gasverbruik"
          label="Jaarlijks gasverbruik"
          unit="m³"
          optional
          placeholder="Bijv. 4200"
          value={values.gasverbruik}
          onChange={(v) => setValue('gasverbruik', v)}
        />
        <NumberField
          id="elekverbruik"
          label="Jaarlijks elektriciteitsverbruik"
          unit="kWh"
          optional
          placeholder="Bijv. 18000"
          value={values.elekverbruik}
          onChange={(v) => setValue('elekverbruik', v)}
        />
      </div>

      <div className="mb-8">
        <NumberField
          id="energiekosten"
          label="Of: gemiddelde maandelijkse energiekosten"
          unit="€ / mnd"
          optional
          placeholder="Bijv. 850"
          value={values.energiekosten}
          onChange={(v) => setValue('energiekosten', v)}
          hint="Weet u uw verbruik niet, maar wel ongeveer uw energiekosten? Vul dan alleen dit veld in — de rest rekenen we voor u uit."
        />
      </div>

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
