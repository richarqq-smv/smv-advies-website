import { CheckCircle, WarningCircle, XCircle, ArrowRight } from '@phosphor-icons/react'
import { HEALTH_STATUS, HEALTH_CATEGORIE_LABELS, bouwWorkflowStappen } from '../../lib/klantOmgeving/dossierHealthCheck'
import { Button } from '../ui/Button'

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

const CATEGORIE_VOLGORDE = ['klant', 'pand', 'opname', 'mjop', 'energie', 'subsidies', 'advies', 'offerte']

// Numerieke stepper (opdracht "UX-herontwerp" 2026-10-08): 1. Gegevens t/m
// laatste stap, in de herkenbare adviesworkflow-volgorde — zie
// bouwWorkflowStappen() in dossierHealthCheck.js, die "Rapport"/"Afronden"
// bewust nooit een verzonnen gereed/ontbreekt-status geeft (geen
// opgeslagen "rapport klaar"-vlag bestaat), hier weergegeven als een
// neutrale pijl-stap in plaats van een vinkje/kruisje.
const STAP_LABELS = { gegevens: 'Gegevens', opname: 'Opname', mjop: 'MJOP', energie: 'Energie', subsidies: 'Subsidies', advies: 'Advies', rapport: 'Rapport', afronden: 'Afronden' }

function StapIcoon({ status }) {
  if (status == null) return <ArrowRight size={16} className="text-foreground-muted" />
  return STATUS_ICOON[status]
}

function Werkvolgorde({ categorieen, dossierStatus }) {
  const stappen = bouwWorkflowStappen({ categorieen, dossierStatus })
  return (
    <ol className="mb-6 flex flex-col gap-2">
      {stappen.map((stap, i) => (
        <li
          key={stap.key}
          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
            stap.status == null ? 'border-border bg-white' : STATUS_CLASSES[stap.status]
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-primary">{i + 1}</span>
          <span className="flex-1 font-medium text-primary">{STAP_LABELS[stap.key] ?? stap.label}</span>
          <StapIcoon status={stap.status} />
          {stap.actie ? (
            <Button {...(stap.actie.href ? { href: stap.actie.href } : { to: stap.actie.to })} variant="ghost" size="sm">
              {stap.actie.label}
            </Button>
          ) : null}
        </li>
      ))}
    </ol>
  )
}

export function DossierHealthCheck({ healthCheck, dossierStatus = 'open', className = '' }) {
  const { categorieen, algemeen } = healthCheck

  return (
    <div className={`rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Werkvolgorde</p>
          <h3 className="text-xl text-primary">Voortgang van dit dossier</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          {STATUS_ICOON[algemeen]}
          {algemeen === HEALTH_STATUS.GEREED ? 'Compleet' : algemeen === HEALTH_STATUS.AANDACHT ? 'Aandachtspunten' : 'Ontbrekende informatie'}
        </span>
      </div>

      <Werkvolgorde categorieen={categorieen} dossierStatus={dossierStatus} />

      <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Details per onderdeel</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {CATEGORIE_VOLGORDE.filter((key) => categorieen[key]).map((key) => {
          const categorie = categorieen[key]
          return (
            <li key={key} className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${STATUS_CLASSES[categorie.status]}`}>
              <span className="mt-0.5 shrink-0">{STATUS_ICOON[categorie.status]}</span>
              <span className="flex-1">
                <span className="font-medium text-primary">{HEALTH_CATEGORIE_LABELS[key]}</span>
                <br />
                <span className="text-foreground-muted">{categorie.reden}</span>
                {categorie.actie ? (
                  <span className="mt-2 block">
                    <Button {...(categorie.actie.href ? { href: categorie.actie.href } : { to: categorie.actie.to })} variant="outline" size="sm">
                      {categorie.actie.label}
                    </Button>
                  </span>
                ) : null}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
