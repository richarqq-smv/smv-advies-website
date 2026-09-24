import { createContext } from 'react'

/**
 * Losstaand van AuthProvider.jsx/useAuth.js zodat elk van die bestanden
 * aan de react-refresh-eis kan voldoen (een bestand exporteert óf alleen
 * componenten, óf alleen niet-componenten — nooit een mix).
 */
export const AuthContext = createContext(undefined)
