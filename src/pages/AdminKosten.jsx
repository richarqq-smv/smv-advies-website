import { useEffect, useState } from 'react'
import { ArrowLeft, Trash, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { ROUTES } from '../lib/routes'
import { adminListKosten, createKostenpost, updateKostenpostStatus, verwijderKostenpost } from '../lib/klantOmgeving/api'
import { KOSTEN_CATEGORIEEN, KOSTEN_CATEGORIE_LABELS, berekenKostenBedragen, valideerKostenpost } from '../lib/klantOmgeving/kosten'
import { euro, formatDatumNl } from '../lib/klantOmgeving/offerte'

const SELECT_CLASSNAME =
  'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'

function vandaagIso() {
  return new Date().toISOString().slice(0, 10)
}

function leegFormulier() {
  return { datum: vandaagIso(), leverancier: '', omschrijving: '', categorie: 'overig', bedragExclBtw: '', btwPercentage: '21' }
}

/**
 * Kosten (/admin/administratie/kosten, opdracht sectie 11) — eenvoudige
 * bedrijfskostenregistratie, geen crediteurenadministratie: alleen de
 * velden die het BTW-overzicht (sectie 12) en het resultaat (sectie 2)
 * nodig hebben. `document_url` is bewust een los tekstveld (link naar
 * extern bewaard document), geen file-upload — er bestaat nog geen
 * Supabase Storage-integratie in deze applicatie en dat voor één optioneel
 * veld toevoegen zou de scope van deze ronde onnodig vergroten.
 */
export default function AdminKosten() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [kosten, setKosten] = useState([])

  const [formulier, setFormulier] = useState(leegFormulier)
  const [fouten, setFouten] = useState({})
  const [opslaanBezig, setOpslaanBezig] = useState(false)
  const [opslaanFout, setOpslaanFout] = useState(false)

  const [verwijderId, setVerwijderId] = useState(null)
  const [verwijderBezig, setVerwijderBezig] = useState(false)
  const [statusBezigId, setStatusBezigId] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    adminListKosten()
      .then((rows) => actief && setKosten(rows))
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [])

  function wijzigVeld(veld, waarde) {
    setFormulier((f) => ({ ...f, [veld]: waarde }))
  }

  async function voegToe(e) {
    e.preventDefault()
    const gevonden = valideerKostenpost(formulier)
    setFouten(gevonden)
    if (Object.keys(gevonden).length > 0) return

    setOpslaanBezig(true)
    setOpslaanFout(false)
    try {
      const bedragExclBtw = Number(formulier.bedragExclBtw)
      const btwPercentage = Number(formulier.btwPercentage)
      const { btwBedrag, totaalInclBtw } = berekenKostenBedragen({ bedragExclBtw, btwPercentage })
      const nieuw = await createKostenpost({
        datum: formulier.datum,
        leverancier: formulier.leverancier,
        omschrijving: formulier.omschrijving,
        categorie: formulier.categorie,
        bedragExclBtw,
        btwPercentage,
        btwBedrag,
        totaalInclBtw,
      })
      setKosten((rows) => [nieuw, ...rows])
      setFormulier(leegFormulier())
      setFouten({})
    } catch {
      setOpslaanFout(true)
    } finally {
      setOpslaanBezig(false)
    }
  }

  async function wisselStatus(post) {
    setStatusBezigId(post.kosten_id)
    try {
      const bijgewerkt = await updateKostenpostStatus(post.kosten_id, post.status === 'betaald' ? 'open' : 'betaald')
      setKosten((rows) => rows.map((k) => (k.kosten_id === post.kosten_id ? bijgewerkt : k)))
    } catch {
      // Stil falen: de knop blijft klikbaar voor een nieuwe poging, geen aparte foutlaag per rij nodig voor deze kleine wijziging.
    } finally {
      setStatusBezigId(null)
    }
  }

  async function bevestigVerwijderen(kostenId) {
    setVerwijderBezig(true)
    try {
      await verwijderKostenpost(kostenId)
      setKosten((rows) => rows.filter((k) => k.kosten_id !== kostenId))
      setVerwijderId(null)
    } catch {
      // Blijft in bevestigingsstap staan — de knop is opnieuw te gebruiken.
    } finally {
      setVerwijderBezig(false)
    }
  }

  return (
    <>
      <Seo title="Kosten" description="Bedrijfskosten registreren en beheren." noindex />
      <PageHero eyebrow="Administratie" title="Kosten" description="Bedrijfskosten die meetellen in het BTW-overzicht en het resultaat." />
      <Section tone="white" noTopPadding>
        <Container wide>
          <Button as="link" to={ROUTES.adminAdministratie} variant="ghost" size="sm" className="mb-5">
            <ArrowLeft size={16} /> Administratie
          </Button>

          <form onSubmit={voegToe} className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="text-lg text-primary">Nieuwe kostenpost</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="kosten-datum" className="mb-2 block text-sm font-medium text-primary">
                  Datum<span className="ml-1 text-accent">*</span>
                </label>
                <input
                  id="kosten-datum"
                  type="date"
                  value={formulier.datum}
                  onChange={(e) => wijzigVeld('datum', e.target.value)}
                  className={SELECT_CLASSNAME}
                />
                {fouten.datum ? <p className="mt-1.5 text-xs font-medium text-error">{fouten.datum}</p> : null}
              </div>
              <div>
                <label htmlFor="kosten-categorie" className="mb-2 block text-sm font-medium text-primary">
                  Categorie<span className="ml-1 text-accent">*</span>
                </label>
                <select
                  id="kosten-categorie"
                  value={formulier.categorie}
                  onChange={(e) => wijzigVeld('categorie', e.target.value)}
                  className={SELECT_CLASSNAME}
                >
                  {KOSTEN_CATEGORIEEN.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                id="kosten-leverancier"
                label="Leverancier"
                required
                value={formulier.leverancier}
                onChange={(v) => wijzigVeld('leverancier', v)}
                error={fouten.leverancier}
              />
              <TextField
                id="kosten-omschrijving"
                label="Omschrijving"
                required
                value={formulier.omschrijving}
                onChange={(v) => wijzigVeld('omschrijving', v)}
                error={fouten.omschrijving}
              />
              <div>
                <label htmlFor="kosten-bedrag" className="mb-2 block text-sm font-medium text-primary">
                  Bedrag excl. btw<span className="ml-1 text-accent">*</span>
                </label>
                <input
                  id="kosten-bedrag"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulier.bedragExclBtw}
                  onChange={(e) => wijzigVeld('bedragExclBtw', e.target.value)}
                  className={SELECT_CLASSNAME}
                />
                {fouten.bedragExclBtw ? <p className="mt-1.5 text-xs font-medium text-error">{fouten.bedragExclBtw}</p> : null}
              </div>
              <div>
                <label htmlFor="kosten-btw" className="mb-2 block text-sm font-medium text-primary">
                  Btw%<span className="ml-1 text-accent">*</span>
                </label>
                <input
                  id="kosten-btw"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulier.btwPercentage}
                  onChange={(e) => wijzigVeld('btwPercentage', e.target.value)}
                  className={SELECT_CLASSNAME}
                />
                {fouten.btwPercentage ? <p className="mt-1.5 text-xs font-medium text-error">{fouten.btwPercentage}</p> : null}
              </div>
            </div>
            {opslaanFout ? (
              <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
                <WarningCircle size={15} weight="fill" />
                Opslaan is niet gelukt. Probeer het opnieuw.
              </p>
            ) : null}
            <div>
              <Button type="submit" variant="primary" size="sm" disabled={opslaanBezig}>
                {opslaanBezig ? 'Bezig...' : 'Kostenpost toevoegen'}
              </Button>
            </div>
          </form>

          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : kosten.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen kostenposten.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {kosten.map((k) => (
                <li key={k.kosten_id} className="rounded-lg border border-border bg-white px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-primary">
                        {k.leverancier} — {k.omschrijving}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {formatDatumNl(k.datum)} · {KOSTEN_CATEGORIE_LABELS[k.categorie] ?? k.categorie}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary">{euro(k.totaal_incl_btw)}</span>
                      <button
                        type="button"
                        onClick={() => wisselStatus(k)}
                        disabled={statusBezigId === k.kosten_id}
                        className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${
                          k.status === 'betaald' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground-muted'
                        }`}
                      >
                        {k.status === 'betaald' ? 'Betaald' : 'Open'}
                      </button>
                      {verwijderId === k.kosten_id ? (
                        <>
                          <Button type="button" variant="ghost" size="sm" onClick={() => bevestigVerwijderen(k.kosten_id)} disabled={verwijderBezig}>
                            Ja
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderId(null)} disabled={verwijderBezig}>
                            Nee
                          </Button>
                        </>
                      ) : (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderId(k.kosten_id)} aria-label="Verwijderen">
                          <Trash size={15} />
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  )
}
