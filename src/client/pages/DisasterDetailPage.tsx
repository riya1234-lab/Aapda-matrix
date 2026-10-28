import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { LocationStatus } from '../components/LocationStatus';
import { SOSButton } from '../components/SOSButton';
import { DISASTER_DIRECTORY } from '../components/DisasterCard';
import { useIncident } from '../context/IncidentContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useBattery } from '../hooks/useBattery';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { DisasterType, Priority } from '../types';
import { ArrowLeft, CheckCircle2, ShieldAlert, PhoneCall, AlertTriangle, Shield } from 'lucide-react';

export const DisasterDetailPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const disasterType = (type?.toUpperCase() || 'OTHER') as DisasterType;
  const disasterMeta = DISASTER_DIRECTORY.find((d) => d.type === disasterType) || DISASTER_DIRECTORY[0];

  const { createIncident } = useIncident();
  const { latitude, longitude, accuracy, protocol, hasGpsLock } = useGeolocation();
  const { level: batteryLevel } = useBattery();
  const { isRecording, recordingSecondsLeft, startRecording } = useAudioRecorder();

  const [priority, setPriority] = useState<Priority>('HIGH');
  const [trappedCount, setTrappedCount] = useState('');
  const [injuriesNote, setInjuriesNote] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);

  const handleTriggerSOS = async () => {
    if (!hasGpsLock || latitude === null || longitude === null) {
      alert('Cannot trigger SOS: Valid GPS coordinates are strictly required so rescue teams know where to deploy.');
      return;
    }

    setIsTransmitting(true);
    const audioPromise = startRecording(5);

    const desc = `${disasterMeta.title} Emergency. ${
      trappedCount ? `Trapped count: ${trappedCount}. ` : ''
    }${injuriesNote ? `Injuries: ${injuriesNote}` : ''}`.trim();

    const res = await createIncident({
      emergencyCategory: 'NATURAL_DISASTER',
      disasterSubtype: disasterMeta.type,
      priority,
      description: desc,
      latitude,
      longitude,
      locationAccuracy: accuracy,
      locationProtocol: protocol,
      batteryLevel,
    });

    setCreatedIncidentId(res.incidentId);

    audioPromise.then(async (audioBlob) => {
      if (audioBlob && res.incidentId) {
        try {
          await api.uploadAudio(res.incidentId, audioBlob);
        } catch (err) {
          console.warn('Audio upload deferred:', err);
        }
      }
      setIsTransmitting(false);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          {/* Header Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/disasters')}
              className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{disasterMeta.title}</span>
              </h2>
              <span className="text-[11px] font-bold text-critical-red uppercase tracking-wider">
                Priority Rescue Protocol Active
              </span>
            </div>
          </div>

          {/* Telemetry Card */}
          <LocationStatus />

          {/* Urgency & Priority Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black text-slate-700 uppercase tracking-wider">
              <span>{t.priorityLevel}</span>
              <span className="text-[10px] font-mono text-slate-400">Select Urgency</span>
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

          {/* Form details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-black text-slate-600 uppercase tracking-wider">
              <span>Entrapment & Injury Intel</span>
              <span className="text-slate-400 font-bold text-[10px]">(OPTIONAL)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={trappedCount}
                onChange={(e) => setTrappedCount(e.target.value)}
                placeholder="Trapped count (e.g. 4)"
                className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-critical-red"
              />
              <input
                type="text"
                value={injuriesNote}
                onChange={(e) => setInjuriesNote(e.target.value)}
                placeholder="List injuries..."
                className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-critical-red"
              />
            </div>
          </div>

          {/* Trigger SOS Button (strictly requires GPS Lock) */}
          <SOSButton
            onTrigger={handleTriggerSOS}
            isRecording={isRecording}
            recordingSecondsLeft={recordingSecondsLeft}
            isTransmitting={isTransmitting}
            hasGpsLock={hasGpsLock}
          />

          {/* Incident Created Notification */}
          {createdIncidentId && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-xs text-emerald-900 uppercase tracking-wider">
                  DISASTER SOS REGISTERED: {createdIncidentId}
                </span>
                <p className="text-[11px] text-emerald-700 mt-1">
                  NDRF and regional disaster authority notified with your verified coordinates.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/incidents/${createdIncidentId}`)}
                  className="mt-2 text-xs font-bold text-emerald-800 underline"
                >
                  Track incident live &rsaquo;
                </button>
              </div>
            </div>
          )}

          {/* Evacuation & Safety Checklist */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-critical-red" />
              <span>{t.safetySops}</span>
            </h4>

            <div className="space-y-2">
              {disasterMeta.sops.map((sop, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{sop}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calamity-Specific Direct Dialer (No extra confirmation clicks) */}
          <a
            href={`tel:${disasterMeta.helplineNumber}`}
            className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm select-none"
            title={`Immediate Direct Call to ${disasterMeta.helplineName}`}
          >
            <PhoneCall className="w-4 h-4 animate-pulse" />
            <span>Call {disasterMeta.helplineName} ({disasterMeta.helplineNumber})</span>
          </a>
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
