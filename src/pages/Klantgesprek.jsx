import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../lib/routes'
import { getDossier, listAdviespunten, getOffertesVoorDossier } from '../lib/klantOmgeving/api'
import { bouwDossierHealthCheck, HEALTH_STATUS } from '../lib/klantOmgeving/dossierHealthCheck'
import { groepeerAdviespunten } from '../lib/dossier/adviesresultaat'
import { vindVragenOmTeStellen, vindHerbeoordelingen, bepaalVolgendeActie } from '../lib/klantOmgeving/klantgesprek'
import { buildInsights } from '../lib/mjop/linking'
import { buildEnergieInsights } from '../lib/dossier/energieInsights'
import { euro, formatDatumNl } from '../lib/klantOmgeving/offerte'

/**
 * "Klaar voor klantgesprek" (werkfase Fase 7) — één read-only scherm voor
 * de adviseur vlak vóór een klantgesprek. Bewust admin-only (zie App.jsx):
 * dit is voorbereiding voor Richard, geen klantfunctie. Geen nieuwe
 * database-entiteit — uitsluitend al bestaande dossier-/adviespunt-/
 * offertevelden, hergroepeerd via al bestaande, geteste pure functies
 * (groepeerAdviespunten, bouwDossierHealthCheck, klantgesprek.js).
 * Zelfde renderbron voor scherm én print (window.print(), print:-varianten)
 * als OffertePreview.jsx/OfferteDocument.jsx — geen los "printversie"-pad.
 */

const STATUS_LABEL = {
  [HEALTH_STATUS.GEREED]: 'Gereed',
  [HEALTH_STATUS.AANDACHT]: 'Aandacht',
  [HEALTH_STATUS.ONTBREEKT]: 'Ontbreekt',
}

function Blok({ titel, children }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm break-inside-avoid print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-8">
      <h2 className="mb-3 text-xs font-semibold tracking-[0.14em] text-accent uppercase">{titel}</h2>
      {children}
    </section>
  )
}

