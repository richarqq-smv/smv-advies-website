import { createClient } from '@supabase/supabase-js'

/**
 * Enige plek waar de Supabase-client wordt aangemaakt. Gebruikt
 * uitsluitend de publieke project-URL en de "anon" sleutel — beide
 * bedoeld om in de browserbundel te staan; RLS in de database
 * (supabase/migrations/0001_init.sql, SECURITY_MODEL.md) is de echte
 * beveiligingsgrens, niet het geheimhouden van deze twee waarden. De
 * `service_role`-sleutel hoort hier nooit, ook niet als fallback.
 *
 * Gooit bewust een duidelijke fout bij het ontbreken van de env-vars in
 * plaats van stil een niet-werkende client te maken — voorkomt dat een
 * ontbrekende configuratie pas laat, als een verwarrende netwerkfout,
 * aan het licht komt.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase is niet geconfigureerd: VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY ontbreken. Zie .env.example.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
