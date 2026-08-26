import { Lightning, Phone } from '@phosphor-icons/react'
import { COMPANY } from '../../data/company'
import { ROUTES } from '../../lib/routes'
import { Button } from '../ui/Button'

/**
 * Mobile/tablet-only sticky action bar (quick access to the indicatietool
 * and calling). Hidden on desktop where the header CTA is always visible.
 */
export function StickyMobileActions() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-border bg-background/95 p-3 backdrop-blur-sm lg:hidden">
      <Button to={ROUTES.energieIndicatie} variant="primary" className="flex-1">
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
