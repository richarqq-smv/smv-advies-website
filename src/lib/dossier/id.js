/**
 * UUID-generatie, zelfde patroon als de bestaande MJOP-tool
 * (zie src/lib/mjop/storage.js): crypto.randomUUID() met een fallback
 * voor omgevingen zonder Web Crypto API.
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}
