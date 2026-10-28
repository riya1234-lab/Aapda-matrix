import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { User, Shield, Heart, HardDrive, LogOut, Check, Phone, Mail, Globe, AlertCircle, LogIn, UserPlus } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile, logout, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { pendingQueueCount, triggerManualSync, isSyncing } = useConnectivity();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Populate from authenticated user
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
      setBloodGroup(user.bloodGroup || 'O+');
      setAllergies(user.allergies || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');
    setErrorMessage('');

    const res = await updateProfile({
      displayName: displayName.trim(),
      phoneNumber: phoneNumber.trim(),
      bloodGroup,
      allergies: allergies.trim(),
      address: address.trim(),
      preferredLanguage: language,
    });

    setIsSaving(false);
    if (res.success) {
      setSaveMessage('Profile saved successfully to database!');
      await refreshProfile();
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setErrorMessage(res.error || 'Failed to update profile.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          {/* User Identity Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-lg border-2 border-slate-700 shadow-inner">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {user?.displayName || 'Guest Citizen (Unauthenticated)'}
                </h3>
                <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{user?.email || 'No email registered'}</span>
                </p>
              </div>
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 text-slate-400 hover:text-critical-red hover:bg-red-50 rounded-xl transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to="/login"
                className="py-1.5 px-3 bg-critical-red hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {!isAuthenticated && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Unauthenticated Session</strong>
                <span>
                  Register or log in so your genuine name and emergency medical ID are automatically attached to distress beacons in the Command Center.{' '}
                  <Link to="/register" className="font-bold underline text-amber-900">
                    Register Account
                  </Link>
                </span>
              </div>
            </div>
          )}

          {/* Feedback Banners */}
          {saveMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">{saveMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Profile & Medical ID Form */}
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-critical-red font-black text-xs uppercase tracking-wider">
                <User className="w-4 h-4" />
                <span>Victim Profile & Emergency ID</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">DB PERSISTED</span>
            </div>

            {/* Display Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Full Registered Name <span className="text-critical-red">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Full Legal Name"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-critical-red"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Contact Phone</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91-9876543210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-critical-red"
              />
            </div>

            {/* Blood Group */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                <Heart className="w-3 h-3 text-critical-red" />
                <span>Blood Group</span>
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-critical-red"
              >
                <option value="A+">A+ (Positive)</option>
                <option value="A-">A- (Negative)</option>
                <option value="B+">B+ (Positive)</option>
                <option value="B-">B- (Negative)</option>
                <option value="AB+">AB+ (Positive)</option>
                <option value="AB-">AB- (Negative)</option>
                <option value="O+">O+ (Positive)</option>
                <option value="O-">O- (Negative)</option>
              </select>
            </div>

            {/* Allergies & Conditions */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Known Medical Allergies / Medical Notes
              </label>
              <textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                rows={2}
                placeholder="e.g. Diabetic, Asthma, Penicillin allergy"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-critical-red resize-none"
              />
            </div>

            {/* Address / Landmark */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                Home Address / Primary Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sector 12, Dwarka, New Delhi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-critical-red"
              />
            </div>

            {/* Preferred Language */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                <Globe className="w-3 h-3 text-brand-blue" />
                <span>Preferred Interface Language</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-critical-red"
              >
                <option value="en">English (Official)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-black disabled:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{isSaving ? 'Saving Changes...' : 'Update & Persist Profile'}</span>
            </button>
          </form>

          {/* Offline Outbox Queue Info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-700 font-black text-xs uppercase tracking-wider">
              <HardDrive className="w-4 h-4 text-slate-500" />
              <span>Offline Database Engine (Dexie IndexedDB)</span>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Pending Offline Beacons:</span>
                <strong className={pendingQueueCount > 0 ? 'text-amber-600 font-black' : 'text-slate-800'}>
                  {pendingQueueCount} items
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Durable Store:</span>
                <strong className="text-emerald-700">Dexie v4 IndexedDB</strong>
              </div>
            </div>

            {pendingQueueCount > 0 && (
              <button
                type="button"
                onClick={() => triggerManualSync()}
                disabled={isSyncing}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                {isSyncing ? 'Synchronizing...' : 'Force Sync Pending Beacons'}
              </button>
            )}
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
