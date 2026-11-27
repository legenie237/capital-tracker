-- Capital Tracker : suivi des erreurs de trading (pour mesurer combien chaque erreur coûte)
alter table public.trades add column if not exists mistakes text[] not null default '{}';
