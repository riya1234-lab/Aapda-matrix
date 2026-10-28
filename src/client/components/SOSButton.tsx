import React from 'react';
import { Mic, Radio, AlertOctagon, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SOSButtonProps {
  onTrigger: () => void;
  isRecording: boolean;
  recordingSecondsLeft: number;
  isTransmitting: boolean;
  disabled?: boolean;
  hasGpsLock?: boolean;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  onTrigger,
  isRecording,
  recordingSecondsLeft,
  isTransmitting,
  disabled = false,
  hasGpsLock = true,
}) => {
  const { t } = useLanguage();
  const isGpsBlocked = !hasGpsLock;

  return (
    <div className="relative w-full">
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

      {isGpsBlocked && (
        <p className="text-[11px] font-bold text-critical-red text-center mt-2 flex items-center justify-center gap-1">
          <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0" />
          <span>GPS must be extracted before SOS can be transmitted to responders.</span>
        </p>
      )}
    </div>
  );
};
