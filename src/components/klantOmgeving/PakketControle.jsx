import { useState } from 'react'
import { Button } from '../ui/Button'
import { PACKAGES } from '../../data/packages'
import { updateDossierPakket } from '../../lib/klantOmgeving/api'

/**
 * Admin-only: zet/wijzigt dossiers.pakket_id (0025_dossiers_pakket_id.sql)
 * — de bron van waarheid voor welke workflow/rapporttemplate/pakketgrens
 * voor dit dossier geldt. "Nog te bepalen" (null) blijft altijd een
 * geldige keuze; wijzigen ná aanmaak is sowieso al admin-only
 * (bewaak_dossier_integriteit staat een klant alleen energie_snapshot
 * toe), deze UI toont dat dus uitsluitend bij magBeheren.
 */
export function PakketControle({ dossier, onDossierChange, magBeheren }) {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  if (!magBeheren) return null

  async function kies(pakketId) {
    if (pakketId === dossier.pakket_id) return
    setFout(null)
    setBezig(true)
    try {
      const bijgewerkt = await updateDossierPakket(dossier.dossier_id, pakketId)
      onDossierChange(bijgewerkt)
    } catch {
      setFout('Pakket wijzigen is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Pakket</p>
      <h3 className="mb-4 text-xl text-primary">Welk pakket betreft dit dossier?</h3>
      <div className="flex flex-wrap gap-2">
        {PACKAGES.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant={dossier.pakket_id === p.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => kies(p.id)}
            disabled={bezig}
          >
            {p.name}
          </Button>
        ))}
        <Button type="button" variant={dossier.pakket_id == null ? 'primary' : 'ghost'} size="sm" onClick={() => kies(null)} disabled={bezig}>
          Nog te bepalen
        </Button>
      </div>
      {fout ? (
        <p role="alert" className="mt-3 text-sm font-medium text-error">
          {fout}
        </p>
      ) : null}
    </div>
  )
}
