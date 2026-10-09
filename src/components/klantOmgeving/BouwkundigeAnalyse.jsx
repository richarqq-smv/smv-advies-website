import { useState } from 'react'
import { Button } from '../ui/Button'
import { updateDossierBouwkundigeAnalyse } from '../../lib/klantOmgeving/api'

const INPUT_CLASSNAME = 'w-full rounded-lg border border-border px-3 py-2 text-sm'
const SELECT_CLASSNAME = 'rounded-lg border border-border px-2 py-2 text-sm'

// Vaste rijen + eis-tekst uit de Premium/Gold-rapporttemplate (bewust niet
// opgeslagen: de eis verandert nooit per dossier, zie
// 0027_dossiers_bouwkundige_analyse.sql). "Installaties" heeft in de
// template vaste "n.v.t."-waarden i.p.v. een Rc/U-kolom en blijft daarom
// buiten deze structuur.
const BOUWDELEN = [
  { key: 'gevel', label: 'Gevel (spouwmuur)', eis: 'Rc ≥ 4,7' },
  { key: 'dak', label: 'Dak', eis: 'Rc ≥ 4,7' },
  { key: 'vloer', label: 'Vloer / bodem', eis: 'Rc ≥ 3,7' },
  { key: 'beglazing', label: 'Beglazing', eis: 'U ≤ 1,65' },
]

// Vaste, beperkte keuzelijst i.p.v. een vrij invoerveld (voorkomt spelling-
// varianten als "slecht"/"Slecht"/"matig" naast elkaar in het rapport).
// Een eerder opgeslagen, afwijkende waarde (bv. uit oudere dossiers) wordt
// nooit stilzwijgend overschreven — zie de render hieronder.
const BEOORDELING_OPTIES = ['Goed', 'Voldoende', 'Matig', 'Slecht']

function leeg() {
  return { waarde: '', eenheid: 'Rc', beoordeling: '', opmerking: '' }
}

/**
 * Rc/U-waarden voor de bouwkundige analyse (Premium/Gold-rapporttabel) —
 * admin-only, vakinhoudelijk door de adviseur tijdens de fysieke opname
 * ingevuld. Nooit berekend of voorgesteld: elk veld start leeg. Alleen
 * zichtbaar voor Premium/Gold — het Basis/QuickScan-rapport heeft deze
 * tabel niet (zie premium.docx/gold.docx sectie 3).
 */
export function BouwkundigeAnalyse({ dossier, onDossierChange, magBeheren }) {
  const [waarden, setWaarden] = useState(() => {
    const opgeslagen = dossier.bouwkundige_analyse ?? {}
    const init = {}
    BOUWDELEN.forEach((b) => {
      init[b.key] = { ...leeg(), ...opgeslagen[b.key] }
    })
    return init
  })
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [opgeslagen, setOpgeslagen] = useState(false)

  if (!magBeheren || dossier.pakket_id === 'basis') return null

  function wijzig(key, veld, value) {
    setOpgeslagen(false)
    setWaarden((v) => ({ ...v, [key]: { ...v[key], [veld]: value } }))
  }

  async function opslaan() {
    setFout(null)
    setBezig(true)
    try {
      const bijgewerkt = await updateDossierBouwkundigeAnalyse(dossier.dossier_id, waarden)
      onDossierChange(bijgewerkt)
      setOpgeslagen(true)
    } catch {
      setFout('Opslaan is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Bouwkundige analyse</p>
      <h3 className="mb-4 text-xl text-primary">Rc/U-waarden (schatting)</h3>
      <p className="mb-4 text-sm text-foreground-muted">Vul uitsluitend in wat u tijdens de opname daadwerkelijk heeft vastgesteld — laat een veld leeg als het onbekend is.</p>

      <div className="flex flex-col gap-4">
        {BOUWDELEN.map((b) => (
          <div key={b.key} className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">{b.label}</p>
              <p className="text-xs text-foreground-muted">Eis: {b.eis}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="flex gap-2 sm:col-span-1">
                <input className={INPUT_CLASSNAME} placeholder="Waarde" value={waarden[b.key].waarde} onChange={(e) => wijzig(b.key, 'waarde', e.target.value)} />
                <select className={SELECT_CLASSNAME} value={waarden[b.key].eenheid} onChange={(e) => wijzig(b.key, 'eenheid', e.target.value)}>
                  <option value="Rc">Rc</option>
                  <option value="U">U</option>
                </select>
              </div>
              <select
                className={`${INPUT_CLASSNAME} sm:col-span-1`}
                value={waarden[b.key].beoordeling}
                onChange={(e) => wijzig(b.key, 'beoordeling', e.target.value)}
              >
                <option value="">Beoordeling...</option>
                {!BEOORDELING_OPTIES.includes(waarden[b.key].beoordeling) && waarden[b.key].beoordeling ? (
                  <option value={waarden[b.key].beoordeling}>{waarden[b.key].beoordeling}</option>
                ) : null}
                {BEOORDELING_OPTIES.map((optie) => (
                  <option key={optie} value={optie}>
                    {optie}
                  </option>
                ))}
              </select>
              <input className={`${INPUT_CLASSNAME} sm:col-span-2`} placeholder="Opmerking" value={waarden[b.key].opmerking} onChange={(e) => wijzig(b.key, 'opmerking', e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" size="sm" onClick={opslaan} disabled={bezig}>
          {bezig ? 'Bezig...' : 'Opslaan'}
        </Button>
        {opgeslagen ? <p role="status" className="text-sm font-medium text-accent">Opgeslagen.</p> : null}
      </div>
      {fout ? (
        <p role="alert" className="mt-2 text-sm font-medium text-error">
          {fout}
        </p>
      ) : null}
    </div>
  )
}
