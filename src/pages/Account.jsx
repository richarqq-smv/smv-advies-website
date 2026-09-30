import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, DownloadSimple, Trash, UploadSimple, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'
import { useAuth } from '../lib/auth/useAuth'
import { UitloggenKnop } from '../components/auth/UitloggenKnop'
import { ROUTES } from '../lib/routes'
import {
  getMijnKlant,
  registreerKlant,
  updateMijnContactpersoon,
  updateKlant,
  listPandenVoorKlant,
  maakPandEnKoppel,
  updatePand,
  listDossiersVoorKlant,
  openOfHergebruikDossier,
  listAdviespunten,
  getOffertesVoorKlant,
  getFacturenVoorKlant,
  getMijnDocumenten,
  uploadDocument,
  getDocumentDownloadUrl,
  verwijderDocument,
} from '../lib/klantOmgeving/api'
import { AdviespuntKaart } from '../components/dossier/AdviesBeheer'
import { valideerKlantRegistratie } from '../lib/klantOmgeving/klantValidatie'
import { leesDossierContext } from '../lib/klantOmgeving/dossierNavigatie'
import { bouwAccountActies } from '../lib/klantOmgeving/accountActies'
import { euro, formatDatumNl } from '../lib/klantOmgeving/offerte'
import { FACTUUR_STATUS_LABELS } from '../lib/klantOmgeving/factuur'

const LEEG_PAND = { omschrijving: '', adres: '', postcode: '', plaats: '', gebruikstype: '' }

const OFFERTE_STATUS_LABELS = {
  concept: 'Concept',
  verstuurd: 'Verstuurd',
  geaccepteerd: 'Geaccepteerd',
  afgewezen: 'Afgewezen',
  geannuleerd: 'Geannuleerd',
}

const SECTIES = [
  { id: 'gegevens', label: 'Mijn gegevens' },
  { id: 'bedrijf', label: 'Mijn bedrijf' },
  { id: 'panden', label: 'Mijn panden' },
  { id: 'dossiers', label: 'Mijn dossiers' },
  { id: 'advies', label: 'Mijn advies' },
  { id: 'documenten', label: 'Mijn documenten' },
  { id: 'offertes', label: 'Mijn offertes' },
  { id: 'facturen', label: 'Mijn facturen' },
  { id: 'acties', label: 'Acties voor u' },
  { id: 'instellingen', label: 'Instellingen' },
]

/**
 * Echte klantomgeving: /account is sinds de Klantomgeving-detailronde
 * (2026-09-28) de centrale hub — Mijn gegevens/bedrijf/panden/dossiers/
 * documenten/offertes/facturen/acties/instellingen, allemaal op één
 * pagina (geen aparte sub-routes: een eenvoudige, anker-genavigeerde
 * pagina is duidelijker voor een niet-technische ondernemer dan een
 * routegebonden tabbladensysteem, en RLS beveiligt sowieso al elke
 * databron hieronder afzonderlijk).
 *
 * Elke sectie is een DUNNE laag om al bestaande, RLS-beveiligde
 * data/acties heen: Mijn offertes/facturen tonen alleen wat de klant al
 * via de dossierpagina/OffertePreview/FactuurDetail zou kunnen zien — deze
 * pagina bouwt geen tweede, parallelle weergave, alleen een overzicht met
 * links naar die al bestaande schermen. Mijn dossiers/offertes/facturen
 * zijn uitdrukkelijk read-only hier: adviesstatussen, interne
 * adviespunten, commerciële kansen en interne planning staan hier nooit
 * (die blijven exclusief in DossierDetail.jsx's admin-gedeelte, resp.
 * volledig buiten klantbereik — zie CommercieleKansSectie.jsx/
 * AdminPlanning.jsx, allebei nog steeds admin-only RLS).
 */
