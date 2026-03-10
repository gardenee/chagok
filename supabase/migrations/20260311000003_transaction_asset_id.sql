-- transactions에 asset_id 컬럼 추가 (은행계좌/현금 자산을 결제수단으로 연결)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;
