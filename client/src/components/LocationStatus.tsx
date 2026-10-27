import React from 'react';
import { Battery, BatteryCharging, BatteryWarning, MapPin, Navigation } from 'lucide-react';
import { useBattery } from '../hooks/useBattery';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLanguage } from '../context/LanguageContext';

export const LocationStatus: React.FC = () => {
  const { level, charging, isAutoGuard } = useBattery();
  const { latitude, longitude, protocol, isAcquiring, refreshLocation } = useGeolocation();
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
          ) : isAutoGuard ? (
            <BatteryWarning className="w-4 h-4 text-critical-red animate-bounce" />
          ) : (
            <Battery className="w-4 h-4 text-slate-500" />
          )}
          <span>{t.batteryStatus}</span>
        </div>

        <div className="flex items-center gap-1.5 font-bold text-sm">
          <span
            className={
              isAutoGuard
                ? 'text-critical-red font-black animate-pulse'
                : level > 20
                ? 'text-slate-800'
                : 'text-amber-600'
            }
          >
            {level}%
          </span>
          {isAutoGuard && (
            <span className="text-[10px] uppercase font-bold bg-red-100 text-critical-red px-1.5 py-0.5 rounded">
              Guard @ 5%
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
          className="flex items-center gap-1 font-mono font-bold text-xs text-sky-600 cursor-pointer hover:text-sky-700 transition-colors"
          title="Click to refresh GPS fix"
        >
          {isAcquiring ? (
            <span className="flex items-center gap-1.5 text-amber-600">
              <Navigation className="w-3.5 h-3.5 animate-spin" />
              <span>{t.locAcquiring}</span>
            </span>
          ) : (
            <span>
              {protocol} {formattedCoords ? `(${formattedCoords})` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
