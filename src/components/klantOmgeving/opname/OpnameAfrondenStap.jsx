import { useEffect, useRef, useState } from 'react'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { Button } from '../../ui/Button'
import { debounce } from '../../../lib/klantOmgeving/debounce'
import { updateOpname, updateOpnameStatus } from '../../../lib/klantOmgeving/api'
import { useLatestRef } from '../../../hooks/useLatestRef'
import { berekenChecklistVoortgang, telWaarnemingenPerOnderdeel, onderdeelLabel } from '../../../lib/klantOmgeving/opname'

/**
 * Laatste stap: Algemene opmerkingen (autosave, opdracht §onderaan
 * opnameformulier — dossierbrede opmerking, niet per onderdeel) +
 * compleetheidscontrole + de daadwerkelijke Afronden-/Heropenen-actie.
 *
 * Compleet = alle 38 checklist-items afgevinkt (het brondocument definieert
 * dat zelf zo, zie opname.js). Onderdelen-zonder-waarneming is bewust
 * NIET blokkerend (geen expliciete verplicht-vlag per onderdeel in de
 * bron) — alleen een informatieve lijst, opdracht §21: "de inspecteur
 * moet niet pas na Afronden ontdekken dat er iets mist" is hiermee al
 * gedekt door de compleetheidscontrole zelf zichtbaar te tonen vóór de
 * knop, niet pas na een klik.
 */
export function OpnameAfrondenStap({ opname, checklistItems, waarnemingen, magBewerken, onOpnameChange, onGaNaarStap }) {
  const [notitie, setNotitie] = useState(opname.notitie ?? '')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const pendingRef = useRef(null)
  const onOpnameChangeRef = useLatestRef(onOpnameChange)
  const opnameIdRef = useLatestRef(opname.opname_id)

  const voortgang = berekenChecklistVoortgang(checklistItems)
  const tellingPerOnderdeel = telWaarnemingenPerOnderdeel(waarnemingen)
  const onderdelenZonderWaarneming = Object.entries(tellingPerOnderdeel).filter(([, n]) => n === 0)

  const [opslaan] = useState(() =>
    debounce(async () => {
      if (pendingRef.current === null) return
      const waarde = pendingRef.current
      pendingRef.current = null
      try {
        const bijgewerkt = await updateOpname(opnameIdRef.current, { notitie: waarde })
        if (bijgewerkt) onOpnameChangeRef.current(bijgewerkt)
      } catch {
        // Stille terugval, zelfde overweging als OpnameBasisgegevensStap.
      }
    }, 800),
  )
  useEffect(() => () => opslaan.flush(), [opslaan])

  function notitieChange(waarde) {
    setNotitie(waarde)
    pendingRef.current = waarde
    opslaan()
  }

  async function afronden() {
    setFout(null)
    setBezig(true)
    try {
      const bijgewerkt = await updateOpnameStatus(opname.opname_id, 'afgerond')
      onOpnameChange(bijgewerkt)
    } catch {
      setFout('Afronden is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  async function heropenen() {
    setFout(null)
    setBezig(true)
    try {
      const bijgewerkt = await updateOpnameStatus(opname.opname_id, 'opgeslagen')
      onOpnameChange(bijgewerkt)
    } catch {
      setFout('Heropenen is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Opname</p>
        <h2 className="text-2xl text-primary">Afronden</h2>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-foreground-muted">Algemene opmerkingen locatiebezoek</span>
        <textarea
          rows={4}
          value={notitie}
          disabled={!magBewerken}
          onChange={(e) => notitieChange(e.target.value)}
          onBlur={() => opslaan.flush()}
          className="w-full max-w-full rounded-lg border border-border px-3.5 py-2.5 text-base text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:bg-muted disabled:text-foreground-muted box-border"
        />
      </label>

      <div className="rounded-xl border border-border bg-white p-4">
        <p className="mb-2 text-sm font-medium text-primary">Checklist: {voortgang.afgevinkt} van {voortgang.totaal} afgevinkt</p>
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-accent transition-all" style={{ width: `${(voortgang.afgevinkt / voortgang.totaal) * 100}%` }} />
        </div>
        {voortgang.compleet ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-accent">
            <CheckCircle size={16} weight="fill" /> Checklist volledig ingevuld.
          </p>
        ) : (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-primary">
              <WarningCircle size={16} weight="fill" className="text-accent" /> Nog {voortgang.ontbrekend.length} checklist-item(s) niet afgevinkt.
            </p>
            <ul className="ml-1 flex flex-col gap-0.5 text-xs text-foreground-muted">
              {voortgang.ontbrekend.slice(0, 8).map((i) => (
                <li key={i.item_code}>• {i.tekst}</li>
              ))}
              {voortgang.ontbrekend.length > 8 ? <li>en {voortgang.ontbrekend.length - 8} meer...</li> : null}
            </ul>
            <button
              type="button"
              onClick={() => onGaNaarStap('checklist')}
              className="mt-1 flex min-h-11 items-center rounded-md px-1 text-sm font-medium text-accent hover:underline"
            >
              Naar checklist
            </button>
          </div>
        )}
      </div>

      {onderdelenZonderWaarneming.length > 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-4">
          <p className="mb-1.5 text-sm font-medium text-primary">Onderdelen nog zonder waarneming:</p>
          <p className="text-xs text-foreground-muted">{onderdelenZonderWaarneming.map(([code]) => onderdeelLabel(code)).join(', ')}</p>
        </div>
      ) : null}

      {fout ? <p role="alert" className="text-sm font-medium text-error">{fout}</p> : null}

      {opname.status === 'afgerond' ? (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <CheckCircle size={16} weight="fill" className="text-accent" /> Deze opname is afgerond.
          </p>
          <Button type="button" variant="outline" onClick={heropenen} disabled={bezig} className="w-fit">
            {bezig ? 'Bezig...' : 'Opname heropenen'}
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={afronden} disabled={bezig || !voortgang.compleet} className="w-fit">
          {bezig ? 'Bezig...' : 'Opname afronden'}
        </Button>
      )}
    </div>
  )
}
