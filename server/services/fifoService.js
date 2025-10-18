import { supabase } from '../supabase.js';

export class FIFOService {
  async calculateCOGS(userId, sku, quantityToSell) {
    const { data: costEntries, error } = await supabase
      .from('cost_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('sku', sku)
      .gt('quantity_remaining', 0)
      .order('entry_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch cost entries: ${error.message}`);
    }

    if (!costEntries || costEntries.length === 0) {
      throw new Error(`No inventory available for SKU: ${sku}`);
    }

    const totalAvailable = costEntries.reduce((sum, entry) => sum + entry.quantity_remaining, 0);

    if (totalAvailable < quantityToSell) {
      throw new Error(`Insufficient inventory for SKU: ${sku}. Available: ${totalAvailable}, Requested: ${quantityToSell}`);
    }

    let remainingToSell = quantityToSell;
    let totalCOGS = 0;
    const updatedEntries = [];

    for (const entry of costEntries) {
      if (remainingToSell <= 0) break;

      const quantityFromThisEntry = Math.min(entry.quantity_remaining, remainingToSell);
      const cogsFromThisEntry = quantityFromThisEntry * parseFloat(entry.total_landed_cost_per_unit);

      totalCOGS += cogsFromThisEntry;
      remainingToSell -= quantityFromThisEntry;

      updatedEntries.push({
        id: entry.id,
        quantity_remaining: entry.quantity_remaining - quantityFromThisEntry
      });
    }

    const cogsPerUnit = totalCOGS / quantityToSell;

    return {
      cogsPerUnit: parseFloat(cogsPerUnit.toFixed(2)),
      totalCOGS: parseFloat(totalCOGS.toFixed(2)),
      updatedEntries
    };
  }

  async updateCostEntries(updatedEntries) {
    for (const entry of updatedEntries) {
      const { error } = await supabase
        .from('cost_entries')
        .update({ quantity_remaining: entry.quantity_remaining })
        .eq('id', entry.id);

      if (error) {
        throw new Error(`Failed to update cost entry: ${error.message}`);
      }
    }
  }
}
