import { ArrowClockwise, CheckCircle, Printer, SpinnerGap, WarningCircle } from '@phosphor-icons/react'
import { EnergyScale } from './EnergyScale'
import { MeasureCard } from './MeasureCard'
import { Button } from '../ui/Button'
import { euro } from '../../lib/energieScan/calculations'
import { COMPANY } from '../../data/company'

function buildGesprekMailto(values, result) {
  const subject = `Aanvraag gratis gesprek — ${values.bedrijfsnaam || ''} (${values.naam || ''})`
  const body =
    `Naam: ${values.naam}\nBedrijf: ${values.bedrijfsnaam}\nTelefoon: ${values.telefoon}\n\n` +
    `Ontving de indicatie "${result.band.status}" met een geschat besparingspotentieel van ${euro(result.totaleBesparing)} per jaar. Graag een vrijblijvend gesprek inplannen.`
  return `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function ResultsView({ result, values, leadStatus, onRestart }) {
  return (
    <div>
      <div className="mx-auto max-w-lg text-center">
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-foreground-muted uppercase">Uw indicatie</p>
        <h2 className="text-2xl text-primary sm:text-3xl">{result.band.status}</h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-foreground-muted">{result.band.desc}</p>

        <div className="mt-8">
          <EnergyScale currentBand={result.band.band} />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <StatChip label="Geschatte energiekosten / jaar" value={euro(result.huidigeKosten)} />
          <StatChip label="Totale besparing / jaar mogelijk" value={euro(result.totaleBesparing)} />
          <StatChip label="Indicatieve CO₂-reductie / jaar" value={`${Math.round(result.co2).toLocaleString('nl-NL')} kg`} />
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-semibold text-primary">Uw grootste besparingskansen</h3>
        <p className="mt-1 text-sm text-foreground-muted">Gerangschikt op geschat jaarlijks besparingspotentieel, op basis van uw gegevens.</p>

        <div className="mt-5 flex flex-col gap-4">
          {result.maatregelen.map((m, i) => (
            <MeasureCard key={m.naam} measure={m} rank={i + 1} />
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-xl bg-primary px-6 py-9 text-center text-white sm:px-10">
        <h3 className="text-xl text-white sm:text-2xl">Wilt u weten wat dit concreet betekent voor uw pand?</h3>
        <p className="mx-auto mt-2 max-w-[46ch] text-sm text-white/75">
          Deze indicatie geeft richting. Voor exacte besparingen, kosten en een stappenplan dat klopt, meet SMV Advies
          uw pand fysiek op — vrijblijvend en zonder poespas.
        </p>
        <div className="mt-6">
          <Button href={buildGesprekMailto(values, result)} variant="primary" className="border border-transparent bg-white text-primary hover:bg-white/90">
            Plan een gratis gesprek
          </Button>
        </div>
        <p className="mt-4 text-xs text-white/60">15 minuten, geen verplichtingen. Gewoon een goed gesprek.</p>
      </div>

      <div className="mt-6 flex justify-center">
        <LeadStatusNote status={leadStatus} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-foreground-muted underline decoration-foreground-muted/40 underline-offset-4 hover:text-primary"
        >
          <Printer size={16} />
          Download als PDF
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-foreground-muted underline decoration-foreground-muted/40 underline-offset-4 hover:text-primary"
        >
          <ArrowClockwise size={16} />
          Opnieuw invullen
        </button>
      </div>

      <div className="mt-8 rounded-lg bg-muted px-5 py-4 text-xs leading-relaxed text-foreground-muted">
        <strong className="font-semibold text-primary">
          Let op: dit is een indicatie, geen officieel energielabel en geen garantie.
        </strong>{' '}
        Deze inschatting is gebaseerd op de door u ingevulde gegevens en realistische vuistregels — niet op een
        officiële meting volgens NTA 8800. Voor betrouwbare cijfers en een onderbouwd plan is een fysieke inmeting
        door SMV Advies nodig.
      </div>
    </div>
  )
}

function LeadStatusNote({ status }) {
  if (status === 'sending') {
    return (
      <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
        <SpinnerGap size={14} weight="bold" className="animate-spin motion-reduce:animate-none" />
        Bezig met versturen van uw aanvraag…
      </p>
    )
  }

  if (status === 'sent') {
    return (
      <p role="status" className="flex items-center gap-1.5 rounded-full bg-accent/8 px-3.5 py-1.5 text-xs font-semibold text-accent">
        <CheckCircle size={14} weight="fill" />
        Aanvraag verstuurd naar SMV Advies
      </p>
    )
  }

  if (status === 'error') {
    return (
      <p role="alert" className="flex max-w-md items-start gap-1.5 text-xs leading-relaxed text-error">
        <WarningCircle size={14} weight="fill" className="mt-0.5 shrink-0" />
        Uw aanvraag kon niet automatisch worden verstuurd. Bel of mail ons gerust rechtstreeks — uw resultaat hierboven
        blijft gewoon zichtbaar.
      </p>
    )
  }

  return null
}

function StatChip({ label, value }) {
  return (
    <div className="min-w-[150px] rounded-lg bg-muted px-5 py-3.5 text-left">
      <p className="text-lg font-bold text-primary">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-foreground-muted">{label}</p>
    </div>
  )
}
