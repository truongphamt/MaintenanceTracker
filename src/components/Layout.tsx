import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, Bell, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Layout() {
  const { state } = useApp();
  const unreadCount = state.notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary-700 tracking-tight">
            HomeBase
          </h1>
          <span className="text-xs text-gray-400 font-medium">Maintenance Tracker</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
        <div className="max-w-4xl mx-auto flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <Home size={20} />
            <span className="mt-0.5">Dashboard</span>
          </NavLink>
          <NavLink
            to="/services"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <List size={20} />
            <span className="mt-0.5">Services</span>
          </NavLink>
          <NavLink
            to="/insurance"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <Shield size={20} />
            <span className="mt-0.5">Insurance</span>
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors relative ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <div className="relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-danger-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="mt-0.5">Alerts</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
