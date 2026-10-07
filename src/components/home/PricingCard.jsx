import { Check } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Reveal } from '../ui/Reveal'
import { cn } from '../../lib/cn'
import { ROUTES } from '../../lib/routes'

export function PricingCard({ pkg, delay = 0 }) {
  return (
    <Reveal
      as="article"
      delay={delay}
      className={cn(
        'flex h-full flex-col rounded-xl border p-7',
        pkg.featured ? 'border-accent bg-white shadow-lg shadow-accent/10' : 'border-border bg-white',
      )}
    >
      {pkg.badge ? (
        <Badge className="mb-4 self-start">{pkg.badge}</Badge>
      ) : (
        <div className="mb-4 h-[26px]" aria-hidden="true" />
      )}

      {pkg.mindset ? (
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{pkg.mindset}</p>
      ) : null}
      <h3 className="mt-1 text-xl font-semibold text-primary">{pkg.name}</h3>
      {pkg.tagline ? <p className="mt-1 text-sm font-medium text-primary">{pkg.tagline}</p> : null}
      <p className="mt-1 text-sm text-foreground-muted">{pkg.subtitle}</p>

      <p className="mt-5 text-3xl text-primary">{pkg.priceDisplay}</p>
      <p className="text-xs text-foreground-muted">{pkg.priceNote}</p>

      <p className="mt-4 text-sm leading-relaxed text-foreground-muted">{pkg.description}</p>

      <ul className="mt-6 flex-1 space-y-3">
        {pkg.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-primary">
            <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-accent" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {pkg.scopeNote ? <p className="mt-4 text-xs text-foreground-muted">{pkg.scopeNote}</p> : null}

      <Button to={pkg.ctaTo} variant={pkg.featured ? 'primary' : 'outline'} className="mt-8 w-full">
        {pkg.cta}
      </Button>
      {/*
        Secundaire actie (Meer-informatie-ronde, 2026-10-07) — springt naar
        de uitgebreide uitleg van dit pakket op /pakketten. Werkt zowel hier
        als op de homepage (zie PricingSection.jsx): het pad is altijd
        /pakketten#pakket-{id}, nooit een lokale anchor op de huidige pagina.
      */}
      <Button to={ROUTES.pakketAnchor(pkg.id)} variant="ghost" size="sm" className="mt-2 w-full">
        Meer informatie
      </Button>
    </Reveal>
  )
}
