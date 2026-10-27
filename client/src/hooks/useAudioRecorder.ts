import { useState, useRef, useCallback } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  recordingSecondsLeft: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  hasPermission: boolean;
  error: string | null;
  startRecording: (durationSeconds?: number) => Promise<Blob | null>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export function useAudioRecorder(): AudioRecorderState {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = useCallback((durationSeconds = 5): Promise<Blob | null> => {
    return new Promise(async (resolve) => {
      chunksRef.current = [];
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Audio recording is not supported in this browser.');
        setHasPermission(false);
        resolve(null);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);

        // Determine mime type
        let mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            mimeType = 'audio/ogg';
          } else {
            mimeType = '';
          }
        }

        const options = mimeType ? { mimeType } : undefined;
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const finalMime = mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: finalMime });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setIsRecording(false);
          setRecordingSecondsLeft(0);

          // Stop all audio tracks to release microphone
          stream.getTracks().forEach((track) => track.stop());
          resolve(blob);
        };

        recorder.start();
        setIsRecording(true);
        setRecordingSecondsLeft(durationSeconds);

        let countdown = durationSeconds;
        timerRef.current = setInterval(() => {
          countdown--;
          setRecordingSecondsLeft(countdown);
          if (countdown <= 0) {
            clearInterval(timerRef.current);
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }
        }, 1000);
      } catch (err: any) {
        console.warn('Microphone permission or hardware unavailable (SOS will proceed without audio):', err);
        setError(err.message || 'Microphone unavailable');
        setHasPermission(false);
        setIsRecording(false);
        resolve(null);
      }
    });
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setError(null);
  }, [stopRecording, audioUrl]);

  return {
    isRecording,
    recordingSecondsLeft,
    audioBlob,
    audioUrl,
    hasPermission,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
