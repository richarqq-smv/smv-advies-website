import { euro, euroRange, jaren } from '../../lib/energieScan/calculations'

export function MeasureCard({ measure, rank }) {
  const besparingTekst = measure.isElektrisch
    ? `${Math.round(measure.besparingKwh).toLocaleString('nl-NL')} kWh / jaar`
    : `${Math.round(measure.besparingM3).toLocaleString('nl-NL')} m³ gas / jaar`

  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 rounded-xl border border-border bg-white p-5 sm:grid-cols-[auto_1fr_auto] sm:p-6">
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent"
      >
        {rank}
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-semibold text-primary">{measure.naam}</h3>
        <p className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-foreground-muted">{measure.toelichting}</p>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          <div>
            <dt className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">Investering</dt>
            <dd className="text-sm font-semibold text-primary">{euroRange(measure.investeringLaag, measure.investeringHoog)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">Terugverdientijd</dt>
            <dd className="text-sm font-semibold text-primary">{jaren(measure.terugverdientijd)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">Besparing</dt>
            <dd className="text-sm font-semibold text-primary">{besparingTekst}</dd>
          </div>
        </dl>
      </div>

      <div className="col-span-2 flex items-baseline gap-1.5 border-t border-border pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 sm:text-right">
        <span className="text-lg font-bold text-accent">{euro(measure.besparingEuro)}</span>
        <span className="text-xs font-medium text-foreground-muted">per jaar</span>
      </div>
    </div>
  )
}
