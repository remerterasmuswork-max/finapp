import { useState, useEffect, useRef } from 'react';
import { Plus, Upload, Download } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { downloadCSV } from '../lib/csvUtils';

interface CostEntry {
  id: string;
  sku: string;
  supplier_name: string;
  unit_cost: number;
  quantity: number;
  quantity_remaining: number;
  freight_per_unit: number;
  duty_per_unit: number;
  total_landed_cost_per_unit: number;
  entry_date: string;
  invoice_reference: string | null;
  products: { sku: string; title: string };
}

export function CostEntries() {
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    title: '',
    supplier_name: '',
    unit_cost: '',
    quantity: '',
    freight_per_unit: '',
    duty_per_unit: '',
    entry_date: new Date().toISOString().split('T')[0],
    invoice_reference: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const result = await api.costEntries.list();
      setEntries(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load cost entries');
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
        title: formData.title,
        supplier_name: formData.supplier_name,
        unit_cost: parseFloat(formData.unit_cost),
        quantity: parseInt(formData.quantity),
        freight_per_unit: formData.freight_per_unit ? parseFloat(formData.freight_per_unit) : 0,
        duty_per_unit: formData.duty_per_unit ? parseFloat(formData.duty_per_unit) : 0,
        entry_date: formData.entry_date,
        invoice_reference: formData.invoice_reference || undefined,
      };

      await api.costEntries.create(payload);
      toast.success('Cost entry created successfully');

      setFormData({
        sku: '',
        title: '',
        supplier_name: '',
        unit_cost: '',
        quantity: '',
        freight_per_unit: '',
        duty_per_unit: '',
        entry_date: new Date().toISOString().split('T')[0],
        invoice_reference: '',
      });
      setShowForm(false);
      await loadEntries();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create cost entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          let successCount = 0;
          let errorCount = 0;

          for (const row of data) {
            try {
              await api.costEntries.create({
                sku: row.SKU || row.sku,
                title: row.Title || row.title || row.SKU || row.sku,
                supplier_name: row['Supplier Name'] || row.supplier_name,
                unit_cost: parseFloat(row['Unit Cost'] || row.unit_cost),
                quantity: parseInt(row.Quantity || row.quantity),
                freight_per_unit: parseFloat(row.Freight || row.freight_per_unit || '0'),
                duty_per_unit: parseFloat(row.Duty || row.duty_per_unit || '0'),
                entry_date: row['Invoice Date'] || row.entry_date,
                invoice_reference: row['Invoice Reference'] || row.invoice_reference || undefined,
              });
              successCount++;
            } catch (err) {
              errorCount++;
              console.error('Failed to import row:', row, err);
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} cost entries`);
            await loadEntries();
          }
          if (errorCount > 0) {
            toast.error(`Failed to import ${errorCount} entries`);
          }
        } catch (err: any) {
          toast.error('Failed to parse CSV file');
        }
      },
      error: (err) => {
        toast.error('Failed to read CSV file');
        console.error(err);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const exportData = entries.map(entry => ({
      SKU: entry.sku,
      Title: entry.products?.title || '',
      'Supplier Name': entry.supplier_name,
      'Unit Cost': entry.unit_cost,
      Quantity: entry.quantity,
      'Quantity Remaining': entry.quantity_remaining,
      'Freight per Unit': entry.freight_per_unit,
      'Duty per Unit': entry.duty_per_unit,
      'Total Landed Cost': entry.total_landed_cost_per_unit,
      'Entry Date': entry.entry_date,
      'Invoice Reference': entry.invoice_reference || '',
    }));

    downloadCSV(exportData, `cost-entries-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Cost entries exported successfully');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cost entries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Cost Entries</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <label className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'Add Cost Entry'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Cost Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  id="supplier_name"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="unit_cost" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost ($) *
                </label>
                <input
                  type="number"
                  id="unit_cost"
                  name="unit_cost"
                  value={formData.unit_cost}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                <label htmlFor="freight_per_unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Freight per Unit ($)
                </label>
                <input
                  type="number"
                  id="freight_per_unit"
                  name="freight_per_unit"
                  value={formData.freight_per_unit}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="duty_per_unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Duty per Unit ($)
                </label>
                <input
                  type="number"
                  id="duty_per_unit"
                  name="duty_per_unit"
                  value={formData.duty_per_unit}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="entry_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Date *
                </label>
                <input
                  type="date"
                  id="entry_date"
                  name="entry_date"
                  value={formData.entry_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="invoice_reference" className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Reference
                </label>
                <input
                  type="text"
                  id="invoice_reference"
                  name="invoice_reference"
                  value={formData.invoice_reference}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {submitting ? 'Saving...' : 'Save Cost Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Landed Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No cost entries yet. Add your first cost entry or import from CSV.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.supplier_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${entry.unit_cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${entry.total_landed_cost_per_unit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          entry.quantity_remaining === 0
                            ? 'bg-red-100 text-red-800'
                            : entry.quantity_remaining < entry.quantity / 2
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {entry.quantity_remaining}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.entry_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
