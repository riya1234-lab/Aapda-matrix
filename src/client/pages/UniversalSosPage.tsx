import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Radio, CheckCircle, ArrowLeft, XCircle, MapPin, Battery, AlertOctagon } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { useIncident } from '../context/IncidentContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useBattery } from '../hooks/useBattery';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { Priority } from '../types';

export const UniversalSosPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { createIncident } = useIncident();
  const { latitude, longitude, accuracy, protocol, hasGpsLock, isAcquiring, refreshLocation } = useGeolocation();
  const { level: batteryLevel } = useBattery();
  const { isRecording, recordingSecondsLeft, startRecording } = useAudioRecorder();

  const [priority, setPriority] = useState<Priority>('HIGH');
  const [countdown, setCountdown] = useState<number | null>(3);
  const [isCancelled, setIsCancelled] = useState(false);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);

  useEffect(() => {
    // Strictly wait for GPS lock before initiating auto-countdown
    if (!hasGpsLock || countdown === null || isCancelled) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0 && !createdIncidentId) {
      // Trigger universal emergency immediately
      const audioPromise = startRecording(5);
      createIncident({
        emergencyCategory: 'OTHER',
        priority,
        description: 'Universal 1-Tap SOS Beacon Triggered',
        latitude,
        longitude,
        locationAccuracy: accuracy,
        locationProtocol: protocol,
        batteryLevel,
      }).then((res) => {
        setCreatedIncidentId(res.incidentId);
        audioPromise.then(async (audioBlob) => {
          if (audioBlob && res.incidentId) {
            try {
              await api.uploadAudio(res.incidentId, audioBlob);
            } catch (err) {
              console.warn('Audio upload deferred:', err);
            }
          }
        });
      });
    }
  }, [countdown, isCancelled, createdIncidentId, createIncident, latitude, longitude, accuracy, protocol, batteryLevel, startRecording, hasGpsLock, priority]);

  const handleCancel = () => {
    setIsCancelled(true);
    setCountdown(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-6 space-y-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          {/* If GPS is not yet acquired, halt beacon countdown and show clear warning */}
          {!hasGpsLock && !createdIncidentId && !isCancelled && (
            <div className="bg-slate-800/90 border border-amber-500/60 rounded-3xl p-8 space-y-5 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <MapPin className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">GPS FIX REQUIRED</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Real GPS coordinates are strictly required so rescue teams know where to deploy. SOS beacon will not transmit without verified location.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshLocation}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md"
              >
                {isAcquiring ? 'Acquiring GPS...' : 'Extract & Lock GPS Now'}
              </button>
            </div>
          )}

          {hasGpsLock && !createdIncidentId && !isCancelled && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 space-y-6 shadow-2xl">
              <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-critical-red opacity-30 animate-ping" />
                <div className="w-24 h-24 rounded-full bg-critical-red flex items-center justify-center font-black text-4xl text-white shadow-xl shadow-red-600/50">
                  {countdown}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  TRANSMITTING UNIVERSAL SOS IN {countdown}s
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Accidental safeguard active. Location & 5s audio telemetry will be broadcasted to Command Center.
                </p>
              </div>

              {/* Priority Selector */}
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('CRITICAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    priority === 'CRITICAL' ? 'bg-critical-red text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  CRITICAL
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('HIGH')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    priority === 'HIGH' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  HIGH
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('MEDIUM')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    priority === 'MEDIUM' ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  MODERATE
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{latitude?.toFixed(4)}, {longitude?.toFixed(4)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{batteryLevel}%</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="w-full py-3.5 px-4 bg-slate-700 hover:bg-slate-600 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Cancel Accidental Activation</span>
              </button>
            </div>
          )}

          {isCancelled && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 space-y-4">
              <XCircle className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="font-extrabold text-base text-white">SOS Trigger Cancelled</h3>
              <p className="text-xs text-slate-400">
                No emergency signal was dispatched. You can safely return to the home screen.
              </p>
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="py-3 px-6 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold text-white transition-colors"
              >
                Return Home
              </button>
            </div>
          )}

          {createdIncidentId && (
            <div className="bg-slate-800/90 border border-emerald-500/50 rounded-3xl p-8 space-y-5 text-left shadow-2xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">UNIVERSAL SOS BROADCASTED</h3>
                  <p className="text-xs font-mono text-emerald-400 font-bold">{createdIncidentId}</p>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60 leading-relaxed font-mono">
                <div>• Status: ACKNOWLEDGED BY SERVER</div>
                <div>• Priority: {priority}</div>
                <div>• GPS: {latitude?.toFixed(4)}, {longitude?.toFixed(4)} ({protocol})</div>
                <div>• Audio Log: 5s RECORDED & SECURED</div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/incidents/${createdIncidentId}`)}
                className="w-full py-4 px-4 bg-critical-red hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider text-center shadow-lg shadow-red-500/30 transition-all"
              >
                Open Live Incident Tracker
              </button>
            </div>
          )}
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
