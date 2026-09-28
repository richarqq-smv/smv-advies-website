import { useState } from 'react'
import { Copy, CheckCircle } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { bouwEnergieIndicatieLink, bouwEnergieUitnodigingTekst } from '../../lib/klantOmgeving/energieUitnodiging'

/**
 * "Klant informeren" (Energie/MJOP/Advies-werkronde, punt 7) — uitsluitend
 * zichtbaar voor een admin, en alleen zolang dit Dossier nog geen
 * Energie-indicatie heeft (zie DossierDetail.jsx). Kopieert een korte,
 * kant-en-klare uitnodigingstekst + link naar het klembord — geen
 * productie-mail vanuit de applicatie zelf, zie de moduledoc van
 * lib/klantOmgeving/energieUitnodiging.js voor waarom bewust niet de
 * bestaande EmailJS-templates zijn hergebruikt.
 */
export function EnergieUitnodiging({ dossierId, klant }) {
  const [gekopieerd, setGekopieerd] = useState(false)
  const [fout, setFout] = useState(false)

  async function kopieer() {
    setFout(false)
    const link = bouwEnergieIndicatieLink(window.location.origin, dossierId)
    const tekst = bouwEnergieUitnodigingTekst({ klantNaam: klant?.naam || klant?.bedrijfsnaam || null, link })
    try {
      await navigator.clipboard.writeText(tekst)
      setGekopieerd(true)
      setTimeout(() => setGekopieerd(false), 3000)
    } catch {
      setFout(true)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Klant informeren</p>
      <h3 className="text-lg text-primary">Nog geen Energie-indicatie bij dit dossier</h3>
      <p className="mt-1 text-sm text-foreground-muted">
        Kopieer een korte uitnodiging (met link) om zelf te versturen — bijvoorbeeld per e-mail of WhatsApp. Het resultaat wordt automatisch aan dit dossier
        gekoppeld zodra de klant de indicatie invult.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={kopieer}>
          {gekopieerd ? <CheckCircle size={16} weight="fill" /> : <Copy size={16} />}
          {gekopieerd ? 'Gekopieerd' : 'Kopieer uitnodiging'}
        </Button>
        {fout ? <span className="text-sm font-medium text-error">Kopiëren is niet gelukt. Probeer het opnieuw.</span> : null}
      </div>
    </div>
  )
}
