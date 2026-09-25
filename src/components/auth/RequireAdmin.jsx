import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth/useAuth'
import { checkIsAdmin } from '../../lib/klantOmgeving/api'
import { ROUTES } from '../../lib/routes'
import { BeveiligdePaginaSeo } from './BeveiligdePaginaSeo'

/**
 * Extra laag boven RequireAuth: vraagt is_admin() op (een SECURITY
 * DEFINER RPC die uitsluitend een boolean over de aanroeper teruggeeft,
 * zie 0001_init.sql). Ook dit is uitsluitend UX — een niet-admin die
 * deze check zou omzeilen, botst alsnog op RLS voor elke echte
 * lees/schrijfactie op /admin.
 */
export function RequireAdmin() {
  const { laden, user } = useAuth()
  const [status, setStatus] = useState('bezig') // 'bezig' | 'admin' | 'geen-admin'

  useEffect(() => {
    if (laden || !user) return
    let actief = true
    checkIsAdmin()
      .then((isAdmin) => {
        if (actief) setStatus(isAdmin ? 'admin' : 'geen-admin')
      })
      .catch(() => {
        if (actief) setStatus('geen-admin')
      })
    return () => {
      actief = false
    }
  }, [laden, user])

  if (laden) return <BeveiligdePaginaSeo />
  if (!user) return <Navigate to={ROUTES.inloggen} replace />
  if (status === 'bezig') return <BeveiligdePaginaSeo />
  if (status === 'geen-admin') return <Navigate to={ROUTES.account} replace />
  return <Outlet />
}
