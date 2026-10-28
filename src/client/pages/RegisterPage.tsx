import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Mail, Lock, Phone, Activity, Heart, ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const res = await register({
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      password,
      phoneNumber: phoneNumber.trim(),
      bloodGroup,
      allergies: allergies.trim(),
      preferredLanguage: language,
    });
    setIsLoading(false);

    if (res.success) {
      navigate('/home');
    } else {
      setError(res.error || 'Registration failed. Please verify your details.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100 selection:bg-critical-red selection:text-white py-12">
      <div className="max-w-lg w-full space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-critical-red flex items-center justify-center mx-auto shadow-lg shadow-red-600/20">
            <Shield className="w-7 h-7 text-critical-red" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">{t.appTitle}</h1>
          <p className="text-xs text-slate-400 font-medium">Create Your Official Citizen Emergency Profile</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white">Emergency Registration</h2>
            <p className="text-[11px] text-slate-400">
              Your registered name and medical notes will be automatically transmitted with every SOS to emergency responders.
            </p>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800 text-red-300 text-xs p-3.5 rounded-xl flex items-start gap-2">
              <span className="text-sm font-bold">&bull;</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Full Legal Name <span className="text-critical-red">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Anita Sharma"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-critical-red transition-colors"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Email Address <span className="text-critical-red">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="anita@example.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-critical-red transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Phone (with +91)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-critical-red transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Security Password (min 6 characters) <span className="text-critical-red">*</span>
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

            {/* Blood Group & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Heart className="w-3 h-3 text-critical-red" />
                  <span>Blood Group</span>
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-critical-red transition-colors"
                >
                  <option value="A+">A+ (Positive)</option>
                  <option value="A-">A- (Negative)</option>
                  <option value="B+">B+ (Positive)</option>
                  <option value="B-">B- (Negative)</option>
                  <option value="O+">O+ (Positive)</option>
                  <option value="O-">O- (Negative)</option>
                  <option value="AB+">AB+ (Positive)</option>
                  <option value="AB-">AB- (Negative)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Preferred Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-critical-red transition-colors"
                >
                  <option value="en">English (Default)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>
            </div>

            {/* Allergies / Medical Notes */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Activity className="w-3 h-3 text-amber-400" />
                <span>Known Medical Allergies / Conditions (Optional)</span>
              </label>
              <textarea
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Diabetic, Penicillin allergy, Asthma"
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-critical-red transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-critical-red hover:bg-red-700 disabled:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="text-critical-red hover:underline font-bold inline-flex items-center gap-1">
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in here</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
