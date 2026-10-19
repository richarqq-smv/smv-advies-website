-- Fase 5 (projectplan "Klantwaarde-uitbreidingen", #8): loyaliteitskorting
-- na 1 jaar. Zelfde maandelijkse pg_cron/pg_net-architectuur als Fase 4
-- (0053_jaarrapportage.sql) — hier toegepast op afgeronde dossiers i.p.v.
-- open dossiers, en met een eenmalig in plaats van jaarlijks terugkerend
-- verzendmoment (vandaar loyaliteitskorting_verzonden_op i.p.v. een
-- "ouder dan N maanden"-herhaling zoals bij de jaarrapportage).
--
-- afgerond_op legt vast WANNEER een dossier is afgerond — dat bestond tot
-- nu toe nergens (alleen de status zelf), en updated_at is daarvoor
-- onbetrouwbaar: dat verandert ook bij een latere, ongerelateerde
-- bewerking van het dossier. Bewust GEEN backfill voor al bestaande
-- afgeronde dossiers: zonder een betrouwbare historische afrondingsdatum
-- zou een gok hier een onverwachte stortvloed aan kortingsmails kunnen
-- veroorzaken zodra de cron voor het eerst draait. Een dossier dat al vóór
-- deze migratie was afgerond, krijgt dus pas een afgerond_op (en komt dus
-- pas na 12 maanden in aanmerking) vanaf de eerstvolgende keer dat het
-- via de bestaande heropenen/opnieuw-afronden-flow gaat, of nooit als dat
-- niet gebeurt — Richard kan zo'n klant desgewenst gewoon handmatig
-- benaderen.
alter table public.dossiers add column afgerond_op timestamptz;
alter table public.dossiers add column loyaliteitskorting_verzonden_op timestamptz;
comment on column public.dossiers.afgerond_op is 'Tijdstip waarop de status naar afgerond is gezet (Fase 5, #8) — betrouwbaarder dan updated_at, dat ook bij latere, ongerelateerde wijzigingen verandert. NULL voor dossiers afgerond vóór deze migratie (bewust geen gok-backfill).';
comment on column public.dossiers.loyaliteitskorting_verzonden_op is 'Tijdstip waarop de eenmalige loyaliteitskorting-mail is verstuurd (Fase 5, #8). NULL = nog nooit verstuurd; eenmalig, geen herhaling zoals bij laatste_jaarrapportage_op.';

-- mail_log (0052/0053) had nog geen 'loyaliteitskorting'-type.
alter table public.mail_log drop constraint mail_log_type_check;
alter table public.mail_log add constraint mail_log_type_check check (type in ('contact', 'energie-lead', 'energie-confirm', 'mjop', 'jaarrapportage', 'loyaliteitskorting'));

-- Maandelijkse trigger (2e van de maand, 05:00 UTC — weer een ander
-- moment dan de RVO-sync (03:00/1e) en de jaarrapportage (04:00/2e), zodat
-- niet alles tegelijk draait). Zelfde dryRun:true-veiligheidspatroon als
-- Fase 4: deze cron-job telt/logt wel, maar verstuurt nooit automatisch
-- een echte mail totdat dat expliciet, in een latere aparte stap, wordt
-- omgezet naar dryRun:false.
select cron.schedule(
  'loyaliteitskorting-maandelijkse-check',
  '0 5 2 * *',
  $$
  select net.http_post(
    url := 'https://cdthrbflmuqblydggszf.supabase.co/functions/v1/loyaliteitskorting-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdGhyYmZsbXVxYmx5ZGdnc3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzExMTcsImV4cCI6MjEwNTg0NzExN30.3YChfpHFdSU-WiEyEyfgscVhnz1_UhCHTQuUj7gGahU',
      'Content-Type', 'application/json'
    ),
    body := '{"dryRun": true}'::jsonb
  );
  $$
);
