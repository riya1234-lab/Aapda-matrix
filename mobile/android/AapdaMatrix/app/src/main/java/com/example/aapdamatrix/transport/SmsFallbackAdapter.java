package com.example.aapdamatrix.transport;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.telephony.SmsManager;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.example.aapdamatrix.database.MessageEntity;
import com.example.aapdamatrix.database.SosDatabaseHelper;

import java.util.ArrayList;
import java.util.List;

public class SmsFallbackAdapter implements CommunicationAdapter {
    private static final String TAG = "SmsFallbackAdapter";
    private static final String EMERGENCY_DISPATCH_SMS = "112";

    private final Context context;
    private final SosDatabaseHelper dbHelper;
    private final TelephonyManager telephonyManager;

    public SmsFallbackAdapter(Context context) {
        this.context = context.getApplicationContext();
        this.dbHelper = SosDatabaseHelper.getInstance(this.context);
        this.telephonyManager = (TelephonyManager) this.context.getSystemService(Context.TELEPHONY_SERVICE);
    }

    @Override
    public boolean isAvailable() {
        if (telephonyManager == null) return false;
        int simState = telephonyManager.getSimState();
        return simState == TelephonyManager.SIM_STATE_READY;
    }

    @Override
    public boolean sendMessage(MessageEntity message) {
        if (!isAvailable()) return false;

        String formattedText = String.format(
                "AAPDA_SOS|ID:%s|TYPE:%s|LOC:%.4f,%.4f|BAT:%d%%|TIME:%d",
                message.getMessageId(),
                message.getCalamityType(),
                message.getLatitude(),
                message.getLongitude(),
                message.getBatteryLevel(),
                message.getTimestamp()
        );

        // Check SEND_SMS runtime permission
        if (ContextCompat.checkSelfPermission(context, "android.permission.SEND_SMS") == PackageManager.PERMISSION_GRANTED) {
            try {
                SmsManager smsManager = SmsManager.getDefault();
                smsManager.sendTextMessage(EMERGENCY_DISPATCH_SMS, null, formattedText, null, null);
                dbHelper.updateMessageStatus(message.getMessageId(), "TRANSMITTED_SMS");
                Log.i(TAG, "Emergency SMS dispatched automatically: " + message.getMessageId());
                return true;
            } catch (Exception e) {
                Log.e(TAG, "Automatic SMS failed, launching prefilled intent fallback", e);
            }
        }

        // Prefilled Intent fallback (user consent required)
        try {
            Intent smsIntent = new Intent(Intent.ACTION_SENDTO);
            smsIntent.setData(Uri.parse("smsto:" + EMERGENCY_DISPATCH_SMS));
            smsIntent.putExtra("sms_body", formattedText);
            smsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(smsIntent);
            dbHelper.updateMessageStatus(message.getMessageId(), "PENDING_SMS_USER_CONFIRM");
            Log.i(TAG, "Prefilled SMS composer displayed to user.");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch SMS intent", e);
            return false;
        }
    }

    @Override
    public List<MessageEntity> receiveMessages() {
        return new ArrayList<>();
    }

    @Override
    public String getStatus() {
        if (!isAvailable()) return "SMS: NO SIM / CELLULAR SERVICE";
        boolean hasPermission = ContextCompat.checkSelfPermission(context, "android.permission.SEND_SMS") == PackageManager.PERMISSION_GRANTED;
        return hasPermission ? "SMS FALLBACK: READY (AUTOMATIC)" : "SMS FALLBACK: READY (PREFILLED COMPOSER)";
    }

    @Override
    public int retryPendingMessages() {
        return 0;
    }
}
