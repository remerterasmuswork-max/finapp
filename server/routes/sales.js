import express from 'express';
import { supabase } from '../supabase.js';
import { FIFOService } from '../services/fifoService.js';
import { z } from 'zod';

const router = express.Router();
const fifoService = new FIFOService();

const saleSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  sale_price: z.number().nonnegative('Sale price must be non-negative'),
  sale_date: z.string().min(1, 'Sale date is required'),
  shopify_order_id: z.string().optional()
});

router.post('/sync', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const validatedData = saleSchema.parse(req.body);

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', userId)
      .eq('sku', validatedData.sku)
      .maybeSingle();

    if (productError || !product) {
      return res.status(404).json({ error: `Product with SKU ${validatedData.sku} not found` });
    }

    const { cogsPerUnit, totalCOGS, updatedEntries } = await fifoService.calculateCOGS(
      userId,
      validatedData.sku,
      validatedData.quantity
    );

    const totalRevenue = validatedData.sale_price * validatedData.quantity;
    const grossProfit = totalRevenue - totalCOGS;

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        product_id: product.id,
        sku: validatedData.sku,
        shopify_order_id: validatedData.shopify_order_id || null,
        quantity: validatedData.quantity,
        sale_price: validatedData.sale_price,
        sale_date: validatedData.sale_date,
        cogs_per_unit: cogsPerUnit,
        gross_profit: grossProfit
      })
      .select()
      .single();

    if (saleError) {
      throw new Error(`Failed to create sale: ${saleError.message}`);
    }

    await fifoService.updateCostEntries(updatedEntries);

    res.status(201).json(sale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating sale:', error);
    res.status(500).json({ error: error.message || 'Failed to create sale' });
  }
});

export default router;
