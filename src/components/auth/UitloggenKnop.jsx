import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabaseClient'
import { ROUTES } from '../../lib/routes'

/**
 * Enige plek in de UI waar een sessie wordt beëindigd — ontbrak tot nu toe
 * volledig (geen enkele pagina had een uitlogactie). Roept uitsluitend
 * Supabase's eigen `signOut()` aan; de auth-state-listener in
 * AuthProvider.jsx merkt dat vanzelf op (zelfde mechanisme als
 * inloggen/sessieherstel), dus hier is verder geen eigen statusbeheer
 * nodig.
 */
export function UitloggenKnop({ className }) {
  const navigate = useNavigate()
  const [bezig, setBezig] = useState(false)

  async function uitloggen() {
    setBezig(true)
    await supabase.auth.signOut()
    navigate(ROUTES.home)
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={uitloggen} disabled={bezig} className={className}>
      {bezig ? 'Bezig...' : 'Uitloggen'}
    </Button>
  )
}
