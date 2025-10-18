/*
  # Add Sample Seed Data

  1. Sample Data
    - 3 Products: T-Shirt, Coffee Mug, Phone Case
    - 5 Cost Entries: Multiple purchases for inventory tracking
    - 3 Sales: Sample sales to show COGS calculation and profit metrics

  2. Demo User
    - Creates a demo user with a fixed UUID
    - All sample data associated with this user

  3. Purpose
    - Populate dashboard with realistic data on first load
    - Demonstrate FIFO inventory calculation
    - Show profit margins and analytics
*/

DO $$
DECLARE
  demo_user_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
  product_tshirt_id uuid;
  product_mug_id uuid;
  product_case_id uuid;
BEGIN
  INSERT INTO users (id, email, shopify_domain, created_at)
  VALUES (demo_user_id, 'demo@cogstrack.com', 'demo-store.myshopify.com', NOW())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO products (user_id, sku, title, current_price, created_at, updated_at)
  VALUES 
    (demo_user_id, 'TSH-001', 'Premium Cotton T-Shirt', 29.99, NOW(), NOW()),
    (demo_user_id, 'MUG-001', 'Ceramic Coffee Mug', 14.99, NOW(), NOW()),
    (demo_user_id, 'CASE-001', 'Silicone Phone Case', 19.99, NOW(), NOW())
  ON CONFLICT (user_id, sku) DO UPDATE SET title = EXCLUDED.title, current_price = EXCLUDED.current_price;

  SELECT id INTO product_tshirt_id FROM products WHERE user_id = demo_user_id AND sku = 'TSH-001';
  SELECT id INTO product_mug_id FROM products WHERE user_id = demo_user_id AND sku = 'MUG-001';
  SELECT id INTO product_case_id FROM products WHERE user_id = demo_user_id AND sku = 'CASE-001';

  DELETE FROM sales WHERE user_id = demo_user_id;
  DELETE FROM cost_entries WHERE user_id = demo_user_id;

  INSERT INTO cost_entries (
    user_id, product_id, sku, supplier_name, unit_cost, quantity, quantity_remaining,
    freight_per_unit, duty_per_unit, total_landed_cost_per_unit, entry_date, invoice_reference, created_at
  )
  VALUES 
    (demo_user_id, product_tshirt_id, 'TSH-001', 'Fabric Suppliers Inc', 8.50, 100, 50, 0.75, 0.25, 9.50, '2025-01-15', 'INV-2025-001', NOW()),
    (demo_user_id, product_tshirt_id, 'TSH-001', 'Fabric Suppliers Inc', 9.00, 100, 100, 0.80, 0.30, 10.10, '2025-02-10', 'INV-2025-008', NOW()),
    (demo_user_id, product_mug_id, 'MUG-001', 'Ceramic Co', 3.25, 200, 120, 0.35, 0.15, 3.75, '2025-01-20', 'INV-2025-003', NOW()),
    (demo_user_id, product_mug_id, 'MUG-001', 'Ceramic Co', 3.50, 150, 150, 0.40, 0.18, 4.08, '2025-02-28', 'INV-2025-012', NOW()),
    (demo_user_id, product_case_id, 'CASE-001', 'Tech Accessories Ltd', 5.75, 150, 100, 0.50, 0.25, 6.50, '2025-01-25', 'INV-2025-005', NOW());

  INSERT INTO sales (
    user_id, product_id, sku, shopify_order_id, quantity, sale_price, sale_date,
    cogs_per_unit, gross_profit, created_at
  )
  VALUES 
    (demo_user_id, product_tshirt_id, 'TSH-001', 'ORD-2025-101', 50, 29.99, '2025-03-05', 9.50, 1024.50, NOW()),
    (demo_user_id, product_mug_id, 'MUG-001', 'ORD-2025-102', 80, 14.99, '2025-03-08', 3.75, 899.20, NOW()),
    (demo_user_id, product_case_id, 'CASE-001', 'ORD-2025-103', 50, 19.99, '2025-03-12', 6.50, 674.50, NOW());

END $$;