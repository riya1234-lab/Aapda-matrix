package com.example.aapdamatrix.mesh;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.os.ParcelUuid;
import android.util.Log;

import com.example.aapdamatrix.database.MessageEntity;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

public class BleMeshAdvertiser {
    private static final String TAG = "BleMeshAdvertiser";
    private final Context context;
    private BluetoothLeAdvertiser advertiser;
    private AdvertiseCallback advertiseCallback;
    private boolean isAdvertising = false;

    public BleMeshAdvertiser(Context context) {
        this.context = context.getApplicationContext();
        BluetoothManager bm = (BluetoothManager) context.getSystemService(Context.BLUETOOTH_SERVICE);
        if (bm != null && bm.getAdapter() != null) {
            BluetoothAdapter adapter = bm.getAdapter();
            if (adapter.isEnabled()) {
                this.advertiser = adapter.getBluetoothLeAdvertiser();
            }
        }
    }

    @SuppressLint("MissingPermission")
    public void startBroadcasting(MessageEntity entity) {
        if (entity == null || advertiser == null) {
            Log.w(TAG, "Cannot start BLE Advertising: Advertiser unavailable or null payload.");
            return;
        }

        if (isAdvertising) {
            stopBroadcasting();
        }

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .setConnectable(false)
                .setTimeout(0)
                .build();

        ParcelUuid pUuid = new ParcelUuid(UUID.fromString(MeshPacketRouter.AAPDA_SERVICE_UUID));

        // Encode compact packet (Message ID prefix + Calamity + Hop) into Service Data payload
        byte[] payloadBytes = packPayload(entity);

        AdvertiseData data = new AdvertiseData.Builder()
                .setIncludeDeviceName(false)
                .addServiceUuid(pUuid)
                .addServiceData(pUuid, payloadBytes)
                .build();

        advertiseCallback = new AdvertiseCallback() {
            @Override
            public void onStartSuccess(AdvertiseSettings settingsInEffect) {
                super.onStartSuccess(settingsInEffect);
                isAdvertising = true;
                Log.d(TAG, "BLE Mesh Advertising STARTED for ID: " + entity.getMessageId());
            }

            @Override
            public void onStartFailure(int errorCode) {
                super.onStartFailure(errorCode);
                isAdvertising = false;
                Log.e(TAG, "BLE Mesh Advertising FAILED. Error code: " + errorCode);
            }
        };

        try {
            advertiser.startAdvertising(settings, data, advertiseCallback);
        } catch (Exception e) {
            Log.e(TAG, "Exception starting BLE advertiser", e);
        }
    }

    @SuppressLint("MissingPermission")
    public void stopBroadcasting() {
        if (advertiser != null && advertiseCallback != null && isAdvertising) {
            try {
                advertiser.stopAdvertising(advertiseCallback);
                Log.d(TAG, "BLE Mesh Advertising STOPPED.");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping BLE advertiser", e);
            }
            isAdvertising = false;
        }
    }

    private byte[] packPayload(MessageEntity entity) {
        // Build compact byte array for BLE Service Data (Max ~24 bytes)
        // Format: [1-byte Calamity Code] [1-byte Hop Count] [4-byte Lat Int] [4-byte Lng Int] [12-byte MsgId Hash Prefix]
        ByteBuffer buffer = ByteBuffer.allocate(22);

        byte calamityCode = parseCalamityCode(entity.getCalamityType());
        buffer.put(calamityCode);
        buffer.put((byte) Math.min(entity.getHopCount(), 255));

        int latInt = (int) (entity.getLatitude() * 1e6);
        int lngInt = (int) (entity.getLongitude() * 1e6);
        buffer.putInt(latInt);
        buffer.putInt(lngInt);

        byte[] idBytes = entity.getMessageId().getBytes(StandardCharsets.UTF_8);
        byte[] truncatedId = new byte[12];
        System.arraycopy(idBytes, 0, truncatedId, 0, Math.min(idBytes.length, 12));
        buffer.put(truncatedId);

        return buffer.array();
    }

    private byte parseCalamityCode(String type) {
        if (type == null) return 0;
        switch (type.toUpperCase()) {
            case "LANDSLIDE": return 1;
            case "FLASH FLOOD": return 2;
            case "EARTHQUAKE": return 3;
            case "BUILDING COLLAPSE": return 4;
            case "INDUSTRIAL FIRE": return 5;
            case "CLOUDBURST": return 6;
            default: return 0;
        }
    }

    public boolean isAdvertising() {
        return isAdvertising;
    }
}
