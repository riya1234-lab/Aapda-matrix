import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { useAuth } from '../context/AuthContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { User, Shield, Heart, HardDrive, LogOut, Check, ArrowRight } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isCommander, demoLogin, logout } = useAuth();
  const { pendingQueueCount, triggerManualSync, isSyncing } = useConnectivity();

  const [bloodGroup, setBloodGroup] = useState('B+');
  const [allergies, setAllergies] = useState('Penicillin');
  const [emergencyContact, setEmergencyContact] = useState('Sunita Patel (+91-9899112299)');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-lg">
              {user?.displayName ? user.displayName.charAt(0) : 'U'}
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-sm text-slate-900">
                {user?.displayName || 'Citizen User (Local)'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Role: <span className="text-brand-blue font-bold">{user?.role || 'CITIZEN'}</span>
              </p>
            </div>
          </div>

          {/* Medical ID Form */}
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 text-critical-red font-black text-xs uppercase tracking-wider">
              <Heart className="w-4 h-4" />
              <span>Emergency Medical ID</span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-critical-red"
              >
                <option value="A+">A+ Positive</option>
                <option value="A-">A- Negative</option>
                <option value="B+">B+ Positive</option>
                <option value="B-">B- Negative</option>
                <option value="AB+">AB+ Positive</option>
                <option value="AB-">AB- Negative</option>
                <option value="O+">O+ Positive</option>
                <option value="O-">O- Negative</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Severe Allergies / Conditions</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-critical-red"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Primary Emergency Contact</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-critical-red"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : null}
              <span>{isSaved ? 'Saved Locally' : 'Update Medical ID'}</span>
            </button>
          </form>

          {/* Offline Storage & IndexedDB Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-700 font-black text-xs uppercase tracking-wider">
              <HardDrive className="w-4 h-4 text-slate-500" />
              <span>Offline Database Engine (Dexie IndexedDB)</span>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Pending Outbox Queue:</span>
                <strong className={pendingQueueCount > 0 ? 'text-amber-600' : 'text-slate-800'}>
                  {pendingQueueCount} items
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Storage Protocol:</span>
                <strong className="text-emerald-700">Persistent IndexedDB</strong>
              </div>
            </div>

            {pendingQueueCount > 0 && (
              <button
                type="button"
                onClick={() => triggerManualSync()}
                disabled={isSyncing}
                className="w-full py-2 bg-amber-600 text-white text-xs font-bold rounded-xl"
              >
                {isSyncing ? 'Syncing...' : 'Force Sync Pending Queue'}
              </button>
            )}
          </div>

          {/* Operator Demo Switcher */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-black text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Authority & Tactical Access</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Switch role to inspect the Command Center Mission Control as an authorized commander.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => demoLogin('COMMANDER').then(() => navigate('/command-center'))}
                className="py-2.5 px-3 bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Commander Login
              </button>

              <button
                type="button"
                onClick={() => navigate('/command-center')}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Open Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
