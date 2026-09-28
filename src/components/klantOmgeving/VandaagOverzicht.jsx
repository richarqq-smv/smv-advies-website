import { Link } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'
import { bouwVandaagOverzicht, VANDAAG_CATEGORIE_INFO } from '../../lib/klantOmgeving/vandaagOverzicht'

/**
 * "Vandaag voor SMV" (werkfase Fase 5). Puur presentatie — alle logica zit
 * in lib/klantOmgeving/vandaagOverzicht.js (getest). Toont uitsluitend
 * categorieën met minstens één item; niets te melden betekent geen sectie,
 * nooit een "0 van de 7"-achtige samenvatting (geen kunstmatige score).
 */
function naamVanDossier(dossier) {
  return dossier?.panden?.omschrijving || dossier?.panden?.adres || 'Onbekend pand'
}

function naamVanKlant(dossier) {
  return dossier?.klanten?.naam || dossier?.klanten?.bedrijfsnaam || 'Onbekende klant'
}

const CATEGORIE_VOLGORDE = [
  'offertesOpTeVolgen',
  'offertesVerlopen',
  'dossiersMetOnbehandeldeSignalen',
  'dossiersZonderMjop',
  'dossiersZonderEnergie',
  'dossiersKlaarVoorAdvies',
  'dossiersKlaarVoorOfferte',
]

function DossierRegel({ dossier }) {
  return (
    <Link
      to={ROUTES.dossier(dossier.dossier_id)}
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm hover:border-accent hover:bg-muted"
    >
      <span className="font-medium text-primary">{naamVanKlant(dossier)}</span>
      <span className="text-foreground-muted">{naamVanDossier(dossier)}</span>
    </Link>
  )
}

function OfferteRegel({ offerte }) {
  const dossier = offerte.dossiers
  if (!dossier) return null
  return (
    <Link
      to={ROUTES.offertePreview(dossier.dossier_id, offerte.id)}
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm hover:border-accent hover:bg-muted"
    >
      <span className="font-medium text-primary">{offerte.offerte_nummer}</span>
      <span className="text-foreground-muted">
        {dossier.klanten?.naam || dossier.klanten?.bedrijfsnaam || 'Onbekende klant'}
        {offerte.verzonden_op ? (
          <> · Verstuurd op {new Date(offerte.verzonden_op).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>
        ) : null}{' '}
        · Geldig tot {new Date(offerte.geldig_tot).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </span>
    </Link>
  )
}

export function VandaagOverzicht({ dossiers, offertes }) {
  const overzicht = bouwVandaagOverzicht({ dossiers, offertes })
  const isOfferteCategorie = (key) => key === 'offertesOpTeVolgen' || key === 'offertesVerlopen'
  const nietsTeMelden = CATEGORIE_VOLGORDE.every((key) => overzicht[key].length === 0)

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Vandaag</p>
      <h2 className="mb-1 text-xl text-primary">Vandaag voor SMV</h2>
      <p className="mb-4 text-xs text-foreground-muted">
        Feitelijk overzicht op basis van bestaande statussen en datums — geen score, geen voorspelling.
      </p>

      {nietsTeMelden ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
          Niets dat vandaag aandacht vraagt.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {CATEGORIE_VOLGORDE.map((key) => {
            const items = overzicht[key]
            if (items.length === 0) return null
            const { label, toelichting } = VANDAAG_CATEGORIE_INFO[key]
            return (
              <div key={key}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold text-primary">
                    {label} <span className="font-mono text-xs font-normal text-foreground-muted">({items.length})</span>
                  </h3>
                </div>
                <p className="mb-2 text-xs text-foreground-muted">{toelichting}</p>
                <div className="flex flex-col gap-1.5">
                  {items.map((item) =>
                    isOfferteCategorie(key) ? <OfferteRegel key={item.id} offerte={item} /> : <DossierRegel key={item.dossier_id} dossier={item} />,
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
