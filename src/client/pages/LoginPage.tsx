import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, UserPlus, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      navigate('/home');
    } else {
      setError(res.error || 'Invalid credentials. Please check your email and password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100 selection:bg-critical-red selection:text-white">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-critical-red flex items-center justify-center mx-auto shadow-lg shadow-red-600/20">
            <Shield className="w-7 h-7 text-critical-red" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">{t.appTitle}</h1>
          <p className="text-xs text-slate-400 font-medium">Citizen Emergency Lifeline &bull; Secure Victim Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Sign In to Your Lifeline</h2>
              <p className="text-[11px] text-slate-400">Access emergency circle, profile & dispatch tracking</p>
            </div>
            <HeartPulse className="w-5 h-5 text-critical-red animate-pulse" />
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800 text-red-300 text-xs p-3.5 rounded-xl flex items-start gap-2">
              <span className="text-sm font-bold">&bull;</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@example.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-critical-red transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-critical-red transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-critical-red hover:bg-red-700 disabled:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Signing In...' : 'Access Victim Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Links & Register */}
          <div className="border-t border-slate-800 pt-4 space-y-3 text-center">
            <p className="text-xs text-slate-400">
              Don't have an emergency profile yet?{' '}
              <Link to="/register" className="text-critical-red hover:underline font-bold inline-flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register here</span>
              </Link>
            </p>

            <Link
              to="/home"
              className="inline-block text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              &larr; Continue as Anonymous Guest / Direct SOS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
