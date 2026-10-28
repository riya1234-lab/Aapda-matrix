import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  durationSeconds?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, durationSeconds = 4 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSeconds);
  const [isUsingSynthesizer, setIsUsingSynthesizer] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Web Audio API emergency tone synthesizer fallback
  const playSynthesizedEmergencyAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      setIsUsingSynthesizer(true);
      setIsPlaying(true);
      setCurrentTime(0);

      const startTime = ctx.currentTime;
      const beeps = [
        { time: 0.1, duration: 0.25, freq: 880 },
        { time: 0.45, duration: 0.25, freq: 880 },
        { time: 0.8, duration: 0.25, freq: 880 },
        { time: 1.2, duration: 0.5, freq: 660 },
        { time: 1.8, duration: 0.5, freq: 660 },
        { time: 2.4, duration: 0.5, freq: 660 },
        { time: 3.0, duration: 0.25, freq: 880 },
        { time: 3.35, duration: 0.25, freq: 880 },
      ];

      beeps.forEach(({ time, duration, freq }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime + time);

        gain.gain.setValueAtTime(0.3, startTime + time);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + time + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime + time);
        osc.stop(startTime + time + duration);
      });

      let elapsed = 0;
      synthTimerRef.current = setInterval(() => {
        elapsed += 0.2;
        setCurrentTime(Math.min(elapsed, totalDuration));
        if (elapsed >= totalDuration) {
          clearInterval(synthTimerRef.current);
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }, 200);
    } catch (e) {
      console.warn('Synthesizer error:', e);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current && !isUsingSynthesizer) {
        audioRef.current.pause();
      }
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    setErrorMessage(null);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsUsingSynthesizer(false);
        })
        .catch((err) => {
          console.warn('Native audio play error, switching to emergency tone synthesizer:', err);
          playSynthesizedEmergencyAudio();
        });
    } else {
      playSynthesizedEmergencyAudio();
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setTotalDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="bg-slate-900 border border-slate-700/90 rounded-2xl p-3.5 shadow-lg space-y-2.5">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => {
          console.warn('Audio tag encountered error with URL:', src);
        }}
        preload="auto"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-critical-red animate-ping' : 'bg-emerald-400'}`} />
          <span className="font-mono text-xs font-black text-slate-200 tracking-wider">
            {isUsingSynthesizer ? 'VOICE SOS (RADIO FREQ SYNTH)' : 'AUTHENTICATED VOICE SOS'}
          </span>
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Large Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white transition-all transform active:scale-95 shadow-md flex-shrink-0 ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30 ring-2 ring-amber-400'
              : 'bg-critical-red hover:bg-red-700 shadow-red-600/30'
          }`}
          title={isPlaying ? 'Pause Emergency Audio' : 'Listen to Emergency Voice SOS'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-white ml-0.5" />
          )}
        </button>

        {/* Dynamic Waveform & Progress Bar */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-sky-400 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{isPlaying ? 'AUDIO STREAM TRANSMITTING' : 'READY TO PLAY'}</span>
            </span>

            {/* Visual animated equalizer waves when playing */}
            {isPlaying && (
              <span className="flex items-center gap-0.5 text-emerald-400">
                <span className="inline-block w-1 h-3 bg-emerald-400 animate-pulse" />
                <span className="inline-block w-1 h-4 bg-emerald-400 animate-pulse delay-75" />
                <span className="inline-block w-1 h-2 bg-emerald-400 animate-pulse delay-150" />
                <span className="inline-block w-1 h-5 bg-emerald-400 animate-pulse" />
                <span className="inline-block w-1 h-3 bg-emerald-400 animate-pulse delay-100" />
              </span>
            )}
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
            <div
              className={`h-full transition-all duration-100 ${
                isPlaying ? 'bg-gradient-to-r from-critical-red to-amber-500' : 'bg-slate-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
