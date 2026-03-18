CREATE TABLE anniversaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  name text NOT NULL,
  date text NOT NULL, -- MM-DD format (e.g., '03-15')
  type text NOT NULL DEFAULT 'anniversary', -- 'birthday_me' | 'birthday_partner' | 'anniversary'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE anniversaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can manage anniversaries"
  ON anniversaries
  FOR ALL
  USING (
    couple_id IN (
      SELECT couple_id FROM users WHERE id = auth.uid() AND couple_id IS NOT NULL
    )
  );
