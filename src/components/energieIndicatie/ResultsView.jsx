import { ArrowClockwise, CheckCircle, Info, Phone, Printer, SpinnerGap, WarningCircle } from '@phosphor-icons/react'
import { EnergyScale } from './EnergyScale'
import { Button } from '../ui/Button'
import { euroRange } from '../../lib/energieScan/calculations'
import { bouwPubliekResultaat, WAT_DEZE_INDICATIE_NIET_WEET } from '../../lib/energieScan/publiekResultaat'
import { COMPANY } from '../../data/company'

function buildGesprekMailto(values, publiek) {
  const subject = `Resultaat Energie Indicatie bespreken — ${values.bedrijfsnaam || ''} (${values.naam || ''})`
  const body =
    `Naam: ${values.naam}\nBedrijf: ${values.bedrijfsnaam}\nTelefoon: ${values.telefoon}\n\n` +
    `Mijn Energie Indicatie: "${publiek.band.status}" (score ${publiek.score} van 100). Graag bespreek ik dit resultaat met SMV Advies.`
  return `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * Resultaat van de Energie Indicatie. Toont bewust alleen de publieke
 * uitkomst (score, band, kostenbandbreedte, aandachtspunten — zie
 * lib/energieScan/publiekResultaat.js), plus wat deze indicatie niet kan
 * weten. De volledige berekening met maatregelen en bedragen gaat alleen
 * naar SMV Advies (interne leadmail).
 */
export function ResultsView({ result, values, leadStatus, onRestart }) {
  const publiek = bouwPubliekResultaat(result)

  return (
    <div>
      <div className="mx-auto max-w-lg text-center">
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-foreground-muted uppercase">Uw eerste indicatie</p>
        <h2 className="text-2xl text-primary sm:text-3xl">{publiek.band.status}</h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-foreground-muted">{publiek.band.desc}</p>

        <div className="mt-8">
          <EnergyScale currentBand={publiek.band.band} />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <StatChip label="Indicatieve energiescore" value={`${publiek.score} / 100`} />
          {publiek.energiekosten ? (
            <StatChip label="Geschatte energiekosten per jaar" value={euroRange(publiek.energiekosten.min, publiek.energiekosten.max)} />
          ) : null}
        </div>
        {publiek.energiekosten ? <p className="mt-3 text-xs text-foreground-muted">Energiekosten {publiek.energiekostenBron}.</p> : null}
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-semibold text-primary">Belangrijkste aandachtspunten</h3>
        {publiek.aandachtspunten.length > 0 ? (
          <>
            <p className="mt-1 text-sm text-foreground-muted">Op basis van uw antwoorden lijken deze onderdelen van uw pand de meeste aandacht te verdienen.</p>
            <ul className="mt-5 flex flex-col gap-3">
              {publiek.aandachtspunten.map((punt) => (
                <li key={punt.id} className="rounded-xl border border-border bg-white px-5 py-4">
                  <p className="font-semibold text-primary">{punt.titel}</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{punt.toelichting}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1 text-sm text-foreground-muted">
            Op basis van uw antwoorden springen er geen duidelijke aandachtspunten uit. Dat zegt nog niets over onderhoud of het juiste moment
            voor een volgende investering.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-muted px-5 py-5 sm:px-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-primary">
          <Info size={18} weight="bold" className="shrink-0 text-accent" />
          Wat deze indicatie niet weet
        </h3>
        <p className="mt-2 text-sm text-foreground-muted">Deze indicatie kijkt alleen naar energie, op basis van uw antwoorden. Ze weet bijvoorbeeld niet:</p>
        <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed text-foreground-muted">
          {WAT_DEZE_INDICATIE_NIET_WEET.map((regel) => (
            <li key={regel}>{regel}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-medium text-primary">Daar begint het advies van SMV Advies.</p>
      </div>

      <div className="mt-10 rounded-xl bg-primary px-6 py-9 text-center text-white sm:px-10">
        <h3 className="text-xl text-white sm:text-2xl">Wilt u weten wat dit voor uw pand betekent?</h3>
        <p className="mx-auto mt-2 max-w-[48ch] text-sm text-white/75">
          Welke maatregelen voor uw pand logisch zijn, en welke voorlopig kunnen wachten, hangt af van meer dan energie. Dat zoekt SMV Advies samen
          met u uit.
        </p>
        <div className="mt-6">
          <Button href={buildGesprekMailto(values, publiek)} variant="primary" className="border border-transparent bg-white text-primary hover:bg-white/90">
            Bespreek mijn resultaat met SMV
          </Button>
        </div>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 text-xs text-white/60">
          <span>
            Liever bellen?{' '}
            <a href={COMPANY.phoneHref} className="inline-flex items-center gap-1 font-medium text-white/80 underline underline-offset-2 hover:text-white">
              <Phone size={12} weight="bold" />
              {COMPANY.phone}
            </a>
          </span>
          <span aria-hidden="true">·</span>
          <span>{COMPANY.responseTime}</span>
        </p>
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
          Let op: dit is een indicatie, geen officieel energielabel en geen verduurzamingsadvies.
        </strong>{' '}
        Deze inschatting is gebaseerd op de door u ingevulde gegevens en algemene vuistregels — niet op een officiële meting volgens NTA 8800
        en niet op een beoordeling van uw pand ter plaatse. Er kunnen geen rechten aan worden ontleend.
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
