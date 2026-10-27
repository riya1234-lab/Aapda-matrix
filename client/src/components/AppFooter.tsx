import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, AlertCircle, Phone, User, Flame } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AppFooter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/home', label: t.home, icon: Home },
    { path: '/disasters', label: 'Disasters', icon: Flame },
    { path: '/sos', label: 'Universal SOS', icon: AlertCircle, isSos: true },
    { path: '/contacts', label: t.contacts, icon: Phone },
    { path: '/profile', label: t.profile, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 shadow-lg max-w-lg mx-auto sm:rounded-t-2xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComp = item.icon;

          if (item.isSos) {
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="relative -top-4 flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-critical-red text-white flex items-center justify-center shadow-lg shadow-red-500/40 ring-4 ring-white group-hover:bg-red-700 transition-colors">
                  <IconComp className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-[10px] font-black text-critical-red uppercase tracking-wider mt-1">
                  SOS
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
                isActive ? 'text-critical-red font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <IconComp className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
