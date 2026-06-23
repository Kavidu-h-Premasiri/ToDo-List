import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Button } from '../../components/UI/Button';
import { User, Mail, Save, X, Camera, Trash2, AlertCircle, CheckCircle, Zap, Shield, Calendar, Sparkles } from 'lucide-react';
import { authService } from '../../services/api';

interface ApiError {
  message: string;
}

export const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    id: 0,
    name: '',
    email: '',
    created_at: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserData();
    loadProfilePhoto();
  }, []);

  const loadUserData = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUserData(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  };

  const loadProfilePhoto = async () => {
    try {
      const response = await authService.getProfilePhoto();
      if (response && response.profile_photo) {
        setProfilePhoto(`import.meta.env.VITE_API_URL/${response.profile_photo}`);
      }
    } catch (err) {
      console.error('Error loading profile photo:', err);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum size is 5MB');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.uploadProfilePhoto(file);
      if (response && response.photo_url) {
        setProfilePhoto(`import.meta.env.VITE_API_URL${response.photo_url}`);
        setSuccess('Profile photo updated successfully!');
        
        const updatedUser = { ...userData, profile_photo: response.photo_url };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to upload photo');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?')) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await authService.deleteProfilePhoto();
      setProfilePhoto(null);
      setSuccess('Profile photo deleted successfully!');
      
      const updatedUser = { ...userData, profile_photo: null };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete photo');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const updatedUser = { ...userData, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setIsEditing(false);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: userData.name, email: userData.email });
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,#ff00ff11,transparent_60%),radial-gradient(circle_at_70%_80%,#00ffff11,transparent_60%),radial-gradient(circle_at_50%_50%,#000000,#0a0a0a)]"></div>
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"></div>
      
      <Sidebar />
      <div className="lg:pl-72 relative z-10">
        <Navbar />
        
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header with glitch effect */}
            <div className="mb-8 relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tighter relative glitch-wrapper">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x relative z-10">
                      PROFILE
                    </span>
                    <span className="absolute -inset-1 blur-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 opacity-50 animate-pulse"></span>
                  </h1>
                  <p className="text-gray-400 mt-1 font-mono tracking-wider text-sm">
                    <Zap className="w-4 h-4 inline mr-2 text-purple-400" />
                    MANAGE YOUR ACCOUNT SETTINGS
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-950/50 border border-red-500/30 rounded-xl flex items-center gap-3 animate-shake backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
                <p className="text-sm text-red-300 font-mono flex-1">{error}</p>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-950/50 border border-green-500/30 rounded-xl flex items-center gap-3 backdrop-blur-sm animate-slide-up">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 animate-pulse" />
                <p className="text-sm text-green-300 font-mono flex-1">{success}</p>
                <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Photo Card */}
              <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 shadow-[0_0_80px_-20px_rgba(255,0,255,0.05)] overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 rounded-2xl blur opacity-20"></div>
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-shine"></div>
                
                <div className="relative text-center">
                  <div className="relative inline-block group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 flex items-center justify-center mx-auto shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)] relative">
                      {profilePhoto ? (
                        <img 
                          src={profilePhoto} 
                          alt={userData.name}
                          className="w-full h-full object-cover"
                          onError={() => setProfilePhoto(null)}
                        />
                      ) : (
                        <span className="text-4xl font-bold text-white">
                          {userData.name?.charAt(0) || 'U'}
                        </span>
                      )}
                      <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse"></div>
                    </div>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300 hover:scale-110 border-2 border-white/20"
                      disabled={uploading}
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <h2 className="mt-4 text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-mono">
                    {userData.name}
                  </h2>
                  <p className="text-sm text-gray-400 font-mono mt-1 flex items-center justify-center gap-2">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    MEMBER SINCE {userData.created_at ? new Date(userData.created_at).getFullYear() : '2024'}
                  </p>
                  
                  {profilePhoto && (
                    <button
                      onClick={handleDeletePhoto}
                      className="mt-3 text-sm text-red-400 hover:text-red-300 flex items-center justify-center gap-1 mx-auto font-mono transition-colors duration-300 hover:scale-105"
                      disabled={uploading}
                    >
                      <Trash2 className="w-3 h-3" />
                      REMOVE PHOTO
                    </button>
                  )}
                  
                  {uploading && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                      <span className="text-xs text-gray-400 font-mono">UPLOADING...</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 font-mono">ACCOUNT STATUS</span>
                    <span className="text-green-400 flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3 h-3 animate-pulse" />
                      ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-400 font-mono">AGENT ID</span>
                    <span className="text-gray-300 font-mono text-xs bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      #{userData.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-400 font-mono">SECURITY LEVEL</span>
                    <span className="text-purple-400 flex items-center gap-1 font-mono">
                      <Shield className="w-3 h-3" />
                      ENCRYPTED
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Info Card */}
              <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 lg:col-span-2 shadow-[0_0_80px_-20px_rgba(255,0,255,0.05)] overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 rounded-2xl blur opacity-20"></div>
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-shine"></div>
                
                <div className="relative">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-mono tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      PERSONAL INFORMATION
                    </h3>
                    {!isEditing && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => setIsEditing(true)}
                        className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono"
                      >
                        EDIT PROFILE
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">
                          FULL NAME
                        </label>
                        <div className="relative group/input">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                            required
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-cyan-500/5 opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">
                          EMAIL ADDRESS
                        </label>
                        <div className="relative group/input">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                            required
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold py-2.5 rounded-xl shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.5)] transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-mono tracking-wider"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              SAVING...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              SAVE CHANGES
                            </>
                          )}
                        </button>
                        <button 
                          type="button" 
                          onClick={handleCancel}
                          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-gray-300 hover:text-white font-bold py-2.5 rounded-xl transition-all duration-300 font-mono tracking-wider"
                        >
                          <X className="w-4 h-4 inline mr-2" />
                          CANCEL
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/20 transition-all duration-300">
                        <User className="w-5 h-5 text-purple-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 font-mono tracking-wider">FULL NAME</p>
                          <p className="text-sm font-bold text-white font-mono">{userData.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-300">
                        <Mail className="w-5 h-5 text-cyan-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 font-mono tracking-wider">EMAIL ADDRESS</p>
                          <p className="text-sm font-bold text-white font-mono">{userData.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <Calendar className="w-5 h-5 text-pink-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 font-mono tracking-wider">MEMBER SINCE</p>
                          <p className="text-sm font-bold text-white font-mono">
                            {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes shine {
          from { transform: translateX(-100%) rotate(45deg); }
          to { transform: translateX(100%) rotate(45deg); }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-shine {
          animation: shine 4s ease-in-out infinite;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        
        .glitch-wrapper {
          position: relative;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #06b6d4);
          border-radius: 2px;
        }
        
        /* Smooth transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
        
        /* Input autofill override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill,
        textarea:-webkit-autofill:hover,
        textarea:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px rgba(0,0,0,0.5) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
};