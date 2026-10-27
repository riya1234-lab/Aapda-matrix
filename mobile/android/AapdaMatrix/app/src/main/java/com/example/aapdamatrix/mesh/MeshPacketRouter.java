package com.example.aapdamatrix.mesh;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.util.Log;

import com.example.aapdamatrix.database.MessageEntity;
import com.example.aapdamatrix.database.SosDatabaseHelper;

import org.json.JSONObject;

import java.util.List;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class MeshPacketRouter {
    private static final String TAG = "MeshPacketRouter";
    public static final String AAPDA_SERVICE_UUID = "0000FA11-0000-1000-8000-00805F9B34FB";
    private static final String COMMAND_CENTER_API = "https://aapda-matrix.vercel.app/api/sos";

    private final Context context;
    private final SosDatabaseHelper dbHelper;
    private final OkHttpClient httpClient;

    public MeshPacketRouter(Context context) {
        this.context = context.getApplicationContext();
        this.dbHelper = SosDatabaseHelper.getInstance(this.context);
        this.httpClient = new OkHttpClient();
    }

    public void handleIncomingPacket(MessageEntity incomingMessage) {
        if (incomingMessage == null || incomingMessage.getMessageId() == null) return;

        String msgId = incomingMessage.getMessageId();

        // 1. Strict De-duplication Check
        if (dbHelper.isMessageSeen(msgId)) {
            Log.d(TAG, "DUPLICATE PACKET DROPPED: " + msgId);
            return;
        }

        Log.d(TAG, "NEW MESH PACKET RECEIVED via BLE Hop #" + incomingMessage.getHopCount());

        // 2. Increment hop count for forwarding
        incomingMessage.setHopCount(incomingMessage.getHopCount() + 1);
        incomingMessage.setStatus("QUEUED");

        // 3. Save to Local Database Store-and-Forward Outbox
        dbHelper.insertMessage(incomingMessage);

        // 4. Gateway Mode Check: If this node has internet, immediately upload to REST API
        checkAndSyncGatewayOutbox();
    }

    public void checkAndSyncGatewayOutbox() {
        if (!isOnline()) return;

        new Thread(() -> {
            List<MessageEntity> pending = dbHelper.getPendingOutboxMessages();
            if (pending.isEmpty()) return;

            Log.d(TAG, "GATEWAY MODE ACTIVE: Uploading " + pending.size() + " pending mesh packets to Command Center...");

            for (MessageEntity entity : pending) {
                try {
                    JSONObject json = new JSONObject();
                    json.put("messageId", entity.getMessageId());
                    json.put("calamityType", entity.getCalamityType());
                    json.put("latitude", entity.getLatitude());
                    json.put("longitude", entity.getLongitude());
                    json.put("timestamp", entity.getTimestamp());
                    json.put("voiceBase64", entity.getVoiceBase64() != null ? entity.getVoiceBase64() : "");
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
                        if (response.isSuccessful()) {
                            dbHelper.updateMessageStatus(entity.getMessageId(), "DELIVERED");
                            Log.d(TAG, "Gateway upload ACK received for packet ID: " + entity.getMessageId());
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Gateway sync error for ID: " + entity.getMessageId(), e);
                }
            }
        }).start();
    }

    private boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
        return nc != null && (nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
    }
}
