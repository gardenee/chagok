-- 기존: 본인 거래내역만 수정 가능
-- 변경: 같은 커플 멤버라면 누구든 수정 가능 (공유 가계부)
DROP POLICY IF EXISTS "본인 거래내역 수정" ON transactions;

CREATE POLICY "커플 거래내역 수정" ON transactions
  FOR UPDATE USING (couple_id = get_my_couple_id());
