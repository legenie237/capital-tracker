-- Capital Tracker : droits d'accès explicites pour l'API Supabase
-- Les nouveaux projets Supabase n'exposent plus automatiquement les tables :
-- sans ces droits, le site ne peut pas lire le profil ni les trades.
-- La sécurité ligne par ligne (RLS) reste active : chacun ne voit que ses données.

grant usage on schema public to anon, authenticated;

grant select on public.profiles to authenticated;
-- (la modification reste limitée aux colonnes autorisées dans 0001)

grant select, insert, update, delete on public.trades to authenticated;
