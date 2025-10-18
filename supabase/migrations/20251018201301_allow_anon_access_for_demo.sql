/*
  # Allow Anonymous Access for Demo User

  1. Changes
    - Add policies to allow anonymous users to access demo data
    - This is for MVP/demo purposes only
    - Production should use proper authentication

  2. Security Notes
    - These policies allow broader access for the demo
    - Should be replaced with proper auth in production
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Allow anon read for demo'
  ) THEN
    CREATE POLICY "Allow anon read for demo"
      ON users FOR SELECT
      TO anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Allow anon insert for demo'
  ) THEN
    CREATE POLICY "Allow anon insert for demo"
      ON users FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Allow anon all for demo'
  ) THEN
    CREATE POLICY "Allow anon all for demo"
      ON products FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cost_entries' 
    AND policyname = 'Allow anon all for demo'
  ) THEN
    CREATE POLICY "Allow anon all for demo"
      ON cost_entries FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sales' 
    AND policyname = 'Allow anon all for demo'
  ) THEN
    CREATE POLICY "Allow anon all for demo"
      ON sales FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;