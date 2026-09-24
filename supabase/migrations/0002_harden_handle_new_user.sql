-- Gevonden door Supabase's eigen security-advisor (get_advisors) direct
-- na het toepassen van 0001_init.sql: handle_new_user() is een
-- SECURITY DEFINER trigger-functie die per ongeluk publiek aanroepbaar
-- was via /rest/v1/rpc/handle_new_user (anon EN authenticated), terwijl
-- elke andere SECURITY DEFINER-functie in 0001_init.sql wél een
-- expliciete revoke had. Dit is de ontbrekende revoke — triggers vuren
-- via de databasemotor, niet via een EXECUTE-aanroep, dus dit heeft geen
-- effect op de on_auth_user_created-trigger zelf.
revoke all on function public.handle_new_user() from public, anon, authenticated;
