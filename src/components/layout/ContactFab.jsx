import { useEffect, useState } from 'react'
import { ChatCircleText, EnvelopeSimple, Phone, X } from '@phosphor-icons/react'
import { COMPANY } from '../../data/company'
import { cn } from '../../lib/cn'
import { getStoredConsent, COOKIE_BANNER_VISIBILITY_EVENT } from '../../lib/consent'

const ACTIONS = [
  // Onder 1440px toont StickyMobileActions al een "Bellen"-knop — deze pil
  // blijft daar verborgen zodat er nooit twee bel-affordances tegelijk
  // zichtbaar zijn; vanaf 1440px (waar de sticky balk verdwijnt) komt hij terug.
  { label: 'Bellen', href: COMPANY.phoneHref, icon: Phone, mobileHidden: true },
  { label: 'E-mail', href: `mailto:${COMPANY.email}`, icon: EnvelopeSimple },
]

/**
 * Floating expandable contact button (desktop + mobile). Kept from the
 * previous site's UX because it tested well as a low-friction contact path.
 */
export function ContactFab() {
  const [open, setOpen] = useState(false)
  const [cookieBannerVisible, setCookieBannerVisible] = useState(() => getStoredConsent() === null)

  useEffect(() => {
    function handleVisibility(event) {
      setCookieBannerVisible(event.detail.visible)
    }
    window.addEventListener(COOKIE_BANNER_VISIBILITY_EVENT, handleVisibility)
    return () => window.removeEventListener(COOKIE_BANNER_VISIBILITY_EVENT, handleVisibility)
  }, [])

  // Cookiebanner heeft prioriteit: zolang de bezoeker nog geen keuze heeft
  // gemaakt, verbergt deze knop zich in plaats van ermee te concurreren.
  if (cookieBannerVisible) return null

  return (
    <div className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[90] flex flex-col items-end gap-3 min-[1440px]:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div
        inert={!open}
        className={cn(
          'flex flex-col items-end gap-2 transition-[opacity,transform] duration-200 ease-default',
          open ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        {ACTIONS.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className={cn(
              'flex items-center gap-2 rounded-full bg-background py-2 pr-4 pl-3 text-sm font-medium text-primary shadow-lg hover:bg-muted',
              action.mobileHidden && 'hidden min-[1440px]:flex',
            )}
          >
            <action.icon size={18} weight="bold" className="text-accent" />
            {action.label}
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Contactopties sluiten' : 'Contactopties openen'}
        aria-expanded={open}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-primary shadow-lg transition-transform duration-200 ease-default hover:scale-105"
      >
        {open ? <X size={20} /> : <ChatCircleText size={20} weight="bold" />}
      </button>
    </div>
  )
}
