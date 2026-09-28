import { useEffect, useState } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { getCommercieleKans, saveCommercieleKans } from '../../lib/klantOmgeving/api'
import { VERVOLGSTAP_OPTIES, valideerCommercieleKans } from '../../lib/klantOmgeving/commercieleKans'

const SELECT_CLASSNAME =
  'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'

/**
 * "Interne commerciële kans" (Admin-ronde, 2026-09-28) — uitsluitend
 * gerenderd door DossierDetail.jsx wanneer `isAdmin` (zie de aanroep
 * daar), en zelfs dan haalt dit component zijn data op via een eigen,
 * losse aanroep (getCommercieleKans), nooit via getDossier()'s
 * `select('*')`. Dubbele veiligheid: de UI toont dit nooit aan een klant
 * (isAdmin-gate) én de data komt sowieso nooit in een klant-fetch terecht
 * (aparte tabel, admin-only RLS — zie
 * 0012_dossier_commerciele_kansen.sql). Geen score, geen automatische
 * aanbeveling: de admin kiest zelf uit een vaste lijst (commercieleKans.js)
 * en typt zelf een vrije notitie — dit wijzigt nooit een offerte, advies
 * of MJOP-gegeven.
 */
export function CommercieleKansSectie({ dossierId }) {
  const [laden, setLaden] = useState(true)
  const [vervolgstap, setVervolgstap] = useState('nog_bepalen')
  const [notitie, setNotitie] = useState('')
  const [heeftOpgeslagenWaarde, setHeeftOpgeslagenWaarde] = useState(false)
  const [fouten, setFouten] = useState({})
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)

  useEffect(() => {
    let actief = true
    setLaden(true)
    getCommercieleKans(dossierId)
      .then((rij) => {
        if (!actief) return
        if (rij) {
          setVervolgstap(rij.vervolgstap)
          setNotitie(rij.notitie ?? '')
          setHeeftOpgeslagenWaarde(true)
        }
      })
      .catch(() => {})
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [dossierId])

  async function opslaan(e) {
    e.preventDefault()
    const veldFouten = valideerCommercieleKans({ vervolgstap })
    setFouten(veldFouten)
    if (Object.keys(veldFouten).length > 0) return

    setBezig(true)
    setFout(false)
    setOpgeslagen(false)
    try {
      await saveCommercieleKans(dossierId, { vervolgstap, notitie })
      setHeeftOpgeslagenWaarde(true)
      setOpgeslagen(true)
    } catch {
      setFout(true)
    } finally {
      setBezig(false)
    }
  }

  if (laden) return null

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Interne commerciële kans</p>
      <h3 className="text-lg text-primary">Mogelijke vervolgstap</h3>
      <p className="mt-1 text-xs text-foreground-muted">Alleen zichtbaar voor SMV-admin — nooit voor de klant, in geen enkel document of e-mail.</p>

      {!heeftOpgeslagenWaarde ? <p className="mt-3 text-sm text-foreground-muted">Nog geen commerciële inschatting vastgelegd.</p> : null}

      <form onSubmit={opslaan} className="mt-4 flex flex-col gap-4">
        <div>
          <label htmlFor="kans-vervolgstap" className="mb-2 block text-sm font-medium text-primary">
            Mogelijke vervolgstap
          </label>
          <select id="kans-vervolgstap" value={vervolgstap} onChange={(e) => setVervolgstap(e.target.value)} className={SELECT_CLASSNAME}>
            {VERVOLGSTAP_OPTIES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          {fouten.vervolgstap ? <p className="mt-1.5 text-xs font-medium text-error">{fouten.vervolgstap}</p> : null}
        </div>

        <div>
          <label htmlFor="kans-notitie" className="mb-2 block text-sm font-medium text-primary">
            Interne commerciële notitie <span className="font-normal text-foreground-muted">(optioneel)</span>
          </label>
          <textarea
            id="kans-notitie"
            rows={3}
            value={notitie}
            onChange={(e) => setNotitie(e.target.value)}
            placeholder="Bijv. Eerst Basis bespreken. Mogelijk later Gold vanwege geplande dakvervanging."
            className={SELECT_CLASSNAME}
          />
        </div>

        {fout ? (
          <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
            <WarningCircle size={15} weight="fill" />
            Opslaan is niet gelukt. Probeer het opnieuw.
          </p>
        ) : null}
        {opgeslagen ? <p role="status" className="text-sm font-medium text-accent">Opgeslagen.</p> : null}

        <div>
          <Button type="submit" size="sm" disabled={bezig}>
            {bezig ? 'Bezig...' : 'Opslaan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
