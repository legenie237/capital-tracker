-- Capital Tracker : stockage privé des captures d'écran des trades
-- Chaque trader ne peut lire, ajouter et supprimer que les fichiers de son propre dossier ({son id}/...).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('captures', 'captures', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "captures lisibles par leur propriétaire" on storage.objects;
create policy "captures lisibles par leur propriétaire"
  on storage.objects for select to authenticated
  using (bucket_id = 'captures' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "captures ajoutées par leur propriétaire" on storage.objects;
create policy "captures ajoutées par leur propriétaire"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'captures' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "captures supprimées par leur propriétaire" on storage.objects;
create policy "captures supprimées par leur propriétaire"
  on storage.objects for delete to authenticated
  using (bucket_id = 'captures' and (storage.foldername(name))[1] = auth.uid()::text);
