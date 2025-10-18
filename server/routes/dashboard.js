import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('quantity, sale_price, cogs_per_unit, gross_profit, sku')
      .eq('user_id', userId);

    if (salesError) {
      throw new Error(`Failed to fetch sales: ${salesError.message}`);
    }

    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.quantity * sale.sale_price), 0);
    const totalCOGS = sales.reduce((sum, sale) => sum + (sale.quantity * sale.cogs_per_unit), 0);
    const totalGrossProfit = sales.reduce((sum, sale) => sum + sale.gross_profit, 0);
    const marginPercentage = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    const productMetrics = {};
    sales.forEach(sale => {
      if (!productMetrics[sale.sku]) {
        productMetrics[sale.sku] = {
          sku: sale.sku,
          revenue: 0,
          cogs: 0,
          profit: 0,
          unitsSold: 0
        };
      }
      productMetrics[sale.sku].revenue += sale.quantity * sale.sale_price;
      productMetrics[sale.sku].cogs += sale.quantity * sale.cogs_per_unit;
      productMetrics[sale.sku].profit += sale.gross_profit;
      productMetrics[sale.sku].unitsSold += sale.quantity;
    });

    const productsArray = Object.values(productMetrics);
    const topProducts = productsArray
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    const bottomProducts = productsArray
      .sort((a, b) => a.profit - b.profit)
      .slice(0, 5);

    res.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalCOGS: parseFloat(totalCOGS.toFixed(2)),
      totalGrossProfit: parseFloat(totalGrossProfit.toFixed(2)),
      marginPercentage: parseFloat(marginPercentage.toFixed(2)),
      topProducts,
      bottomProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
});

export default router;
