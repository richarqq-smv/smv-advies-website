import { useEffect, useRef } from 'react'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
// Publieke site-key van Cloudflare Turnstile (ronde 2026-10-17) — deze mag
// gewoon in de clientbundel staan, dat is hoe Turnstile is ontworpen (zelfde
// soort "openbare sleutel" als de Supabase anon-key). De bijbehorende
// SECRET-sleutel staat uitsluitend als Edge Function secret
// (TURNSTILE_SECRET_KEY, zie supabase/functions/send-email/index.ts),
// nooit hier.
const SITE_KEY = '0x4AAAAAAFZZ4WQ3p1dU3n1j'

let scriptPromise = null
function laadTurnstileScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Geen browseromgeving'))
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Kon verificatie niet laden.'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

/**
 * Cloudflare Turnstile-widget (ronde 2026-10-17) — vóór het versturen van
 * contact-/energie-indicatie-/MJOP-mail, zodat de send-email Edge Function
 * niet langer door een simpel script te flooden is (zie het commentaar bij
 * verifyTurnstile() in die functie). `onToken` krijgt het token zodra de
 * check slaagt, `null` bij verlopen/fout.
 *
 * `onToken`/`onExpire` worden bewust via een ref bijgehouden i.p.v. in de
 * effect-dependency-array: anders zou elke re-render van de ouder (bijv.
 * een toetsaanslag in een ander formulierveld) de widget afbreken en
 * opnieuw opbouwen, met een nieuwe, nog niet opgeloste verificatie tot
 * gevolg. De widget wordt dus maar één keer gerenderd per mount — voor een
 * nieuw token na een mislukte verzending geeft de ouder een nieuwe `key`
 * mee, zodat dit component volledig opnieuw mount (zie ContactForm.jsx/
 * StepContact.jsx/StepAdvies.jsx).
 */
export function TurnstileWidget({ onToken, onExpire }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const onTokenRef = useRef(onToken)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    let actief = true
    laadTurnstileScript()
      .then(() => {
        if (!actief || !containerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => {
            onTokenRef.current(null)
            onExpireRef.current?.()
          },
          'error-callback': () => {
            onTokenRef.current(null)
          },
        })
      })
      .catch(() => {
        // Script kon niet laden (bijv. geblokkeerd door een ad-/trackingblocker)
        // — onToken blijft null, de verstuurknop blijft dan uitgeschakeld.
        // Geen crash, geen onbruikbaar formulier.
      })

    return () => {
      actief = false
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // Widget was al verdwenen (bijv. script nooit geladen) — negeren.
        }
      }
    }
  }, [])

  return <div ref={containerRef} />
}
