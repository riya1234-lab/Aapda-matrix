package com.example.aapdamatrix.transport;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.util.Log;

import com.example.aapdamatrix.database.MessageEntity;
import com.example.aapdamatrix.database.SosDatabaseHelper;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class InternetAdapter implements CommunicationAdapter {
    private static final String TAG = "InternetAdapter";
    private static final String DEFAULT_API_URL = "http://10.0.2.2:5000/api/incidents"; // Android emulator localhost

    private final Context context;
    private final SosDatabaseHelper dbHelper;
    private final OkHttpClient httpClient;
    private final String serverUrl;

    public InternetAdapter(Context context) {
        this(context, DEFAULT_API_URL);
    }

    public InternetAdapter(Context context, String serverUrl) {
        this.context = context.getApplicationContext();
        this.dbHelper = SosDatabaseHelper.getInstance(this.context);
        this.httpClient = new OkHttpClient();
        this.serverUrl = serverUrl;
    }

    @Override
    public boolean isAvailable() {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
        return nc != null && (
                nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                nc.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        );
    }

    @Override
    public boolean sendMessage(MessageEntity message) {
        if (!isAvailable()) return false;

        try {
            JSONObject json = new JSONObject();
            json.put("id", message.getMessageId());
            json.put("emergencyCategory", message.getCalamityType() != null ? message.getCalamityType() : "OTHER");
            json.put("priority", message.isBatteryDistress() ? "CRITICAL" : "HIGH");
            json.put("description", "Distress SOS: " + message.getCalamityType());
            json.put("latitude", message.getLatitude());
            json.put("longitude", message.getLongitude());
            json.put("batteryLevel", message.getBatteryLevel());
            json.put("communicationMethod", "INTERNET");

            RequestBody body = RequestBody.create(
                    json.toString(),
                    MediaType.parse("application/json; charset=utf-8")
            );

            Request request = new Request.Builder()
                    .url(serverUrl)
                    .post(body)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    dbHelper.updateMessageStatus(message.getMessageId(), "DELIVERED_SERVER");
                    Log.i(TAG, "Internet SOS transmission succeeded for ID: " + message.getMessageId());
                    return true;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Internet dispatch error for: " + message.getMessageId(), e);
        }

        return false;
    }

    @Override
    public List<MessageEntity> receiveMessages() {
        // Handled via Socket.IO in full client
        return new ArrayList<>();
    }

    @Override
    public String getStatus() {
        return isAvailable() ? "INTERNET: CONNECTED (GATEWAY READY)" : "INTERNET: DISCONNECTED";
    }

    @Override
    public int retryPendingMessages() {
        if (!isAvailable()) return 0;

        List<MessageEntity> pending = dbHelper.getPendingOutboxMessages();
        int successCount = 0;
        for (MessageEntity m : pending) {
            if (sendMessage(m)) {
                successCount++;
            }
        }
        return successCount;
    }
}
