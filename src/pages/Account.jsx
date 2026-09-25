import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'
import { useAuth } from '../lib/auth/useAuth'
import { UitloggenKnop } from '../components/auth/UitloggenKnop'
import { ROUTES } from '../lib/routes'
import { getMijnKlant, registreerKlant, listPandenVoorKlant, maakPandEnKoppel, listDossiersVoorKlant, openOfHergebruikDossier } from '../lib/klantOmgeving/api'

const LEEG_PAND = { omschrijving: '', adres: '', postcode: '', plaats: '', gebruikstype: '' }

/**
 * Echte klantomgeving: Account → Bedrijf → Pand → Dossier. Losstaand van
 * de interne MJOP-Tool-demoflow (components/dossier/KlantDossierFlow.jsx,
 * nog steeds localStorage-gebaseerd) — hier hoort een bezoeker eerst een
 * account te hebben (afgedwongen door RequireAuth in App.jsx), en is er
 * precies één Klant per account (afgedwongen door registreer_klant()).
 */
export default function Account() {
  const { user } = useAuth()
  const [laden, setLaden] = useState(true)
  const [klant, setKlant] = useState(null)
  const [panden, setPanden] = useState([])
  const [dossiersPerPand, setDossiersPerPand] = useState({})

  const [registratie, setRegistratie] = useState({ naam: '', bedrijfsnaam: '', email: '', telefoon: '' })
  const [registratieBezig, setRegistratieBezig] = useState(false)
  const [registratieFout, setRegistratieFout] = useState(null)

  const [nieuwPandModus, setNieuwPandModus] = useState(false)
  const [nieuwPand, setNieuwPand] = useState(LEEG_PAND)
  const [pandBezig, setPandBezig] = useState(false)
  const [pandFout, setPandFout] = useState(null)

  useEffect(() => {
    if (!user) return
    setRegistratie((v) => ({ ...v, email: user.email ?? v.email }))
    laadAlles()
  }, [user])

  async function laadAlles() {
    setLaden(true)
    try {
      const mijnKlant = await getMijnKlant()
      setKlant(mijnKlant?.klant ?? null)
      if (mijnKlant?.klant) {
        const lijst = await listPandenVoorKlant(mijnKlant.klant.klant_id)
        setPanden(lijst)
        const dossiersMap = {}
        for (const pand of lijst) {
          dossiersMap[pand.pand_id] = await listDossiersVoorKlant(mijnKlant.klant.klant_id).then((alle) => alle.filter((d) => d.pand_id === pand.pand_id))
        }
        setDossiersPerPand(dossiersMap)
      }
    } finally {
      setLaden(false)
    }
  }

  async function submitRegistratie(e) {
    e.preventDefault()
    setRegistratieFout(null)
    if (!registratie.naam.trim()) return setRegistratieFout('Vul uw naam in.')
    setRegistratieBezig(true)
    try {
      await registreerKlant(registratie)
      await laadAlles()
    } catch {
      setRegistratieFout('Registreren is niet gelukt. Probeer het opnieuw.')
    } finally {
      setRegistratieBezig(false)
    }
  }

  async function submitNieuwPand(e) {
    e.preventDefault()
    setPandFout(null)
    if (!nieuwPand.adres.trim() && !nieuwPand.omschrijving.trim()) return setPandFout('Vul minimaal een adres of omschrijving in.')
    setPandBezig(true)
    try {
      const pand = await maakPandEnKoppel(klant.klant_id, nieuwPand)
      setPanden((v) => [pand, ...v])
      setDossiersPerPand((v) => ({ ...v, [pand.pand_id]: [] }))
      setNieuwPand(LEEG_PAND)
      setNieuwPandModus(false)
    } catch {
      setPandFout('Het pand kon niet worden toegevoegd. Probeer het opnieuw.')
    } finally {
      setPandBezig(false)
    }
  }

  async function openDossierVoorPand(pand) {
    const { dossier } = await openOfHergebruikDossier({ klantId: klant.klant_id, pandId: pand.pand_id, pand })
    setDossiersPerPand((v) => ({ ...v, [pand.pand_id]: [dossier, ...(v[pand.pand_id] ?? []).filter((d) => d.dossier_id !== dossier.dossier_id)] }))
    window.location.assign(ROUTES.dossier(dossier.dossier_id))
  }

  return (
    <>
      <Seo title="Mijn account" description="Beheer uw bedrijfsgegevens, panden en adviesdossiers bij SMV Advies." noindex />
      <PageHero eyebrow="Account" title="Mijn account" description="Uw bedrijfsgegevens, panden en adviesdossiers op één plek." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-2xl">
          <div className="mb-4 flex justify-end">
            <UitloggenKnop />
          </div>
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : !klant ? (
            <form onSubmit={submitRegistratie} className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
              <div>
                <h2 className="text-lg text-primary">Bedrijfsgegevens</h2>
                <p className="mt-1 text-sm text-foreground-muted">Rond uw account af met uw bedrijfsgegevens, zodat we panden en dossiers aan uw bedrijf kunnen koppelen.</p>
              </div>
              <TextField id="acc-naam" label="Naam" required value={registratie.naam} onChange={(v) => setRegistratie((s) => ({ ...s, naam: v }))} />
              <TextField id="acc-bedrijfsnaam" label="Bedrijfsnaam" value={registratie.bedrijfsnaam} onChange={(v) => setRegistratie((s) => ({ ...s, bedrijfsnaam: v }))} />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField id="acc-email" label="E-mailadres" type="email" value={registratie.email} onChange={(v) => setRegistratie((s) => ({ ...s, email: v }))} />
                <TextField id="acc-telefoon" label="Telefoonnummer" type="tel" value={registratie.telefoon} onChange={(v) => setRegistratie((s) => ({ ...s, telefoon: v }))} />
              </div>
              {registratieFout ? <p role="alert" className="text-sm font-medium text-error">{registratieFout}</p> : null}
              <Button type="submit" disabled={registratieBezig}>
                {registratieBezig ? 'Bezig...' : 'Bedrijfsgegevens opslaan'}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
                <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Bedrijf</p>
                <h2 className="text-lg text-primary">{klant.naam || klant.bedrijfsnaam}</h2>
                {klant.bedrijfsnaam && klant.bedrijfsnaam !== klant.naam ? <p className="text-sm text-foreground-muted">{klant.bedrijfsnaam}</p> : null}
              </div>

              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg text-primary">Panden</h2>
                  {!nieuwPandModus ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setNieuwPandModus(true)}>
                      Pand toevoegen
                    </Button>
                  ) : null}
                </div>

                {nieuwPandModus ? (
                  <form onSubmit={submitNieuwPand} className="mb-6 flex flex-col gap-4 rounded-lg border border-accent/30 bg-muted/40 p-4">
                    <TextField id="pand-omschrijving" label="Omschrijving" value={nieuwPand.omschrijving} onChange={(v) => setNieuwPand((s) => ({ ...s, omschrijving: v }))} />
                    <TextField id="pand-adres" label="Adres" value={nieuwPand.adres} onChange={(v) => setNieuwPand((s) => ({ ...s, adres: v }))} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField id="pand-postcode" label="Postcode" value={nieuwPand.postcode} onChange={(v) => setNieuwPand((s) => ({ ...s, postcode: v }))} />
                      <TextField id="pand-plaats" label="Plaats" value={nieuwPand.plaats} onChange={(v) => setNieuwPand((s) => ({ ...s, plaats: v }))} />
                    </div>
                    {pandFout ? <p role="alert" className="text-sm font-medium text-error">{pandFout}</p> : null}
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" size="sm" disabled={pandBezig}>
                        {pandBezig ? 'Bezig...' : 'Pand opslaan'}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setNieuwPandModus(false); setPandFout(null) }} disabled={pandBezig}>
                        Annuleren
                      </Button>
                    </div>
                  </form>
                ) : null}

                {panden.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen panden toegevoegd.</p>
                ) : (
                  <ul className="flex flex-col gap-4">
                    {panden.map((pand) => (
                      <li key={pand.pand_id} className="rounded-lg border border-border p-4">
                        <p className="font-medium text-primary">{pand.omschrijving || pand.adres || 'Naamloos pand'}</p>
                        {pand.plaats ? <p className="text-sm text-foreground-muted">{pand.adres ? `${pand.adres}, ` : ''}{pand.plaats}</p> : null}
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <Link to={ROUTES.mjopTool} className="text-sm font-medium text-accent hover:underline">
                            MJOP starten/bekijken
                          </Link>
                          {(dossiersPerPand[pand.pand_id] ?? []).length === 0 ? (
                            <Button type="button" variant="outline" size="sm" onClick={() => openDossierVoorPand(pand)}>
                              Adviesdossier openen
                            </Button>
                          ) : (
                            (dossiersPerPand[pand.pand_id] ?? []).map((d) => (
                              <Link key={d.dossier_id} to={ROUTES.dossier(d.dossier_id)} className="text-sm font-medium text-accent hover:underline">
                                Dossier bekijken {d.status === 'afgerond' ? '(afgerond)' : '(open)'}
                              </Link>
                            ))
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
