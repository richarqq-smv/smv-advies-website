import { Check } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Reveal } from '../ui/Reveal'
import { cn } from '../../lib/cn'

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

      <h3 className="text-xl font-semibold text-primary">{pkg.name}</h3>
      <p className="mt-1 text-sm text-foreground-muted">{pkg.subtitle}</p>

      <p className="mt-5 text-3xl text-primary">{pkg.price}</p>
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

      <Button to={pkg.ctaTo} variant={pkg.featured ? 'primary' : 'outline'} className="mt-8 w-full">
        {pkg.cta}
      </Button>
    </Reveal>
  )
}
