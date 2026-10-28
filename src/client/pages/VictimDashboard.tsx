import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bot, CheckCircle2, Radio, ExternalLink, ShieldCheck, Truck, Clock, MapPin, PhoneCall, UserCheck, AlertOctagon, RefreshCw } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { LocationStatus } from '../components/LocationStatus';
import { EmergencyCard } from '../components/EmergencyCard';
import { SOSButton } from '../components/SOSButton';
import { AppFooter } from '../components/AppFooter';
import { AIChatPanel } from '../components/AIChatPanel';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();
  const { level: batteryLevel } = useBattery();
  const {
    latitude,
    longitude,
    accuracy: locationAccuracy,
    protocol: locationProtocol,
    hasGpsLock,
    isEmergencyOverrideAllowed,
    userProvidedAddress,
    refreshLocation,
    enableEmergencyOverride,
    setManualAddress,
  } = useGeolocation();
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
    if (!hasGpsLock && !isEmergencyOverrideAllowed) {
      alert('Cannot trigger SOS: Real GPS extraction required, or click Emergency Override to dispatch without GPS.');
      return;
    }

    setIsTransmitting(true);
    const audioPromise = startRecording(5);

    const result = await createIncident({
      emergencyCategory: selectedCategory,
      priority,
      description: intelText.trim() || `${selectedCategory.replace(/_/g, ' ')} emergency reported.`,
      latitude: hasGpsLock ? latitude : null,
      longitude: hasGpsLock ? longitude : null,
      locationAccuracy: hasGpsLock ? locationAccuracy : null,
      locationProtocol: hasGpsLock ? locationProtocol : 'UNAVAILABLE',
      locationStatus: hasGpsLock ? 'GPS_VERIFIED' : userProvidedAddress ? 'USER_PROVIDED' : 'LOCATION_UNAVAILABLE',
      locationSource: hasGpsLock ? 'GPS' : userProvidedAddress ? 'USER_MANUAL' : 'UNAVAILABLE',
      userProvidedAddress,
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
    setSelectedCategory(category);
    setPriority(aiPriority);
    setIntelText(description);
    createIncident({
      emergencyCategory: category,
      priority: aiPriority,
      description,
      latitude: hasGpsLock ? latitude : null,
      longitude: hasGpsLock ? longitude : null,
      locationAccuracy: hasGpsLock ? locationAccuracy : null,
      locationProtocol: hasGpsLock ? locationProtocol : 'UNAVAILABLE',
      locationStatus: hasGpsLock ? 'GPS_VERIFIED' : userProvidedAddress ? 'USER_PROVIDED' : 'LOCATION_UNAVAILABLE',
      locationSource: hasGpsLock ? 'GPS' : userProvidedAddress ? 'USER_MANUAL' : 'UNAVAILABLE',
      userProvidedAddress,
      batteryLevel,
    }).then((res) => {
      setLastDeliveredIncidentId(res.incidentId);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
          {/* Authenticated Victim Identification Banner */}
          {user && (
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Logged in as</span>
                  <span className="text-xs font-black text-slate-800">{user.displayName}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Profile Linked to SOS
              </span>
            </div>
          )}

          {/* Real-Time Live Dispatch Alert Banner ("Help is on the way!") */}
          {dispatchAlert && (
            <div className="bg-red-950/90 border-2 border-critical-red rounded-3xl p-5 shadow-2xl space-y-3 text-white animate-pulse">
              <div className="flex items-center gap-2.5 text-critical-red font-black text-sm tracking-wide uppercase">
                <Truck className="w-6 h-6 animate-bounce" />
                <span>{t.helpOnTheWay}</span>
              </div>

              <p className="text-xs text-slate-100 font-medium leading-relaxed">
                {dispatchAlert.message}
              </p>

              <div className="bg-slate-900/80 rounded-2xl p-3 border border-red-900/40 text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Unit:</span>
                  <strong className="text-white">{dispatchAlert.teamName}</strong>
                </div>
                {dispatchAlert.etaMinutes && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t.etaLabel}:</span>
                    <strong className="text-amber-400">~{dispatchAlert.etaMinutes} mins</strong>
                  </div>
                )}
                {dispatchAlert.contactNumber && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Direct Team Line:</span>
                    <a
                      href={`tel:${dispatchAlert.contactNumber}`}
                      className="text-emerald-400 font-bold underline flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{dispatchAlert.contactNumber}</span>
                    </a>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 text-center font-bold">
                {t.stayPutNotice}
              </p>
            </div>
          )}

          {/* Telemetry Bar (Battery + Real GPS Protocol) */}
          <LocationStatus />

          {/* Optional Landmark / Manual Address when GPS is unavailable */}
          {!hasGpsLock && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-2">
              <label className="text-[11px] font-bold text-amber-900 uppercase block flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Manual Landmark / Street Address (Optional)</span>
              </label>
              <input
                type="text"
                value={userProvidedAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="e.g. Near Metro Pillar 140, Main Market"
                className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="text-[10px] text-amber-700">
                Responders will use this user-provided address to locate you if GPS hardware coordinates cannot be acquired.
              </p>
            </div>
          )}

          {/* 2x2 Emergency Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase block">
              {t.identifyEmergency}
            </span>

            <EmergencyCard
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          </div>

          {/* Dynamic Proportional Priority Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                {t.priorityLevel}
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                  priority === 'CRITICAL'
                    ? 'bg-red-100 text-critical-red border border-red-300'
                    : priority === 'HIGH'
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : priority === 'MEDIUM'
                    ? 'bg-blue-100 text-brand-blue border border-blue-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                {priority}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['CRITICAL', 'HIGH', 'MEDIUM'] as Priority[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPriority(lvl)}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all ${
                    priority === lvl
                      ? lvl === 'CRITICAL'
                        ? 'bg-critical-red text-white shadow-md'
                        : lvl === 'HIGH'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-brand-blue text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Situational Intel Textarea */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase block">
              {t.situationalIntel}
            </span>
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-critical-red">
              <textarea
                value={intelText}
                onChange={(e) => setIntelText(e.target.value)}
                placeholder={t.intelPlaceholder}
                rows={2}
                className="w-full p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none font-medium"
              />
            </div>
          </div>

          {/* Activate SOS Primary Button */}
          <SOSButton
            onTrigger={handleTriggerSOS}
            isRecording={isRecording}
            recordingSecondsLeft={recordingSecondsLeft}
            isTransmitting={isTransmitting}
            hasGpsLock={hasGpsLock}
            isEmergencyOverrideAllowed={isEmergencyOverrideAllowed}
            onRetryGps={refreshLocation}
            onEnableOverride={enableEmergencyOverride}
          />

          {/* AI Emergency Triage Assistant Trigger */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-3.5 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-critical-red/50 flex items-center justify-center">
                <Bot className="w-4 h-4 text-critical-red" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-white">AI Emergency Triage</h4>
                <p className="text-[10px] text-slate-300">Deterministic local NLP triage</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAiPanelOpen(true)}
              className="py-1.5 px-3 bg-critical-red hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors"
            >
              Consult AI
            </button>
          </div>

          {/* Confirmation pill after incident delivery */}
          {lastDeliveredIncidentId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-800 font-mono shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Distress Beacon: <strong>{lastDeliveredIncidentId}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/my-incidents')}
                className="text-[11px] font-bold text-emerald-700 underline flex items-center gap-0.5"
              >
                Track &rsaquo;
              </button>
            </div>
          )}

          {/* Community Feedback Button matching Screenshot 3 */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => navigate('/disaster/other')}
              className="w-full py-3 px-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="uppercase tracking-wider text-[11px]">{t.communityFeedback}</span>
            </button>
          </div>
        </main>
      </div>

      <AIChatPanel
        isOpen={isAiPanelOpen}
        onClose={() => setIsAiPanelOpen(false)}
        onTriggerSos={handleAiSosTrigger}
      />

      <AppFooter />
    </div>
  );
};
