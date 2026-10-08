import { IsolatieInvoerVelden, ApparaatInvoerVelden, VentilatieInvoerVelden } from '../../subsidie/SubsidieInvoerVelden'
import { maatregelSoort } from '../../../lib/subsidie/opnameSubsidieKoppeling'
import { MAATREGEL_LABELS, TECHNISCHE_EENHEID_PER_MAATREGEL } from '../../../lib/subsidie/isdeIsolatieRegels'
import { APPARAAT_LABELS } from '../../../lib/subsidie/isdeApparaatRegels'

const VENTILATIE_LABEL = 'Ventilatie'

/**
 * Compacte subsidie-invoerkaart binnen een opname-onderdeel (opdracht:
 * "gegevens één keer invoeren tijdens de opname, daarna hergebruikt op
 * de subsidiepagina"). Toont uitsluitend de invoervelden zelf — geen
 * status/berekening/bron, dat hoort bij de daadwerkelijke beoordeling op
 * de subsidiepagina (AdminSubsidieBegeleiding.jsx), niet bij de opname.
 * Schrijft rechtstreeks naar dezelfde tabel (dossier_subsidie_
 * specificaties) via dezelfde upsert-functie, dus geen apart dataspoor.
 */
export function OpnameSubsidieKaart({ maatregelKey, specificatie, opslaanBezig, onWijzig, magBewerken }) {
  const soort = maatregelSoort(maatregelKey)
  if (!soort) return null

  const label = soort === 'isolatie' ? MAATREGEL_LABELS[maatregelKey] : soort === 'apparaat' ? APPARAAT_LABELS[maatregelKey] : VENTILATIE_LABEL
  const technischeEenheidLabel = soort === 'isolatie' ? TECHNISCHE_EENHEID_PER_MAATREGEL[maatregelKey] : undefined
  const disabled = !magBewerken

  return (
    <div className="rounded-lg border border-dashed border-accent/40 bg-accent/5 p-3">
      <p className="mb-2 text-xs font-semibold tracking-wide text-accent uppercase">Subsidiegegevens — {label}</p>
      {soort === 'isolatie' ? (
        <IsolatieInvoerVelden
          maatregelKey={maatregelKey}
          specificatie={specificatie}
          opslaanBezig={opslaanBezig}
          onWijzig={onWijzig}
          technischeEenheidLabel={technischeEenheidLabel}
          disabled={disabled}
        />
      ) : soort === 'apparaat' ? (
        <ApparaatInvoerVelden maatregelKey={maatregelKey} specificatie={specificatie} opslaanBezig={opslaanBezig} onWijzig={onWijzig} disabled={disabled} />
      ) : (
        <VentilatieInvoerVelden specificatie={specificatie} opslaanBezig={opslaanBezig} onWijzig={onWijzig} disabled={disabled} />
      )}
      <p className="mt-2 text-[11px] text-foreground-muted">Deze gegevens komen automatisch terug op de subsidiepagina van dit dossier.</p>
    </div>
  )
}
