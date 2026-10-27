package com.example.aapdamatrix.sos;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.location.Location;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.BatteryManager;
import android.telephony.SmsManager;
import android.util.Log;

import com.example.aapdamatrix.database.MessageEntity;
import com.example.aapdamatrix.database.SosDatabaseHelper;
import com.example.aapdamatrix.service.MeshRelayService;

import org.json.JSONObject;

import java.io.File;
import java.security.MessageDigest;
import java.util.UUID;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class SosCaptureManager {
    private static final String TAG = "SosCaptureManager";
    private static final String COMMAND_CENTER_API = "https://aapda-matrix.vercel.app/api/sos";
    private static final String EMERGENCY_CONTACT_SMS = "+15550199999";

    private final Context context;
    private final VoiceRecorderHelper voiceRecorderHelper;
    private final SosDatabaseHelper dbHelper;
    private final OkHttpClient httpClient;

    public interface SosProcessListener {
        void onSosStarted();
        void onSosRecorded(String base64Audio);
        void onTransmissionSuccess(String channelUsed, MessageEntity message);
        void onError(String message);
    }

    public SosCaptureManager(Context context) {
        this.context = context.getApplicationContext();
        this.voiceRecorderHelper = new VoiceRecorderHelper();
        this.dbHelper = SosDatabaseHelper.getInstance(this.context);
        this.httpClient = new OkHttpClient();
    }

    public void triggerSosWorkflow(String calamityType, SosProcessListener listener) {
        if (listener != null) listener.onSosStarted();

        // 1. Record 10-second voice note
        voiceRecorderHelper.startRecording(context, 10, new VoiceRecorderHelper.OnRecordingFinishedListener() {
            @Override
            public void onRecordingFinished(File audioFile, String base64Audio) {
                if (listener != null) listener.onRecordingFinished(base64Audio);

                // 2. Fetch Location & Battery
                double[] coords = getFineGpsLocation();
                int batteryLevel = getBatteryLevel();

                // 3. Generate unique SHA-256 Message ID
                String messageId = generateUniqueId(calamityType, coords[0], coords[1]);

                MessageEntity entity = new MessageEntity(
                        messageId,
                        calamityType,
                        coords[0],
                        coords[1],
                        System.currentTimeMillis(),
                        base64Audio,
                        0,
                        batteryLevel,
                        "QUEUED",
                        false
                );

                // 4. Run Fallback Hierarchy
                executeFallbackHierarchy(entity, listener);
            }

            @Override
            public void onError(String error) {
                if (listener != null) listener.onError("Voice record failed: " + error);
            }
        });
    }

    public void executeFallbackHierarchy(MessageEntity entity, SosProcessListener listener) {
        new Thread(() -> {
            // Priority 1: REST API (If online)
            if (isNetworkAvailable()) {
                boolean restSuccess = postToCommandCenter(entity);
                if (restSuccess) {
                    entity.setStatus("DELIVERED");
                    dbHelper.insertMessage(entity);
                    if (listener != null) {
                        listener.onTransmissionSuccess("PRIORITY 1: REST API (ONLINE GATEWAY)", entity);
                    }
                    return;
                }
            }

            // Priority 2: SMS (If cellular active without internet data)
            boolean smsSent = trySendCompressedSms(entity);
            if (smsSent) {
                entity.setStatus("SMS_SENT");
                dbHelper.insertMessage(entity);
                if (listener != null) {
                    listener.onTransmissionSuccess("PRIORITY 2: CELLULAR SMS", entity);
                }
                return;
            }

            // Priority 3: Offline BLE Multi-Hop Mesh Network
            entity.setStatus("QUEUED");
            boolean inserted = dbHelper.insertMessage(entity);
            
            // Ensure MeshRelayService is active to broadcast
            try {
                Intent serviceIntent = new Intent(context, MeshRelayService.class);
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            } catch (Exception e) {
                Log.e(TAG, "Could not start MeshRelayService", e);
            }

            if (listener != null) {
                listener.onTransmissionSuccess("PRIORITY 3: OFFLINE BLE MULTI-HOP MESH", entity);
            }
        }).start();
    }

    private boolean postToCommandCenter(MessageEntity entity) {
        try {
            JSONObject json = new JSONObject();
            json.put("messageId", entity.getMessageId());
            json.put("calamityType", entity.getCalamityType());
            json.put("latitude", entity.getLatitude());
            json.put("longitude", entity.getLongitude());
            json.put("timestamp", entity.getTimestamp());
            json.put("voiceBase64", entity.getVoiceBase64());
            json.put("hopCount", entity.getHopCount());
            json.put("batteryLevel", entity.getBatteryLevel());
            json.put("isBatteryDistress", entity.isBatteryDistress());

            RequestBody body = RequestBody.create(
                    json.toString(),
                    MediaType.parse("application/json; charset=utf-8")
            );

            Request request = new Request.Builder()
                    .url(COMMAND_CENTER_API)
                    .post(body)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                Log.d(TAG, "Command Center HTTP Response Code: " + response.code());
                return response.isSuccessful();
            }
        } catch (Exception e) {
            Log.e(TAG, "Command Center POST failed", e);
            return false;
        }
    }

    private boolean trySendCompressedSms(MessageEntity entity) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            String smsBody = "AAPDA SOS|" + entity.getCalamityType() + "|LAT:" + entity.getLatitude()
                    + "|LNG:" + entity.getLongitude() + "|BAT:" + entity.getBatteryLevel() + "%|ID:" + entity.getMessageId().substring(0, 8);
            smsManager.sendTextMessage(EMERGENCY_CONTACT_SMS, null, smsBody, null, null);
            Log.d(TAG, "Compressed SMS dispatched successfully");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "SMS Send failed", e);
            return false;
        }
    }

    @SuppressLint("MissingPermission")
    private double[] getFineGpsLocation() {
        double[] coords = new double[]{28.6139, 77.2090}; // Default New Delhi fallback
        try {
            LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            if (lm != null) {
                Location loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (loc == null) {
                    loc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                }
                if (loc != null) {
                    coords[0] = loc.getLatitude();
                    coords[1] = loc.getLongitude();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Location fetch error", e);
        }
        return coords;
    }

    private int getBatteryLevel() {
        IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent batteryStatus = context.registerReceiver(null, filter);
        if (batteryStatus != null) {
            int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            if (level != -1 && scale != -1) {
                return (int) ((level / (float) scale) * 100);
            }
        }
        return 100;
    }

    private String generateUniqueId(String calamity, double lat, double lng) {
        try {
            String raw = calamity + lat + lng + System.currentTimeMillis() + UUID.randomUUID().toString();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    public boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.getSystemServiceName(ConnectivityManager.class));
        if (cm == null) return false;
        NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
        return nc != null && (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
    }
}
