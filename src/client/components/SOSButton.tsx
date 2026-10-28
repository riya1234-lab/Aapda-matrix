import React from 'react';
import { Mic, Radio, AlertOctagon, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SOSButtonProps {
  onTrigger: () => void;
  isRecording: boolean;
  recordingSecondsLeft: number;
  isTransmitting: boolean;
  disabled?: boolean;
  hasGpsLock?: boolean;
  isEmergencyOverrideAllowed?: boolean;
  onRetryGps?: () => void;
  onEnableOverride?: () => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  onTrigger,
  isRecording,
  recordingSecondsLeft,
  isTransmitting,
  disabled = false,
  hasGpsLock = true,
  isEmergencyOverrideAllowed = false,
  onRetryGps,
  onEnableOverride,
}) => {
  const { t } = useLanguage();
  const isGpsBlocked = !hasGpsLock && !isEmergencyOverrideAllowed;

  return (
    <div className="relative w-full space-y-2.5">
      {/* Outer pulsating glow effect when recording or transmitting */}
      {(isRecording || isTransmitting) && (
        <span className="absolute -inset-1 rounded-2xl bg-critical-red opacity-50 blur-lg animate-pulse" />
      )}

      <button
        type="button"
        disabled={disabled || isGpsBlocked || isTransmitting}
        onClick={onTrigger}
        className={`relative w-full py-4 px-6 rounded-2xl font-black text-base tracking-wide flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg select-none ${
          isGpsBlocked
            ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-90'
            : isEmergencyOverrideAllowed && !hasGpsLock
            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30 ring-2 ring-amber-400'
            : disabled
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            : isRecording
            ? 'bg-red-700 text-white shadow-red-600/50 ring-4 ring-red-400 animate-pulse'
            : isTransmitting
            ? 'bg-amber-600 text-white shadow-amber-600/50'
            : 'bg-critical-red hover:bg-red-700 text-white shadow-red-500/30'
        }`}
      >
        {isGpsBlocked ? (
          <>
            <MapPin className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="uppercase tracking-wider text-xs sm:text-sm">
              {t.locRequired}
            </span>
          </>
        ) : isEmergencyOverrideAllowed && !hasGpsLock ? (
          <>
            <AlertTriangle className="w-5 h-5 text-amber-200" />
            <span className="uppercase tracking-wider text-xs sm:text-sm">
              ACTIVATE SOS (LOCATION UNAVAILABLE)
            </span>
          </>
        ) : isRecording ? (
          <>
            <Radio className="w-5 h-5 animate-spin" />
            <span className="uppercase tracking-wider">
              {t.recordingAudio} ({recordingSecondsLeft}s)
            </span>
          </>
        ) : isTransmitting ? (
          <>
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="uppercase tracking-wider">{t.transmitting}</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 stroke-[2.2]" />
            <span className="uppercase tracking-wider">{t.activateSos}</span>
          </>
        )}
      </button>

      {/* Safety Override Controls when GPS is unavailable */}
      {!hasGpsLock && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 space-y-2 text-center">
          <p className="text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              {isEmergencyOverrideAllowed
                ? 'Emergency Override Active: SOS will transmit with Location Unavailable status.'
                : 'GPS coordinates unavailable. You can retry GPS or override to send SOS immediately.'}
            </span>
          </p>

          <div className="flex items-center justify-center gap-2 pt-1">
            {onRetryGps && (
              <button
                type="button"
                onClick={onRetryGps}
                className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-sky-400" />
                <span>Retry GPS</span>
              </button>
            )}

            {!isEmergencyOverrideAllowed && onEnableOverride && (
              <button
                type="button"
                onClick={onEnableOverride}
                className="py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              >
                <AlertTriangle className="w-3 h-3 text-amber-200" />
                <span>Override: Send SOS Without GPS</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
