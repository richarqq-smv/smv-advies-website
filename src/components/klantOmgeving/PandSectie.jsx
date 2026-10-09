import { useState } from 'react'
import { PencilSimple, WarningCircle } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { updatePand } from '../../lib/klantOmgeving/api'
import { valideerNieuwPand, ZAKELIJKE_GEBRUIKSTYPES } from '../../lib/klantOmgeving/pandValidatie'

const SELECT_CLASSNAME =
  'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'

const GEBRUIKSTYPE_LABELS = {
  kantoor: 'Kantoor',
  bedrijfshal: 'Bedrijfshal / loods',
  winkel: 'Winkel',
  horeca: 'Horeca',
  praktijk: 'Praktijkruimte',
  gemengd: 'Gemengd gebruik',
  anders: 'Anders',
  magazijn: 'Magazijn',
  werkplaats: 'Werkplaats',
  overig: 'Overig',
}

function pandNaarFormulier(pand) {
  return {
    omschrijving: pand.omschrijving ?? '',
    adres: pand.adres ?? '',
    postcode: pand.postcode ?? '',
    plaats: pand.plaats ?? '',
    bouwjaar: pand.bouwjaar ?? '',
    gebruikstype: pand.gebruikstype ?? '',
    vloeroppervlak: pand.vloeroppervlak ?? '',
    bouwlagen: pand.bouwlagen ?? '',
    gebruikers: pand.gebruikers ?? '',
    opmerkingen: pand.opmerkingen ?? '',
  }
}

/**
 * Admin-only: pandgegevens tonen en bewerken (UX-auditronde 2026-10-09,
 * §0 — tot nu toe kon een admin een typo in adres/gebruikstype/
 * vloeroppervlak nergens corrigeren, alleen de klant zelf via de MJOP-
 * tool/Energie-indicatie). Hergebruikt de al bestaande updatePand()
 * (RLS panden_update staat is_admin() al toe) en dezelfde
 * valideerNieuwPand() als het nieuwe-klant-formulier
 * (NieuweKlantModal.jsx), zodat gebruikstype nooit een onbekende/lege
 * waarde kan worden via dit scherm.
 */
export function PandSectie({ pand, onPandChange }) {
  const [bewerken, setBewerken] = useState(false)
  const [form, setForm] = useState(() => pandNaarFormulier(pand))
  const [fouten, setFouten] = useState({})
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  if (!pand) return null

  function startBewerken() {
    setForm(pandNaarFormulier(pand))
    setFouten({})
    setFout(null)
    setBewerken(true)
  }

  async function opslaan(e) {
    e.preventDefault()
    const validatieFouten = valideerNieuwPand(form)
    setFouten(validatieFouten)
    if (Object.keys(validatieFouten).length > 0) return

    setBezig(true)
    setFout(null)
    try {
      const bijgewerkt = await updatePand(pand.pand_id, {
        omschrijving: form.omschrijving.trim(),
        adres: form.adres.trim(),
        postcode: form.postcode.trim(),
        plaats: form.plaats.trim(),
        bouwjaar: form.bouwjaar === '' ? null : Number(form.bouwjaar),
        gebruikstype: form.gebruikstype,
        vloeroppervlak: form.vloeroppervlak === '' ? null : Number(form.vloeroppervlak),
        bouwlagen: form.bouwlagen === '' ? null : Number(form.bouwlagen),
        gebruikers: form.gebruikers === '' ? null : Number(form.gebruikers),
        opmerkingen: form.opmerkingen.trim(),
      })
      onPandChange?.(bijgewerkt)
      setBewerken(false)
    } catch {
      setFout('Opslaan is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  if (!bewerken) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-base font-medium text-primary">Pand</h2>
          <Button type="button" variant="ghost" size="sm" onClick={startBewerken} aria-label="Pand bewerken" title="Pand bewerken">
            <PencilSimple size={16} /> Bewerken
          </Button>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-foreground-muted">Omschrijving</dt>
            <dd className="text-primary">{pand.omschrijving || '—'}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Adres</dt>
            <dd className="text-primary">{[pand.adres, [pand.postcode, pand.plaats].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '—'}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Gebruikstype</dt>
            <dd className="text-primary">{GEBRUIKSTYPE_LABELS[pand.gebruikstype] ?? pand.gebruikstype ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Bouwjaar</dt>
            <dd className="text-primary">{pand.bouwjaar ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Oppervlak</dt>
            <dd className="text-primary">{pand.vloeroppervlak != null ? `${pand.vloeroppervlak} m²` : '—'}</dd>
          </div>
          <div>
            <dt className="text-foreground-muted">Bouwlagen</dt>
            <dd className="text-primary">{pand.bouwlagen ?? '—'}</dd>
          </div>
        </dl>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5 shadow-sm sm:p-6">
      <h2 className="mb-3 text-base font-medium text-primary">Pand bewerken</h2>
      <form onSubmit={opslaan} className="flex flex-col gap-3">
        <TextField id="pand-omschrijving" label="Omschrijving" value={form.omschrijving} onChange={(v) => setForm((f) => ({ ...f, omschrijving: v }))} />
        <TextField id="pand-adres" label="Adres" value={form.adres} onChange={(v) => setForm((f) => ({ ...f, adres: v }))} />
        <div className="grid grid-cols-2 gap-3">
          <TextField id="pand-postcode" label="Postcode" value={form.postcode} onChange={(v) => setForm((f) => ({ ...f, postcode: v }))} />
          <TextField id="pand-plaats" label="Plaats" value={form.plaats} onChange={(v) => setForm((f) => ({ ...f, plaats: v }))} />
        </div>
        <div>
          <label htmlFor="pand-gebruikstype" className="mb-2 block text-sm font-medium text-primary">
            Gebruikstype<span className="ml-1 text-accent">*</span>
          </label>
          <select
            id="pand-gebruikstype"
            value={form.gebruikstype}
            onChange={(e) => setForm((f) => ({ ...f, gebruikstype: e.target.value }))}
            className={SELECT_CLASSNAME}
          >
            <option value="">Kies een gebruikstype...</option>
            {ZAKELIJKE_GEBRUIKSTYPES.map((waarde) => (
              <option key={waarde} value={waarde}>
                {GEBRUIKSTYPE_LABELS[waarde] ?? waarde}
              </option>
            ))}
          </select>
          {fouten.gebruikstype ? (
            <p role="alert" className="mt-2 text-sm font-medium text-error">
              {fouten.gebruikstype}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <TextField id="pand-bouwjaar" label="Bouwjaar" type="number" value={form.bouwjaar} onChange={(v) => setForm((f) => ({ ...f, bouwjaar: v }))} error={fouten.bouwjaar} />
          <TextField
            id="pand-vloeroppervlak"
            label="Oppervlak (m²)"
            type="number"
            value={form.vloeroppervlak}
            onChange={(v) => setForm((f) => ({ ...f, vloeroppervlak: v }))}
            error={fouten.vloeroppervlak}
          />
          <TextField id="pand-bouwlagen" label="Bouwlagen" type="number" value={form.bouwlagen} onChange={(v) => setForm((f) => ({ ...f, bouwlagen: v }))} error={fouten.bouwlagen} />
        </div>
        {fout ? (
          <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
            <WarningCircle size={14} weight="fill" />
            {fout}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={bezig}>
            {bezig ? 'Bezig...' : 'Opslaan'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setBewerken(false)} disabled={bezig}>
            Annuleren
          </Button>
        </div>
      </form>
    </div>
  )
}
