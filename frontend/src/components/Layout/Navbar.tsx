import React, { useState } from 'react';
import { Menu, User as UserIcon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from '../Notifications/NotificationBell';

export const Navbar: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [photoError, setPhotoError] = useState(false);
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const goToProfile = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  const handlePhotoError = () => {
    setPhotoError(true);
  };

  // API URL එකෙන් /api කෑල්ල අයින් කරලා, photo path එක නිවැරදිව සම්බන්ධ කිරීම
  const getProfilePhotoUrl = () => {
    if (!user.profile_photo) return null;
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
    const photoPath = user.profile_photo.startsWith('/') ? user.profile_photo : `/${user.profile_photo}`;
    return `${baseUrl}${photoPath}`;
  };

  const profilePhoto = getProfilePhotoUrl();

  return (
    <nav className="bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-4 sticky top-0 z-40 relative overflow-visible">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-pink-600/5 to-cyan-600/5"></div>
      
      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan-line"></div>
      </div>

      <div className="relative flex justify-between items-center">
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-white/5 border border-white/10 transition-all duration-300 group"
        >
          <Menu className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
        </button>

        <div className="flex-1 lg:flex-none">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tighter">
            <span className="text-gray-400">Welcome back,</span>{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
              {user.name?.split(' ')[0] || 'User'}
            </span>
            <span className="text-purple-400 animate-pulse">!</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1 hidden sm:block font-mono tracking-wider">
            <span className="text-purple-400">✦</span> SYSTEM STATUS: ONLINE{' '}
            <span className="text-cyan-400">✦</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-purple-500/30 transition-all duration-300 group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] overflow-hidden relative group-hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.5)] transition-all duration-300">
                {profilePhoto && !photoError ? (
                  <img 
                    src={profilePhoto} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                    onError={handlePhotoError}
                  />
                ) : (
                  <span className="relative z-10">{user.name?.charAt(0) || 'U'}</span>
                )}
                {/* Animated ring effect */}
                <div className="absolute inset-0 rounded-xl border-2 border-white/20 animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-mono text-gray-400 tracking-wider">AGENT</div>
                <div className="text-xs font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  {user.name?.split(' ')[0] || 'User'}
                </div>
              </div>
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_0_80px_-20px_rgba(255,0,255,0.15)] z-[9999] overflow-hidden animate-slide-up">
                  {/* Gradient border glow */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
                  
                  <div className="relative p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-cyan-600/10">
                    <p className="font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                      {user.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-1 tracking-wider">
                      {user.email || 'user@example.com'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                      <span className="text-[10px] text-green-400 font-mono tracking-wider">ACTIVE</span>
                    </div>
                  </div>
                  
                  <div className="relative p-2">
                    <button 
                      onClick={goToProfile}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 group font-mono"
                    >
                      <UserIcon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="group-hover:text-purple-400 transition-colors">PROFILE SETTINGS</span>
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 group font-mono mt-1"
                    >
                      <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="group-hover:text-red-300 transition-colors">SIGN OUT</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-scan-line {
          animation: scan-line 8s linear infinite;
        }
        
        .animate-slide-up {
          animation: slide-up 0.2s ease-out forwards;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        /* Smooth transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
      `}</style>
    </nav>
  );
};