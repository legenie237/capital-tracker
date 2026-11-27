-- Capital Tracker : fondations (profils, trades, sécurité par utilisateur)
-- À exécuter dans Supabase > SQL Editor.

create extension if not exists citext;

-- ============ PROFILS ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext not null unique check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  full_name text,
  avatar_url text,
  trading_goals text,
  show_on_leaderboard boolean not null default false,
  -- Colonnes réservées au serveur / à l'admin (non modifiables par l'utilisateur)
  role text not null default 'member' check (role in ('member', 'admin')),
  subscription_status text not null default 'none' check (subscription_status in ('none', 'active', 'expired')),
  subscription_until timestamptz,
  referral_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  referred_by uuid references public.profiles (id) on delete set null,
  is_flagged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profil lisible par son propriétaire"
  on public.profiles for select using (auth.uid() = id);

create policy "profil modifiable par son propriétaire"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- L'utilisateur ne peut modifier que ces colonnes ; rôle, abonnement, parrainage restent verrouillés.
revoke update on public.profiles from authenticated, anon;
grant update (username, full_name, avatar_url, trading_goals, show_on_leaderboard)
  on public.profiles to authenticated;

-- Vérifie la disponibilité d'un nom d'utilisateur sans exposer la table.
create or replace function public.username_available(name text)
returns boolean language sql security definer set search_path = public stable as $$
  select not exists (select 1 from public.profiles where username = name::citext);
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- Création automatique du profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  wanted text := coalesce(new.raw_user_meta_data ->> 'username', '');
begin
  if wanted !~ '^[a-zA-Z0-9_]{3,20}$' or exists (select 1 from public.profiles where username = wanted::citext) then
    wanted := 'trader_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into public.profiles (id, username) values (new.id, wanted);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ TRADES ============
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  symbol text not null,
  direction text not null check (direction in ('buy', 'sell')),
  status text not null default 'closed' check (status in ('open', 'closed')),
  entry_price numeric not null,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  lot_size numeric,
  pnl numeric,
  fees numeric not null default 0,
  risk_amount numeric,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  setup text,
  session text,
  emotions text[],
  followed_plan boolean,
  notes text,
  screenshots text[] not null default '{}',
  -- Pour l'import automatique (MT5, Binance, CSV) : évite les doublons
  source text not null default 'manual' check (source in ('manual', 'csv', 'mt5', 'binance', 'api')),
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);

create index trades_user_opened_idx on public.trades (user_id, opened_at desc);

alter table public.trades enable row level security;

create policy "trades lisibles par leur propriétaire"
  on public.trades for select using (auth.uid() = user_id);
create policy "trades créés par leur propriétaire"
  on public.trades for insert with check (auth.uid() = user_id);
create policy "trades modifiés par leur propriétaire"
  on public.trades for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trades supprimés par leur propriétaire"
  on public.trades for delete using (auth.uid() = user_id);

-- ============ updated_at ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trades_touch before update on public.trades
  for each row execute function public.touch_updated_at();
