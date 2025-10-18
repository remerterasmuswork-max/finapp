import express from 'express';
import { supabase } from '../supabase.js';
import { z } from 'zod';

const router = express.Router();

const costEntrySchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  title: z.string().min(1, 'Product title is required'),
  supplier_name: z.string().min(1, 'Supplier name is required'),
  unit_cost: z.number().positive('Unit cost must be positive'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  freight_per_unit: z.number().nonnegative('Freight must be non-negative').optional().default(0),
  duty_per_unit: z.number().nonnegative('Duty must be non-negative').optional().default(0),
  entry_date: z.string().min(1, 'Entry date is required'),
  invoice_reference: z.string().optional()
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    console.log('Creating cost entry for user:', userId);
    const validatedData = costEntrySchema.parse(req.body);
    console.log('Validated data:', validatedData);

    const totalLandedCost =
      validatedData.unit_cost +
      (validatedData.freight_per_unit || 0) +
      (validatedData.duty_per_unit || 0);

    let productId;
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', userId)
      .eq('sku', validatedData.sku)
      .maybeSingle();

    if (existingProduct) {
      productId = existingProduct.id;

      await supabase
        .from('products')
        .update({
          title: validatedData.title,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);
    } else {
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          sku: validatedData.sku,
          title: validatedData.title
        })
        .select()
        .single();

      if (productError) {
        throw new Error(`Failed to create product: ${productError.message}`);
      }
      productId = newProduct.id;
    }

    const { data: costEntry, error: costError } = await supabase
      .from('cost_entries')
      .insert({
        user_id: userId,
        product_id: productId,
        sku: validatedData.sku,
        supplier_name: validatedData.supplier_name,
        unit_cost: validatedData.unit_cost,
        quantity: validatedData.quantity,
        quantity_remaining: validatedData.quantity,
        freight_per_unit: validatedData.freight_per_unit || 0,
        duty_per_unit: validatedData.duty_per_unit || 0,
        total_landed_cost_per_unit: totalLandedCost,
        entry_date: validatedData.entry_date,
        invoice_reference: validatedData.invoice_reference || null
      })
      .select()
      .single();

    if (costError) {
      throw new Error(`Failed to create cost entry: ${costError.message}`);
    }

    res.status(201).json(costEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating cost entry:', error);
    res.status(500).json({ error: error.message || 'Failed to create cost entry' });
  }
});

router.get('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { data, error } = await supabase
      .from('cost_entries')
      .select(`
        *,
        products(sku, title)
      `)
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch cost entries: ${error.message}`);
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching cost entries:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch cost entries' });
  }
});

export default router;
