package com.example.aapdamatrix.sos;

import android.content.Context;
import android.media.MediaRecorder;
import android.os.Build;
import android.util.Base64;
import android.util.Log;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

public class VoiceRecorderHelper {
    private static final String TAG = "VoiceRecorderHelper";
    private MediaRecorder mediaRecorder;
    private File outputFile;

    public interface OnRecordingFinishedListener {
        void onRecordingFinished(File audioFile, String base64Audio);
        void onError(String error);
    }

    public boolean startRecording(Context context, int durationSeconds, OnRecordingFinishedListener listener) {
        try {
            outputFile = new File(context.getCacheDir(), "sos_voice_" + System.currentTimeMillis() + ".m4a");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                mediaRecorder = new MediaRecorder(context);
            } else {
                mediaRecorder = new MediaRecorder();
            }

            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            mediaRecorder.setAudioSamplingRate(16000); // 16kHz
            mediaRecorder.setAudioEncodingBitRate(24000); // 24kbps
            mediaRecorder.setOutputFile(outputFile.getAbsolutePath());

            mediaRecorder.prepare();
            mediaRecorder.start();
            Log.d(TAG, "Audio recording started: " + outputFile.getAbsolutePath());

            // Auto-stop after durationSeconds
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                stopAndConvert(listener);
            }, durationSeconds * 1000L);

            return true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to start recording", e);
            if (listener != null) listener.onError("Recording start failed: " + e.getMessage());
            return false;
        }
    }

    public void stopAndConvert(OnRecordingFinishedListener listener) {
        if (mediaRecorder != null) {
            try {
                mediaRecorder.stop();
                mediaRecorder.release();
                mediaRecorder = null;
                Log.d(TAG, "Recording stopped successfully.");

                if (outputFile != null && outputFile.exists()) {
                    String base64 = fileToBase64(outputFile);
                    if (listener != null) listener.onRecordingFinished(outputFile, base64);
                } else {
                    if (listener != null) listener.onError("Audio file missing");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error stopping recorder", e);
                if (listener != null) listener.onError("Stop recorder error: " + e.getMessage());
            }
        }
    }

    private String fileToBase64(File file) {
        byte[] bytes = new byte[(int) file.length()];
        try (FileInputStream fis = new FileInputStream(file)) {
            int read = fis.read(bytes);
            if (read > 0) {
                return Base64.encodeToString(bytes, Base64.NO_WRAP);
            }
        } catch (IOException e) {
            Log.e(TAG, "Base64 conversion failed", e);
        }
        return "";
    }
}
