-- Asset subcategories (types under a category)
-- Run this once in Supabase SQL Editor (production project)

CREATE TABLE IF NOT EXISTS asset_subcategories (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
  subcategory_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (category_id, subcategory_name)
);

ALTER TABLE asset_subcategories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'asset_subcategories' AND policyname = 'Allow all for anon'
  ) THEN
    CREATE POLICY "Allow all for anon" ON asset_subcategories FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Optional FK from assets.subcategory_id (safe if orphans are null)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'assets_subcategory_id_fkey'
  ) THEN
    ALTER TABLE assets
      ADD CONSTRAINT assets_subcategory_id_fkey
      FOREIGN KEY (subcategory_id) REFERENCES asset_subcategories(id)
      ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Skipping assets FK: %', SQLERRM;
END $$;
