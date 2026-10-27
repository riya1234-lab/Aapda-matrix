import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Languages, RefreshCw, Shield, Radio, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { useAuth } from '../context/AuthContext';
import { SupportedLanguage } from '../types';

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { isInternetReachable, pendingQueueCount, isSyncing, triggerManualSync } = useConnectivity();
  const { user, isOperator } = useAuth();

  const isCommandCenter = location.pathname.startsWith('/command-center');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-critical-red animate-ping absolute opacity-75" />
            <span className="w-3.5 h-3.5 rounded-full bg-critical-red relative" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-critical-red transition-colors">
              AAPDA MATRIX
            </span>
            <span className="text-xs font-black px-1.5 py-0.5 rounded bg-red-100 text-critical-red">
              V4.0
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Offline/Sync indicator */}
          {!isInternetReachable ? (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold">
              <Radio className="w-3 h-3 animate-pulse text-amber-600" />
              <span>OFFLINE {pendingQueueCount > 0 ? `(${pendingQueueCount} queued)` : ''}</span>
            </div>
          ) : pendingQueueCount > 0 ? (
            <button
              onClick={() => triggerManualSync()}
              disabled={isSyncing}
              className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Syncing ({pendingQueueCount})</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-success-green animate-pulse" />
              <span>LIVE</span>
            </div>
          )}

          {/* Language Selector Dropdown */}
          <div className="relative flex items-center bg-slate-100 hover:bg-slate-200 rounded-lg px-2 py-1 transition-colors">
            <Languages className="w-3.5 h-3.5 text-slate-600 mr-1" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="mr">मराठी</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={() => window.location.reload()}
            title="Refresh Status"
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Operator / Commander Shortcut */}
          {!isCommandCenter && (
            <button
              onClick={() => navigate('/command-center')}
              className="hidden sm:flex items-center gap-1 text-xs font-bold text-brand-blue bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Command Center</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
