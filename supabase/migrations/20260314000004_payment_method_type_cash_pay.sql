-- payment_methods.type CHECK constraint에 cash, pay 추가
ALTER TABLE payment_methods DROP CONSTRAINT IF EXISTS payment_methods_type_check;

ALTER TABLE payment_methods ADD CONSTRAINT payment_methods_type_check
  CHECK (type IN ('credit_card','debit_card','transit','welfare','points','prepaid','cash','pay','other'));
