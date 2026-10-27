package com.example.aapdamatrix.transport;

import android.content.Context;
import android.util.Log;

import com.example.aapdamatrix.database.MessageEntity;
import com.example.aapdamatrix.database.SosDatabaseHelper;

import java.util.ArrayList;
import java.util.List;

public class FallbackCommunicationManager {
    private static final String TAG = "CommunicationManager";

    private final Context context;
    private final SosDatabaseHelper dbHelper;
    private final InternetAdapter internetAdapter;
    private final BleMeshAdapter bleMeshAdapter;
    private final WifiDirectAdapter wifiDirectAdapter;
    private final SmsFallbackAdapter smsFallbackAdapter;

    public FallbackCommunicationManager(Context context) {
        this.context = context.getApplicationContext();
        this.dbHelper = SosDatabaseHelper.getInstance(this.context);
        this.internetAdapter = new InternetAdapter(this.context);
        this.bleMeshAdapter = new BleMeshAdapter(this.context);
        this.wifiDirectAdapter = new WifiDirectAdapter(this.context);
        this.smsFallbackAdapter = new SmsFallbackAdapter(this.context);
    }

    /**
     * Executes the preferred fallback sequence:
     * 1. Internet delivery (immediate, zero unnecessary delay)
     * 2. Bluetooth peer-to-peer (BLE mesh advertising)
     * 3. Wi-Fi Direct peer-to-peer
     * 4. Cellular SMS fallback
     * 5. Local persistent queue in SQLite
     */
    public String dispatchEmergencySos(MessageEntity message) {
        if (message == null) return "ERROR_NULL_PAYLOAD";

        // Save locally first to guarantee zero message loss
        dbHelper.insertMessage(message);

        // 1. Primary: Internet Route
        if (internetAdapter.isAvailable()) {
            boolean sent = internetAdapter.sendMessage(message);
            if (sent) {
                return "DELIVERED_INTERNET";
            }
        }

        // 2. Secondary: Bluetooth BLE Mesh Loop
        if (bleMeshAdapter.isAvailable()) {
            boolean sent = bleMeshAdapter.sendMessage(message);
            if (sent) {
                return "BROADCASTED_BLE_MESH";
            }
        }

        // 3. Tertiary: Wi-Fi Direct Peer-to-Peer
        if (wifiDirectAdapter.isAvailable()) {
            boolean sent = wifiDirectAdapter.sendMessage(message);
            if (sent) {
                return "BROADCASTED_WIFI_P2P";
            }
        }

        // 4. Quaternary: Cellular SMS Fallback
        if (smsFallbackAdapter.isAvailable()) {
            boolean sent = smsFallbackAdapter.sendMessage(message);
            if (sent) {
                return "DISPATCHED_CELLULAR_SMS";
            }
        }

        // 5. Final Fallback: Local persistent queue
        dbHelper.updateMessageStatus(message.getMessageId(), "QUEUED_LOCAL_OFFLINE");
        Log.w(TAG, "No active communication transport found. Message queued in local store-and-forward outbox.");
        return "QUEUED_OFFLINE";
    }

    public List<String> getAllTransportStatuses() {
        List<String> statuses = new ArrayList<>();
        statuses.add(internetAdapter.getStatus());
        statuses.add(bleMeshAdapter.getStatus());
        statuses.add(wifiDirectAdapter.getStatus());
        statuses.add(smsFallbackAdapter.getStatus());
        return statuses;
    }

    public void retryAllTransports() {
        if (internetAdapter.isAvailable()) {
            internetAdapter.retryPendingMessages();
        }
        if (bleMeshAdapter.isAvailable()) {
            bleMeshAdapter.retryPendingMessages();
        }
    }
}
