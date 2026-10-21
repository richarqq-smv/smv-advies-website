import { Lightning, Phone } from '@phosphor-icons/react'
import { COMPANY } from '../../data/company'
import { ROUTES } from '../../lib/routes'
import { Button } from '../ui/Button'
import { trackEvent } from '../../lib/analytics'

/**
 * Mobile/tablet-only sticky action bar (quick access to the indicatietool
 * and calling). Hidden on desktop where the header CTA is always visible.
 */
export function StickyMobileActions() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex gap-3 bg-background p-3 shadow-[0_-8px_24px_-12px_rgb(22_41_58/0.25)] min-[1440px]:hidden"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <Button
        to={ROUTES.energieIndicatie}
        variant="primary"
        className="flex-1"
        onClick={() => trackEvent('cta_click', { cta: 'energie_indicatie', location: 'sticky_mobile' })}
      >
        <Lightning size={18} weight="bold" />
        Indicatie
      </Button>
      <Button href={COMPANY.phoneHref} variant="outline" className="flex-1">
        <Phone size={18} weight="bold" />
        Bellen
      </Button>
    </div>
  )
}
