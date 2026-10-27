package com.example.aapdamatrix.mesh;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.os.ParcelUuid;
import android.util.Log;

import com.example.aapdamatrix.database.MessageEntity;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class BleMeshScanner {
    private static final String TAG = "BleMeshScanner";
    private final Context context;
    private final MeshPacketRouter packetRouter;
    private BluetoothLeScanner scanner;
    private ScanCallback scanCallback;
    private boolean isScanning = false;

    public BleMeshScanner(Context context, MeshPacketRouter packetRouter) {
        this.context = context.getApplicationContext();
        this.packetRouter = packetRouter;
        BluetoothManager bm = (BluetoothManager) context.getSystemService(Context.BLUETOOTH_SERVICE);
        if (bm != null && bm.getAdapter() != null) {
            BluetoothAdapter adapter = bm.getAdapter();
            if (adapter.isEnabled()) {
                this.scanner = adapter.getBluetoothLeScanner();
            }
        }
    }

    @SuppressLint("MissingPermission")
    public void startScanning() {
        if (scanner == null) {
            Log.w(TAG, "Cannot start BLE Scan: Scanner unavailable.");
            return;
        }

        if (isScanning) return;

        ParcelUuid pUuid = new ParcelUuid(UUID.fromString(MeshPacketRouter.AAPDA_SERVICE_UUID));

        List<ScanFilter> filters = new ArrayList<>();
        filters.add(new ScanFilter.Builder().setServiceUuid(pUuid).build());

        ScanSettings settings = new ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build();

        scanCallback = new ScanCallback() {
            @Override
            public void onScanResult(int callbackType, ScanResult result) {
                super.onScanResult(callbackType, result);
                if (result == null || result.getScanRecord() == null) return;

                Map<ParcelUuid, byte[]> serviceData = result.getScanRecord().getServiceData();
                if (serviceData != null && serviceData.containsKey(pUuid)) {
                    byte[] payload = serviceData.get(pUuid);
                    MessageEntity decoded = unpackPayload(payload);
                    if (decoded != null) {
                        Log.d(TAG, "BLE Scan Result: Discovered packet ID " + decoded.getMessageId());
                        packetRouter.handleIncomingPacket(decoded);
                    }
                }
            }

            @Override
            public void onScanFailed(int errorCode) {
                super.onScanFailed(errorCode);
                isScanning = false;
                Log.e(TAG, "BLE Scan Failed with error code: " + errorCode);
            }
        };

        try {
            scanner.startScan(filters, settings, scanCallback);
            isScanning = true;
            Log.d(TAG, "BLE Mesh Scanner STARTED.");
        } catch (Exception e) {
            Log.e(TAG, "Exception starting BLE scanner", e);
        }
    }

    @SuppressLint("MissingPermission")
    public void stopScanning() {
        if (scanner != null && scanCallback != null && isScanning) {
            try {
                scanner.stopScan(scanCallback);
                Log.d(TAG, "BLE Mesh Scanner STOPPED.");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping BLE scanner", e);
            }
            isScanning = false;
        }
    }

    private MessageEntity unpackPayload(byte[] payload) {
        if (payload == null || payload.length < 22) return null;

        try {
            ByteBuffer buffer = ByteBuffer.wrap(payload);

            byte calamityCode = buffer.get();
            int hopCount = buffer.get() & 0xFF;
            int latInt = buffer.getInt();
            int lngInt = buffer.getInt();

            byte[] idBytes = new byte[12];
            buffer.get(idBytes);
            String messageIdPrefix = new String(idBytes, StandardCharsets.UTF_8).trim();

            MessageEntity entity = new MessageEntity();
            entity.setMessageId("BLE_" + messageIdPrefix);
            entity.setCalamityType(decodeCalamityCode(calamityCode));
            entity.setLatitude(latInt / 1e6);
            entity.setLongitude(lngInt / 1e6);
            entity.setTimestamp(System.currentTimeMillis());
            entity.setHopCount(hopCount);
            entity.setBatteryLevel(50);
            entity.setStatus("QUEUED");

            return entity;
        } catch (Exception e) {
            Log.e(TAG, "Error unpacking BLE payload", e);
            return null;
        }
    }

    private String decodeCalamityCode(byte code) {
        switch (code) {
            case 1: return "Landslide";
            case 2: return "Flash Flood";
            case 3: return "Earthquake";
            case 4: return "Building Collapse";
            case 5: return "Industrial Fire";
            case 6: return "Cloudburst";
            default: return "General Disaster";
        }
    }

    public boolean isScanning() {
        return isScanning;
    }
}
