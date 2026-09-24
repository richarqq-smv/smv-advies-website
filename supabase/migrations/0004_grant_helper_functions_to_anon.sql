-- Gevonden tijdens de echte anonieme-toegangstest: anon had geen EXECUTE
-- op is_admin()/is_member_of_klant(), terwijl de RLS-policies op vrijwel
-- elke tabel deze functies aanroepen voor ALLE rollen (geen "to
-- authenticated" op de policies zelf). Resultaat: een anonieme request
-- kreeg een rauwe "permission denied for function"-fout in plaats van
-- een schone lege/geweigerde respons. Geen databeveiligingslek (anon
-- kon en kan nog steeds niets lezen/schrijven — auth.uid() is null voor
-- anon, dus beide functies geven gewoon false terug), maar wel een
-- onnodige interne-foutmelding naar een niet-geauthenticeerde client.
grant execute on function public.is_admin() to anon;
grant execute on function public.is_member_of_klant(uuid) to anon;
