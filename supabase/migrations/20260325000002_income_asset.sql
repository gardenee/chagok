-- 수입 자산 잔액 조정 함수
create or replace function adjust_asset_balance(
  p_asset_id uuid,
  p_delta integer
)
returns void
language plpgsql
security definer
as $$
begin
  if p_asset_id is not null then
    update assets
    set amount = coalesce(amount, 0) + p_delta
    where id = p_asset_id;
  end if;
end;
$$;
