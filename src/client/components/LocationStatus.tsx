import React from 'react';
import { Battery, BatteryCharging, BatteryWarning, MapPin, Navigation, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useBattery } from '../hooks/useBattery';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLanguage } from '../context/LanguageContext';

export const LocationStatus: React.FC = () => {
  const { level, charging, isBelowTenPercent, isAutoGuard } = useBattery();
  const { latitude, longitude, protocol, isAcquiring, hasGpsLock, error: gpsError, refreshLocation } = useGeolocation();
  const { t } = useLanguage();

  const formattedCoords =
    latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : '';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3.5 transition-all">
      {/* Battery Telemetry Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs tracking-wider">
          {charging ? (
            <BatteryCharging className="w-4 h-4 text-emerald-600" />
          ) : isBelowTenPercent || isAutoGuard ? (
            <BatteryWarning className="w-4 h-4 text-critical-red animate-bounce" />
          ) : (
            <Battery className="w-4 h-4 text-slate-500" />
          )}
          <span>{t.batteryStatus}</span>
        </div>

        <div className="flex items-center gap-1.5 font-bold text-sm">
          <span
            className={
              isBelowTenPercent || isAutoGuard
                ? 'text-critical-red font-black animate-pulse'
                : level > 20
                ? 'text-slate-800'
                : 'text-amber-600'
            }
          >
            {level}%
          </span>
          {isBelowTenPercent && (
            <span className="text-[10px] uppercase font-bold bg-red-100 text-critical-red px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-critical-red animate-ping" />
              <span>&lt; 10% Auto-Share</span>
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Location Telemetry Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs tracking-wider">
          <MapPin className="w-4 h-4 text-slate-500" />
          <span>{t.locProtocol}</span>
        </div>

        <div
          onClick={refreshLocation}
          className="flex items-center gap-1 font-mono font-bold text-xs cursor-pointer transition-colors"
          title="Click to refresh GPS fix"
        >
          {isAcquiring ? (
            <span className="flex items-center gap-1.5 text-amber-600 animate-pulse">
              <Navigation className="w-3.5 h-3.5 animate-spin" />
              <span>{t.locAcquiring}</span>
            </span>
          ) : !hasGpsLock ? (
            <span className="flex items-center gap-1 text-critical-red font-bold hover:underline" title={gpsError || 'GPS permission required'}>
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{t.locRequired}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{protocol} ({formattedCoords})</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
