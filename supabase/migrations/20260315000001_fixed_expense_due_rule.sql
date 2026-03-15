alter table fixed_expenses
add column if not exists due_day_mode text not null default 'day'
check (due_day_mode in ('day', 'eom'));

alter table fixed_expenses
add column if not exists business_day_adjust text not null default 'none'
check (business_day_adjust in ('none', 'prev', 'next'));

