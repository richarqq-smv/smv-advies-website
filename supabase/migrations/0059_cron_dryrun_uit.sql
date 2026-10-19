-- Expliciete GO van Richard (2026-10-19, na de correctieronde): de
-- maandelijkse jaarrapportage-/loyaliteitskorting-cron mag nu echt gaan
-- versturen. Enige wijziging t.o.v. 0057_cron_shared_secret.sql: de
-- request-body gaat van {"dryRun": true} naar {"dryRun": false} — de
-- X-Cron-Secret-header (uit Vault) en de rest van de planning
-- (2e van de maand, 04:00/05:00 UTC) blijven ongewijzigd.
--
-- Vanaf hier verstuurt de EERSTVOLGENDE geplande cron-aanroep (niet deze
-- migratie zelf — er wordt hier niets handmatig getriggerd) echte mail
-- naar elk dossier dat op dat moment aan de drempel voldoet. Terugdraaien
-- kan altijd met een nieuwe migratie die de body weer op dryRun:true zet.
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
    body := '{"dryRun": false}'::jsonb
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
    body := '{"dryRun": false}'::jsonb
  );
  $$
);
