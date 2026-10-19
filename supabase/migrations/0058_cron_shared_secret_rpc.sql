-- Correctieronde (2026-10-19, vervolg op 0057_cron_shared_secret.sql):
-- 0057 liet de cron-jobs zelf (uitgevoerd als de scheduling-rol, met
-- rechtstreekse SQL-toegang) de X-Cron-Secret-waarde uit
-- vault.decrypted_secrets lezen. De Edge Functions zelf (jaarrapportage-
-- sync/loyaliteitskorting-sync) kunnen dat niet op dezelfde manier: hun
-- supabase-js service-role-client loopt via PostgREST, en het `vault`-
-- schema is daar bewust niet in geëxposeerd (en dat moet ook niet worden).
--
-- Bewust GEEN losse Edge Function-secret als tweede opslagplek voor
-- hetzelfde geheim: dat zou vereisen dat iemand dezelfde, willekeurig
-- gegenereerde waarde handmatig op twee plekken identiek invoert — foutg-
-- evoelig, en voor deze (niet-technische) klant onnodig. In plaats daarvan
-- deze smalle, service-role-only RPC: één bron van waarheid (Vault), door
-- zowel de cron-SQL (0057) als de Edge Functions (via supabase.rpc())
-- geraadpleegd. `security definer` zodat de functie zelf (als eigenaar
-- met vault-toegang) de vertaalslag maakt — de aanroeper (service_role)
-- hoeft zelf geen rechtstreekse vault-toegang te hebben.
create or replace function public.get_cron_shared_secret()
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret' limit 1;
$$;

-- Uitsluitend service_role mag dit aanroepen — nooit anon/authenticated,
-- dit geeft letterlijk het interne cron-geheim terug.
revoke all on function public.get_cron_shared_secret() from public, anon, authenticated;
grant execute on function public.get_cron_shared_secret() to service_role;
