-- 커플 멤버면 상대방 데이터도 수정/삭제 가능하도록 정책 변경

-- ───────────────────────────────
-- transactions: DELETE 커플 멤버로 변경
-- ───────────────────────────────
DROP POLICY IF EXISTS "본인 거래내역 삭제" ON transactions;

CREATE POLICY "커플 거래내역 삭제" ON transactions
  FOR DELETE USING (couple_id = get_my_couple_id());

-- ───────────────────────────────
-- schedules: UPDATE/DELETE 커플 멤버로 변경
-- ───────────────────────────────
DROP POLICY IF EXISTS "본인 일정 수정" ON schedules;
DROP POLICY IF EXISTS "본인 일정 삭제" ON schedules;

CREATE POLICY "커플 일정 수정" ON schedules
  FOR UPDATE USING (couple_id = get_my_couple_id());

CREATE POLICY "커플 일정 삭제" ON schedules
  FOR DELETE USING (couple_id = get_my_couple_id());

-- ───────────────────────────────
-- comments: UPDATE 추가, DELETE 커플 멤버로 변경
-- ───────────────────────────────
DROP POLICY IF EXISTS "본인 댓글 삭제" ON comments;

CREATE POLICY "커플 댓글 수정" ON comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_id
        AND t.couple_id = get_my_couple_id()
    )
  );

CREATE POLICY "커플 댓글 삭제" ON comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_id
        AND t.couple_id = get_my_couple_id()
    )
  );
