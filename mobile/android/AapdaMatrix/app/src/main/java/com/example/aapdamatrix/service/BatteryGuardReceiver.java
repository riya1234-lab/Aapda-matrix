package com.example.aapdamatrix.service;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import android.os.BatteryManager;
import android.telephony.SmsManager;
import android.util.Log;

import com.example.aapdamatrix.database.MessageEntity;
import com.example.aapdamatrix.database.SosDatabaseHelper;
import com.example.aapdamatrix.sos.SosCaptureManager;

import java.util.UUID;

public class BatteryGuardReceiver extends BroadcastReceiver {
    private static final String TAG = "BatteryGuardReceiver";
    private static final String DEFAULT_FAMILY_CONTACT = "+15550199999";
    private static boolean hasTriggeredDistress = false;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        if (Intent.ACTION_BATTERY_CHANGED.equals(intent.getAction())) {
            int level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            int batteryPct = (int) ((level / (float) scale) * 100);

            Log.d(TAG, "Battery level broadcast received: " + batteryPct + "%");

            // 5% Auto Trigger Requirement
            if (batteryPct <= 5 && !hasTriggeredDistress) {
                hasTriggeredDistress = true;
                Log.w(TAG, "CRITICAL BATTERY LEVEL <= 5% DETECTED! Triggering Auto Emergency Distress Packet...");
                triggerAutoBatteryDistress(context, batteryPct);
            } else if (batteryPct > 10) {
                hasTriggeredDistress = false; // Reset trigger if battery is charged above 10%
            }
        }
    }

    private void triggerAutoBatteryDistress(Context context, int batteryPct) {
        new Thread(() -> {
            double[] coords = getFineGpsLocation(context);

            MessageEntity distressEntity = new MessageEntity(
                    "BAT5_" + UUID.randomUUID().toString().substring(0, 8),
                    "CRITICAL_BATTERY_DISTRESS",
                    coords[0],
                    coords[1],
                    System.currentTimeMillis(),
                    "",
                    0,
                    batteryPct,
                    "QUEUED",
                    true
            );

            // 1. Log to SQLite for BLE mesh propagation
            SosDatabaseHelper dbHelper = SosDatabaseHelper.getInstance(context);
            dbHelper.insertMessage(distressEntity);

            // 2. Dispatch Direct Emergency Family SMS
            try {
                SmsManager smsManager = SmsManager.getDefault();
                String msg = "CRITICAL BATTERY ALERT (5%): Victim device shutting down! Last GPS Loc: Lat "
                        + coords[0] + ", Lng " + coords[1] + ". Aapda Matrix ID: " + distressEntity.getMessageId();
                smsManager.sendTextMessage(DEFAULT_FAMILY_CONTACT, null, msg, null, null);
                Log.d(TAG, "Emergency battery SMS sent to family contact: " + DEFAULT_FAMILY_CONTACT);
            } catch (Exception e) {
                Log.e(TAG, "Failed to send emergency battery SMS", e);
            }

            // 3. Delegate to SosCaptureManager for REST API / BLE Mesh transmission
            SosCaptureManager captureManager = new SosCaptureManager(context);
            captureManager.executeFallbackHierarchy(distressEntity, null);
        }).start();
    }

    @SuppressLint("MissingPermission")
    private double[] getFineGpsLocation(Context context) {
        double[] coords = new double[]{28.6139, 77.2090}; // Default location
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
            Log.e(TAG, "Error fetching location for battery guard", e);
        }
        return coords;
    }
}
