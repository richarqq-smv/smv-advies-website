import { useContext } from 'react'
import { AuthContext } from './context.js'

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth() moet binnen een <AuthProvider> gebruikt worden.')
  }
  return context
}
