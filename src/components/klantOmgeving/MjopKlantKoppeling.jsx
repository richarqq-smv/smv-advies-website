import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, WarningCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { ROUTES } from '../../lib/routes'
import { buildingToPandInput, createMjopSnapshotFromBuilding } from '../../lib/dossier/mjopAdapter'
import { adminListKlanten, listPandenVoorKlant, maakPandEnKoppel, updatePand, openOfHergebruikDossier, legMjopSnapshotVastAlsLeeg } from '../../lib/klantOmgeving/api'

const selectClass =
  'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'

/**
 * Bij het bijwerken van een BESTAAND pand: alleen velden die de MJOP-tool
 * daadwerkelijk invult. Een leeg MJOP-veld (bijv. geen naam of plaats
 * ingevuld) mag nooit gegevens wissen die de klant of SMV al eerder bij het
 * pand heeft vastgelegd.
 */
function alleenIngevuld(pandInput) {
  return Object.fromEntries(Object.entries(pandInput).filter(([, waarde]) => waarde !== null && waarde !== undefined && waarde !== ''))
}

/**
 * De brug tussen de (interne) MJOP-tool en een klantdossier in Supabase.
 * Alleen voor de adviseur: /MJOP-Tool staat achter RequireAdmin (App.jsx),
 * en dossiers aanmaken of wijzigen mag sinds migration 0006 uitsluitend een
 * admin. De adviseur kiest de klant en het pand; daarna wordt een dossier
 * geopend (of het bestaande open dossier hergebruikt) met de huidige
 * MJOP-invoer als bevroren momentopname.
 *
 * Een bestaand open dossier zonder MJOP-momentopname krijgt de snapshot
 * alsnog; een dossier dat er al een heeft, wordt nooit overschreven (dat is
 * vastgelegde historie) — de adviseur krijgt dan een melding.
 *
 * Hergebruikt bewust dezelfde pure adapterfuncties als de localStorage-
 * koppeling (buildingToPandInput/createMjopSnapshotFromBuilding uit
 * lib/dossier/mjopAdapter.js) — geen tweede, parallelle vertaallaag.
 */
export function MjopKlantKoppeling({ building }) {
  const navigate = useNavigate()

  const [status, setStatus] = useState('laden') // 'laden' | 'fout' | 'klaar'
  const [klanten, setKlanten] = useState([])
  const [klantId, setKlantId] = useState('')
  const [panden, setPanden] = useState([])
  const [pandId, setPandId] = useState('nieuw')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [melding, setMelding] = useState(null) // { dossierId, tekst }

  useEffect(() => {
    let actief = true
    adminListKlanten()
      .then((lijst) => {
        if (!actief) return
        setKlanten(lijst ?? [])
        setStatus('klaar')
      })
      .catch(() => actief && setStatus('fout'))
    return () => {
      actief = false
    }
  }, [])

  useEffect(() => {
    let actief = true
    if (!klantId) return undefined
    listPandenVoorKlant(klantId)
      .then((lijst) => actief && setPanden(lijst ?? []))
      .catch(() => actief && setFout('De panden van deze klant konden niet worden geladen.'))
    return () => {
      actief = false
    }
  }, [klantId])

  if (status === 'laden') return null

  function kiesKlant(id) {
    setKlantId(id)
    setPanden([])
    setPandId('nieuw')
    setFout(null)
    setMelding(null)
  }

  async function koppelEnOpenDossier(e) {
    e.preventDefault()
    setFout(null)
    setMelding(null)
    if (!klantId) return setFout('Kies eerst een klant.')
    setBezig(true)
    try {
      const pandInput = buildingToPandInput(building)
      const mjopSnapshot = createMjopSnapshotFromBuilding(building)

      let pand
      if (pandId === 'nieuw') {
        pand = await maakPandEnKoppel(klantId, pandInput)
      } else {
        // `ontstaanVia` hoort bij het aanmaken, niet bij het bijwerken van een bestaand pand.
        const { ontstaanVia: _ontstaanVia, ...wijzigingen } = alleenIngevuld(pandInput)
        pand = Object.keys(wijzigingen).length > 0 ? await updatePand(pandId, wijzigingen) : panden.find((p) => p.pand_id === pandId)
      }

      const { dossier, hergebruikt } = await openOfHergebruikDossier({ klantId, pandId: pand.pand_id, pand, mjopSnapshot })

      if (hergebruikt && dossier.mjop_snapshot) {
        setMelding({
          dossierId: dossier.dossier_id,
          tekst: 'Er bestaat al een open dossier met een MJOP-momentopname voor dit pand. Die is niet overschreven.',
        })
        setBezig(false)
        return
      }
      if (hergebruikt) await legMjopSnapshotVastAlsLeeg(dossier.dossier_id, mjopSnapshot)
      navigate(ROUTES.dossier(dossier.dossier_id))
    } catch {
      setFout('Koppelen aan het klantdossier is niet gelukt. Probeer het opnieuw.')
      setBezig(false)
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-6 print:hidden">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Klantdossier</p>
      <h3 className="text-lg text-primary">Koppel deze MJOP-gegevens aan een klantdossier</h3>
      <p className="mt-1 text-sm text-foreground-muted">
        Legt de huidige MJOP-invoer vast als momentopname in het adviesdossier van de gekozen klant en pand — anders dan de lokale opslag hierboven, die
        alleen in deze browser blijft.
      </p>

      {status === 'fout' ? (
        <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm font-medium text-error">
          <WarningCircle size={15} weight="fill" />
          De klantenlijst kon niet worden geladen.
        </p>
      ) : klanten.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-muted">Er zijn nog geen klanten om aan te koppelen.</p>
      ) : (
        <form onSubmit={koppelEnOpenDossier} className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="mjop-koppel-klant" className="mb-1.5 block text-sm font-medium text-primary">
              Klant
            </label>
            <select id="mjop-koppel-klant" value={klantId} onChange={(e) => kiesKlant(e.target.value)} className={selectClass}>
              <option value="">Kies een klant</option>
              {klanten.map((k) => (
                <option key={k.klant_id} value={k.klant_id}>
                  {k.bedrijfsnaam || k.naam || 'Naamloze klant'}
                </option>
              ))}
            </select>
          </div>

          {klantId ? (
            <div>
              <label htmlFor="mjop-koppel-pand" className="mb-1.5 block text-sm font-medium text-primary">
                Pand
              </label>
              <select id="mjop-koppel-pand" value={pandId} onChange={(e) => setPandId(e.target.value)} className={selectClass}>
                <option value="nieuw">Nieuw pand aanmaken van deze MJOP-gegevens</option>
                {panden.map((pand) => (
                  <option key={pand.pand_id} value={pand.pand_id}>
                    {pand.omschrijving || pand.adres || 'Naamloos pand'}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {fout ? (
            <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
              <WarningCircle size={15} weight="fill" />
              {fout}
            </p>
          ) : null}

          {melding ? (
            <p role="status" className="text-sm text-primary">
              {melding.tekst}{' '}
              <Link to={ROUTES.dossier(melding.dossierId)} className="font-medium text-accent hover:underline">
                Naar het dossier
              </Link>
            </p>
          ) : null}

          <div>
            <Button type="submit" size="sm" disabled={bezig || !klantId}>
              {bezig ? <SpinnerGap size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Koppelen en dossier openen
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
