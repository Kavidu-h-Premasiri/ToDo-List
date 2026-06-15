import React, { useState } from 'react';
import { Bell, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const toggleMobileSidebar = () => {
    const sidebar = document.querySelector('aside');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar && backdrop) {
      sidebar.classList.toggle('-translate-x-full');
      backdrop.style.display = backdrop.style.display === 'none' ? 'block' : 'none';
    }
  };

  const handleLogout = () => {
    // Clear all user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Close dropdown if open
    setShowDropdown(false);
    
    // Navigate to login page
    navigate('/login');
  };

  const goToProfile = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-30">
      <div className="flex justify-between items-center">
        {/* Mobile menu button */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>

        {/* Page Title */}
        <div className="flex-1 lg:flex-none">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Welcome back, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {user.name?.split(' ')[0] || 'User'}
            </span>!
          </h2>
          <p className="text-sm text-gray-500 mt-1 hidden sm:block">Here's what's happening with your tasks today.</p>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-md">
                {user.name?.charAt(0) || 'U'}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <p className="font-semibold text-gray-800">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-500 mt-1">{user.email || 'user@example.com'}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={goToProfile}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      Profile Settings
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};