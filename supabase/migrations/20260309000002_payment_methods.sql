create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  name text not null,
  type text not null default 'credit_card'
    check (type in ('credit_card','debit_card','transit','welfare','points','prepaid','other')),
  icon text not null default 'wallet',
  color text not null default '#D4C5F0',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table payment_methods enable row level security;

create policy "payment_methods_select" on payment_methods
  for select using (couple_id = get_my_couple_id());

create policy "payment_methods_insert" on payment_methods
  for insert with check (couple_id = get_my_couple_id());

create policy "payment_methods_update" on payment_methods
  for update using (couple_id = get_my_couple_id());

create policy "payment_methods_delete" on payment_methods
  for delete using (couple_id = get_my_couple_id());

create index idx_payment_methods_couple_id on payment_methods(couple_id);
