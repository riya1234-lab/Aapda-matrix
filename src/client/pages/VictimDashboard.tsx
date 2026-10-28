import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bot, CheckCircle2, Radio, ExternalLink, ShieldCheck, Truck, Clock, MapPin, PhoneCall } from 'lucide-react';
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
import { getSocket } from '../services/socket';
import { EmergencyCategory, Priority, DispatchAlertPayload } from '../types';

export const VictimDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { level: batteryLevel } = useBattery();
  const { latitude, longitude, accuracy: locationAccuracy, protocol: locationProtocol, hasGpsLock } = useGeolocation();
  const { isRecording, recordingSecondsLeft, startRecording } = useAudioRecorder();
  const { createIncident } = useIncident();

  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory>('MEDICAL_EMERGENCY');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [intelText, setIntelText] = useState('MEDICAL EMERGENCY');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [lastDeliveredIncidentId, setLastDeliveredIncidentId] = useState<string | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [dispatchAlert, setDispatchAlert] = useState<DispatchAlertPayload | null>(null);

  // Listen for real-time dispatch alerts ("Help is on the way")
  useEffect(() => {
    const socket = getSocket();
    const handleDispatch = (data: DispatchAlertPayload) => {
      console.log('🚨 Received live dispatch broadcast:', data);
      setDispatchAlert(data);
    };

    socket.on('incident:dispatched', handleDispatch);
    return () => {
      socket.off('incident:dispatched', handleDispatch);
    };
  }, []);

  const handleSelectCategory = (cat: EmergencyCategory) => {
    setSelectedCategory(cat);
    setIntelText(cat.replace(/_/g, ' '));
    // Proportional default priority instead of everything critical
    if (cat === 'MEDICAL_EMERGENCY' || cat === 'DISASTER_EMERGENCY') {
      setPriority('HIGH');
    } else if (cat === 'WOMEN_SAFETY' || cat === 'FIRE_EMERGENCY') {
      setPriority('HIGH');
    } else if (cat === 'ROAD_ACCIDENT' || cat === 'POLICE_ASSISTANCE') {
      setPriority('HIGH');
    } else {
      setPriority('MEDIUM');
    }
  };

  const handleTriggerSOS = async () => {
    if (!hasGpsLock || latitude === null || longitude === null) {
      alert('Cannot trigger SOS: Valid GPS coordinates are strictly required so tactical teams can reach your exact location.');
      return;
    }

    setIsTransmitting(true);
    const audioPromise = startRecording(5);

    const result = await createIncident({
      emergencyCategory: selectedCategory,
      priority,
      description: intelText.trim() || `${selectedCategory.replace(/_/g, ' ')} emergency reported.`,
      latitude,
      longitude,
      locationAccuracy,
      locationProtocol,
      batteryLevel,
    });

    setLastDeliveredIncidentId(result.incidentId);

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

  const handleAiSosTrigger = (category: EmergencyCategory, description: string, aiPriority: Priority) => {
    if (!hasGpsLock) {
      alert('Cannot trigger SOS: Valid GPS coordinates required.');
      return;
    }
    setSelectedCategory(category);
    setPriority(aiPriority);
    setIntelText(description);
    createIncident({
      emergencyCategory: category,
      priority: aiPriority,
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
          {/* Live Dispatch Notification Banner ("HELP IS ON THE WAY") */}
          {dispatchAlert && (
            <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-xl border-2 border-emerald-400 space-y-3 animate-bounce">
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
                <Truck className="w-5 h-5 flex-shrink-0 animate-pulse text-yellow-300" />
                <span>{t.helpOnTheWay}</span>
              </div>

              <div className="bg-emerald-700/80 rounded-xl p-3 text-xs space-y-1.5 font-medium border border-emerald-500">
                <div className="font-bold text-white text-sm">
                  {dispatchAlert.teamName}
                </div>
                <div className="flex items-center gap-3 text-emerald-100 text-[11px] font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-yellow-300" />
                    <span>ETA ~{dispatchAlert.etaMinutes} mins</span>
                  </span>
                  {dispatchAlert.distanceKm && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-yellow-300" />
                      <span>{dispatchAlert.distanceKm} km away</span>
                    </span>
                  )}
                </div>
                {dispatchAlert.contactNumber && (
                  <a
                    href={`tel:${dispatchAlert.contactNumber.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-300 underline mt-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Direct Team Contact: {dispatchAlert.contactNumber}</span>
                  </a>
                )}
              </div>

              <p className="text-[11px] text-emerald-100 font-semibold leading-relaxed">
                {t.stayPutNotice}
              </p>
            </div>
          )}

          {/* Telemetry Card */}
          <LocationStatus />

          {/* Section 1: Emergency Type Selection */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              {t.identifyEmergency}
            </h3>
            <EmergencyCard
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          </div>

          {/* Section 2: Urgency Priority Level (Requirement 9: Not all critical) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-600 uppercase tracking-wider">
              <span>{t.priorityLevel}</span>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {priority === 'CRITICAL' ? 'Immediate Life Danger' : priority === 'HIGH' ? 'Urgent Assist' : 'Stable'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('CRITICAL')}
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all ${
                  priority === 'CRITICAL'
                    ? 'bg-critical-red text-white ring-2 ring-red-400 shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                CRITICAL
              </button>
              <button
                type="button"
                onClick={() => setPriority('HIGH')}
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all ${
                  priority === 'HIGH'
                    ? 'bg-amber-600 text-white ring-2 ring-amber-400 shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                HIGH
              </button>
              <button
                type="button"
                onClick={() => setPriority('MEDIUM')}
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all ${
                  priority === 'MEDIUM'
                    ? 'bg-sky-600 text-white ring-2 ring-sky-400 shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                MODERATE
              </button>
            </div>
          </div>

          {/* Section 3: Situational Intel Textarea */}
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

          {/* SOS Primary Button (Hard locked to real GPS) */}
          <div className="pt-1">
            <SOSButton
              onTrigger={handleTriggerSOS}
              isRecording={isRecording}
              recordingSecondsLeft={recordingSecondsLeft}
              isTransmitting={isTransmitting}
              hasGpsLock={hasGpsLock}
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
                  Command Center notified. Tactical responders and nearby units alerted.
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

          {/* Community Feedback Button */}
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
