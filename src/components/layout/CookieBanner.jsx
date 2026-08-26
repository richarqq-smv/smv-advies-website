import { useEffect, useState } from 'react'
import { ROUTES } from '../../lib/routes'
import { loadAnalytics } from '../../lib/analytics'
import { getStoredConsent, storeConsent } from '../../lib/consent'
import { Button } from '../ui/Button'

/**
 * Cookie-consent banner. Functional cookies (the site itself, the energy
 * scan) always run — no consent needed for those, per the Privacyverklaring.
 * Analytics only loads after explicit "Accepteren". Declining, or leaving
 * the choice unmade, means analytics never loads at all.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(() => getStoredConsent() === null)

  useEffect(() => {
    if (getStoredConsent() === 'accepted') {
      loadAnalytics()
    }
  }, [])

  function handleAccept() {
    storeConsent('accepted')
    loadAnalytics()
    setVisible(false)
  }

  function handleDecline() {
    storeConsent('declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Cookiemelding"
      className="fixed inset-x-0 top-16 z-[80] border-b border-border bg-background shadow-md lg:top-[72px]"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm leading-relaxed text-foreground-muted">
          Deze website gebruikt functionele cookies (altijd actief) en, alleen met uw toestemming, analytische
          cookies om het gebruik van de website te begrijpen. Lees meer in onze{' '}
          <a href={ROUTES.privacy} className="text-primary underline hover:text-secondary">
            privacyverklaring
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2.5">
          <Button variant="ghost" size="sm" onClick={handleDecline}>
            Weigeren
          </Button>
          <Button variant="primary" size="sm" onClick={handleAccept}>
            Accepteren
          </Button>
        </div>
      </div>
    </div>
  )
}
