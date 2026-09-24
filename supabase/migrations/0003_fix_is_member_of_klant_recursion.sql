-- KRITIEKE FIX, gevonden tijdens echte A/B-databasetests (niet in de
-- eerdere adversariële review gevonden, omdat die geen live databases-
-- operaties tegen een draaiend project kon uitvoeren):
--
-- is_member_of_klant() was SECURITY INVOKER en las public.contactpersonen.
-- De SELECT-policy op contactpersonen roept op zijn beurt weer
-- is_member_of_klant() aan → oneindige recursie ("stack depth limit
-- exceeded") zodra een ECHTE authenticated gebruiker (dus niet via een
-- SECURITY DEFINER RPC zoals registreer_klant/maak_pand_en_koppel, die
-- toevallig als tabel-eigenaar draaien en zo RLS internally omzeilden)
-- een dossier/adviespunt/pand/klant_pand_relatie/contactpersoon aanraakt.
-- Dit trof vrijwel de hele datalaag buiten de twee atomaire RPC's.
--
-- Fix: net als is_admin() wordt deze functie SECURITY DEFINER, zodat de
-- interne SELECT op contactpersonen RLS niet opnieuw triggert. De
-- functie geeft nog steeds uitsluitend een boolean terug over of de
-- AANROEPER (auth.uid()) aan de meegegeven klant_id gekoppeld is — geen
-- enkele andere data wordt blootgesteld, dus dit is een veilige,
-- noodzakelijke aanpassing van hetzelfde patroon dat is_admin() al had.
create or replace function public.is_member_of_klant(target_klant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.contactpersonen
    where klant_id = target_klant_id and account_id = auth.uid()
  );
$$;
revoke all on function public.is_member_of_klant(uuid) from public, anon;
grant execute on function public.is_member_of_klant(uuid) to authenticated;
