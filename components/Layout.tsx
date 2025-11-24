import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { FiHome, FiUser, FiClock, FiCalendar, FiLogOut, FiMenu, FiX, FiUsers, FiBarChart, FiSettings } from 'react-icons/fi';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const isEmployee = user?.role === 'employee';
  const isAdmin = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'super_admin';

  const employeeMenu = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: FiHome },
    { name: 'Attendance', path: '/employee/attendance', icon: FiClock },
    { name: 'Leave', path: '/employee/leave', icon: FiCalendar },
    { name: 'Profile', path: '/employee/profile', icon: FiUser },
  ];

  const adminMenu = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
    { name: 'Employees', path: '/admin/employees', icon: FiUsers },
    { name: 'Attendance', path: '/admin/attendance', icon: FiClock },
    { name: 'Leaves', path: '/admin/leaves', icon: FiCalendar },
    { name: 'Reports', path: '/admin/reports', icon: FiBarChart },
    { name: 'Settings', path: '/admin/settings', icon: FiSettings },
  ];

  const menu = isEmployee ? employeeMenu : adminMenu;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary-600">SmartTrack HR</h2>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>
          <nav className="mt-4">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.path;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 ${
                    isActive ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
            <div className="flex items-center flex-shrink-0 px-4 py-4 border-b">
              <h2 className="text-xl font-bold text-primary-600">SmartTrack HR</h2>
            </div>
            <nav className="flex-1 mt-4">
              {menu.map((item) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.path;
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(item.path);
                    }}
                    className={`flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 ${
                      isActive ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navbar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h1 className="text-xl font-semibold text-gray-900">
                {menu.find((m) => m.path === router.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