export default function Account() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const dossierId = leesDossierContext(searchParams)
  const [laden, setLaden] = useState(true)
  const [klant, setKlant] = useState(null)
  const [contactpersoon, setContactpersoon] = useState(null)
  const [panden, setPanden] = useState([])
  const [dossiers, setDossiers] = useState([])
  const [adviespuntenPerDossier, setAdviespuntenPerDossier] = useState({})
  const [offertes, setOffertes] = useState([])
  const [facturen, setFacturen] = useState([])
  const [documenten, setDocumenten] = useState([])

  const [registratie, setRegistratie] = useState({ naam: '', bedrijfsnaam: '', email: '', telefoon: '' })
  const [registratieBezig, setRegistratieBezig] = useState(false)
  const [registratieFout, setRegistratieFout] = useState(null)
  const [registratieVeldFouten, setRegistratieVeldFouten] = useState({})

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
      setContactpersoon(mijnKlant?.contactpersoon ?? null)
      if (mijnKlant?.klant) {
        const klantId = mijnKlant.klant.klant_id
        const [pandenLijst, dossiersLijst, offertesLijst, facturenLijst, documentenLijst] = await Promise.all([
          listPandenVoorKlant(klantId),
          listDossiersVoorKlant(klantId),
          getOffertesVoorKlant(klantId),
          getFacturenVoorKlant(klantId),
          getMijnDocumenten(klantId),
        ])
        setPanden(pandenLijst)
        setDossiers(dossiersLijst)
        setOffertes(offertesLijst)
        setFacturen(facturenLijst)
        setDocumenten(documentenLijst)

        // "Mijn advies" hergebruikt exact dezelfde listAdviespunten()-call als
        // DossierDetail.jsx (geen tweede adviesquery/datamodel) — RLS
        // (adviespunten_select) levert per dossier alleen al bestaande,
        // definitieve adviespunt-rijen; een ruw automatisch signaal is nooit
        // een rij in deze tabel (zie 0020_account_security_hardening.sql),
        // dus er is hier niets extra te filteren.
        const adviesPerDossierEntries = await Promise.all(
          dossiersLijst.map(async (d) => [d.dossier_id, await listAdviespunten(d.dossier_id)]),
        )
        setAdviespuntenPerDossier(Object.fromEntries(adviesPerDossierEntries))
      }
    } finally {
      setLaden(false)
    }
  }

  async function submitRegistratie(e) {
    e.preventDefault()
    setRegistratieFout(null)
    const veldFouten = valideerKlantRegistratie(registratie)
    setRegistratieVeldFouten(veldFouten)
    if (Object.keys(veldFouten).length > 0) return
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

  const acties = klant ? bouwAccountActies({ klant, contactpersoon, panden, dossiers }) : []

  return (
    <>
      <Seo title="Mijn account" description="Beheer uw bedrijfsgegevens, panden, dossiers, documenten, offertes en facturen bij SMV Advies." noindex />
      <PageHero eyebrow="Account" title="Mijn account" description="Uw gegevens, panden, dossiers, documenten, offertes en facturen op één plek." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {dossierId ? (
              <Button to={ROUTES.dossier(dossierId)} variant="ghost" size="sm" className="-ml-3">
                <ArrowLeft size={16} />
                Terug naar dossier
              </Button>
            ) : (
              <span />
            )}
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
              <TextField id="acc-naam" label="Naam" required value={registratie.naam} onChange={(v) => setRegistratie((s) => ({ ...s, naam: v }))} error={registratieVeldFouten.naam} />
              <TextField id="acc-bedrijfsnaam" label="Bedrijfsnaam" value={registratie.bedrijfsnaam} onChange={(v) => setRegistratie((s) => ({ ...s, bedrijfsnaam: v }))} />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField id="acc-email" label="E-mailadres" type="email" value={registratie.email} onChange={(v) => setRegistratie((s) => ({ ...s, email: v }))} error={registratieVeldFouten.email} />
                <TextField id="acc-telefoon" label="Telefoonnummer" type="tel" value={registratie.telefoon} onChange={(v) => setRegistratie((s) => ({ ...s, telefoon: v }))} error={registratieVeldFouten.telefoon} />
              </div>
              <p className="-mt-3 text-xs text-foreground-muted">Vul minimaal een e-mailadres of telefoonnummer in, zodat we u kunnen bereiken.</p>
              {registratieFout ? <p role="alert" className="text-sm font-medium text-error">{registratieFout}</p> : null}
              <Button type="submit" disabled={registratieBezig}>
                {registratieBezig ? 'Bezig...' : 'Bedrijfsgegevens opslaan'}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-6">
              <nav aria-label="Onderdelen van uw account" className="flex flex-wrap gap-1.5">
                {SECTIES.map((s) => (
                  <a key={s.id} href={`#${s.id}`} className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-foreground-muted hover:bg-accent/10 hover:text-accent">
                    {s.label}
                  </a>
                ))}
              </nav>

              <MijnGegevens contactpersoon={contactpersoon} onOpgeslagen={setContactpersoon} />
              <MijnBedrijf klant={klant} onOpgeslagen={setKlant} />
              <MijnPanden panden={panden} setPanden={setPanden} klant={klant} setDossiers={setDossiers} />
              <MijnDossiers dossiers={dossiers} />
              <MijnAdvies dossiers={dossiers} adviespuntenPerDossier={adviespuntenPerDossier} />
              <MijnDocumenten klant={klant} documenten={documenten} setDocumenten={setDocumenten} dossiers={dossiers} />
              <MijnOffertes offertes={offertes} />
              <MijnFacturen facturen={facturen} />
              <ActiesVoorU acties={acties} />
              <Instellingen />
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}

function Kaart({ id, titel, omschrijving, children }) {
  return (
    <div id={id} className="scroll-mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">{titel}</p>
      {omschrijving ? <p className="mb-4 text-sm text-foreground-muted">{omschrijving}</p> : null}
      {children}
    </div>
  )
}

// --- Mijn gegevens (contactpersoon) --------------------------------------------------

function MijnGegevens({ contactpersoon, onOpgeslagen }) {
  const [bewerken, setBewerken] = useState(false)
  const [form, setForm] = useState({ naam: '', email: '', telefoon: '', rol: '' })
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [fouten, setFouten] = useState({})
  const [opgeslagen, setOpgeslagen] = useState(false)

  function startBewerken() {
    setForm({ naam: contactpersoon?.naam ?? '', email: contactpersoon?.email ?? '', telefoon: contactpersoon?.telefoon ?? '', rol: contactpersoon?.rol ?? '' })
    setFout(null)
    setFouten({})
    setOpgeslagen(false)
    setBewerken(true)
  }

  async function opslaan(e) {
    e.preventDefault()
    const veldFouten = valideerKlantRegistratie(form)
    setFouten(veldFouten)
    if (Object.keys(veldFouten).length > 0) return
    setBezig(true)
    setFout(null)
    try {
      const bijgewerkt = await updateMijnContactpersoon(contactpersoon.contactpersoon_id, form)
      onOpgeslagen(bijgewerkt)
      setBewerken(false)
      setOpgeslagen(true)
    } catch {
      setFout('Opslaan is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  if (!contactpersoon) {
    return (
      <Kaart id="gegevens" titel="Mijn gegevens">
        <p className="text-sm text-foreground-muted">Geen eigen contactpersoon gevonden.</p>
      </Kaart>
    )
  }

  return (
    <Kaart id="gegevens" titel="Mijn gegevens" omschrijving="Uw eigen naam, functie en contactgegevens.">
      {bewerken ? (
        <form onSubmit={opslaan} className="flex flex-col gap-4">
          <TextField id="gegevens-naam" label="Naam" required value={form.naam} onChange={(v) => setForm((s) => ({ ...s, naam: v }))} error={fouten.naam} />
          <TextField id="gegevens-rol" label="Functie / rol" value={form.rol} onChange={(v) => setForm((s) => ({ ...s, rol: v }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="gegevens-email" label="E-mailadres" type="email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} error={fouten.email} />
            <TextField id="gegevens-telefoon" label="Telefoonnummer" type="tel" value={form.telefoon} onChange={(v) => setForm((s) => ({ ...s, telefoon: v }))} error={fouten.telefoon} />
          </div>
          {fout ? <p role="alert" className="text-sm font-medium text-error">{fout}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="sm" disabled={bezig}>
              {bezig ? 'Bezig...' : 'Opslaan'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setBewerken(false)} disabled={bezig}>
              Annuleren
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-primary">
            {contactpersoon.naam}
            {contactpersoon.rol ? <span className="text-foreground-muted"> — {contactpersoon.rol}</span> : null}
          </p>
          <p className="text-sm text-foreground-muted">
            {contactpersoon.email || 'Geen e-mailadres bekend'}
            {contactpersoon.telefoon ? <> · {contactpersoon.telefoon}</> : null}
          </p>
          {opgeslagen ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <CheckCircle size={15} weight="fill" /> Opgeslagen.
            </p>
          ) : null}
          <div>
            <Button type="button" variant="outline" size="sm" onClick={startBewerken}>
              Gegevens aanpassen
            </Button>
          </div>
        </div>
      )}
    </Kaart>
  )
}

// --- Mijn bedrijf (klant) --------------------------------------------------

function MijnBedrijf({ klant, onOpgeslagen }) {
  const [bewerken, setBewerken] = useState(false)
  const [form, setForm] = useState({ naam: '', bedrijfsnaam: '', email: '', telefoon: '', adres: '', postcode: '', plaats: '' })
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [opgeslagen, setOpgeslagen] = useState(false)

  function startBewerken() {
    setForm({
      naam: klant.naam ?? '',
      bedrijfsnaam: klant.bedrijfsnaam ?? '',
      email: klant.email ?? '',
      telefoon: klant.telefoon ?? '',
      adres: klant.adres ?? '',
      postcode: klant.postcode ?? '',
      plaats: klant.plaats ?? '',
    })
    setFout(null)
    setOpgeslagen(false)
    setBewerken(true)
  }

  async function opslaan(e) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    try {
      const bijgewerkt = await updateKlant(klant.klant_id, form)
      onOpgeslagen(bijgewerkt)
      setBewerken(false)
      setOpgeslagen(true)
    } catch {
      setFout('Opslaan is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <Kaart id="bedrijf" titel="Mijn bedrijf" omschrijving="De bedrijfsgegevens waaronder wij u kennen.">
      {bewerken ? (
        <form onSubmit={opslaan} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="bedrijf-naam" label="Naam" required value={form.naam} onChange={(v) => setForm((s) => ({ ...s, naam: v }))} />
            <TextField id="bedrijf-bedrijfsnaam" label="Bedrijfsnaam" value={form.bedrijfsnaam} onChange={(v) => setForm((s) => ({ ...s, bedrijfsnaam: v }))} />
            <TextField id="bedrijf-email" label="E-mailadres" type="email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} />
            <TextField id="bedrijf-telefoon" label="Telefoonnummer" type="tel" value={form.telefoon} onChange={(v) => setForm((s) => ({ ...s, telefoon: v }))} />
          </div>
          <TextField id="bedrijf-adres" label="Adres" value={form.adres} onChange={(v) => setForm((s) => ({ ...s, adres: v }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="bedrijf-postcode" label="Postcode" value={form.postcode} onChange={(v) => setForm((s) => ({ ...s, postcode: v }))} />
            <TextField id="bedrijf-plaats" label="Plaats" value={form.plaats} onChange={(v) => setForm((s) => ({ ...s, plaats: v }))} />
          </div>
          {fout ? <p role="alert" className="text-sm font-medium text-error">{fout}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="sm" disabled={bezig}>
              {bezig ? 'Bezig...' : 'Opslaan'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setBewerken(false)} disabled={bezig}>
              Annuleren
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-primary">{klant.bedrijfsnaam || klant.naam}</p>
          {klant.bedrijfsnaam && klant.bedrijfsnaam !== klant.naam ? <p className="text-sm text-foreground-muted">t.a.v. {klant.naam}</p> : null}
          {klant.adres || klant.postcode || klant.plaats ? (
            <p className="text-sm text-foreground-muted">
              {klant.adres}
              {klant.adres && (klant.postcode || klant.plaats) ? <br /> : null}
              {klant.postcode} {klant.plaats}
            </p>
          ) : null}
          <p className="text-sm text-foreground-muted">
            {klant.email || 'Geen e-mailadres bekend'}
            {klant.telefoon ? <> · {klant.telefoon}</> : null}
          </p>
          {opgeslagen ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <CheckCircle size={15} weight="fill" /> Opgeslagen.
            </p>
          ) : null}
          <div>
            <Button type="button" variant="outline" size="sm" onClick={startBewerken}>
              Bedrijfsgegevens aanpassen
            </Button>
          </div>
        </div>
      )}
    </Kaart>
  )
}

// --- Mijn panden --------------------------------------------------

function MijnPanden({ panden, setPanden, klant, setDossiers }) {
  const [nieuwPandModus, setNieuwPandModus] = useState(false)
  const [nieuwPand, setNieuwPand] = useState(LEEG_PAND)
  const [pandBezig, setPandBezig] = useState(false)
  const [pandFout, setPandFout] = useState(null)

  const [bewerkId, setBewerkId] = useState(null)
  const [bewerkForm, setBewerkForm] = useState(null)
  const [bewerkBezig, setBewerkBezig] = useState(false)
  const [bewerkFout, setBewerkFout] = useState(null)

  async function submitNieuwPand(e) {
    e.preventDefault()
    setPandFout(null)
    if (!nieuwPand.adres.trim() && !nieuwPand.omschrijving.trim()) return setPandFout('Vul minimaal een adres of omschrijving in.')
    setPandBezig(true)
    try {
      const pand = await maakPandEnKoppel(klant.klant_id, nieuwPand)
      setPanden((v) => [pand, ...v])
      setNieuwPand(LEEG_PAND)
      setNieuwPandModus(false)
    } catch {
      setPandFout('Het pand kon niet worden toegevoegd. Probeer het opnieuw.')
    } finally {
      setPandBezig(false)
    }
  }

  function startBewerken(pand) {
    setBewerkId(pand.pand_id)
    setBewerkForm({
      omschrijving: pand.omschrijving ?? '',
      adres: pand.adres ?? '',
      postcode: pand.postcode ?? '',
      plaats: pand.plaats ?? '',
      gebruikstype: pand.gebruikstype ?? '',
      bouwjaar: pand.bouwjaar ?? '',
      vloeroppervlak: pand.vloeroppervlak ?? '',
      opmerkingen: pand.opmerkingen ?? '',
    })
    setBewerkFout(null)
  }

  async function opslaanPand(e, pandId) {
    e.preventDefault()
    setBewerkBezig(true)
    setBewerkFout(null)
    try {
      const bijgewerkt = await updatePand(pandId, {
        ...bewerkForm,
        bouwjaar: bewerkForm.bouwjaar === '' ? null : Number(bewerkForm.bouwjaar),
        vloeroppervlak: bewerkForm.vloeroppervlak === '' ? null : Number(bewerkForm.vloeroppervlak),
      })
      setPanden((v) => v.map((p) => (p.pand_id === pandId ? bijgewerkt : p)))
      setBewerkId(null)
    } catch {
      setBewerkFout('Opslaan is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBewerkBezig(false)
    }
  }

  async function openDossierVoorPand(pand) {
    const { dossier } = await openOfHergebruikDossier({ klantId: klant.klant_id, pandId: pand.pand_id, pand })
    setDossiers((v) => [dossier, ...v.filter((d) => d.dossier_id !== dossier.dossier_id)])
    window.location.assign(ROUTES.dossier(dossier.dossier_id))
  }

  return (
    <Kaart id="panden" titel="Mijn panden" omschrijving="De panden die aan uw bedrijf gekoppeld zijn.">
      <div className="mb-4 flex justify-end">
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
          {panden.map((pand) =>
            bewerkId === pand.pand_id ? (
              <li key={pand.pand_id} className="rounded-lg border border-accent/30 bg-muted/40 p-4">
                <form onSubmit={(e) => opslaanPand(e, pand.pand_id)} className="flex flex-col gap-4">
                  <TextField id={`pand-bewerk-omschrijving-${pand.pand_id}`} label="Omschrijving" value={bewerkForm.omschrijving} onChange={(v) => setBewerkForm((s) => ({ ...s, omschrijving: v }))} />
                  <TextField id={`pand-bewerk-adres-${pand.pand_id}`} label="Adres" value={bewerkForm.adres} onChange={(v) => setBewerkForm((s) => ({ ...s, adres: v }))} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField id={`pand-bewerk-postcode-${pand.pand_id}`} label="Postcode" value={bewerkForm.postcode} onChange={(v) => setBewerkForm((s) => ({ ...s, postcode: v }))} />
                    <TextField id={`pand-bewerk-plaats-${pand.pand_id}`} label="Plaats" value={bewerkForm.plaats} onChange={(v) => setBewerkForm((s) => ({ ...s, plaats: v }))} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <TextField id={`pand-bewerk-gebruikstype-${pand.pand_id}`} label="Gebruikstype" value={bewerkForm.gebruikstype} onChange={(v) => setBewerkForm((s) => ({ ...s, gebruikstype: v }))} />
                    <TextField id={`pand-bewerk-bouwjaar-${pand.pand_id}`} label="Bouwjaar" type="number" value={bewerkForm.bouwjaar} onChange={(v) => setBewerkForm((s) => ({ ...s, bouwjaar: v }))} />
                    <TextField id={`pand-bewerk-oppervlak-${pand.pand_id}`} label="Oppervlakte (m²)" type="number" value={bewerkForm.vloeroppervlak} onChange={(v) => setBewerkForm((s) => ({ ...s, vloeroppervlak: v }))} />
                  </div>
                  <TextField id={`pand-bewerk-opmerkingen-${pand.pand_id}`} label="Opmerkingen (bijv. geplande verbouwing)" value={bewerkForm.opmerkingen} onChange={(v) => setBewerkForm((s) => ({ ...s, opmerkingen: v }))} />
                  {bewerkFout ? <p role="alert" className="text-sm font-medium text-error">{bewerkFout}</p> : null}
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" size="sm" disabled={bewerkBezig}>
                      {bewerkBezig ? 'Bezig...' : 'Opslaan'}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setBewerkId(null)} disabled={bewerkBezig}>
                      Annuleren
                    </Button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={pand.pand_id} className="rounded-lg border border-border p-4">
                <p className="font-medium text-primary">{pand.omschrijving || pand.adres || 'Naamloos pand'}</p>
                {pand.plaats ? <p className="text-sm text-foreground-muted">{pand.adres ? `${pand.adres}, ` : ''}{pand.postcode} {pand.plaats}</p> : null}
                {pand.gebruikstype ? <p className="text-sm text-foreground-muted">{pand.gebruikstype}{pand.bouwjaar ? `, bouwjaar ${pand.bouwjaar}` : ''}{pand.vloeroppervlak ? `, ${pand.vloeroppervlak} m²` : ''}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link to={ROUTES.mjopTool} className="text-sm font-medium text-accent hover:underline">
                    MJOP starten/bekijken
                  </Link>
                  <Button type="button" variant="outline" size="sm" onClick={() => openDossierVoorPand(pand)}>
                    Adviesdossier openen
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => startBewerken(pand)}>
                    Pandgegevens aanpassen
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </Kaart>
  )
}

// --- Mijn dossiers --------------------------------------------------

const DOSSIER_STATUS_LABEL = { open: 'Open', afgerond: 'Afgerond' }

function MijnDossiers({ dossiers }) {
  return (
    <Kaart id="dossiers" titel="Mijn dossiers" omschrijving="Al uw adviesdossiers, per pand.">
      {dossiers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen adviesdossiers. Open er één via een pand hierboven.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {dossiers.map((d) => (
            <li key={d.dossier_id}>
              <Link
                to={ROUTES.dossier(d.dossier_id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm hover:border-accent hover:bg-muted"
              >
                <span className="font-medium text-primary">{d.panden?.omschrijving || d.panden?.adres || 'Onbekend pand'}</span>
                <span className={d.status === 'afgerond' ? 'text-accent' : 'text-foreground-muted'}>{DOSSIER_STATUS_LABEL[d.status] ?? d.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Kaart>
  )
}

// --- Mijn advies --------------------------------------------------

/**
 * Toont per dossier uitsluitend de al bestaande, definitieve adviespunten
 * (dezelfde AdviespuntKaart als DossierDetail.jsx/DossierWerkruimte.jsx,
 * hier zonder `actions` — dus altijd read-only, een klant kan hier niets
 * aanpassen). Geen ruwe automatische signalen: die zijn geen rij in
 * `adviespunten` en komen dus sowieso niet in adviespuntenPerDossier terecht
 * (zie moduledoc bij listAdviespunten()-aanroep in laadAlles()). Geen
 * interne velden (commerciële kans, planning, interne notities/uren/kosten)
 * — die tabellen worden hier niet bevraagd.
 */
function MijnAdvies({ dossiers, adviespuntenPerDossier }) {
  return (
    <Kaart id="advies" titel="Mijn advies" omschrijving="Het definitieve advies per dossier, zodra SMV dit heeft vastgesteld.">
      {dossiers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen dossier, dus nog geen advies.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {dossiers.map((d) => {
            const adviespunten = adviespuntenPerDossier[d.dossier_id] ?? []
            return (
              <li key={d.dossier_id}>
                <Link to={ROUTES.dossier(d.dossier_id)} className="text-sm font-medium text-primary hover:underline">
                  {d.panden?.omschrijving || d.panden?.adres || 'Adviesdossier'}
                </Link>
                {adviespunten.length === 0 ? (
                  <p className="mt-2 text-sm text-foreground-muted">Er is voor dit dossier nog geen definitief advies beschikbaar.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-3">
                    {adviespunten.map((advies) => (
                      <li key={advies.adviespunt_id}>
                        <AdviespuntKaart
                          advies={{
                            onderwerp: advies.onderwerp,
                            herkomst: advies.herkomst,
                            adviesStatus: advies.advies_status,
                            toelichting: advies.toelichting,
                            herbeoordelenBij: advies.herbeoordelen_bij,
                            herbeoordelenDatum: advies.herbeoordelen_datum,
                            signaalBevroren: advies.signaal_bevroren,
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Kaart>
  )
}

// --- Mijn documenten --------------------------------------------------

function MijnDocumenten({ klant, documenten, setDocumenten, dossiers }) {
  const [bestand, setBestand] = useState(null)
  const [omschrijving, setOmschrijving] = useState('')
  const [dossierId, setDossierId] = useState('')
  const [uploadBezig, setUploadBezig] = useState(false)
  const [uploadFout, setUploadFout] = useState(null)

  const [verwijderId, setVerwijderId] = useState(null)
  const [verwijderBezig, setVerwijderBezig] = useState(false)
  const [downloadFoutId, setDownloadFoutId] = useState(null)

  async function submitUpload(e) {
    e.preventDefault()
    if (!bestand) return setUploadFout('Kies eerst een bestand.')
    setUploadBezig(true)
    setUploadFout(null)
    try {
      const nieuw = await uploadDocument({ klantId: klant.klant_id, dossierId: dossierId || null, file: bestand, omschrijving })
      setDocumenten((v) => [nieuw, ...v])
      setBestand(null)
      setOmschrijving('')
      setDossierId('')
      e.target.reset()
    } catch {
      setUploadFout('Uploaden is niet gelukt. Probeer het opnieuw.')
    } finally {
      setUploadBezig(false)
    }
  }

  async function downloaden(document) {
    setDownloadFoutId(null)
    try {
      const url = await getDocumentDownloadUrl(document.storage_path)
      window.open(url, '_blank', 'noopener')
    } catch {
      setDownloadFoutId(document.document_id)
    }
  }

  async function bevestigVerwijderen(document) {
    setVerwijderBezig(true)
    try {
      await verwijderDocument(document.document_id, document.storage_path)
      setDocumenten((v) => v.filter((d) => d.document_id !== document.document_id))
      setVerwijderId(null)
    } catch {
      // Blijft in bevestigingsstap staan — opnieuw proberen kan direct.
    } finally {
      setVerwijderBezig(false)
    }
  }

  return (
    <Kaart id="documenten" titel="Mijn documenten" omschrijving="Bijvoorbeeld energiegegevens, MJOP, onderhoudsdocumenten of offertes van derden.">
      <form onSubmit={submitUpload} className="mb-6 flex flex-col gap-4 rounded-lg border border-border bg-muted/40 p-4">
        <div>
          <label htmlFor="doc-bestand" className="mb-2 block text-sm font-medium text-primary">
            Bestand
          </label>
          <input
            id="doc-bestand"
            type="file"
            onChange={(e) => setBestand(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-foreground-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </div>
        <TextField id="doc-omschrijving" label="Omschrijving (optioneel)" value={omschrijving} onChange={setOmschrijving} />
        {dossiers.length > 0 ? (
          <div>
            <label htmlFor="doc-dossier" className="mb-2 block text-sm font-medium text-primary">
              Bij dossier (optioneel)
            </label>
            <select
              id="doc-dossier"
              value={dossierId}
              onChange={(e) => setDossierId(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            >
              <option value="">Geen specifiek dossier</option>
              {dossiers.map((d) => (
                <option key={d.dossier_id} value={d.dossier_id}>
                  {d.panden?.omschrijving || d.panden?.adres || 'Dossier'}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {uploadFout ? <p role="alert" className="text-sm font-medium text-error">{uploadFout}</p> : null}
        <div>
          <Button type="submit" size="sm" disabled={uploadBezig}>
            <UploadSimple size={15} /> {uploadBezig ? 'Bezig...' : 'Document uploaden'}
          </Button>
        </div>
      </form>

      {documenten.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen documenten geüpload.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documenten.map((d) => (
            <li key={d.document_id} className="rounded-lg border border-border bg-white px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-primary">{d.bestandsnaam}</p>
                  <p className="text-xs text-foreground-muted">
                    {formatDatumNl(d.created_at?.slice(0, 10))}
                    {d.omschrijving ? ` · ${d.omschrijving}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => downloaden(d)} aria-label="Downloaden">
                    <DownloadSimple size={15} />
                  </Button>
                  {verwijderId === d.document_id ? (
                    <>
                      <Button type="button" variant="ghost" size="sm" onClick={() => bevestigVerwijderen(d)} disabled={verwijderBezig}>
                        Ja
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderId(null)} disabled={verwijderBezig}>
                        Nee
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setVerwijderId(d.document_id)} aria-label="Verwijderen">
                      <Trash size={15} />
                    </Button>
                  )}
                </div>
              </div>
              {downloadFoutId === d.document_id ? (
                <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-error">
                  <WarningCircle size={13} weight="fill" /> Downloaden is niet gelukt. Probeer het opnieuw.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Kaart>
  )
}

// --- Mijn offertes --------------------------------------------------

function MijnOffertes({ offertes }) {
  return (
    <Kaart id="offertes" titel="Mijn offertes" omschrijving="Al uw offertes, over al uw dossiers heen.">
      {offertes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen offertes.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {offertes.map((o) => (
            <li key={o.id}>
              <Link
                to={ROUTES.offertePreview(o.dossier_id, o.id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm hover:border-accent hover:bg-muted"
              >
                <span className="font-medium text-primary">{o.offerte_nummer}</span>
                <span className="text-xs text-foreground-muted">{OFFERTE_STATUS_LABELS[o.status] ?? o.status}</span>
                <span className="text-xs text-foreground-muted">{formatDatumNl(o.offerte_datum)}</span>
                <span className="text-primary">{euro(o.totaal)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Kaart>
  )
}

// --- Mijn facturen --------------------------------------------------

function MijnFacturen({ facturen }) {
  return (
    <Kaart id="facturen" titel="Mijn facturen" omschrijving="Al uw facturen, met status en vervaldatum.">
      {facturen.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen facturen.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {facturen.map((f) => (
            <li key={f.factuur_id}>
              <Link
                to={ROUTES.mijnFactuur(f.factuur_id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm hover:border-accent hover:bg-muted"
              >
                <span className="font-medium text-primary">{f.factuurnummer}</span>
                <span className="text-xs text-foreground-muted">{FACTUUR_STATUS_LABELS[f.status] ?? f.status}</span>
                <span className="text-xs text-foreground-muted">Vervalt {formatDatumNl(f.vervaldatum)}</span>
                <span className="text-primary">{euro(f.totaal_incl_btw)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Kaart>
  )
}

// --- Acties voor u --------------------------------------------------

function ActiesVoorU({ acties }) {
  return (
    <Kaart id="acties" titel="Acties voor u" omschrijving="Concrete punten die u zelf kunt aanvullen.">
      {acties.length === 0 ? (
        <p className="flex items-center gap-1.5 text-sm text-foreground-muted">
          <CheckCircle size={15} weight="fill" className="text-accent" /> Alles is compleet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {acties.map((actie, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-primary">{actie.label}</p>
                <p className="text-xs text-foreground-muted">{actie.reden}</p>
              </div>
              <Button as="link" to={actie.actie.to} variant="outline" size="sm">
                {actie.actie.label}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Kaart>
  )
}

// --- Instellingen --------------------------------------------------

function Instellingen() {
  return (
    <Kaart id="instellingen" titel="Instellingen">
      <div className="flex flex-wrap gap-3">
        <a href="#gegevens" className="text-sm font-medium text-accent hover:underline">
          Contactgegevens aanpassen
        </a>
        <Link to={ROUTES.wachtwoordVergeten} className="text-sm font-medium text-accent hover:underline">
          Wachtwoord wijzigen
        </Link>
      </div>
      <div className="mt-4">
        <UitloggenKnop />
      </div>
    </Kaart>
  )
}
