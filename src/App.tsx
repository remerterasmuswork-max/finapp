import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { CostEntries } from './pages/CostEntries';
import { Sales } from './pages/Sales';
import { Products } from './pages/Products';
import { Settings } from './pages/Settings';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'cost-entries':
        return <CostEntries />;
      case 'sales':
        return <Sales />;
      case 'products':
        return <Products />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
