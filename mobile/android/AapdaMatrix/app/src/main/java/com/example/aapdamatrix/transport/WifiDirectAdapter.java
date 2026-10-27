package com.example.aapdamatrix.transport;

import android.content.Context;
import android.net.wifi.p2p.WifiP2pManager;
import android.util.Log;

import com.example.aapdamatrix.database.MessageEntity;

import java.util.ArrayList;
import java.util.List;

public class WifiDirectAdapter implements CommunicationAdapter {
    private static final String TAG = "WifiDirectAdapter";

    private final Context context;
    private final WifiP2pManager p2pManager;
    private final WifiP2pManager.Channel p2pChannel;

    public WifiDirectAdapter(Context context) {
        this.context = context.getApplicationContext();
        this.p2pManager = (WifiP2pManager) this.context.getSystemService(Context.WIFI_P2P_SERVICE);
        if (this.p2pManager != null) {
            this.p2pChannel = this.p2pManager.initialize(this.context, this.context.getMainLooper(), null);
        } else {
            this.p2pChannel = null;
        }
    }

    @Override
    public boolean isAvailable() {
        return p2pManager != null && p2pChannel != null;
    }

    @Override
    public boolean sendMessage(MessageEntity message) {
        if (!isAvailable()) return false;

        Log.i(TAG, "Wi-Fi Direct peer discovery initiated for SOS packet: " + message.getMessageId());
        try {
            p2pManager.discoverPeers(p2pChannel, new WifiP2pManager.ActionListener() {
                @Override
                public void onSuccess() {
                    Log.d(TAG, "Wi-Fi Direct peer discovery active.");
                }

                @Override
                public void onFailure(int reason) {
                    Log.w(TAG, "Wi-Fi Direct discovery failed with code: " + reason);
                }
            });
            return true;
        } catch (SecurityException se) {
            Log.e(TAG, "Missing NEARBY_WIFI_DEVICES or FINE_LOCATION permission for Wi-Fi Direct", se);
            return false;
        }
    }

    @Override
    public List<MessageEntity> receiveMessages() {
        return new ArrayList<>();
    }

    @Override
    public String getStatus() {
        if (!isAvailable()) return "WI-FI DIRECT: HARDWARE NOT SUPPORTED";
        return "WI-FI DIRECT: READY (PEER-TO-PEER PENDING)";
    }

    @Override
    public int retryPendingMessages() {
        return 0;
    }
}
