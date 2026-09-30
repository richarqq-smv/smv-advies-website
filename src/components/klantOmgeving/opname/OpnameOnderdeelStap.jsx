import { Plus } from '@phosphor-icons/react'
import { Button } from '../../ui/Button'
import { OpnameWaarnemingCard } from './OpnameWaarnemingCard'
import { addOpnameWaarneming } from '../../../lib/klantOmgeving/api'

/**
 * Eén stap = één vast onderdeel uit het opnameformulier (Dak, Gevel, ...).
 * Meerdere waarnemingen per onderdeel is de norm, geen uitzondering: het
 * brondocument heeft zelf 2 lege voorbeeldregels per onderdeel (opdracht
 * §7) — vandaar een lijst + "Waarneming toevoegen", nooit één vast
 * tekstveld.
 */
export function OpnameOnderdeelStap({ onderdeel, label, waarnemingen, magBewerken, opnameId, klantId, documenten, onWaarnemingToegevoegd, onWaarnemingChange, onWaarnemingVerwijderd, onDocumentGeupload }) {
  async function toevoegen() {
    const nieuw = await addOpnameWaarneming(opnameId, onderdeel)
    onWaarnemingToegevoegd(nieuw)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Onderdeel</p>
        <h2 className="text-2xl text-primary">{label}</h2>
      </div>

      {waarnemingen.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
          Nog geen waarneming voor dit onderdeel.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {waarnemingen.map((w) => (
            <OpnameWaarnemingCard
              key={w.waarneming_id}
              waarneming={w}
              magBewerken={magBewerken}
              documenten={documenten}
              klantId={klantId}
              opnameId={opnameId}
              onWaarnemingChange={onWaarnemingChange}
              onVerwijderd={onWaarnemingVerwijderd}
              onDocumentGeupload={onDocumentGeupload}
            />
          ))}
        </div>
      )}

      {magBewerken ? (
        <Button type="button" variant="outline" onClick={toevoegen} className="min-h-11 w-fit">
          <Plus size={16} /> Waarneming toevoegen
        </Button>
      ) : null}
    </div>
  )
}
