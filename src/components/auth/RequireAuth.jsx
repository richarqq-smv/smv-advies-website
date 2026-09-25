import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth/useAuth'
import { ROUTES } from '../../lib/routes'
import { BeveiligdePaginaSeo } from './BeveiligdePaginaSeo'

/**
 * Routebeveiliging is UX, geen beveiligingsgrens (die is RLS in de
 * database, zie SECURITY_MODEL.md) — dit voorkomt alleen dat een
 * niet-ingelogde bezoeker een lege/foutieve klantpagina te zien krijgt,
 * en stuurt in plaats daarvan naar /inloggen door.
 */
export function RequireAuth() {
  const { laden, user } = useAuth()

  if (laden) return <BeveiligdePaginaSeo />
  if (!user) return <Navigate to={ROUTES.inloggen} replace />
  return <Outlet />
}
