import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { AuthContext } from './context.js'

/**
 * Enige bron van waarheid voor de auth-status in de React-boom. Leest de
 * echte Supabase-sessie (nooit een zelfgemaakte "loggedIn"-vlag) en houdt
 * die synchroon via Supabase's eigen auth-state-listener — dat dekt
 * inloggen, uitloggen, tokenvernieuwing én sessieherstel na een refresh
 * in één mechanisme.
 *
 * `session` is `undefined` zolang de eerste check nog loopt (voorkomt een
 * korte "niet ingelogd"-flits vóór de echte status bekend is), en `null`
 * zodra bevestigd is dat er geen sessie is. Zie lib/auth/useAuth.js voor
 * de hook die dit leest.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    laden: session === undefined,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
