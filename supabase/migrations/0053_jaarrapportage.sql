-- Fase 4 (projectplan "Klantwaarde-uitbreidingen", #6): jaarlijkse
-- automatische voortgangsrapportage. Zelfde pg_cron/pg_net-architectuur
-- als de al-werkende maandelijkse RVO-sync (0036_rvo_subsidie_index.sql):
-- de database roept zelf de Edge Function aan, geen externe scheduler
-- nodig.
--
-- laatste_jaarrapportage_op is het dubbel-verzend-beschermingsveld: zodra
-- een dossier een rapportage heeft ontvangen, wordt dit bijgewerkt naar nu
-- — waardoor dat dossier de eerstvolgende 11 maanden wordt overgeslagen
-- door de maandelijkse check. Alleen de jaarrapportage-sync Edge Function
-- (service_role, omzeilt RLS) schrijft dit veld, dus er is bewust geen
-- aparte RPC/policy voor nodig.
alter table public.dossiers add column laatste_jaarrapportage_op timestamptz;
comment on column public.dossiers.laatste_jaarrapportage_op is 'Tijdstip van de laatst verstuurde jaarlijkse voortgangsrapportage-mail (Fase 4, #6). NULL = nog nooit verstuurd. Uitsluitend bijgewerkt door de jaarrapportage-sync Edge Function (service_role).';

-- mail_log (0052_mail_log.sql) had nog geen 'jaarrapportage'-type in de
-- check-constraint — zonder deze aanpassing zou elke logpoging van de
-- nieuwe Edge Function falen.
alter table public.mail_log drop constraint mail_log_type_check;
alter table public.mail_log add constraint mail_log_type_check check (type in ('contact', 'energie-lead', 'energie-confirm', 'mjop', 'jaarrapportage'));

-- Maandelijkse trigger (2e van de maand, 04:00 UTC — een ander moment dan
-- de RVO-sync om 03:00 op de 1e, zodat niet alles tegelijk draait).
--
-- BEWUST dryRun:true in de body: het projectplan eist expliciet "eerst
-- een niet-destructieve droogloop (tellen/loggen zonder echt te
-- versturen) voordat de functie live en gekoppeld aan de cron gaat". Met
-- dryRun:true telt/logt de Edge Function de kandidaat-dossiers wel, maar
-- verstuurt nooit een echte mail en werkt laatste_jaarrapportage_op nooit
-- bij. Deze cron-job mag dus zonder risico actief zijn; het omzetten naar
-- dryRun:false (echt gaan versturen) is een bewust aparte, latere stap —
-- pas na een handmatige controle van een droogloop-resultaat en
-- uitdrukkelijke goedkeuring, nooit automatisch vanuit deze migratie.
select cron.schedule(
  'jaarrapportage-maandelijkse-check',
  '0 4 2 * *',
  $$
  select net.http_post(
    url := 'https://cdthrbflmuqblydggszf.supabase.co/functions/v1/jaarrapportage-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdGhyYmZsbXVxYmx5ZGdnc3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzExMTcsImV4cCI6MjEwNTg0NzExN30.3YChfpHFdSU-WiEyEyfgscVhnz1_UhCHTQuUj7gGahU',
      'Content-Type', 'application/json'
    ),
    body := '{"dryRun": true}'::jsonb
  );
  $$
);
