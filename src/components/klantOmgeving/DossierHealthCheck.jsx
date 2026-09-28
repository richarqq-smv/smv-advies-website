import { CheckCircle, WarningCircle, XCircle } from '@phosphor-icons/react'
import { HEALTH_STATUS, HEALTH_CATEGORIE_LABELS } from '../../lib/klantOmgeving/dossierHealthCheck'

/**
 * Zichtbare weergave van bouwDossierHealthCheck() (werkfase Fase 6). Puur
 * presentatie — alle logica zit in lib/klantOmgeving/dossierHealthCheck.js
 * (getest). Toont uitsluitend de drie feitelijke statussen + de reden
 * erachter, nooit een score of percentage (zie moduledoc daar).
 */
const STATUS_ICOON = {
  [HEALTH_STATUS.GEREED]: <CheckCircle size={16} weight="fill" className="text-primary" />,
  [HEALTH_STATUS.AANDACHT]: <WarningCircle size={16} weight="fill" className="text-accent" />,
  [HEALTH_STATUS.ONTBREEKT]: <XCircle size={16} weight="fill" className="text-error" />,
}

const STATUS_CLASSES = {
  [HEALTH_STATUS.GEREED]: 'border-border bg-white',
  [HEALTH_STATUS.AANDACHT]: 'border-accent/30 bg-accent/5',
  [HEALTH_STATUS.ONTBREEKT]: 'border-error/30 bg-error-bg',
}

const CATEGORIE_VOLGORDE = ['klant', 'pand', 'energie', 'mjop', 'advies', 'offerte']

export function DossierHealthCheck({ healthCheck, className = '' }) {
  const { categorieen, algemeen } = healthCheck

  return (
    <div className={`rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Health Check</p>
          <h3 className="text-xl text-primary">Is dit dossier klaar voor advies?</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          {STATUS_ICOON[algemeen]}
          {algemeen === HEALTH_STATUS.GEREED ? 'Compleet' : algemeen === HEALTH_STATUS.AANDACHT ? 'Aandachtspunten' : 'Ontbrekende informatie'}
        </span>
      </div>
      <p className="mb-4 -mt-2 text-xs text-foreground-muted">
        Feitelijke checklist — of de benodigde informatie aanwezig is, geen oordeel over de inhoud van het advies zelf.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {CATEGORIE_VOLGORDE.map((key) => {
          const categorie = categorieen[key]
          return (
            <li key={key} className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${STATUS_CLASSES[categorie.status]}`}>
              <span className="mt-0.5 shrink-0">{STATUS_ICOON[categorie.status]}</span>
              <span>
                <span className="font-medium text-primary">{HEALTH_CATEGORIE_LABELS[key]}</span>
                <br />
                <span className="text-foreground-muted">{categorie.reden}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
