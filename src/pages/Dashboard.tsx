import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Package, Percent, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { MetricCard } from '../components/MetricCard';
import { api } from '../lib/api';
import { downloadCSV } from '../lib/csvUtils';

interface DashboardData {
  totalRevenue: number;
  totalCOGS: number;
  totalGrossProfit: number;
  marginPercentage: number;
  topProducts: Array<{
    sku: string;
    revenue: number;
    cogs: number;
    profit: number;
    unitsSold: number;
  }>;
  bottomProducts: Array<{
    sku: string;
    revenue: number;
    cogs: number;
    profit: number;
    unitsSold: number;
  }>;
}

interface Sale {
  sale_date: string;
  gross_profit: number;
  sale_price: number;
  quantity: number;
  cogs_per_unit: number;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [profitTrend, setProfitTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await api.dashboard.get();
      setData(result);

      await loadProfitTrend();
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadProfitTrend = async () => {
    try {
      const salesData = await fetch('http://localhost:3001/api/sales', {
        headers: {
          'x-user-id': 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        },
      }).then(res => res.json());

      const trendMap = new Map<string, { profit: number; revenue: number }>();

      salesData.forEach((sale: Sale) => {
        const date = sale.sale_date;
        const existing = trendMap.get(date) || { profit: 0, revenue: 0 };
        trendMap.set(date, {
          profit: existing.profit + sale.gross_profit,
          revenue: existing.revenue + (sale.sale_price * sale.quantity),
        });
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, values]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          profit: parseFloat(values.profit.toFixed(2)),
          revenue: parseFloat(values.revenue.toFixed(2)),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30);

      setProfitTrend(trend);
    } catch (err) {
      console.error('Failed to load profit trend:', err);
    }
  };

  const handleExport = () => {
    if (!data) return;

    const exportData = [
      {
        Metric: 'Total Revenue',
        Value: data.totalRevenue,
      },
      {
        Metric: 'Total COGS',
        Value: data.totalCOGS,
      },
      {
        Metric: 'Gross Profit',
        Value: data.totalGrossProfit,
      },
      {
        Metric: 'Profit Margin %',
        Value: data.marginPercentage,
      },
      ...data.topProducts.map(p => ({
        Metric: `${p.sku} - Revenue`,
        Value: p.revenue,
      })),
    ];

    downloadCSV(exportData, `dashboard-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Dashboard data exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <MetricCard
          title="Total COGS"
          value={`$${data.totalCOGS.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Package}
        />
        <MetricCard
          title="Gross Profit"
          value={`$${data.totalGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Profit Margin"
          value={`${data.marginPercentage.toFixed(2)}%`}
          icon={Percent}
        />
      </div>

      {profitTrend.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Products by Profit</h3>
          {data.topProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">No sales data available</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.sku}</p>
                    <p className="text-sm text-gray-600">{product.unitsSold} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ${product.profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${product.revenue.toFixed(2)} revenue
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bottom 5 Products by Profit</h3>
          {data.bottomProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">No sales data available</p>
          ) : (
            <div className="space-y-3">
              {data.bottomProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.sku}</p>
                    <p className="text-sm text-gray-600">{product.unitsSold} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      ${product.profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${product.revenue.toFixed(2)} revenue
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
