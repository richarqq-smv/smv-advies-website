import { useEffect, useState } from 'react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../lib/routes'
import { adminListFacturen, adminListKosten } from '../lib/klantOmgeving/api'
import { euro, isFactuurVervallen } from '../lib/klantOmgeving/factuur'
import { berekenBtwOverzicht, berekenBtwPeriode, formatBtwPeriodeLabel } from '../lib/klantOmgeving/btwOverzicht'

/**
 * Administratie-dashboard (/admin/administratie, opdracht sectie 2) — het
 * startpunt van de facturatie-/BTW-administratie: vier kaarten met
 * uitsluitend optellingen van al vastgelegde facturen/kosten (Omzet,
 * Openstaand, Btw, Resultaat), geen scores/voorspellingen/automatisch
 * financieel advies. Kosten/Btw-overzicht/Instellingen staan hier als
 * kaarten (niet in AdminLayout's navigatiebalk, zie moduledoc daar) — dit
 * is dus ook het enige klikpad naar die drie subpagina's.
 *
 * Eén brede fetch (heel het lopende jaar aan facturen/kosten) waaruit alle
 * vier kaarten client-side worden afgeleid — geen vier losse queries voor
 * vier kaarten, en klein genoeg qua opzet (v1, geen paginering) om dat
 * verantwoord te doen.
 */
export default function AdminAdministratie() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [facturen, setFacturen] = useState([])
  const [kosten, setKosten] = useState([])

  const vandaagIso = new Date().toISOString().slice(0, 10)
  const jaarPeriode = berekenBtwPeriode('jaar', vandaagIso)
  const maandPeriode = berekenBtwPeriode('maand', vandaagIso)
  const kwartaalPeriode = berekenBtwPeriode('kwartaal', vandaagIso)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    Promise.all([adminListFacturen({ vanaf: jaarPeriode.vanaf, tot: jaarPeriode.tot }), adminListKosten({ vanaf: jaarPeriode.vanaf, tot: jaarPeriode.tot })])
      .then(([f, k]) => {
        if (!actief) return
        setFacturen(f)
        setKosten(k)
      })
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [jaarPeriode.vanaf, jaarPeriode.tot])

  const jaarOverzicht = berekenBtwOverzicht({ facturen, kosten })
  const maandFacturen = facturen.filter((f) => f.factuurdatum >= maandPeriode.vanaf && f.factuurdatum <= maandPeriode.tot)
  const maandOverzicht = berekenBtwOverzicht({ facturen: maandFacturen, kosten: [] })
  const kwartaalFacturen = facturen.filter((f) => f.factuurdatum >= kwartaalPeriode.vanaf && f.factuurdatum <= kwartaalPeriode.tot)
  const kwartaalKosten = kosten.filter((k) => k.datum >= kwartaalPeriode.vanaf && k.datum <= kwartaalPeriode.tot)
  const kwartaalOverzicht = berekenBtwOverzicht({ facturen: kwartaalFacturen, kosten: kwartaalKosten })

  const openFacturen = facturen.filter((f) => f.status === 'verzonden')
  const openBedrag = openFacturen.reduce((som, f) => som + Number(f.totaal_incl_btw ?? 0), 0)
  const vervallenFacturen = facturen.filter((f) => f.status === 'vervallen' || isFactuurVervallen(f, vandaagIso))
  const vervallenBedrag = vervallenFacturen.reduce((som, f) => som + Number(f.totaal_incl_btw ?? 0), 0)

  return (
    <>
      <Seo title="Administratie" description="Financieel overzicht: omzet, openstaand, btw en resultaat." noindex />
      <PageHero eyebrow="Beheer" title="Administratie" description="Wat moet u vandaag weten over facturatie en btw." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Kaart titel="Omzet" omschrijving="Excl. btw, van daadwerkelijk verstuurde facturen.">
                <Regel label="Deze maand" waarde={euro(maandOverzicht.omzetExclBtw)} />
                <Regel label="Dit jaar" waarde={euro(jaarOverzicht.omzetExclBtw)} />
              </Kaart>

              <Kaart titel="Openstaand" omschrijving="Verzonden facturen die nog niet betaald zijn.">
                <Regel label="Aantal openstaand" waarde={String(openFacturen.length)} />
                <Regel label="Totaal openstaand" waarde={euro(openBedrag)} />
                <Regel label="Waarvan vervallen" waarde={euro(vervallenBedrag)} nadruk={vervallenBedrag > 0} />
              </Kaart>

              <Kaart titel="Btw" omschrijving={`Huidige periode (${formatBtwPeriodeLabel('kwartaal', vandaagIso)}).`} cta="Naar btw-overzicht" to={ROUTES.adminBtw}>
                <Regel label="Verschuldigd" waarde={euro(kwartaalOverzicht.btwVerkoop)} />
                <Regel label="Aftrekbaar" waarde={euro(kwartaalOverzicht.btwAftrekbaar)} />
                <Regel label="Saldo" waarde={euro(kwartaalOverzicht.saldo)} />
              </Kaart>

              <Kaart titel="Resultaat" omschrijving="Omzet minus kosten, excl. btw, dit jaar.">
                <Regel label="Omzet" waarde={euro(jaarOverzicht.omzetExclBtw)} />
                <Regel label="Kosten" waarde={euro(jaarOverzicht.kostenExclBtw)} />
                <Regel label="Resultaat" waarde={euro(jaarOverzicht.omzetExclBtw - jaarOverzicht.kostenExclBtw)} />
              </Kaart>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button to={ROUTES.adminKosten} variant="outline" size="sm">
              Kosten
            </Button>
            <Button to={ROUTES.adminBtw} variant="outline" size="sm">
              Btw-overzicht
            </Button>
            <Button to={ROUTES.adminInstellingen} variant="outline" size="sm">
              Instellingen
            </Button>
          </div>
        </Container>
      </Section>
    </>
  )
}

function Kaart({ titel, omschrijving, cta, to, children }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg text-primary">{titel}</h3>
        <p className="mt-1 text-sm text-foreground-muted">{omschrijving}</p>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
      {to ? (
        <div className="mt-auto pt-1">
          <Button to={to} variant="outline" size="sm">
            {cta}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function Regel({ label, waarde, nadruk = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span className={nadruk ? 'font-medium text-error' : 'text-primary'}>{waarde}</span>
    </div>
  )
}
