import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

interface Product {
  id: string;
  sku: string;
  title: string;
  current_price: number | null;
}

export function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    quantity: '',
    sale_price: '',
    sale_date: new Date().toISOString().split('T')[0],
    shopify_order_id: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await api.products.list();
      setProducts(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        sku: formData.sku,
        quantity: parseInt(formData.quantity),
        sale_price: parseFloat(formData.sale_price),
        sale_date: formData.sale_date,
        shopify_order_id: formData.shopify_order_id || undefined,
      };

      const result = await api.sales.sync(payload);
      const margin = result.gross_profit / (result.sale_price * result.quantity) * 100;

      toast.success(
        `Sale recorded! COGS: $${result.cogs_per_unit.toFixed(2)}, Profit: $${result.gross_profit.toFixed(2)} (${margin.toFixed(1)}% margin)`,
        { duration: 5000 }
      );

      setFormData({
        sku: '',
        quantity: '',
        sale_price: '',
        sale_date: new Date().toISOString().split('T')[0],
        shopify_order_id: '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'sku') {
      const selectedProduct = products.find(p => p.sku === value);
      if (selectedProduct && selectedProduct.current_price) {
        setFormData({
          ...formData,
          [name]: value,
          sale_price: selectedProduct.current_price.toString(),
        });
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Record Sale</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
              Product *
            </label>
            <select
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a product...</option>
              {products.map((product) => (
                <option key={product.id} value={product.sku}>
                  {product.sku} - {product.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700 mb-1">
                Sale Price per Unit ($) *
              </label>
              <input
                type="number"
                id="sale_price"
                name="sale_price"
                value={formData.sale_price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sale_date" className="block text-sm font-medium text-gray-700 mb-1">
                Sale Date *
              </label>
              <input
                type="date"
                id="sale_date"
                name="sale_date"
                value={formData.sale_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="shopify_order_id" className="block text-sm font-medium text-gray-700 mb-1">
                Order ID (optional)
              </label>
              <input
                type="text"
                id="shopify_order_id"
                name="shopify_order_id"
                value={formData.shopify_order_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Recording Sale...' : 'Record Sale'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• COGS is calculated automatically using FIFO (First-In-First-Out)</li>
            <li>• Inventory quantities are updated after each sale</li>
            <li>• Profit margin is calculated as (Revenue - COGS) / Revenue</li>
            <li>• All sales data appears immediately in your Dashboard and Products pages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
