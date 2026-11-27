-- Capital Tracker : coach IA
-- coach_usage : chaque appel au coach (sert à limiter l'usage par jour).
--   Pas de droit de suppression : on ne peut pas effacer son compteur.
-- coach_reviews : bilans générés, pour les relire plus tard.
-- Ce script peut être exécuté plusieurs fois sans erreur.

create table if not exists public.coach_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('bilan', 'question')),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists coach_usage_user_created on public.coach_usage (user_id, created_at desc);

create table if not exists public.coach_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  content text not null check (char_length(content) <= 40000),
  created_at timestamptz not null default now()
);
create index if not exists coach_reviews_user_created on public.coach_reviews (user_id, created_at desc);

alter table public.coach_usage enable row level security;
alter table public.coach_reviews enable row level security;

drop policy if exists "coach_usage lecture" on public.coach_usage;
create policy "coach_usage lecture" on public.coach_usage
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "coach_usage ajout" on public.coach_usage;
create policy "coach_usage ajout" on public.coach_usage
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "coach_usage maj" on public.coach_usage;
create policy "coach_usage maj" on public.coach_usage
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "coach_reviews lecture" on public.coach_reviews;
create policy "coach_reviews lecture" on public.coach_reviews
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "coach_reviews ajout" on public.coach_reviews;
create policy "coach_reviews ajout" on public.coach_reviews
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "coach_reviews suppression" on public.coach_reviews;
create policy "coach_reviews suppression" on public.coach_reviews
  for delete to authenticated using (user_id = auth.uid());

grant select, insert on public.coach_usage to authenticated;
-- seuls les compteurs de jetons peuvent être mis à jour
grant update (input_tokens, output_tokens) on public.coach_usage to authenticated;
grant select, insert, delete on public.coach_reviews to authenticated;
