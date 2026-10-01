import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { ROUTES } from '../../lib/routes'

/**
 * Herbruikbare terugknop voor admin-subpagina's (responsiviteitsronde) —
 * zelfde visuele patroon als de al bestaande "← Administratie"-knoppen op
 * Omzet/Openstaand/Resultaat/Btw/Kosten/Instellingen, nu ook op de
 * pagina's die rechtstreeks vanuit het Admin Dashboard bereikbaar zijn
 * (Administratie/Offertes/Facturen/Planning/Kansen/Archief/Klanten &
 * dossiers) — daar ontbrak tot nu toe elke terugknop, de gebruiker moest
 * de (op mobiel verborgen) topnavigatie gebruiken. Standaard naar
 * ROUTES.admin ("Terug naar dashboard"); `to`/`label` overschrijfbaar voor
 * een logischer, contextueel doel waar dat van toepassing is.
 */
export function AdminTerugKnop({ to = ROUTES.admin, label = 'Terug naar dashboard', className = 'mb-5' }) {
  return (
    <Button as="link" to={to} variant="ghost" size="sm" className={className}>
      <ArrowLeft size={16} /> {label}
    </Button>
  )
}
