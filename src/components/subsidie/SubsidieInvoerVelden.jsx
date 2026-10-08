/**
 * Herbruikbare invoervelden voor dossier_subsidie_specificaties — exact
 * dezelfde drie veldensets die AdminSubsidieBegeleiding.jsx gebruikt,
 * hier losgetrokken van de kaart eromheen (status-badge/redenen/
 * berekening/bron) zodat ze ook compact binnen een opname-onderdeel
 * kunnen worden getoond (opdracht: gegevens één keer invoeren tijdens
 * de opname, daarna hergebruikt op de subsidiepagina — geen tweede,
 * losstaande set velden/componenten).
 */
export const INPUT_CLASSNAME = 'w-full rounded-lg border border-border px-3 py-2 text-sm'
export const SELECT_CLASSNAME = 'w-full rounded-lg border border-border px-3 py-2 text-sm'

/** Dak/gevel/vloer/bodem/glas: oppervlakte + Rd- of U-waarde + meldcode + "aangebracht?". `disabled` schakelt alle velden uit (bv. een afgeronde opname), los van `opslaanBezig` (een actieve autosave van dit ene veldenblok). */
export function IsolatieInvoerVelden({ maatregelKey, specificatie, opslaanBezig, onWijzig, technischeEenheidLabel, disabled = false }) {
  const uitgeschakeld = disabled || opslaanBezig === maatregelKey
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs text-foreground-muted">
        Oppervlakte (m²)
        <input
          type="number"
          min="0"
          step="0.1"
          className={INPUT_CLASSNAME}
          defaultValue={specificatie?.oppervlakteM2 ?? ''}
          disabled={uitgeschakeld}
          onBlur={(e) => onWijzig(maatregelKey, 'oppervlakteM2', e.target.value === '' ? null : Number(e.target.value))}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground-muted">
        Isolatiewaarde ({technischeEenheidLabel ?? 'Rd, m²K/W'})
        <input
          type="number"
          min="0"
          step="0.1"
          className={INPUT_CLASSNAME}
          defaultValue={specificatie?.technischeWaarde ?? ''}
          disabled={uitgeschakeld}
          onBlur={(e) => onWijzig(maatregelKey, 'technischeWaarde', e.target.value === '' ? null : Number(e.target.value))}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground-muted">
        Meldcode
        <input
          type="text"
          className={INPUT_CLASSNAME}
          placeholder="Vraag de leverancier/installateur"
          defaultValue={specificatie?.meldcode ?? ''}
          disabled={uitgeschakeld}
          onBlur={(e) => onWijzig(maatregelKey, 'meldcode', e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground-muted">
        Is er isolatie aangebracht?
        <select
          className={SELECT_CLASSNAME}
          value={specificatie?.isolatieBevestigd ?? 'onbekend'}
          disabled={uitgeschakeld}
          onChange={(e) => onWijzig(maatregelKey, 'isolatieBevestigd', e.target.value)}
        >
          <option value="onbekend">Nog onbekend</option>
          <option value="ja">Ja</option>
          <option value="nee">Nee</option>
        </select>
      </label>
    </div>
  )
}

/** Warmtepomp/zonneboiler: meldcode + adviseur-ingevoerd bedrag + bron-URL + "geïnstalleerd?". */
export function ApparaatInvoerVelden({ maatregelKey, specificatie, opslaanBezig, onWijzig, disabled = false }) {
  const uitgeschakeld = disabled || opslaanBezig === maatregelKey
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs text-foreground-muted sm:col-span-2">
        Wordt dit apparaat geïnstalleerd?
        <select
          className={SELECT_CLASSNAME}
          value={specificatie?.isolatieBevestigd ?? 'onbekend'}
          disabled={uitgeschakeld}
          onChange={(e) => onWijzig(maatregelKey, 'isolatieBevestigd', e.target.value)}
        >
          <option value="onbekend">Nog onbekend</option>
          <option value="ja">Ja</option>
          <option value="nee">Nee</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground-muted">
        Meldcode (van het specifieke apparaat)
        <input
          type="text"
          className={INPUT_CLASSNAME}
          placeholder="Zoek op in de RVO-meldcodelijst"
          defaultValue={specificatie?.meldcode ?? ''}
          disabled={uitgeschakeld}
          onBlur={(e) => onWijzig(maatregelKey, 'meldcode', e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground-muted">
        Subsidiebedrag (van de meldcodepagina)
        <input
          type="number"
          min="0"
          step="0.01"
          className={INPUT_CLASSNAME}
          placeholder="Bijv. 1925,00"
          defaultValue={specificatie?.bedrag ?? ''}
          disabled={uitgeschakeld}
          onBlur={(e) => onWijzig(maatregelKey, 'bedrag', e.target.value === '' ? null : Number(e.target.value))}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground-muted sm:col-span-2">
        URL van de meldcodepagina van dit apparaat
        <input
          type="url"
          className={INPUT_CLASSNAME}
          placeholder="https://www.rvo.nl/meldcodes-..."
          defaultValue={specificatie?.bronUrl ?? ''}
          disabled={uitgeschakeld}
          onBlur={(e) => onWijzig(maatregelKey, 'bronUrl', e.target.value)}
        />
      </label>
    </div>
  )
}

/** Ventilatie: alleen meldcode + "wordt dit geïnstalleerd?" (vast bedrag, geen oppervlakte, geen adviseur-bedrag). */
export function VentilatieInvoerVelden({ specificatie, opslaanBezig, onWijzig, disabled = false }) {
  const uitgeschakeld = disabled || opslaanBezig === 'ventilatie'
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs text-foreground-muted">
        Meldcode (ventilatie-eenheid)
        <input
          type="text"
          className={INPUT_CLASSNAME}
          placeholder="Zoek op in de RVO-meldcodelijst"
          defaultValue={specificatie?.meldcode ?? ''}
          disabled={uitgeschakeld}
          onBlur={(e) => onWijzig('ventilatie', 'meldcode', e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-foreground-muted">
        Wordt dit geïnstalleerd?
        <select
          className={SELECT_CLASSNAME}
          value={specificatie?.isolatieBevestigd ?? 'onbekend'}
          disabled={uitgeschakeld}
          onChange={(e) => onWijzig('ventilatie', 'isolatieBevestigd', e.target.value)}
        >
          <option value="onbekend">Nog onbekend</option>
          <option value="ja">Ja</option>
          <option value="nee">Nee</option>
        </select>
      </label>
    </div>
  )
}
