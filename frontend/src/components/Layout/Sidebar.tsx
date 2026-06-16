import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  User, 
  LogOut,
  Sparkles,
  MessageSquare 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>({});
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.profile_photo) {
        setProfilePhoto(`http://localhost:8080/${parsedUser.profile_photo}`);
      }
    }
  }, []);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/teams', icon: Users, label: 'Teams' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 lg:hidden z-40" id="sidebar-backdrop" style={{ display: 'none' }}></div>
      
      <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 flex flex-col z-50 transform transition-transform duration-300 lg:translate-x-0 -translate-x-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                TaskFlow
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Smart Task Management</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
              {profilePhoto ? (
                <img src={profilePhoto} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.charAt(0) || 'U'
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user.email || 'user@example.com'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1 h-8 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 w-full group"
          >
            <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-600" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};