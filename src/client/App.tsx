import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConnectivityProvider } from './context/ConnectivityContext';
import { IncidentProvider } from './context/IncidentContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

// Pages
import { LandingPortal } from './pages/LandingPortal';
import { VictimDashboard } from './pages/VictimDashboard';
import { UniversalSosPage } from './pages/UniversalSosPage';
import { DisasterDirectory } from './pages/DisasterDirectory';
import { DisasterDetailPage } from './pages/DisasterDetailPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { ContactsPage } from './pages/ContactsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { LoginPage } from './pages/LoginPage';

// Route Guard 1: Command Center Restricted Access (Victim cannot access Command Center)
const CommandCenterRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOperator, demoLogin } = useAuth();
  const navigate = useNavigate();

  if (!isOperator) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-red-900/80 rounded-3xl p-8 space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-critical-red flex items-center justify-center mx-auto text-critical-red">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight uppercase">
              RESTRICTED OPERATIONAL ZONE
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Command Center access is restricted to authorized tactical personnel. Victims and public citizens cannot enter the tactical operations grid.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3.5 px-4 bg-brand-blue hover:bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              Operator Login
            </button>

            <button
              type="button"
              onClick={() => demoLogin('COMMANDER')}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors border border-slate-700"
            >
              Demo Commander Sign-In
            </button>

            <button
              type="button"
              onClick={() => navigate('/home')}
              className="w-full py-2 px-4 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              &larr; Return to Victim Safety Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Route Guard 2: Victim Portal Restricted from Command Officers (Commander cannot trigger victim SOS)
const VictimRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOperator, logout } = useAuth();
  const navigate = useNavigate();

  if (isOperator) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-blue-900/80 rounded-3xl p-8 space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-950/80 border border-sky-400 flex items-center justify-center mx-auto text-sky-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight uppercase">
              COMMAND OFFICER RESTRICTION
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              You are currently logged in as a Command Officer. To prevent erroneous citizen SOS dispatches, Command Officers cannot access the Citizen Emergency Portal while in command mode.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/command-center')}
              className="w-full py-3.5 px-4 bg-brand-blue hover:bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              Return to Command Center Dashboard
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/home');
              }}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors border border-slate-700"
            >
              Sign Out of Officer Session (Switch to Citizen Mode)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ConnectivityProvider>
          <IncidentProvider>
            <BrowserRouter>
              <Routes>
                {/* Landing Gateway */}
                <Route path="/" element={<LandingPortal />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Victim Portal Routes (Protected from Command Officers) */}
                <Route path="/home" element={<VictimRoute><VictimDashboard /></VictimRoute>} />
                <Route path="/sos" element={<VictimRoute><UniversalSosPage /></VictimRoute>} />
                <Route path="/disasters" element={<VictimRoute><DisasterDirectory /></VictimRoute>} />
                <Route path="/disasters/:type" element={<VictimRoute><DisasterDetailPage /></VictimRoute>} />
                <Route path="/ai-assistant" element={<VictimRoute><AIAssistantPage /></VictimRoute>} />
                <Route path="/incidents" element={<VictimRoute><IncidentsPage /></VictimRoute>} />
                <Route path="/incidents/:id" element={<IncidentDetailPage />} />
                <Route path="/contacts" element={<VictimRoute><ContactsPage /></VictimRoute>} />
                <Route path="/profile" element={<VictimRoute><ProfilePage /></VictimRoute>} />

                {/* Tactical Mission Command Center (Protected from Victims/Citizens) */}
                <Route
                  path="/command-center"
                  element={
                    <CommandCenterRoute>
                      <CommandCenterPage />
                    </CommandCenterRoute>
                  }
                />
                <Route
                  path="/command-center/incidents/:id"
                  element={
                    <CommandCenterRoute>
                      <IncidentDetailPage />
                    </CommandCenterRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </IncidentProvider>
        </ConnectivityProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
