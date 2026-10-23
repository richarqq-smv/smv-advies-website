import { Check } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { cn } from '../../lib/cn'
import { ROUTES } from '../../lib/routes'

/**
 * Anti-slop-ronde (2026-10-21, taste-skill inspect): geen 1px-omlijnde
 * kaarten met schaduw, pill-badge en kleine hoofdletterlabels meer. Elke
 * kaart is nu een vlak in een eigen toon (muted; het aanbevolen pakket
 * navy), de pakketnaam is de kop, de mindset ("Oriënteren", …) staat er in
 * gewone zinsopbouw naast, en "Aanbevolen" is gewone tekst in de kaart i.p.v.
 * een badge erboven. Alle data (prijzen, features, scope, CTA's) is
 * ongewijzigd.
 */
export function PricingCard({ pkg, delay = 0 }) {
  const featured = pkg.featured

  return (
    <Reveal
      as="article"
      delay={delay}
      className={cn(
        'flex h-full flex-col rounded-xl p-8',
        featured ? 'bg-primary text-white' : 'bg-muted',
      )}
    >
      <h3 className={cn('text-3xl', featured ? 'text-white' : 'text-primary')}>{pkg.name}</h3>
      <p className={cn('mt-1 text-base', featured ? 'text-white/80' : 'text-foreground-muted')}>
        {pkg.badge ? <strong className="font-semibold text-accent-light">{pkg.badge}. </strong> : null}
        {pkg.mindset ? `${pkg.mindset}: ` : null}
        {pkg.subtitle}
      </p>

      <p className={cn('mt-6 text-4xl tabular-nums', featured ? 'text-white' : 'text-primary')}>{pkg.priceDisplay}</p>
      <p className={cn('mt-1 text-sm', featured ? 'text-white/80' : 'text-foreground-muted')}>
        {pkg.priceNote}
      </p>

      {pkg.tagline ? (
        <p className={cn('mt-6 text-lg font-medium', featured ? 'text-white' : 'text-primary')}>{pkg.tagline}</p>
      ) : null}

      <p className={cn('mt-2 text-base leading-relaxed', featured ? 'text-white/90' : 'text-foreground')}>
        {pkg.description}
      </p>

      <ul className="mt-6 flex-1 space-y-3">
        {pkg.features.map((feature) => (
          <li key={feature} className={cn('flex items-start gap-2.5 text-base', featured ? 'text-white' : 'text-foreground')}>
            <Check
              size={16}
              weight="bold"
              aria-hidden="true"
              className={cn('mt-1 shrink-0', featured ? 'text-accent-light' : 'text-accent')}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {pkg.scopeNote ? (
        <p className={cn('mt-5 text-sm', featured ? 'text-white/80' : 'text-foreground-muted')}>{pkg.scopeNote}</p>
      ) : null}

      <Button to={pkg.ctaTo} variant={pkg.featured ? 'primary' : 'outline'} className="mt-8 w-full">
        {pkg.cta}
      </Button>
      {/*
        Secundaire actie (Meer-informatie-ronde, 2026-10-07) — springt naar
        de uitgebreide uitleg van dit pakket op /pakketten. Werkt zowel hier
        als op de homepage (zie PricingSection.jsx): het pad is altijd
        /pakketten#pakket-{id}, nooit een lokale anchor op de huidige pagina.
      */}
      <Button to={ROUTES.pakketAnchor(pkg.id)} variant="ghost" size="sm" className={cn('mt-2 w-full', featured && 'text-white hover:bg-white/10')}>
        Meer over {pkg.name}
      </Button>
    </Reveal>
  )
}
