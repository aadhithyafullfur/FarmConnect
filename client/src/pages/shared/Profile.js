import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

function Profile() {
  const { user, login, logout } = useContext(AuthContext);
  
  // All state hooks must be defined before any early returns
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || ''
  });

  // Other state hooks that come later
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [validation, setValidation] = useState({
    name: { isValid: true, message: '' },
    email: { isValid: true, message: '' },
    phone: { isValid: true, message: '' }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    emailNotifications: user?.emailNotifications || true,
    smsNotifications: user?.smsNotifications || false,
    marketingEmails: user?.marketingEmails || false,
    twoFactorAuth: user?.twoFactorAuth || false
  });

  // All useEffect hooks
  React.useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  React.useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          logout();
          return;
        }

        const response = await api.get('/auth/profile');
        if (response.data) {
          login({ token, user: response.data });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.response?.status === 401) {
          console.log('Token expired, logging out user');
          logout();
        }
      }
    };

    if (user) {
      fetchLatestProfile();
    }
  }, [user, login, logout]);

  // Check if user is logged in (after all hooks)
  const token = localStorage.getItem('token');
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-6">You must be logged in to view your profile.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Real-time validation function
  const validateField = (field, value) => {
    let isValid = true;
    let message = '';

    switch (field) {
      case 'name':
        if (!value.trim()) {
          isValid = false;
          message = 'Name is required';
        } else if (value.trim().length < 2) {
          isValid = false;
          message = 'Name must be at least 2 characters';
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          isValid = false;
          message = 'Email is required';
        } else if (!emailRegex.test(value)) {
          isValid = false;
          message = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (value && !/^\+?[\d\s-()]{10,15}$/.test(value)) {
          isValid = false;
          message = 'Please enter a valid phone number';
        }
        break;
      default:
        break;
    }

    setValidation(prev => ({
      ...prev,
      [field]: { isValid, message }
    }));

    return isValid;
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const nameValid = validateField('name', profileForm.name);
    const emailValid = validateField('email', profileForm.email);
    const phoneValid = validateField('phone', profileForm.phone);
    
    if (!nameValid || !emailValid || !phoneValid) {
      showMessage('error', 'Please fix the validation errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/profile', profileForm);
      showMessage('success', 'Profile updated successfully!');
      
      // Update the user context with new data
      if (response.data.user) {
        const token = localStorage.getItem('token');
        login({ token, user: response.data.user });
      }
      
      setEditMode(false); // Exit edit mode after successful update
    } catch (error) {
      showMessage('error', error.response?.data?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showMessage('success', 'Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showMessage('error', error.response?.data?.msg || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/settings', settingsForm);
      showMessage('success', 'Settings updated successfully!');
    } catch (error) {
      showMessage('error', error.response?.data?.msg || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeactivation = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDeletion = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      showMessage('error', 'You must type "DELETE MY ACCOUNT" exactly to confirm deletion.');
      return;
    }

    setLoading(true);
    try {
      // Check if user is still authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        showMessage('error', 'You must be logged in to delete your account. Please log in again.');
        logout();
        return;
      }

      await api.delete('/auth/account');
      showMessage('success', 'Account and all data have been permanently deleted');
      
      // Log user out immediately
      setTimeout(() => {
        logout();
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      console.error('Account deletion error:', error);
      
      if (error.response?.status === 401) {
        showMessage('error', 'Your session has expired. Please log in again to delete your account.');
        logout();
      } else {
        showMessage('error', error.response?.data?.msg || 'Failed to delete account');
      }
      
      if (error.response?.status === 401) {
        showMessage('error', 'Your session has expired. Please log in again to delete your account.');
        setTimeout(() => {
          logout();
          window.location.href = '/login';
        }, 2000);
      } else {
        showMessage('error', error.response?.data?.msg || 'Failed to delete account. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleCancelDeletion = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/50 text-green-400' 
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.1)] border border-gray-700/50 overflow-hidden">
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-600/20 to-green-400/20 px-8 py-12 border-b border-gray-700/50">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="text-3xl font-bold text-white">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
                  {user.name}
                </h1>
                <p className="text-gray-400 text-lg capitalize mt-1">
                  {user.role === 'farmer' ? '🌾 Farmer' : '🛒 Buyer'}
                </p>
                <p className="text-green-400 text-sm mt-2">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-8 py-4 border-b border-gray-700/50">
            <div className="flex space-x-8">
              {[
                { key: 'profile', label: 'Profile', icon: '👤' },
                { key: 'password', label: 'Change Password', icon: '🔒' },
                { key: 'settings', label: 'Account Settings', icon: '⚙️' },
                { key: 'security', label: 'Security', icon: '🛡️' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'bg-green-600/20 text-green-400 border border-green-500/50'
                      : 'text-gray-400 hover:text-green-400 hover:bg-green-600/10'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                      editMode 
                        ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <span>{editMode ? '👁️' : '✏️'}</span>
                    <span>{editMode ? 'View Profile' : 'Edit Profile'}</span>
                  </button>
                </div>

                {!editMode ? (
                  /* Profile Details View */
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Personal Information Card */}
                      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                        <h3 className="text-lg font-medium text-green-400 mb-4 flex items-center">
                          <span className="mr-2">👤</span>
                          Personal Information
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-gray-400 text-sm font-medium">Full Name</label>
                            <p className="text-white font-medium text-lg">
                              {user?.name || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm font-medium">Email Address</label>
                            <p className="text-white font-medium">
                              {user?.email || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm font-medium">Account Type</label>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-2xl">
                                {user?.role === 'farmer' ? '🌾' : '🛒'}
                              </span>
                              <span className="text-white font-medium capitalize">
                                {user?.role || 'Not specified'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information Card */}
                      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                        <h3 className="text-lg font-medium text-green-400 mb-4 flex items-center">
                          <span className="mr-2">📞</span>
                          Contact Information
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-gray-400 text-sm font-medium">Phone Number</label>
                            <p className="text-white font-medium">
                              {user?.phone || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm font-medium">Address</label>
                            <p className="text-white font-medium">
                              {user?.address || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <label className="text-gray-400 text-sm font-medium">Member Since</label>
                            <p className="text-white font-medium">
                              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 'Not available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bio Section */}
                    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                      <h3 className="text-lg font-medium text-green-400 mb-4 flex items-center">
                        <span className="mr-2">📝</span>
                        About Me
                      </h3>
                      <p className="text-white leading-relaxed">
                        {user?.bio || 'No bio added yet. Click "Edit Profile" to add information about yourself.'}
                      </p>
                    </div>

                    {/* Account Statistics */}
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6 text-center">
                        <div className="text-3xl mb-2">📊</div>
                        <h4 className="text-green-400 font-medium mb-1">Profile Completion</h4>
                        <p className="text-2xl font-bold text-white">
                          {Math.round(((user?.name ? 1 : 0) + 
                            (user?.email ? 1 : 0) + 
                            (user?.phone ? 1 : 0) + 
                            (user?.address ? 1 : 0) + 
                            (user?.bio ? 1 : 0)) / 5 * 100)}%
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 text-center">
                        <div className="text-3xl mb-2">
                          {user?.role === 'farmer' ? '🌾' : '🛒'}
                        </div>
                        <h4 className="text-blue-400 font-medium mb-1">Account Type</h4>
                        <p className="text-lg font-bold text-white capitalize">
                          {user?.role || 'Not set'}
                        </p>
                      </div>

                      <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6 text-center">
                        <div className="text-3xl mb-2">
                          {user?.isVerified ? '✅' : '⏳'}
                        </div>
                        <h4 className="text-purple-400 font-medium mb-1">Verification Status</h4>
                        <p className="text-lg font-bold text-white">
                          {user?.isVerified ? 'Verified' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit Profile Form */
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                      <h3 className="text-lg font-medium text-green-400 mb-4">Edit Personal Information</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => {
                              const value = e.target.value;
                              setProfileForm({ ...profileForm, name: value });
                              validateField('name', value);
                            }}
                            className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
                              validation.name.isValid 
                                ? 'border-gray-600 focus:ring-green-500' 
                                : 'border-red-500 focus:ring-red-500'
                            }`}
                            placeholder="Enter your full name"
                            required
                          />
                          {!validation.name.isValid && (
                            <p className="text-red-400 text-sm mt-1 flex items-center">
                              <span className="mr-1">⚠️</span>
                              {validation.name.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => {
                              const value = e.target.value;
                              setProfileForm({ ...profileForm, email: value });
                              validateField('email', value);
                            }}
                            className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
                              validation.email.isValid 
                                ? 'border-gray-600 focus:ring-green-500' 
                                : 'border-red-500 focus:ring-red-500'
                            }`}
                            placeholder="Enter your email"
                            required
                          />
                          {!validation.email.isValid && (
                            <p className="text-red-400 text-sm mt-1 flex items-center">
                              <span className="mr-1">⚠️</span>
                              {validation.email.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => {
                              const value = e.target.value;
                              setProfileForm({ ...profileForm, phone: value });
                              validateField('phone', value);
                            }}
                            className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
                              validation.phone.isValid 
                                ? 'border-gray-600 focus:ring-green-500' 
                                : 'border-red-500 focus:ring-red-500'
                            }`}
                            placeholder="Enter your phone number"
                          />
                          {!validation.phone.isValid && (
                            <p className="text-red-400 text-sm mt-1 flex items-center">
                              <span className="mr-1">⚠️</span>
                              {validation.phone.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm font-medium mb-2">
                            Address
                          </label>
                          <input
                            type="text"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter your address"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                      <h3 className="text-lg font-medium text-green-400 mb-4">About Me</h3>
                      <div>
                        <label className="block text-gray-400 text-sm font-medium mb-2">
                          Bio
                        </label>
                        <textarea
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          rows="4"
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Tell us about yourself..."
                          maxLength="500"
                        />
                        <p className="text-gray-500 text-sm mt-2">
                          {profileForm.bio.length}/500 characters
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={loading || !validation.name.isValid || !validation.email.isValid || !validation.phone.isValid}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <span>💾</span>
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          // Reset form to original values
                          setProfileForm({
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            address: user?.address || '',
                            bio: user?.bio || ''
                          });
                          // Reset validation
                          setValidation({
                            name: { isValid: true, message: '' },
                            email: { isValid: true, message: '' },
                            phone: { isValid: true, message: '' }
                          });
                        }}
                        className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-all duration-300 flex items-center space-x-2"
                      >
                        <span>❌</span>
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
                <form onSubmit={handleSettingsUpdate} className="space-y-6">
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <h3 className="text-lg font-medium text-green-400 mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">Email Notifications</h4>
                          <p className="text-gray-400 text-sm">Receive notifications via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.emailNotifications}
                            onChange={(e) => setSettingsForm({ ...settingsForm, emailNotifications: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">SMS Notifications</h4>
                          <p className="text-gray-400 text-sm">Receive notifications via SMS</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.smsNotifications}
                            onChange={(e) => setSettingsForm({ ...settingsForm, smsNotifications: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">Marketing Emails</h4>
                          <p className="text-gray-400 text-sm">Receive promotional emails and updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.marketingEmails}
                            onChange={(e) => setSettingsForm({ ...settingsForm, marketingEmails: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <h3 className="text-lg font-medium text-green-400 mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Enable 2FA</h4>
                        <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.twoFactorAuth}
                          onChange={(e) => setSettingsForm({ ...settingsForm, twoFactorAuth: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                    <h3 className="text-lg font-medium text-green-400 mb-4">Account Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-gray-200">Account Active</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-gray-200">Email Verified</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${profileForm.phone ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                        <span className="text-gray-200">
                          {profileForm.phone ? 'Phone Verified' : 'Phone Not Added'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-red-400 mb-4 flex items-center">
                      <span className="mr-2">⚠️</span>
                      Danger Zone - Permanent Account Deletion
                    </h3>
                    <div className="bg-red-800/20 border border-red-600/30 rounded-lg p-4 mb-4">
                      <h4 className="text-red-300 font-medium mb-2">This action will permanently delete:</h4>
                      <ul className="text-red-200 text-sm space-y-1 ml-4">
                        <li>• Your account and profile information</li>
                        <li>• All your products {user?.role === 'farmer' ? '(you are a farmer)' : ''}</li>
                        <li>• All your orders and purchase history</li>
                        <li>• All notifications and messages</li>
                        <li>• All data from our database</li>
                      </ul>
                    </div>
                    <p className="text-gray-300 mb-4">
                      <strong className="text-red-400">WARNING:</strong> This action is PERMANENT and CANNOT be undone. 
                      All your data will be completely removed from our MongoDB database.
                    </p>
                    <button
                      onClick={handleAccountDeactivation}
                      disabled={loading}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-300 flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Deleting Account...</span>
                        </>
                      ) : (
                        <>
                          <span>🗑️</span>
                          <span>Permanently Delete Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-red-500/50 max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">
                Permanent Account Deletion
              </h2>
              <p className="text-gray-300 text-sm">
                This action cannot be undone!
              </p>
            </div>

            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-6">
              <h3 className="text-red-300 font-medium mb-2">This will permanently delete:</h3>
              <ul className="text-red-200 text-sm space-y-1">
                <li>• Your account and profile</li>
                <li>• All your {user?.role === 'farmer' ? 'products and listings' : 'orders and history'}</li>
                <li>• All notifications and messages</li>
                <li>• All data from our database</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Type <span className="text-red-400 font-bold">"DELETE MY ACCOUNT"</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Type confirmation text here"
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmDeletion}
                disabled={loading || deleteConfirmText !== "DELETE MY ACCOUNT"}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-300 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Delete Forever</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancelDeletion}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;