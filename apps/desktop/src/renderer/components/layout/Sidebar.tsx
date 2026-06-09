import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export function Sidebar() {
  const { shop, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Queue Dashboard', path: '/queue', icon: 'bx-layer' },
    { name: 'Passport Tool', path: '/passport', icon: 'bx-id-card' },
    { name: 'Bill Calculator', path: '/billing', icon: 'bx-calculator' },
    { name: 'Fix & Print', path: '/fix-print', icon: 'bx-wrench' },
    { name: 'Settings', path: '/settings', icon: 'bx-cog' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
      {/* Shop Info */}
      <div className="flex flex-col items-center border-b border-gray-200 p-6">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
          <i className="bx bx-store text-2xl text-white"></i>
        </div>
        <h2 className="text-center font-bold text-gray-900">{shop?.name || 'Your Shop'}</h2>
        <p className="text-xs text-gray-500">{shop?.slug}.printsathi.com</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <i className={`bx ${item.icon} text-xl`}></i>
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
        >
          <i className="bx bx-log-out text-xl"></i>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
