-- Capital Tracker : abonnements et paiements (Mobile Money validé par l'admin, crypto automatique)
-- L'abonnement n'est jamais activé depuis le navigateur : seulement par l'admin
-- (fonction review_payment) ou par le serveur après paiement crypto confirmé.
-- Ce script peut être exécuté plusieurs fois sans erreur.

-- Admin ?
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_admin() to authenticated;

-- L'admin peut lire tous les profils (pour la liste des paiements)
drop policy if exists "profils lisibles par l'admin" on public.profiles;
create policy "profils lisibles par l'admin" on public.profiles
  for select to authenticated using (public.is_admin());

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  method text not null check (method in ('mobile_money', 'crypto')),
  operator text check (operator in ('mtn', 'orange')),
  phone text check (char_length(phone) <= 20),
  reference text check (char_length(reference) <= 60),
  months integer not null check (months in (1, 3, 6, 12)),
  amount_fcfa integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'waiting_crypto', 'failed')),
  provider_id text,
  admin_note text check (char_length(admin_note) <= 500),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payments_amount check (amount_fcfa = months * 2500),
  constraint payments_mobile_money check (
    method <> 'mobile_money' or (operator is not null and phone is not null and reference is not null)
  )
);
create index if not exists payments_user_created on public.payments (user_id, created_at desc);
create index if not exists payments_status on public.payments (status, created_at);
-- Une même référence de transfert ne peut pas servir deux fois
create unique index if not exists payments_reference_unique
  on public.payments (operator, lower(reference))
  where method = 'mobile_money' and status <> 'rejected';

alter table public.payments enable row level security;

drop policy if exists "paiements lisibles" on public.payments;
create policy "paiements lisibles" on public.payments
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Le trader peut seulement déclarer un transfert Mobile Money (en attente), 3 demandes en attente au plus
drop policy if exists "declarer un transfert" on public.payments;
create policy "declarer un transfert" on public.payments
  for insert to authenticated with check (
    user_id = auth.uid()
    and method = 'mobile_money'
    and status = 'pending'
    and provider_id is null and admin_note is null and reviewed_by is null and reviewed_at is null
    and (select count(*) from public.payments p where p.user_id = auth.uid() and p.status = 'pending') < 3
  );

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;
grant insert (method, operator, phone, reference, months, amount_fcfa) on public.payments to authenticated;

-- Prolonge l'abonnement (usage interne)
create or replace function public.extend_subscription(p_user uuid, p_months integer)
returns void language sql security definer set search_path = public as $$
  update public.profiles
     set subscription_until = greatest(coalesce(subscription_until, now()), now()) + make_interval(months => p_months),
         subscription_status = 'active',
         updated_at = now()
   where id = p_user;
$$;
revoke all on function public.extend_subscription(uuid, integer) from public, anon, authenticated;

-- Validation ou refus d'un transfert par l'admin
create or replace function public.review_payment(p_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  pay public.payments;
begin
  if not public.is_admin() then
    raise exception 'Réservé à l''administrateur';
  end if;
  select * into pay from public.payments where id = p_id for update;
  if not found or pay.method <> 'mobile_money' or pay.status <> 'pending' then
    raise exception 'Ce paiement a déjà été traité';
  end if;
  update public.payments
     set status = case when p_approve then 'approved' else 'rejected' end,
         admin_note = nullif(trim(p_note), ''),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = p_id;
  if p_approve then
    perform public.extend_subscription(pay.user_id, pay.months);
  end if;
end;
$$;
revoke all on function public.review_payment(uuid, boolean, text) from public, anon;
grant execute on function public.review_payment(uuid, boolean, text) to authenticated;

-- Paiement crypto confirmé (appelé uniquement par le serveur avec la clé service_role)
create or replace function public.confirm_crypto_payment(p_id uuid, p_provider_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  pay public.payments;
begin
  select * into pay from public.payments where id = p_id for update;
  if not found or pay.method <> 'crypto' then
    return false;
  end if;
  if pay.status = 'approved' then
    return true; -- déjà activé : on ne prolonge pas deux fois
  end if;
  update public.payments
     set status = 'approved', provider_id = coalesce(p_provider_id, provider_id), reviewed_at = now()
   where id = p_id;
  perform public.extend_subscription(pay.user_id, pay.months);
  return true;
end;
$$;
revoke all on function public.confirm_crypto_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.confirm_crypto_payment(uuid, text) to service_role;
grant select, insert, update on public.payments to service_role;
