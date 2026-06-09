import { NavLink } from 'react-router-dom';

export default function SettingsView() {
  const settingsLinks = [
    { name: 'Printer Settings', path: '/settings/printers', icon: 'bx-printer', desc: 'Configure default printers and drivers' },
    { name: 'Shop Settings', path: '/settings/shop', icon: 'bx-store-alt', desc: 'Update shop name, phone, and address' },
    { name: 'Rate Card', path: '/settings/ratecard', icon: 'bx-list-ul', desc: 'Manage your printing rates and services' },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {settingsLinks.map(link => (
          <NavLink key={link.path} to={link.path} className="flex gap-4 p-5 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-2xl shrink-0">
              <i className={`bx ${link.icon}`}></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{link.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
