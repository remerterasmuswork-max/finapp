import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <SettingsIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings Coming Soon</h3>
          <p className="text-gray-600 text-center max-w-md">
            This page will allow you to configure your Shopify connection, manage
            integrations, and customize your COGS tracking preferences.
          </p>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Planned Features</h4>
          <ul className="space-y-2">
            <li className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Shopify OAuth Integration
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Automatic Order Sync
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Invoice Parsing & OCR
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              CSV Import/Export
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Multi-User Teams
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
