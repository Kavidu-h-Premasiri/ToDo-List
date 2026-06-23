import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  User, 
  LogOut,
  Sparkles,
  MessageSquare,
  Zap
} from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  profile_photo?: string;
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData>({ name: '', email: '' });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [isEmailOverflowing, setIsEmailOverflowing] = useState(false);
  const emailRef = React.useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const loadUserData = (): void => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Only set profile photo if it exists and is not empty
          if (parsedUser.profile_photo && parsedUser.profile_photo !== '') {
            // API URL එකෙන් /api කොටස ඉවත් කරලා ෆොටෝ එකේ සැබෑ URL එක සකස් කිරීම
            const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
            const photoPath = parsedUser.profile_photo.startsWith('/') ? parsedUser.profile_photo : `/${parsedUser.profile_photo}`;
            setProfilePhoto(`${baseUrl}${photoPath}`);
          } else {
            setProfilePhoto(null);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    loadUserData();
  }, []);

  // Check if email is overflowing
  useEffect(() => {
    if (emailRef.current) {
      setIsEmailOverflowing(emailRef.current.scrollWidth > emailRef.current.clientWidth);
    }
  }, [user.email]);

  const handlePhotoError = (): void => {
    setPhotoError(true);
    setProfilePhoto(null);
    // Clear the broken photo from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.profile_photo) {
          parsedUser.profile_photo = '';
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }
      } catch (error) {
        console.error('Error updating user data:', error);
      }
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/teams', icon: Users, label: 'Teams' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm lg:hidden z-40" id="sidebar-backdrop" style={{ display: 'none' }}></div>
      
      <aside className="fixed left-0 top-0 h-full w-72 bg-black/90 backdrop-blur-2xl border-r border-white/10 flex flex-col z-50 transform transition-transform duration-300 lg:translate-x-0 -translate-x-full shadow-[0_0_80px_-20px_rgba(255,0,255,0.1)] overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-pink-600/5 to-cyan-600/5"></div>
        
        {/* Animated glow orbs */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-600/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>

        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan-line"></div>
        </div>

        <div className="relative p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-xl shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] relative">
              <Sparkles className="w-6 h-6 text-white" />
              <div className="absolute inset-0 rounded-xl border border-white/20 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                TaskFlow
              </h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-wider mt-0.5">
                <Zap className="w-3 h-3 inline mr-1 text-purple-400" />
                SMART TASK MANAGEMENT
              </p>
            </div>
          </div>
        </div>

        <div className="relative p-4 border-b border-white/10">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)] relative">
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
              <div className="absolute inset-0 rounded-xl border border-white/20 animate-pulse"></div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white truncate font-mono tracking-wide">{user.name || 'User'}</p>
              {/* Email with marquee effect */}
              <div className="relative overflow-hidden">
                <p 
                  ref={emailRef}
                  className={`text-xs text-gray-400 font-mono tracking-wider whitespace-nowrap ${
                    isEmailOverflowing ? 'animate-marquee' : ''
                  }`}
                  style={{
                    display: 'inline-block',
                    maxWidth: '100%',
                  }}
                >
                  {user.email || 'user@example.com'}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-green-400 font-mono tracking-wider">ONLINE</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 border border-purple-500/30 shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-cyan-500 rounded-r-full shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>
                )}
                <Icon className={`w-5 h-5 transition-all duration-300 ${
                  isActive 
                    ? 'text-purple-400' 
                    : 'text-gray-500 group-hover:text-purple-400'
                }`} />
                <span className={`font-mono tracking-wider text-sm ${
                  isActive 
                    ? 'text-white' 
                    : 'group-hover:text-white'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto flex items-center gap-1">
                    <span className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></span>
                    <span className="w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-300"></span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-300 w-full group font-mono tracking-wider"
          >
            <LogOut className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform duration-300" />
            <span className="group-hover:text-red-300 transition-colors">LOGOUT</span>
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-scan-line {
          animation: scan-line 8s linear infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .animate-marquee {
          animation: marquee 8s linear infinite;
          padding-right: 100%;
        }
        
        /* Pause animation on hover */
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        .delay-150 {
          animation-delay: 150ms;
        }
        
        .delay-300 {
          animation-delay: 300ms;
        }
        
        /* Custom scrollbar for sidebar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #06b6d4);
          border-radius: 10px;
        }
        
        /* Smooth transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
      `}</style>
    </>
  );
};