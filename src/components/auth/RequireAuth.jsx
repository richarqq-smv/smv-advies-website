import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth/useAuth'
import { ROUTES } from '../../lib/routes'

/**
 * Routebeveiliging is UX, geen beveiligingsgrens (die is RLS in de
 * database, zie SECURITY_MODEL.md) — dit voorkomt alleen dat een
 * niet-ingelogde bezoeker een lege/foutieve klantpagina te zien krijgt,
 * en stuurt in plaats daarvan naar /inloggen door.
 *
 * `state.van` (pad + querystring, dus bijv. ook ?dossierId=...) gaat mee
 * naar Inloggen.jsx, dat na een geslaagde login al terugnavigeert naar
 * `location.state?.van` — die kant bestond al, hier wordt 'm alleen
 * daadwerkelijk gevuld in plaats van altijd naar de homepage terug te
 * vallen.
 */
export function RequireAuth() {
  const { laden, user } = useAuth()
  const location = useLocation()

  if (laden) return null
  if (!user) return <Navigate to={ROUTES.inloggen} replace state={{ van: location.pathname + location.search }} />
  return <Outlet />
}
