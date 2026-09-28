import { euro, euroRange, jaren } from '../../lib/energieScan/calculations'
import { formatGetal, formatUitgevoerdOp, besparingHoeveelheidTekst, NIET_INGEVULD } from '../../lib/dossier/energieSnapshotFormat'

/**
 * Read-only weergave van een opgeslagen Energie-indicatie (Energie-indicatie
 * Fase 3) — toont uitsluitend `dossier.energie_snapshot`, nooit een live
 * herberekening. Zelfde principe als de offerte-preview (OfferteDocument.jsx):
 * een eenmaal opgeslagen momentopname moet altijd exact hetzelfde blijven
 * tonen, ook als lib/energieScan/calculations.js, constants.js of
 * fieldOptions.js later veranderen.
 *
 * Geen calculatorfuncties hier: `berekenResultaat`/`prepareCalculationInput`
 * worden nergens geïmporteerd of aangeroepen. `euro`/`euroRange`/`jaren` uit
 * calculations.js zijn pure getalformatters (geen business-lookup, geen
 * herberekening) — dezelfde functies die de publieke ResultsView al
 * gebruikt om exact dezelfde soort waarden te tonen, hier hergebruikt voor
 * consistente notatie, niet om iets opnieuw te bepalen.
 *
 * Alle veldwaarden (pandtype/bouwjaar/... als label, band/status/desc,
 * maatregelen) komen rechtstreeks uit de snapshot zoals
 * energieScanResultToSnapshot() die op het moment van meten heeft
 * bevroren — geen LABELS-lookup, geen SCORE_BANDS-lookup hier.
 */

function Rij({ label, waarde }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className="text-right text-primary">{waarde ?? NIET_INGEVULD}</dd>
    </div>
  )
}

function SectieKop({ children }) {
  return <h4 className="mb-2 text-xs font-semibold tracking-[0.1em] text-accent uppercase">{children}</h4>
}

function MaatregelRij({ maatregel }) {
  const besparingHoeveelheid = besparingHoeveelheidTekst(maatregel)

  return (
    <li className="rounded-lg border border-border p-4">
      <p className="font-medium text-primary">{maatregel.naam ?? 'Onbekende maatregel'}</p>
      {maatregel.toelichting ? <p className="mt-1 text-sm text-foreground-muted">{maatregel.toelichting}</p> : null}
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        <div>
          <dt className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">Investering</dt>
          <dd className="text-sm font-medium text-primary">
            {maatregel.investeringLaag != null && maatregel.investeringHoog != null ? euroRange(maatregel.investeringLaag, maatregel.investeringHoog) : NIET_INGEVULD}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">Terugverdientijd</dt>
          <dd className="text-sm font-medium text-primary">{maatregel.terugverdientijd != null ? jaren(maatregel.terugverdientijd) : NIET_INGEVULD}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">Besparing</dt>
          <dd className="text-sm font-medium text-primary">{besparingHoeveelheid ?? NIET_INGEVULD}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">Besparing / jaar</dt>
          <dd className="text-sm font-medium text-accent">{maatregel.besparingEuro != null ? euro(maatregel.besparingEuro) : NIET_INGEVULD}</dd>
        </div>
      </dl>
    </li>
  )
}

export function EnergieSnapshot({ snapshot }) {
  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Energie-indicatie</p>
        <h3 className="mb-4 text-xl text-primary">Energie-indicatie</h3>
        <p className="text-sm text-foreground-muted">Nog geen Energie-indicatie opgeslagen.</p>
      </div>
    )
  }

  const invoer = snapshot.invoer ?? {}
  const resultaat = snapshot.resultaat ?? {}
  const band = resultaat.band ?? {}
  const huidig = resultaat.huidig ?? {}
  const maatregelen = Array.isArray(resultaat.maatregelen) ? resultaat.maatregelen : []

  const verbruikRijen = [
    invoer.gasverbruik != null ? { label: 'Gasverbruik (opgegeven)', waarde: formatGetal(invoer.gasverbruik, 'm³') } : null,
    invoer.elekverbruik != null ? { label: 'Elektriciteitsverbruik (opgegeven)', waarde: formatGetal(invoer.elekverbruik, 'kWh') } : null,
    invoer.energiekosten != null ? { label: 'Energiekosten (opgegeven)', waarde: `${euro(invoer.energiekosten)} / mnd` } : null,
  ].filter(Boolean)

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Energie-indicatie</p>
      <h3 className="text-xl text-primary">Energie-indicatie</h3>
      <p className="mt-1 mb-6 text-sm text-foreground-muted">Uitgevoerd op {formatUitgevoerdOp(snapshot.uitgevoerd_op)}</p>

      <div className="flex flex-col gap-6">
        <div>
          <SectieKop>Pandgegevens</SectieKop>
          <dl className="flex flex-col divide-y divide-border">
            <Rij label="Pandtype" waarde={invoer.pandtype} />
            <Rij label="Bouwjaar" waarde={invoer.bouwjaar} />
            <Rij label="Oppervlakte" waarde={formatGetal(invoer.oppervlakte, 'm²')} />
            <Rij label="Verdiepingen" waarde={invoer.verdiepingen} />
            <Rij label="Beglazing" waarde={invoer.beglazing} />
            <Rij label="Isolatie gevel" waarde={invoer.isolatie_gevel} />
            <Rij label="Isolatie dak" waarde={invoer.isolatie_dak} />
            <Rij label="Isolatie vloer" waarde={invoer.isolatie_vloer} />
            <Rij label="Verwarming" waarde={invoer.verwarming} />
          </dl>
        </div>

        <div>
          <SectieKop>Verbruik</SectieKop>
          {verbruikRijen.length > 0 ? (
            <dl className="flex flex-col divide-y divide-border">
              {verbruikRijen.map((rij) => (
                <Rij key={rij.label} label={rij.label} waarde={rij.waarde} />
              ))}
            </dl>
          ) : (
            <p className="text-sm text-foreground-muted">Niet opgegeven bij deze meting.</p>
          )}
        </div>

        <div>
          <SectieKop>Resultaat</SectieKop>
          <dl className="flex flex-col divide-y divide-border">
            <Rij label="Score" waarde={resultaat.score != null ? `${resultaat.score} / 100` : null} />
            <Rij label="Band" waarde={band.band != null ? band.band : null} />
            <Rij label="Status" waarde={band.status} />
            <Rij label="Omschrijving" waarde={band.desc} />
            <Rij label="Huidige gasindicatie" waarde={formatGetal(huidig.gas, 'm³ / jaar')} />
            <Rij label="Huidige elektriciteitsindicatie" waarde={formatGetal(huidig.elek, 'kWh / jaar')} />
            <Rij label="Huidige kosten" waarde={resultaat.huidigeKosten != null ? `${euro(resultaat.huidigeKosten)} / jaar` : null} />
          </dl>
        </div>

        <div>
          <SectieKop>Potentiële besparing</SectieKop>
          <dl className="flex flex-col divide-y divide-border">
            <Rij label="Totale besparing" waarde={resultaat.totaleBesparing != null ? `${euro(resultaat.totaleBesparing)} / jaar` : null} />
            <Rij label="CO₂-indicatie" waarde={formatGetal(resultaat.co2, 'kg / jaar')} />
          </dl>
        </div>

        <div>
          <SectieKop>Maatregelen</SectieKop>
          {maatregelen.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {maatregelen.map((maatregel, i) => (
                <MaatregelRij key={i} maatregel={maatregel} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground-muted">Geen maatregelen opgeslagen bij deze meting.</p>
          )}
        </div>
      </div>
    </div>
  )
}
