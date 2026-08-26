import { LockSimple, SpinnerGap } from '@phosphor-icons/react'
import { TextField } from '../ui/TextField'
import { StepHead } from './StepHead'
import { Button } from '../ui/Button'

export function StepContact({ values, errors, setValue, onSubmit, onBack, isSubmitting }) {
  return (
    <div>
      <StepHead
        eyebrow="Stap 4 van 4"
        title="Waar sturen we uw rapport naartoe?"
        description="Uw persoonlijke rapport met besparingskansen staat klaar. Vul uw gegevens in en we sturen het meteen door."
      />

      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        <TextField
          id="naam"
          label="Naam"
          autoComplete="name"
          placeholder="Voor- en achternaam"
          value={values.naam}
          onChange={(v) => setValue('naam', v)}
          error={errors.naam}
        />
        <TextField
          id="bedrijfsnaam"
          label="Bedrijfsnaam"
          autoComplete="organization"
          placeholder="Naam van uw bedrijf"
          value={values.bedrijfsnaam}
          onChange={(v) => setValue('bedrijfsnaam', v)}
          error={errors.bedrijfsnaam}
        />
      </div>

      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        <TextField
          id="email"
          label="E-mailadres"
          type="email"
          autoComplete="email"
          placeholder="u@bedrijf.nl"
          value={values.email}
          onChange={(v) => setValue('email', v)}
          error={errors.email}
        />
        <TextField
          id="telefoon"
          label="Telefoonnummer"
          type="tel"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          value={values.telefoon}
          onChange={(v) => setValue('telefoon', v)}
          error={errors.telefoon}
        />
      </div>

      <div className="mb-8 flex items-start gap-2.5 rounded-lg bg-muted px-4 py-3.5 text-sm text-foreground-muted">
        <LockSimple size={18} weight="fill" className="mt-0.5 shrink-0 text-primary/60" />
        <p>
          <strong className="font-semibold text-primary">Uw gegevens zijn veilig.</strong> We gebruiken ze uitsluitend om
          uw rapport te versturen en u — desgewenst — te woord te staan over verduurzaming van uw pand. Geen spam, geen
          doorverkoop aan derden.
        </p>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
          Vorige
        </Button>
        <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <SpinnerGap size={18} weight="bold" className="animate-spin motion-reduce:animate-none" />
          ) : null}
          {isSubmitting ? 'Bezig met berekenen…' : 'Bekijk mijn volledige rapport'}
        </Button>
      </div>
    </div>
  )
}
