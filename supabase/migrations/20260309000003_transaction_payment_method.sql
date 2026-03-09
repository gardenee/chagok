alter table transactions
  add column if not exists payment_method_id uuid references payment_methods(id) on delete set null;

create index idx_transactions_payment_method_id on transactions(payment_method_id);
