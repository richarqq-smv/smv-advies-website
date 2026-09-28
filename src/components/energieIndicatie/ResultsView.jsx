import { ArrowClockwise, CheckCircle, Printer, SpinnerGap, WarningCircle } from '@phosphor-icons/react'
import { EnergyScale } from './EnergyScale'
import { Button } from '../ui/Button'
import { EnergieDossierKoppeling } from '../klantOmgeving/EnergieDossierKoppeling'
import { buildPubliekeAandachtspunten, formatKostenBandbreedte, WAT_WEET_DEZE_INDICATIE_NIET } from '../../lib/energieScan/publiekeWeergave'
import { COMPANY } from '../../data/company'

// Deze mailto-conceptmail gaat NAAR SMV Advies zelf, maar de href staat
// gewoon in de publieke pagina-HTML (zichtbaar via "pagina-bron bekijken",
// ook al toont de knop alleen "Bespreek mijn resultaat met SMV") — dus mag
// hierin, net als de zichtbare weergave zelf, geen bedrag staan dat we
// publiek al hebben verborgen (Fase 6). Alleen de band/status (die al wél
// zichtbaar is) wordt hier herhaald, geen totale besparing meer.
function buildGesprekMailto(values, result) {
  const subject = `Aanvraag gratis gesprek — ${values.bedrijfsnaam || ''} (${values.naam || ''})`
  const body =
    `Naam: ${values.naam}\nBedrijf: ${values.bedrijfsnaam}\nTelefoon: ${values.telefoon}\n\n` +
    `Ontving de indicatie "${result.band.status}". Graag een vrijblijvend gesprek inplannen.`
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
          <StatChip label="Geschatte energiekosten / jaar" value={formatKostenBandbreedte(result.huidigeKosten) ?? '–'} />
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-semibold text-primary">Uw belangrijkste aandachtspunten</h3>
        <p className="mt-1 text-sm text-foreground-muted">Op basis van uw gegevens — geen investeringsbedragen of terugverdientijden, dat vraagt een preciezere opname.</p>

        <div className="mt-5 flex flex-col gap-3">
          {buildPubliekeAandachtspunten(result.maatregelen).map((punt, i) => (
            <AandachtspuntItem key={punt.naam} punt={punt} rank={i + 1} />
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-muted/40 px-6 py-7 sm:px-8">
        <h3 className="text-base font-semibold text-primary">Wat deze indicatie niet weet</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
          De Energie Indicatie kijkt naar uw energiegegevens en een paar gebouwkenmerken. Wat hij niet volledig beoordeelt:
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {WAT_WEET_DEZE_INDICATIE_NIET.map((punt) => (
            <li key={punt} className="flex items-start gap-2 text-sm text-foreground-muted">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground-muted/50" />
              {punt}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-xl bg-primary px-6 py-9 text-center text-white sm:px-10">
        <h3 className="text-xl text-white sm:text-2xl">Bespreek uw resultaat met SMV</h3>
        <p className="mx-auto mt-2 max-w-[46ch] text-sm text-white/75">
          De Energie Indicatie geeft een eerste beeld. SMV kan vervolgens kijken wat dit betekent voor uw hele
          bedrijfspand — inclusief onderhoud en het juiste investeringsmoment.
        </p>
        <div className="mt-6">
          <Button href={buildGesprekMailto(values, result)} variant="primary" className="border border-transparent bg-white text-primary hover:bg-white/90">
            Bespreek mijn resultaat met SMV
          </Button>
        </div>
        <p className="mt-4 text-xs text-white/60">15 minuten, geen verplichtingen. Gewoon een goed gesprek.</p>
      </div>

      <div className="mt-6 flex justify-center">
        <LeadStatusNote status={leadStatus} />
      </div>

      <EnergieDossierKoppeling values={values} result={result} />

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

// Toont uitsluitend naam + toelichting (buildPubliekeAandachtspunten()
// heeft de bedragen al weggelaten) — bewust geen investering/besparing/
// terugverdientijd-kolommen meer, in tegenstelling tot de weergave vóór
// Fase 6.
function AandachtspuntItem({ punt, rank }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-white p-5 sm:p-6">
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent"
      >
        {rank}
      </div>
      <div className="min-w-0">
        <h4 className="text-base font-semibold text-primary">{punt.naam}</h4>
        <p className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-foreground-muted">{punt.toelichting}</p>
      </div>
    </div>
  )
}
