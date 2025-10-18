/*
  # COGS Tracking Application Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Unique user identifier
      - `email` (text, unique) - User email address
      - `shopify_domain` (text, nullable) - Shopify store domain (for future OAuth)
      - `created_at` (timestamptz) - Account creation timestamp

    - `products`
      - `id` (uuid, primary key) - Unique product identifier
      - `user_id` (uuid, foreign key) - Reference to users table
      - `shopify_product_id` (text, nullable) - Shopify product ID (for future sync)
      - `sku` (text, not null) - Stock Keeping Unit
      - `title` (text, not null) - Product title/name
      - `current_price` (decimal, nullable) - Current selling price
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

    - `cost_entries`
      - `id` (uuid, primary key) - Unique cost entry identifier
      - `user_id` (uuid, foreign key) - Reference to users table
      - `product_id` (uuid, foreign key) - Reference to products table
      - `sku` (text, not null) - Product SKU
      - `supplier_name` (text, not null) - Supplier/vendor name
      - `unit_cost` (decimal, not null) - Base cost per unit
      - `quantity` (integer, not null) - Number of units purchased
      - `quantity_remaining` (integer, not null) - Units not yet consumed by sales
      - `freight_per_unit` (decimal, default 0) - Freight cost per unit
      - `duty_per_unit` (decimal, default 0) - Duty/tax cost per unit
      - `total_landed_cost_per_unit` (decimal, not null) - Total cost including all fees
      - `entry_date` (date, not null) - Date of purchase/cost entry
      - `invoice_reference` (text, nullable) - Invoice number or reference
      - `created_at` (timestamptz) - Record creation timestamp

    - `sales`
      - `id` (uuid, primary key) - Unique sale identifier
      - `user_id` (uuid, foreign key) - Reference to users table
      - `product_id` (uuid, foreign key) - Reference to products table
      - `sku` (text, not null) - Product SKU
      - `shopify_order_id` (text, nullable) - Shopify order ID (for future sync)
      - `quantity` (integer, not null) - Units sold
      - `sale_price` (decimal, not null) - Price per unit sold
      - `sale_date` (date, not null) - Date of sale
      - `cogs_per_unit` (decimal, not null) - Calculated COGS per unit (FIFO)
      - `gross_profit` (decimal, not null) - Calculated gross profit
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own records
    - All foreign keys have proper constraints and indexes

  3. Important Notes
    - FIFO logic: quantity_remaining in cost_entries tracks available inventory
    - Calculated fields (cogs_per_unit, gross_profit) stored for performance
    - All monetary values use decimal type for precision
    - Indexes added on foreign keys and frequently queried columns
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  shopify_domain text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shopify_product_id text,
  sku text NOT NULL,
  title text NOT NULL,
  current_price decimal(10, 2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create cost_entries table
CREATE TABLE IF NOT EXISTS cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text NOT NULL,
  supplier_name text NOT NULL,
  unit_cost decimal(10, 2) NOT NULL CHECK (unit_cost >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  quantity_remaining integer NOT NULL CHECK (quantity_remaining >= 0),
  freight_per_unit decimal(10, 2) DEFAULT 0 CHECK (freight_per_unit >= 0),
  duty_per_unit decimal(10, 2) DEFAULT 0 CHECK (duty_per_unit >= 0),
  total_landed_cost_per_unit decimal(10, 2) NOT NULL CHECK (total_landed_cost_per_unit >= 0),
  entry_date date NOT NULL,
  invoice_reference text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cost_entries_user_id ON cost_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_product_id ON cost_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_sku ON cost_entries(sku);
CREATE INDEX IF NOT EXISTS idx_cost_entries_entry_date ON cost_entries(entry_date);

ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cost entries"
  ON cost_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cost entries"
  ON cost_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cost entries"
  ON cost_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cost entries"
  ON cost_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text NOT NULL,
  shopify_order_id text,
  quantity integer NOT NULL CHECK (quantity > 0),
  sale_price decimal(10, 2) NOT NULL CHECK (sale_price >= 0),
  sale_date date NOT NULL,
  cogs_per_unit decimal(10, 2) NOT NULL CHECK (cogs_per_unit >= 0),
  gross_profit decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_sku ON sales(sku);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sales"
  ON sales FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales"
  ON sales FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);