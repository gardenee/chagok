-- payment_methods에 카드사/결제일/연회비/연결계좌 컬럼 추가
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS card_company TEXT DEFAULT NULL;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS billing_day SMALLINT DEFAULT NULL;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS annual_fee INTEGER DEFAULT NULL;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS linked_asset_id UUID DEFAULT NULL
  REFERENCES assets(id) ON DELETE SET NULL;
