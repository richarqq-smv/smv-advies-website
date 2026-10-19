-- Correctieronde (2026-10-19, interne security-review na oplevering van
-- het projectplan "Klantwaarde-uitbreidingen"): de cron-aanroepen naar
-- jaarrapportage-sync/loyaliteitskorting-sync droegen tot nu toe alleen
-- de PUBLIEKE anon-key mee als Authorization-header. Omdat verify_jwt:true
-- alleen bewijst dat de aanroeper ÉÉN of ander geldig Supabase-JWT heeft
-- (en de anon-key is er zo een, letterlijk aanwezig in elke browserbundel),
-- kon IEDEREEN met die publieke sleutel deze batchfuncties met
-- dryRun:false aanroepen en écht mail laten versturen naar alle klanten,
-- en zelfs in droogloop al klant-e-mailadressen/dossiernummers uitlezen.
-- Zie jaarrapportage-sync/index.ts en loyaliteitskorting-sync/index.ts
-- voor de volledige toelichting op de nieuwe, verplichte
-- X-Cron-Secret-controle die deze migratie voedt.
--
-- BELANGRIJK — GEEN GEHEIM IN DEZE MIGRATIE OF IN GIT: de waarde van de
-- header komt uit Supabase Vault via een subquery, nooit als letterlijke
-- tekst. Deze migratie verwacht dat er al een vault-secret met de naam
-- 'cron_shared_secret' bestaat — dat is een APARTE, eenmalige actie,
-- rechtstreeks tegen productie uitgevoerd (nooit in een migratiebestand,
-- want dat zou de waarde alsnog naar git schrijven), bijvoorbeeld:
--   select vault.create_secret('<een lange, willekeurige waarde>', 'cron_shared_secret');
-- Dezelfde waarde moet daarna ook als Edge Function-secret
-- CRON_SHARED_SECRET op beide functies worden gezet (ook dat is geen
-- migratie-actie). Ontbreekt de vault-secret op het moment dat de
-- cron-job vuurt, dan geeft de subquery hieronder simpelweg NULL/leeg
-- terug — de Edge Function is fail-closed gebouwd (weigert zonder een
-- geldige/overeenkomende secret), dus dat is veilig "nog niet werkend",
-- nooit "onveilig open".
--
-- Bestaande maandelijkse planning (2e van de maand, 04:00/05:00 UTC) en
-- de dryRun:true-body blijven ongewijzigd — alleen de headers worden
-- aangevuld.
select cron.unschedule('jaarrapportage-maandelijkse-check');
select cron.schedule(
  'jaarrapportage-maandelijkse-check',
  '0 4 2 * *',
  $$
  select net.http_post(
    url := 'https://cdthrbflmuqblydggszf.supabase.co/functions/v1/jaarrapportage-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdGhyYmZsbXVxYmx5ZGdnc3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzExMTcsImV4cCI6MjEwNTg0NzExN30.3YChfpHFdSU-WiEyEyfgscVhnz1_UhCHTQuUj7gGahU',
      'Content-Type', 'application/json',
      'X-Cron-Secret', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret' limit 1), '')
    ),
    body := '{"dryRun": true}'::jsonb
  );
  $$
);

select cron.unschedule('loyaliteitskorting-maandelijkse-check');
select cron.schedule(
  'loyaliteitskorting-maandelijkse-check',
  '0 5 2 * *',
  $$
  select net.http_post(
    url := 'https://cdthrbflmuqblydggszf.supabase.co/functions/v1/loyaliteitskorting-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdGhyYmZsbXVxYmx5ZGdnc3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzExMTcsImV4cCI6MjEwNTg0NzExN30.3YChfpHFdSU-WiEyEyfgscVhnz1_UhCHTQuUj7gGahU',
      'Content-Type', 'application/json',
      'X-Cron-Secret', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'cron_shared_secret' limit 1), '')
    ),
    body := '{"dryRun": true}'::jsonb
  );
  $$
);
