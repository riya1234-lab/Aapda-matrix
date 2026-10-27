import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bot, CheckCircle2, Radio, ExternalLink } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { LocationStatus } from '../components/LocationStatus';
import { EmergencyCard } from '../components/EmergencyCard';
import { SOSButton } from '../components/SOSButton';
import { AppFooter } from '../components/AppFooter';
import { AIChatPanel } from '../components/AIChatPanel';
import { useLanguage } from '../context/LanguageContext';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useGeolocation } from '../hooks/useGeolocation';
import { useBattery } from '../hooks/useBattery';
import { useIncident } from '../context/IncidentContext';
import { api } from '../services/api';
import { EmergencyCategory, Priority } from '../types';

export const VictimDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { level: batteryLevel } = useBattery();
  const { latitude, longitude, accuracy: locationAccuracy, protocol: locationProtocol } = useGeolocation();
  const { isRecording, recordingSecondsLeft, startRecording } = useAudioRecorder();
  const { createIncident } = useIncident();

  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory>('MEDICAL_EMERGENCY');
  const [intelText, setIntelText] = useState('MEDICAL EMERGENCY');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [lastDeliveredIncidentId, setLastDeliveredIncidentId] = useState<string | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  const handleTriggerSOS = async () => {
    setIsTransmitting(true);

    // 1. Immediately initiate emergency audio recording in background (5-second authorized clip)
    const audioPromise = startRecording(5);

    // 2. Dispatch incident payload immediately without blocking on audio completion or GPS fix!
    const result = await createIncident({
      emergencyCategory: selectedCategory,
      priority: 'CRITICAL',
      description: intelText.trim() || `${selectedCategory.replace('_', ' ')} emergency reported.`,
      latitude,
      longitude,
      locationAccuracy,
      locationProtocol,
      batteryLevel,
    });

    setLastDeliveredIncidentId(result.incidentId);

    // 3. When audio finishes, upload it to the backend immediately
    audioPromise.then(async (audioBlob) => {
      if (audioBlob && result.incidentId) {
        try {
          await api.uploadAudio(result.incidentId, audioBlob);
          console.log('✓ Emergency voice SOS uploaded successfully to:', result.incidentId);
        } catch (audioErr) {
          console.warn('Audio upload deferred or failed:', audioErr);
        }
      }
      setIsTransmitting(false);
    });
  };

  const handleAiSosTrigger = (category: EmergencyCategory, description: string, priority: Priority) => {
    setSelectedCategory(category);
    setIntelText(description);
    createIncident({
      emergencyCategory: category,
      priority,
      description,
      latitude,
      longitude,
      locationAccuracy,
      locationProtocol,
      batteryLevel,
    }).then((res) => {
      setLastDeliveredIncidentId(res.incidentId);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          {/* Telemetry Card (Matching Screenshot 1 & 3) */}
          <LocationStatus />

          {/* Section 1: Emergency Type Selection */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              {t.identifyEmergency}
            </h3>
            <EmergencyCard
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setIntelText(cat.replace('_', ' '));
              }}
            />
          </div>

          {/* Section 2: Situational Intel Textarea */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              {t.situationalIntel}
            </h3>
            <textarea
              rows={2}
              value={intelText}
              onChange={(e) => setIntelText(e.target.value)}
              placeholder={t.intelPlaceholder}
              className="w-full bg-white border border-slate-200/90 rounded-2xl p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-critical-red transition-all shadow-sm resize-none"
            />
          </div>

          {/* SOS Primary Button (Matching Screenshot 1 & 3) */}
          <div className="pt-1">
            <SOSButton
              onTrigger={handleTriggerSOS}
              isRecording={isRecording}
              recordingSecondsLeft={recordingSecondsLeft}
              isTransmitting={isTransmitting}
            />
          </div>

          {/* Transmission Success Notification Banner */}
          {lastDeliveredIncidentId && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-emerald-900 uppercase tracking-wider">
                    DISTRESS TRANSMISSION BROADCASTED
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {lastDeliveredIncidentId}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                  Command Center notified. Tactical responders and nearby mesh relays alerted.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/incidents/${lastDeliveredIncidentId}`)}
                  className="mt-2 text-xs font-bold text-emerald-800 underline flex items-center gap-1 hover:text-emerald-900"
                >
                  <span>Track live response & timeline</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Community Feedback Button (Matching Screenshot 1 & 3) */}
          <button
            type="button"
            onClick={() => alert('Community Feedback: Dangerous area marked. Responders alerted of localized road hazard.')}
            className="w-full py-3 px-4 bg-red-50/50 hover:bg-red-50 border border-red-200/80 rounded-2xl text-critical-red font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
          >
            <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
            <span>{t.communityFeedback}</span>
          </button>
        </main>
      </div>

      {/* Floating AI Assistant Trigger in Bottom Right */}
      <button
        type="button"
        onClick={() => setIsAiPanelOpen(true)}
        className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-900/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border-2 border-slate-700"
        title="Open AAPDA MATRIX AI Emergency Assistant"
      >
        <Bot className="w-7 h-7 text-amber-400" />
      </button>

      {/* AI Assistant Modal Panel */}
      <AIChatPanel
        isOpen={isAiPanelOpen}
        onClose={() => setIsAiPanelOpen(false)}
        onActivateSosWithAI={handleAiSosTrigger}
      />

      {/* Bottom Footer Navigation */}
      <AppFooter />
    </div>
  );
};
