import { useEffect, useState } from 'react';
import { AppNavLink } from '../../components/navigation/AppNavLink';

export default function PrinterSettingsView() {
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrinters() {
      try {
        const res = await window.electron.getPrinters();
        if (res.success) {
          setPrinters(res.printers || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPrinters();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <AppNavLink to="/settings" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600">
          <i className="bx bx-arrow-back text-xl"></i>
        </AppNavLink>
        <h1 className="text-2xl font-bold text-gray-900">Printer Settings</h1>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Installed Printers</h2>
        
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <i className="bx bx-loader-alt animate-spin"></i> Loading...
          </div>
        ) : printers.length === 0 ? (
          <p className="text-gray-500">No printers found on this system.</p>
        ) : (
          <div className="space-y-3">
            {printers.map(p => (
              <div key={p.name} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <i className="bx bx-printer text-xl text-gray-400"></i>
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
