-- ───────────────────────────────
-- 이체(transfer) 기능 추가
-- ───────────────────────────────

-- 1. transactions.type에 'transfer' 허용
alter table transactions
  drop constraint if exists transactions_type_check;

alter table transactions
  add constraint transactions_type_check
  check (type in ('expense', 'income', 'transfer'));

-- 2. transactions.tag nullable 허용 (이체에는 tag 불필요, 이미 nullable이면 무시됨)
-- (20260319000001_nullable_transaction_tag.sql 에서 이미 처리됨)

-- 3. 이체 목적지 자산 컬럼 추가
alter table transactions
  add column if not exists target_asset_id uuid references assets(id) on delete set null;

-- 4. fixed_expenses에 이체 타입 지원 추가
alter table fixed_expenses
  add column if not exists type text not null default 'expense'
  check (type in ('expense', 'transfer'));

alter table fixed_expenses
  add column if not exists from_asset_id uuid references assets(id) on delete set null;

alter table fixed_expenses
  add column if not exists to_asset_id uuid references assets(id) on delete set null;

-- 5. execute_transfer: 원자적 자산 잔액 업데이트 함수
create or replace function execute_transfer(
  p_from_asset_id uuid,
  p_to_asset_id uuid,
  p_amount integer
)
returns void
language plpgsql
security definer
as $$
begin
  if p_from_asset_id is not null then
    update assets
    set amount = coalesce(amount, 0) - p_amount
    where id = p_from_asset_id;
  end if;

  if p_to_asset_id is not null then
    update assets
    set amount = coalesce(amount, 0) + p_amount
    where id = p_to_asset_id;
  end if;
end;
$$;

-- 6. reverse_transfer: 이체 삭제/수정 시 잔액 되돌리기 함수
create or replace function reverse_transfer(
  p_from_asset_id uuid,
  p_to_asset_id uuid,
  p_amount integer
)
returns void
language plpgsql
security definer
as $$
begin
  if p_from_asset_id is not null then
    update assets
    set amount = coalesce(amount, 0) + p_amount
    where id = p_from_asset_id;
  end if;

  if p_to_asset_id is not null then
    update assets
    set amount = coalesce(amount, 0) - p_amount
    where id = p_to_asset_id;
  end if;
end;
$$;
