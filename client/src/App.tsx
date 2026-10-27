import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ConnectivityProvider } from './context/ConnectivityContext';
import { IncidentProvider } from './context/IncidentContext';

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

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ConnectivityProvider>
          <IncidentProvider>
            <BrowserRouter>
              <Routes>
                {/* Landing & Portal Gateways */}
                <Route path="/" element={<LandingPortal />} />
                <Route path="/home" element={<VictimDashboard />} />

                {/* SOS & Disasters */}
                <Route path="/sos" element={<UniversalSosPage />} />
                <Route path="/disasters" element={<DisasterDirectory />} />
                <Route path="/disasters/:type" element={<DisasterDetailPage />} />

                {/* AI & Communication */}
                <Route path="/ai-assistant" element={<AIAssistantPage />} />

                {/* Incidents & Tracking */}
                <Route path="/incidents" element={<IncidentsPage />} />
                <Route path="/incidents/:id" element={<IncidentDetailPage />} />

                {/* Contacts & Profile */}
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Protected Mission Command Center */}
                <Route path="/command-center" element={<CommandCenterPage />} />
                <Route path="/command-center/incidents/:id" element={<IncidentDetailPage />} />
                <Route path="/login" element={<LoginPage />} />

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
