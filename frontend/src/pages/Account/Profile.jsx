import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';

const Profile = () => {
  const { user, registerPasskey, unlinkPasskey, updateProfileDetails, changeUserPassword, verifyCurrentPassword } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Profile details edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Avatar upload states
  const fileInputRef = useRef(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [avatarError, setAvatarError] = useState(null);

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Map and Location States
  const { isLoaded: isMapApiLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [mapCenter, setMapCenter] = useState(user?.homeLocation?.lat ? { lat: user.homeLocation.lat, lng: user.homeLocation.lng } : { lat: 6.9271, lng: 79.8612 }); // Default to Colombo
  const [homeMarker, setHomeMarker] = useState(user?.homeLocation?.lat ? { lat: user.homeLocation.lat, lng: user.homeLocation.lng } : null);
  const [homeAddress, setHomeAddress] = useState(user?.homeLocation?.address || '');
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState(null);

  const reverseGeocode = (lat, lng) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setHomeAddress(results[0].formatted_address);
      }
    });
  };

  const handleMapClick = useCallback((e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setHomeMarker({ lat: newLat, lng: newLng });
    reverseGeocode(newLat, newLng);
  }, []);

  const handlePlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();
        setMapCenter({ lat: newLat, lng: newLng });
        setHomeMarker({ lat: newLat, lng: newLng });
        setHomeAddress(place.formatted_address);
      }
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          setMapCenter({ lat: newLat, lng: newLng });
          setHomeMarker({ lat: newLat, lng: newLng });
          reverseGeocode(newLat, newLng);
        },
        () => {
          setLocationFeedback({ type: 'error', text: 'Geolocation permission denied or unavailable.' });
        }
      );
    }
  };

  const saveHomeLocation = async () => {
    if (!homeMarker) return;
    setIsSavingLocation(true);
    setLocationFeedback(null);
    try {
      await updateProfileDetails({
        homeLocation: {
          lat: homeMarker.lat,
          lng: homeMarker.lng,
          address: homeAddress
        }
      });
      setLocationFeedback({ type: 'success', text: 'Home location saved successfully!' });
      setTimeout(() => setLocationFeedback(null), 3000);
    } catch (err) {
      setLocationFeedback({ type: 'error', text: 'Failed to save location.' });
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setRegistering(true);
    setFeedback(null);
    try {
      await registerPasskey();
      setFeedback({ type: 'success', text: 'Passkey linked to your account successfully!' });
    } catch (err) {
      const isCancellation = err.name === 'NotAllowedError' || err.message?.includes('NotAllowedError');
      setFeedback({
        type: 'error',
        text: isCancellation ? 'Passkey registration was cancelled.' : (err.response?.data?.message || err.message || 'Failed to register passkey. Try again.'),
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleUnlinkPasskey = async () => {
    setUnlinking(true);
    setFeedback(null);
    try {
      await unlinkPasskey();
      setFeedback({ type: 'success', text: 'Passkey unlinked from your account successfully!' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to unlink passkey. Try again.',
      });
    } finally {
      setUnlinking(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError('Name is required.');
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const formData = new FormData();
      formData.append('name', editName.trim());
      await updateProfileDetails(formData);
      setIsEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be less than 5MB.');
      return;
    }

    setUploadingPicture(true);
    setAvatarError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      await updateProfileDetails(formData);
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleVerifyCurrentPasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', text: 'Current password is required.' });
      return;
    }

    setVerifyingPassword(true);
    try {
      await verifyCurrentPassword(currentPassword);
      setCurrentPasswordVerified(true);
      setPasswordFeedback({ type: 'success', text: 'Current password verified. You can now enter your new password.' });
      setTimeout(() => {
        setPasswordFeedback(null);
      }, 1500);
    } catch (err) {
      setPasswordFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Current password is incorrect.',
      });
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (user.linkedMethods?.password && !currentPasswordVerified) {
      setPasswordFeedback({ type: 'error', text: 'Please verify your current password first.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordFeedback({ type: 'error', text: 'New password cannot be the same as your current password.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setChangingPassword(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setPasswordFeedback({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPasswordVerified(false);
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordFeedback(null);
      }, 2000);
    } catch (err) {
      setPasswordFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="glass-panel rounded-3xl shadow-xl overflow-hidden relative">
        {/* Top visual brand banner */}
        <div className="h-32 bg-gradient-to-r from-primary to-primary-light relative flex items-end px-8 pb-4">
          <div className="absolute top-4 right-4 bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Customer Profile
          </div>
          <div className="flex items-center gap-4 translate-y-8">
            {/* Avatar block with upload trigger */}
            <div 
              onClick={handleAvatarClick}
              className="w-20 h-20 relative rounded-2xl shadow-lg cursor-pointer group overflow-hidden border-4 border-white dark:border-charcoal-light bg-white dark:bg-charcoal flex items-center justify-center transition-transform hover:scale-[1.03]"
            >
              {uploadingPicture ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.name} 
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span className="text-3xl font-bold text-primary dark:text-primary-light">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
              
              {/* Overlay edit label */}
              <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
                <svg className="w-5 h-5 mb-1 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <span className="text-[10px] font-extrabold tracking-wider uppercase">Change</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/90">Photo</span>
              </div>
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />

            <div className="mb-2">
              <h1 className="text-xl font-bold text-white drop-shadow-md">{user.name}</h1>
              <p className="text-xs text-white/80 drop-shadow-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 pt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Account Details */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-2 mb-4">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">
                  Profile Details
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditName(user.name);
                      setEditError(null);
                    }}
                    className="text-xs font-bold text-primary hover:text-primary-light transition-colors"
                  >
                    Edit Details
                  </button>
                )}
              </div>

              {avatarError && (
                <div className="p-2.5 mb-4 text-xs bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-200/50 dark:border-red-500/20 rounded-xl leading-relaxed">
                  ⚠️ {avatarError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                {isEditing ? (
                  <div className="space-y-2 col-span-1 sm:col-span-2 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-200/50 dark:border-white/5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                      Display Name
                    </label>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 max-w-md">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your Name"
                        className="flex-1 min-w-[200px] px-3 py-1.5 bg-white dark:bg-charcoal border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-4 py-1.5 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-lg shadow transition-all"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                    {editError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠️</span>{editError}</p>}
                  </div>
                ) : (
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                      Display Name
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 font-semibold">{user.name}</span>
                  </div>
                )}

                {!isEditing && (
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                      Email Address
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 font-semibold">{user.email}</span>
                  </div>
                )}

                <div className={isEditing ? 'col-span-1 sm:col-span-2' : ''}>
                  <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                    Account Status
                  </span>
                  {user.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      Pending Verification
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                    Identity Provider
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full capitalize">
                    {user.provider === 'google' && '🔵 '}
                    {user.provider === 'facebook' && '🔵 '}
                    {user.provider === 'local' && '🔑 '}
                    {user.provider}
                  </span>
                </div>
              </div>

              {/* ── Home Delivery Address ── */}
              <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">
                    Home Delivery Address
                  </h2>
                  <button 
                    onClick={saveHomeLocation}
                    disabled={isSavingLocation || !homeMarker}
                    className="text-xs font-bold bg-primary hover:bg-primary-light text-white px-4 py-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isSavingLocation ? 'Saving...' : 'Save Location'}
                  </button>
                </div>

                {locationFeedback && (
                  <div className={`p-2.5 mb-4 text-xs rounded-xl ${
                    locationFeedback.type === 'success' 
                      ? 'bg-green-50 text-green-600 border border-green-200' 
                      : 'bg-red-50 text-red-500 border border-red-200'
                  }`}>
                    {locationFeedback.type === 'success' ? '✅ ' : '⚠️ '}{locationFeedback.text}
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-200/50 dark:border-white/5 space-y-4">
                  {isMapApiLoaded ? (
                    <>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Autocomplete onLoad={(auto) => (autocompleteRef.current = auto)} onPlaceChanged={handlePlaceChanged}>
                            <input
                              type="text"
                              placeholder="Search for an address..."
                              className="w-full px-3 py-2 bg-white dark:bg-charcoal border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </Autocomplete>
                        </div>
                        <button
                          onClick={handleCurrentLocation}
                          className="px-3 py-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors"
                          title="Use current location"
                        >
                          📍 GPS
                        </button>
                      </div>

                      <div className="h-64 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-white/10">
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%' }}
                          center={mapCenter}
                          zoom={15}
                          onClick={handleMapClick}
                          options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                          }}
                        >
                          {homeMarker && <Marker position={homeMarker} />}
                        </GoogleMap>
                      </div>

                      {homeAddress && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <span className="mt-0.5">🏠</span>
                          <span className="font-medium">{homeAddress}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-gray-500">
                      Loading map...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-2 mb-4">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">
                  Password & Security
                </h2>
                {!showPasswordForm && (
                  <button
                    onClick={() => {
                      setShowPasswordForm(true);
                      setCurrentPasswordVerified(false);
                      setPasswordFeedback(null);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-xs font-bold text-primary hover:text-primary-light transition-colors"
                  >
                    {user.linkedMethods?.password ? 'Change Password' : 'Set Password'}
                  </button>
                )}
              </div>

              {showPasswordForm ? (
                <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-2xl border border-gray-200/50 dark:border-white/5 max-w-md">
                  {passwordFeedback && (
                    <div className={`p-3 mb-4 text-xs border rounded-xl leading-relaxed animate-slide-up ${
                      passwordFeedback.type === 'success' 
                        ? 'bg-green-50 dark:bg-green-500/10 border-green-200/50 dark:border-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-500/10 border-red-200/50 dark:border-red-500/20 text-red-500'
                    }`}>
                      {passwordFeedback.type === 'success' ? '✅ ' : '⚠️ '}{passwordFeedback.text}
                    </div>
                  )}

                  {user.linkedMethods?.password && !currentPasswordVerified ? (
                    <form onSubmit={handleVerifyCurrentPasswordSubmit} className="space-y-4 animate-slide-up">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-1.5 bg-white dark:bg-charcoal border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={verifyingPassword}
                          className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5"
                        >
                          {verifyingPassword ? (
                            <>
                              <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Verifying...
                            </>
                          ) : 'Verify Password'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordFeedback(null);
                            setCurrentPassword('');
                          }}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleChangePasswordSubmit} className="space-y-4 animate-slide-up">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-1.5 bg-white dark:bg-charcoal border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full px-3 py-1.5 bg-white dark:bg-charcoal border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={changingPassword}
                          className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5"
                        >
                          {changingPassword ? (
                            <>
                              <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              {user.linkedMethods?.password ? 'Updating...' : 'Setting...'}
                            </>
                          ) : (user.linkedMethods?.password ? 'Update Password' : 'Set Password')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordFeedback(null);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setCurrentPasswordVerified(false);
                          }}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.linkedMethods?.password
                    ? 'Update your account password. We recommend using a strong, unique password.'
                    : 'You currently sign in using an external provider. Set a password to enable direct email and password login.'}
                </p>
              )}
            </div>

            {/* Passkeys Configuration Section */}
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-white/5 pb-2 mb-4">
                Biometric Login & Passkeys
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Passkeys let you sign in securely using your device's fingerprint scanner, facial recognition, or screen PIN. Link a passkey to bypass passwords entirely.
              </p>

              {feedback && (
                <div
                  className={`p-3.5 border rounded-xl text-xs flex items-start gap-2 mb-4 leading-relaxed ${
                    feedback.type === 'success'
                      ? 'bg-green-50 dark:bg-green-500/10 border-green-200/50 dark:border-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-500/10 border-red-200/50 dark:border-red-500/20 text-red-500'
                  }`}
                >
                  <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
                  <span>{feedback.text}</span>
                </div>
              )}

              {user.linkedMethods?.passkey ? (
                <div className="flex flex-wrap items-center gap-3 animate-slide-up">
                  <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-3 py-2 rounded-xl border border-green-200/30 dark:border-green-500/20">
                    🟢 Device Passkey is Linked
                  </span>
                  <button
                    onClick={handleUnlinkPasskey}
                    disabled={unlinking}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-600/70 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    {unlinking ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Unlinking...
                      </>
                    ) : (
                      <>
                        <span>🔓</span> Unlink Device Passkey
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRegisterPasskey}
                  disabled={registering}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-light disabled:bg-primary/70 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {registering ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Contacting Authenticator...
                    </>
                  ) : (
                    <>
                      <span>🔑</span> Link Device Passkey
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Authentication Links Right-Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
                Linked Authentication
              </h3>
              <ul className="space-y-3.5">
                <li className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Email & Password</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${user.linkedMethods?.password ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-white/5'}`}>
                    {user.linkedMethods?.password ? 'Active' : 'Not Set'}
                  </span>
                </li>
                <li className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Google Connection</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${user.linkedMethods?.google ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-white/5'}`}>
                    {user.linkedMethods?.google ? 'Linked' : 'Not Linked'}
                  </span>
                </li>
                <li className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Facebook Connection</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${user.linkedMethods?.facebook ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-white/5'}`}>
                    {user.linkedMethods?.facebook ? 'Linked' : 'Not Linked'}
                  </span>
                </li>
                <li className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Device Passkeys</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${user.linkedMethods?.passkey ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-white/5'}`}>
                    {user.linkedMethods?.passkey ? 'Linked' : 'Not Linked'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
