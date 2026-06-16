import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { User, Mail, Save, X, Camera, Trash2, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { authService } from '../../services/api';

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
        setProfilePhoto(`http://localhost:8080/${response.profile_photo}`);
      }
    } catch (err) {
      console.error('Error loading profile photo:', err);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    // Validate file size (5MB max)
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
        setProfilePhoto(`http://localhost:8080${response.photo_url}`);
        setSuccess('Profile photo updated successfully!');
        
        // Update user data in localStorage
        const updatedUser = { ...userData, profile_photo: response.photo_url };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
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
      
      // Update user data in localStorage
      const updatedUser = { ...userData, profile_photo: null };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete photo');
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
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="lg:pl-72">
        <Navbar />
        
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Profile Settings</h1>
            <p className="text-gray-500 mb-6">Manage your account settings and profile photo</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Image Section */}
              <Card className="p-6">
                <div className="text-center">
                  <div className="relative inline-block group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mx-auto shadow-lg">
                      {profilePhoto ? (
                        <img 
                          src={profilePhoto} 
                          alt={userData.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl font-bold text-white">
                          {userData.name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    
                    {/* Upload Button Overlay */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                      disabled={uploading}
                    >
                      <Camera className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <h2 className="mt-4 text-xl font-semibold text-gray-800">{userData.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Member since {userData.created_at ? new Date(userData.created_at).getFullYear() : '2024'}
                  </p>
                  
                  {profilePhoto && (
                    <button
                      onClick={handleDeletePhoto}
                      className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center justify-center gap-1 mx-auto"
                      disabled={uploading}
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Photo
                    </button>
                  )}
                  
                  {uploading && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-gray-500">Uploading...</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Account Status</span>
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">Account ID</span>
                    <span className="text-gray-800 font-mono text-xs">#{userData.id}</span>
                  </div>
                </div>
              </Card>

              {/* Profile Details Section */}
              <Card className="lg:col-span-2 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
                  {!isEditing && (
                    <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Saving...' : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="secondary" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <User className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-sm font-medium text-gray-800">{userData.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Email Address</p>
                        <p className="text-sm font-medium text-gray-800">{userData.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};