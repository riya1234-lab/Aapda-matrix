import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, LayoutGrid, Radio, MapPin, Cpu, Zap, Activity } from 'lucide-react';

export const LandingPortal: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-critical-red selection:text-white">
      {/* Top Header & Branding */}
      <div className="flex flex-col items-center text-center mt-6 sm:mt-12 space-y-3">
        {/* Shield Icon in rounded container matching Screenshot 4 */}
        <div className="w-16 h-16 rounded-2xl bg-white border border-red-100 flex items-center justify-center shadow-md shadow-red-500/10 mb-2">
          <Shield className="w-8 h-8 text-critical-red stroke-[2.2]" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          AAPDA MATRIX
        </h1>

        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-md">
          Next-Gen AI Disaster Response Network
        </p>
      </div>

      {/* Main Two-Portal Grid (Matching Screenshot 4) */}
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        {/* Portal Card 1: VICTIM PORT (EMERGENCY) */}
        <div className="bg-white border-2 border-red-200/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-red-500/5 hover:border-red-400 transition-all duration-300">
          <div className="space-y-4">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-critical-red font-black text-[11px] uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>EMERGENCY</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                I NEED HELP
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
                Victim Port — Report Emergency SOS
              </p>
            </div>

            {/* Feature Chips */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-700">
                <Radio className="w-3.5 h-3.5 text-critical-red" />
                <span>One-Tap SOS</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-700">
                <Zap className="w-3.5 h-3.5 text-critical-red" />
                <span>Bluetooth Mesh</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 col-span-2">
                <MapPin className="w-3.5 h-3.5 text-critical-red" />
                <span>Auto-Location Protocol</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => navigate('/home')}
              className="w-full py-4 px-6 rounded-2xl bg-critical-red hover:bg-red-700 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 active:scale-[0.98] transition-all"
            >
              <span>Open Victim App</span>
              <span className="text-lg">›</span>
            </button>
          </div>
        </div>

        {/* Portal Card 2: COMMAND CENTER (CONTROL CENTER) */}
        <div className="bg-white border-2 border-blue-200/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-blue-500/5 hover:border-blue-400 transition-all duration-300">
          <div className="space-y-4">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand-blue font-black text-[11px] uppercase tracking-wider">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>CONTROL CENTER</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                COMMAND CENTER
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
                Authority Portal — Rescue Coordination
              </p>
            </div>

            {/* Feature Chips */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-700">
                <Cpu className="w-3.5 h-3.5 text-brand-blue" />
                <span>AI Triage Engine</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                <span>Real-time Mapping</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 col-span-2">
                <Activity className="w-3.5 h-3.5 text-brand-blue" />
                <span>Incident Management</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={() => navigate('/command-center')}
              className="w-full py-4 px-6 rounded-2xl bg-brand-blue hover:bg-blue-700 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
            >
              <span>Enter Dashboard</span>
              <span className="text-lg">›</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Tagline (Matching Screenshot 4) */}
      <footer className="text-center text-xs font-medium text-slate-400 py-4">
        Built for the first critical 72 hours of disaster response.
      </footer>
    </div>
  );
};
