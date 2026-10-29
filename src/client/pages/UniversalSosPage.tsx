import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Radio, CheckCircle, ArrowLeft, XCircle, MapPin, Battery, AlertOctagon, RefreshCw, AlertTriangle } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { useIncident } from '../context/IncidentContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useBattery } from '../hooks/useBattery';
import { useLanguage } from '../context/LanguageContext';
import { Priority } from '../types';

export const UniversalSosPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { createIncident } = useIncident();
  const {
    latitude,
    longitude,
    accuracy,
    protocol,
    hasGpsLock,
    isEmergencyOverrideAllowed,
    userProvidedAddress,
    refreshLocation,
    enableEmergencyOverride,
    setManualAddress,
  } = useGeolocation();
  const { level: batteryLevel } = useBattery();

  const [priority, setPriority] = useState<Priority>('HIGH');
  const [countdown, setCountdown] = useState<number | null>(3);
  const [isCancelled, setIsCancelled] = useState(false);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);

  useEffect(() => {
    // If neither GPS is locked nor override is allowed, hold countdown
    if ((!hasGpsLock && !isEmergencyOverrideAllowed) || countdown === null || isCancelled) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0 && !createdIncidentId) {
      // Trigger universal emergency immediately (voice recording disabled for non-natural disasters)
      createIncident({
        emergencyCategory: 'OTHER',
        priority,
        description: 'Universal 1-Tap SOS Beacon Triggered',
        latitude: hasGpsLock ? latitude : null,
        longitude: hasGpsLock ? longitude : null,
        locationAccuracy: hasGpsLock ? accuracy : null,
        locationProtocol: hasGpsLock ? protocol : 'UNAVAILABLE',
        locationStatus: hasGpsLock ? 'GPS_VERIFIED' : userProvidedAddress ? 'USER_PROVIDED' : 'LOCATION_UNAVAILABLE',
        locationSource: hasGpsLock ? 'GPS' : userProvidedAddress ? 'USER_MANUAL' : 'UNAVAILABLE',
        userProvidedAddress,
        batteryLevel,
      }).then((res) => {
        setCreatedIncidentId(res.incidentId);
      });
    }
  }, [countdown, isCancelled, createdIncidentId, createIncident, latitude, longitude, accuracy, protocol, batteryLevel, hasGpsLock, isEmergencyOverrideAllowed, userProvidedAddress, priority]);

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

          {/* GPS acquisition required or safety override */}
          {!hasGpsLock && !isEmergencyOverrideAllowed && !createdIncidentId && !isCancelled && (
            <div className="bg-slate-800/90 border border-amber-500/60 rounded-3xl p-8 space-y-5 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <MapPin className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">GPS LOCATION ACQUIRING</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Real GPS coordinates help tactical units locate you instantly. If hardware GPS is unavailable, you can use Emergency Override to dispatch without GPS.
                </p>
              </div>

              {/* Landmark input */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-amber-300 uppercase">
                  Add Landmark or Address (Optional)
                </label>
                <input
                  type="text"
                  value={userProvidedAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="e.g. Near Metro Pillar 140"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={refreshLocation}
                  className="w-full py-3.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-sky-400" />
                  <span>Retry Hardware GPS</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    enableEmergencyOverride();
                    setCountdown(3);
                  }}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-200" />
                  <span>Emergency Override: Send Without GPS</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Countdown Beacon */}
          {(hasGpsLock || isEmergencyOverrideAllowed) && countdown !== null && countdown > 0 && !isCancelled && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 space-y-6 shadow-2xl">
              <div className="w-28 h-28 rounded-full bg-red-950/80 border-4 border-critical-red flex items-center justify-center mx-auto shadow-2xl shadow-red-600/50 animate-pulse">
                <span className="text-5xl font-black text-critical-red">{countdown}</span>
              </div>

              <div>
                <h2 className="text-xl font-black tracking-tight text-white uppercase">
                  Transmitting Distress Beacon
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Accidental tap safeguard active. Beacon dispatches automatically in {countdown} seconds.
                </p>
                {!hasGpsLock && isEmergencyOverrideAllowed && (
                  <p className="text-[11px] text-amber-400 font-bold mt-2">
                    &bull; Transmitting with Location Unavailable status
                  </p>
                )}
              </div>

              {/* Priority Selector */}
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 space-y-2 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Emergency Urgency Tier
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['CRITICAL', 'HIGH', 'MEDIUM'] as Priority[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      className={`py-1.5 px-1 rounded-xl text-[10px] font-black transition-all ${
                        priority === lvl
                          ? lvl === 'CRITICAL'
                            ? 'bg-critical-red text-white'
                            : lvl === 'HIGH'
                            ? 'bg-amber-600 text-white'
                            : 'bg-brand-blue text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-colors flex items-center justify-center gap-2 border border-slate-600"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Cancel Accidental SOS</span>
              </button>
            </div>
          )}

          {/* Transmitted Confirmation State */}
          {createdIncidentId && (
            <div className="bg-slate-800 border border-emerald-500/50 rounded-3xl p-8 space-y-6 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-white">Distress Beacon Broadcasted</h2>
                <p className="text-xs text-slate-300">
                  Incident ID: <strong className="font-mono text-emerald-400">{createdIncidentId}</strong>
                </p>
                <p className="text-xs text-slate-400">
                  {hasGpsLock
                    ? `Live coordinates (${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}) transmitted.`
                    : 'Dispatched with Location Unavailable status.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/my-incidents')}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-colors shadow-lg shadow-emerald-600/30"
              >
                Track Dispatch Status
              </button>
            </div>
          )}

          {/* Cancelled State */}
          {isCancelled && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 space-y-4 shadow-xl">
              <XCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Distress Beacon Cancelled</h3>
              <p className="text-xs text-slate-400">No signals or location records were transmitted.</p>
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="py-2 px-4 bg-slate-700 text-white text-xs font-bold rounded-xl"
              >
                Return to Safety Portal
              </button>
            </div>
          )}
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
