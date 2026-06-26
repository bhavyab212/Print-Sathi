import { AppNavLink } from '../../components/navigation/AppNavLink';

export default function RateCardSettingsView() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <AppNavLink to="/settings" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600">
          <i className="bx bx-arrow-back text-xl"></i>
        </AppNavLink>
        <h1 className="text-2xl font-bold text-gray-900">Rate Card Settings</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-gray-500">Manage rate card here. Coming soon.</p>
      </div>
    </div>
  );
}
