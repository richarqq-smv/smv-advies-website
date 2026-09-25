import { useState } from 'react'
import { CheckCircle, WarningCircle, SpinnerGap, Plus, X, FileText } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { PACKAGES } from '../../data/packages'
import { LAST_UPDATED as VOORWAARDEN_VERSIE } from '../../data/legalContent'
import { createOfferte } from '../../lib/klantOmgeving/api'
import { ROUTES } from '../../lib/routes'
import { BTW_PERCENTAGE, euro, parsePrijsRange, rond2, standaardGeldigTot, berekenOfferteBedragen, bouwOfferteSnapshot } from '../../lib/klantOmgeving/offerte'

const LEGE_MEERWERKREGEL = { omschrijving: '', aantal: 1, eenheidsprijs: 0 }
const inputClass =
  'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'

function MeerwerkRegelRij({ regel, index, onWijzig, onVerwijder }) {
  const totaal = rond2((Number(regel.aantal) || 0) * (Number(regel.eenheidsprijs) || 0))
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_70px_110px_100px_auto] sm:items-end">
      <div>
        {index === 0 ? <label className="mb-1.5 block text-xs font-medium text-primary">Omschrijving</label> : null}
        <input
          type="text"
          value={regel.omschrijving}
          onChange={(e) => onWijzig({ ...regel, omschrijving: e.target.value })}
          placeholder="Bijv. extra locatiebezoek"
          className={inputClass}
        />
      </div>
      <div>
        {index === 0 ? <label className="mb-1.5 block text-xs font-medium text-primary">Aantal</label> : null}
        <input
          type="number"
          min="1"
          value={regel.aantal}
          onChange={(e) => onWijzig({ ...regel, aantal: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        {index === 0 ? <label className="mb-1.5 block text-xs font-medium text-primary">Prijs per stuk</label> : null}
        <input
          type="number"
          min="0"
          step="0.01"
          value={regel.eenheidsprijs}
          onChange={(e) => onWijzig({ ...regel, eenheidsprijs: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="flex items-center pt-1 text-sm text-foreground-muted sm:pt-2.5">{euro(totaal)}</div>
      <div className="flex items-center">
        <Button type="button" variant="ghost" size="sm" onClick={onVerwijder} aria-label="Meerwerkregel verwijderen">
          <X size={16} />
        </Button>
      </div>
    </div>
  )
}

/**
 * "Offerte maken" — compacte editor op DossierDetail (Fase 2). Geen
 * preview/PDF (Fase 3) en geen historielijst (Fase 4): na opslaan toont
 * dit component alleen de bevestiging van de zojuist aangemaakte offerte
 * (offertenummer + kerngegevens), genoeg om te weten dat het gelukt is.
 *
 * Pakketdata komt uitsluitend uit src/data/packages.js — geen tweede
 * bron. De bandbreedte-waarschuwing wordt uit datzelfde `price`-veld
 * geparsed (parsePrijsRange), niet als los getallenpaar bijgehouden.
 */
export function OfferteEditor({ klant, contactpersoon, pand, dossier, onOpgeslagen }) {
  const [open, setOpen] = useState(false)
  const [pakketId, setPakketId] = useState(null)
  const [bedrag, setBedrag] = useState('')
  const [meerwerk, setMeerwerk] = useState([])
  const [opmerkingen, setOpmerkingen] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [resultaat, setResultaat] = useState(null)

  const pakket = PACKAGES.find((p) => p.id === pakketId) ?? null
  const range = pakket ? parsePrijsRange(pakket.price) : null
  const bedragGetal = bedrag === '' ? null : Number(bedrag)
  const buitenRange = pakket && bedragGetal != null && range?.min != null && (bedragGetal < range.min || bedragGetal > range.max)

  const meerwerkVoorBerekening = meerwerk.map((r) => ({
    ...r,
    aantal: Number(r.aantal) || 0,
    eenheidsprijs: Number(r.eenheidsprijs) || 0,
    totaal: rond2((Number(r.aantal) || 0) * (Number(r.eenheidsprijs) || 0)),
  }))
  const bedragen = pakket && bedragGetal != null ? berekenOfferteBedragen({ bedrag: bedragGetal, meerwerk: meerwerkVoorBerekening }) : null

  function nieuweOfferteStarten() {
    setOpen(true)
    setResultaat(null)
    setPakketId(null)
    setBedrag('')
    setMeerwerk([])
    setOpmerkingen('')
    setFout(null)
  }

  function voegMeerwerkregelToe() {
    setMeerwerk((v) => [...v, { ...LEGE_MEERWERKREGEL }])
  }

  function wijzigMeerwerkregel(index, regel) {
    setMeerwerk((v) => v.map((r, i) => (i === index ? regel : r)))
  }

  function verwijderMeerwerkregel(index) {
    setMeerwerk((v) => v.filter((_, i) => i !== index))
  }

  async function opslaan() {
    setFout(null)
    if (!pakket) return setFout('Kies eerst een pakket.')
    if (bedragGetal == null || bedragGetal <= 0) return setFout('Vul een concreet offertebedrag in.')
    for (const regel of meerwerkVoorBerekening) {
      if (!regel.omschrijving.trim()) return setFout('Elke meerwerkregel heeft een omschrijving nodig.')
      if (regel.aantal <= 0) return setFout('Het aantal bij een meerwerkregel moet groter dan 0 zijn.')
      if (regel.eenheidsprijs < 0) return setFout('De prijs per stuk bij een meerwerkregel kan niet negatief zijn.')
    }

    setBezig(true)
    try {
      const financieel = { ...bedragen, btw_percentage: BTW_PERCENTAGE }
      const snapshot = bouwOfferteSnapshot({
        klant,
        contactpersoon,
        pand,
        pakket,
        bedrag: bedragGetal,
        meerwerk: meerwerkVoorBerekening,
        financieel,
        voorwaardenVersie: VOORWAARDEN_VERSIE,
      })
      const opgeslagen = await createOfferte({
        klantId: klant.klant_id,
        pandId: pand.pand_id,
        dossierId: dossier.dossier_id,
        geldigTot: standaardGeldigTot(),
        pakketId: pakket.id,
        bedrag: bedragGetal,
        meerwerk: meerwerkVoorBerekening,
        subtotaal: bedragen.subtotaal,
        btwPercentage: BTW_PERCENTAGE,
        btwBedrag: bedragen.btwBedrag,
        totaal: bedragen.totaal,
        opmerkingen,
        snapshot,
      })
      setResultaat(opgeslagen)
      setOpen(false)
      onOpgeslagen?.(opgeslagen)
    } catch {
      setFout('Opslaan van de offerte is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  if (!open && !resultaat) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Offerte</p>
        <h3 className="mb-4 text-xl text-primary">Offerte maken</h3>
        <Button type="button" variant="outline" onClick={nieuweOfferteStarten}>
          Offerte maken
        </Button>
      </div>
    )
  }

  if (resultaat) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Offerte</p>
        <p role="status" className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle size={18} weight="fill" className="text-accent" />
          Offerte {resultaat.offerte_nummer} opgeslagen (concept).
        </p>
        <dl className="mb-4 flex flex-col gap-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">Pakket</dt>
            <dd className="font-medium text-primary">{resultaat.snapshot?.pakket?.naam}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">Bedrag</dt>
            <dd className="font-medium text-primary">{euro(resultaat.bedrag)} excl. btw</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">Totaal incl. btw</dt>
            <dd className="font-medium text-primary">{euro(resultaat.totaal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">Geldig tot</dt>
            <dd className="font-medium text-primary">{new Date(resultaat.geldig_tot).toLocaleDateString('nl-NL')}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <Button as="link" to={ROUTES.offertePreview(dossier.dossier_id, resultaat.id)} variant="outline" size="sm">
            <FileText size={16} /> Offerte bekijken / afdrukken
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={nieuweOfferteStarten}>
            Nog een offerte maken
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Offerte</p>
      <h3 className="mb-4 text-xl text-primary">Offerte maken</h3>

      <div className="flex flex-col gap-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-primary">Pakket</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {PACKAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPakketId(p.id)}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  pakketId === p.id ? 'border-accent bg-accent/5' : 'border-border bg-white hover:border-accent/50'
                }`}
              >
                <span className="block font-medium text-primary">{p.name}</span>
                <span className="block text-xs text-foreground-muted">{p.subtitle}</span>
                <span className="mt-1 block text-xs font-medium text-accent">{p.price}</span>
              </button>
            ))}
          </div>
        </div>

        {pakket ? (
          <div>
            <label htmlFor="offerte-bedrag" className="mb-1.5 block text-sm font-medium text-primary">
              Offertebedrag (excl. btw)
              <span className="ml-1 text-accent">*</span>
            </label>
            <input
              id="offerte-bedrag"
              type="number"
              min="0"
              step="0.01"
              value={bedrag}
              onChange={(e) => setBedrag(e.target.value)}
              placeholder={`Standaard: ${pakket.price}`}
              className={inputClass}
            />
            {buitenRange ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-accent">
                <WarningCircle size={14} weight="fill" />
                Dit bedrag valt buiten de standaardprijsrange van dit pakket ({pakket.price}).
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-primary">Meerwerk (optioneel)</label>
            <Button type="button" variant="ghost" size="sm" onClick={voegMeerwerkregelToe}>
              <Plus size={15} /> Meerwerk toevoegen
            </Button>
          </div>
          {meerwerk.length > 0 ? (
            <div className="flex flex-col gap-3">
              {meerwerk.map((regel, i) => (
                <MeerwerkRegelRij
                  key={i}
                  regel={regel}
                  index={i}
                  onWijzig={(r) => wijzigMeerwerkregel(i, r)}
                  onVerwijder={() => verwijderMeerwerkregel(i)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground-muted">Geen meerwerkregels.</p>
          )}
        </div>

        <div>
          <label htmlFor="offerte-opmerkingen" className="mb-1.5 block text-sm font-medium text-primary">
            Opmerkingen <span className="font-normal text-foreground-muted">(optioneel)</span>
          </label>
          <textarea
            id="offerte-opmerkingen"
            rows={3}
            value={opmerkingen}
            onChange={(e) => setOpmerkingen(e.target.value)}
            className={inputClass}
          />
        </div>

        {bedragen ? (
          <dl className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-muted">Subtotaal</dt>
              <dd className="text-primary">{euro(bedragen.subtotaal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-muted">Btw ({BTW_PERCENTAGE}%)</dt>
              <dd className="text-primary">{euro(bedragen.btwBedrag)}</dd>
            </div>
            <div className="flex justify-between gap-3 font-medium">
              <dt className="text-primary">Totaal incl. btw</dt>
              <dd className="text-primary">{euro(bedragen.totaal)}</dd>
            </div>
          </dl>
        ) : null}

        {fout ? (
          <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
            <WarningCircle size={15} weight="fill" />
            {fout}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={opslaan} disabled={bezig}>
            {bezig ? <SpinnerGap size={16} className="animate-spin" /> : null}
            Offerte opslaan
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={bezig}>
            Annuleren
          </Button>
        </div>
      </div>
    </div>
  )
}
