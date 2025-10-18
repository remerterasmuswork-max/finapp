import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('title');

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('product_id, sku, quantity, sale_price, cogs_per_unit, gross_profit')
      .eq('user_id', userId);

    if (salesError) {
      throw new Error(`Failed to fetch sales: ${salesError.message}`);
    }

    const productMetrics = products.map(product => {
      const productSales = sales.filter(s => s.product_id === product.id);

      const unitsSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
      const revenue = productSales.reduce((sum, sale) => sum + (sale.quantity * sale.sale_price), 0);
      const cogs = productSales.reduce((sum, sale) => sum + (sale.quantity * sale.cogs_per_unit), 0);
      const profit = productSales.reduce((sum, sale) => sum + sale.gross_profit, 0);
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        id: product.id,
        sku: product.sku,
        title: product.title,
        current_price: product.current_price,
        unitsSold,
        revenue: parseFloat(revenue.toFixed(2)),
        cogs: parseFloat(cogs.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        margin: parseFloat(margin.toFixed(2))
      };
    });

    res.json(productMetrics);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch products' });
  }
});

export default router;
