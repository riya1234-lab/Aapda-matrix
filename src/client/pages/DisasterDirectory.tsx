import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { DisasterCard, DISASTER_DIRECTORY } from '../components/DisasterCard';
import { DisasterType } from '../types';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const DisasterDirectory: React.FC = () => {
  const navigate = useNavigate();

  const handleSelect = (type: DisasterType) => {
    navigate(`/disasters/${type.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/home')}
              className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Disaster SOS Protocols
              </h2>
              <p className="text-xs text-slate-500">
                Select your specific disaster context for verified safety checklists & dispatch
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-1">
            {DISASTER_DIRECTORY.map((disaster) => (
              <DisasterCard
                key={disaster.type}
                disaster={disaster}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