export default function Klantgesprek() {
  const { dossierId } = useParams()
  const [laden, setLaden] = useState(true)
  const [nietGevonden, setNietGevonden] = useState(false)
  const [dossier, setDossier] = useState(null)
  const [adviespunten, setAdviespunten] = useState([])
  const [offertes, setOffertes] = useState([])

  useEffect(() => {
    let actief = true
    setLaden(true)
    setNietGevonden(false)
    Promise.all([getDossier(dossierId), listAdviespunten(dossierId), getOffertesVoorDossier(dossierId)])
      .then(([d, a, o]) => {
        if (!actief) return
        setDossier(d)
        setAdviespunten(a)
        setOffertes(o)
      })
      .catch(() => actief && setNietGevonden(true))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [dossierId])

  const openSignalenAantal = useMemo(() => {
    if (!dossier) return 0
    const mjopInsights = dossier.mjop_snapshot?.components ? buildInsights(dossier.mjop_snapshot) : []
    const gebruikteComponentIds = new Set(adviespunten.filter((a) => a.signaal_bevroren).map((a) => a.signaal_bevroren.componentId))
    const openMjop = mjopInsights.filter((i) => !gebruikteComponentIds.has(i.componentId)).length
    const energieInsights = buildEnergieInsights(dossier.energie_snapshot)
    const gebruikteEnergieIds = new Set(
      adviespunten.filter((a) => a.signaal_bevroren?.herkomst === 'energie').map((a) => a.signaal_bevroren.energieMaatregelId),
    )
    const openEnergie = energieInsights.filter((i) => !gebruikteEnergieIds.has(i.energieMaatregelId)).length
    return openMjop + openEnergie
  }, [dossier, adviespunten])

  const healthCheck = useMemo(() => {
    if (!dossier) return null
    return bouwDossierHealthCheck({
      klant: dossier.klanten,
      contactpersoon: dossier.contactpersonen,
      pand: dossier.panden,
      energieSnapshot: dossier.energie_snapshot,
      mjopSnapshot: dossier.mjop_snapshot,
      adviespunten,
      offertes,
      openSignalenAantal,
    })
  }, [dossier, adviespunten, offertes, openSignalenAantal])

  // Zelfde veldvertaling (advies_status -> adviesStatus, adviespunt_id ->
  // adviespuntId) als de bestaande Resultaat-weergave in DossierWerkruimte.jsx
  // — groepeerAdviespunten() zelf blijft ongewijzigd, geen tweede implementatie.
  const { groepen } = useMemo(
    () => groepeerAdviespunten(adviespunten.map((a) => ({ ...a, adviesStatus: a.advies_status, adviespuntId: a.adviespunt_id }))),
    [adviespunten],
  )
  const vragen = useMemo(() => vindVragenOmTeStellen(adviespunten), [adviespunten])
  const herbeoordelingen = useMemo(() => vindHerbeoordelingen(adviespunten), [adviespunten])
  const laatsteOfferte = offertes[0] ?? null
  const volgendeActie = dossier
    ? bepaalVolgendeActie({ dossierStatus: dossier.status, openSignalenAantal, aantalAdviespunten: adviespunten.length, laatsteOfferte })
    : null

  return (
    <>
      <Seo title="Klantgesprek voorbereiden" description="Voorbereiding voor een klantgesprek." noindex />
      <div className="min-h-dvh bg-muted/40 print:bg-white">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-4 py-4 print:hidden sm:px-6">
          <Button as="link" to={dossierId ? ROUTES.dossier(dossierId) : ROUTES.admin} variant="ghost" size="sm">
            <ArrowLeft size={16} /> Terug naar dossier
          </Button>
          {dossier ? (
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
              <Printer size={16} /> Afdrukken
            </Button>
          ) : null}
        </div>

        <div className="mx-auto flex max-w-[900px] flex-col gap-4 px-4 pb-16 print:gap-6 print:p-0 sm:px-6">
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : nietGevonden || !dossier ? (
            <p className="rounded-lg border border-dashed border-border bg-white px-5 py-6 text-center text-sm text-foreground-muted">
              Dit dossier bestaat niet, of u heeft er geen toegang toe.
            </p>
          ) : (
            <>
              <div className="print:mb-2">
                <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Klaar voor klantgesprek</p>
                <h1 className="font-heading text-2xl text-primary">
                  {dossier.klanten?.naam || dossier.klanten?.bedrijfsnaam || 'Onbekende klant'}
                </h1>
                <p className="text-sm text-foreground-muted">{dossier.panden?.omschrijving || dossier.panden?.adres || 'Onbekend pand'}</p>
              </div>

              <Blok titel="Volgende stap">
                <p className="text-lg text-primary">{volgendeActie}</p>
              </Blok>

              <Blok titel="Klant &amp; pand">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-1 text-xs font-medium text-foreground-muted uppercase">Klant</h3>
                    <p className="text-primary">
                      {dossier.klanten?.bedrijfsnaam || dossier.klanten?.naam}
                      {dossier.contactpersonen ? (
                        <>
                          <br />
                          {dossier.contactpersonen.naam}
                          {dossier.contactpersonen.rol ? ` (${dossier.contactpersonen.rol})` : ''}
                          <br />
                          {/* Werkfase Fase 14: klikbaar bellen/mailen op dit voorbereidingsscherm — precies waar een adviseur dit onderweg nodig heeft. */}
                          {dossier.contactpersonen.email ? (
                            <a href={`mailto:${dossier.contactpersonen.email}`} className="text-accent hover:underline print:text-primary print:no-underline">
                              {dossier.contactpersonen.email}
                            </a>
                          ) : null}
                          {dossier.contactpersonen.telefoon ? (
                            <>
                              {' · '}
                              <a href={`tel:${dossier.contactpersonen.telefoon}`} className="text-accent hover:underline print:text-primary print:no-underline">
                                {dossier.contactpersonen.telefoon}
                              </a>
                            </>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-foreground-muted"> — geen contactpersoon bekend</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-xs font-medium text-foreground-muted uppercase">Pand</h3>
                    <p className="text-primary">
                      {/* Werkfase Fase 14: adres direct openen in Maps op mobiel — gratis, browser-native link, geen API-sleutel. */}
                      {dossier.panden?.adres ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([dossier.panden.adres, dossier.panden.postcode, dossier.panden.plaats].filter(Boolean).join(', '))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline print:text-primary print:no-underline"
                        >
                          {dossier.panden.adres}
                        </a>
                      ) : null}
                      <br />
                      {dossier.panden?.postcode} {dossier.panden?.plaats}
                      {dossier.panden?.gebruikstype ? (
                        <>
                          <br />
                          {dossier.panden.gebruikstype}
                          {dossier.panden.bouwjaar ? `, bouwjaar ${dossier.panden.bouwjaar}` : ''}
                          {dossier.panden.vloeroppervlak ? `, ${dossier.panden.vloeroppervlak} m²` : ''}
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
              </Blok>

              <Blok titel="Wat weten we / wat weten we nog niet">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(healthCheck.categorieen).map(([key, c]) => (
                    <li key={key} className="flex items-baseline justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                      <span className="text-primary">{c.reden}</span>
                      <span className="shrink-0 text-xs font-medium text-foreground-muted">{STATUS_LABEL[c.status]}</span>
                    </li>
                  ))}
                </ul>
              </Blok>

              {vragen.length > 0 ? (
                <Blok titel="Vragen om te stellen">
                  <ul className="flex flex-col gap-1.5">
                    {vragen.map((v) => (
                      <li key={v.adviespunt_id} className="text-primary">
                        · {v.onderwerp}
                        {v.toelichting ? <span className="text-foreground-muted"> — {v.toelichting}</span> : null}
                      </li>
                    ))}
                  </ul>
                </Blok>
              ) : null}

              <Blok titel="Advies: wat moet nu, wat kan wachten">
                <div className="flex flex-col gap-4">
                  {groepen.map((groep) =>
                    groep.aantal === 0 ? null : (
                      <div key={groep.status}>
                        <h3 className="mb-1.5 text-sm font-semibold text-primary">
                          {groep.label} <span className="font-mono text-xs font-normal text-foreground-muted">({groep.aantal})</span>
                        </h3>
                        <ul className="flex flex-col gap-1">
                          {groep.adviespunten.map((a) => (
                            <li key={a.adviespuntId} className="text-sm text-primary">
                              · {a.onderwerp}
                              {a.toelichting ? <span className="text-foreground-muted"> — {a.toelichting}</span> : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
                  {adviespunten.length === 0 ? <p className="text-sm text-foreground-muted">Nog geen adviespunten vastgelegd.</p> : null}
                </div>
              </Blok>

              {herbeoordelingen.length > 0 ? (
                <Blok titel="Herbeoordelingen">
                  <ul className="flex flex-col gap-1.5">
                    {herbeoordelingen.map((h) => (
                      <li key={h.adviespunt_id} className="text-sm text-primary">
                        · {h.onderwerp}{' '}
                        <span className="text-foreground-muted">
                          — {h.herbeoordelen_datum ? formatDatumNl(h.herbeoordelen_datum) : ''}
                          {h.herbeoordelen_datum && h.herbeoordelen_bij ? ' · ' : ''}
                          {h.herbeoordelen_bij}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Blok>
              ) : null}

              <Blok titel="Open offerte">
                {laatsteOfferte ? (
                  <p className="text-primary">
                    {laatsteOfferte.offerte_nummer} — {laatsteOfferte.snapshot?.pakket?.naam} — {euro(laatsteOfferte.totaal)}
                    <br />
                    <span className="text-foreground-muted">
                      Status: {laatsteOfferte.status} · Geldig tot {formatDatumNl(laatsteOfferte.geldig_tot)}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-foreground-muted">Nog geen offerte voor dit dossier.</p>
                )}
              </Blok>
            </>
          )}
        </div>
      </div>
    </>
  )
}
