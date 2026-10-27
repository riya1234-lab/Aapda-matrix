package com.example.aapdamatrix.service;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.example.aapdamatrix.R;
import com.example.aapdamatrix.database.MessageEntity;
import com.example.aapdamatrix.database.SosDatabaseHelper;
import com.example.aapdamatrix.mesh.BleMeshAdvertiser;
import com.example.aapdamatrix.mesh.BleMeshScanner;
import com.example.aapdamatrix.mesh.MeshPacketRouter;

import java.util.List;

public class MeshRelayService extends Service {
    private static final String TAG = "MeshRelayService";
    private static final String CHANNEL_ID = "aapda_mesh_service_channel";
    private static final int NOTIFICATION_ID = 911;
    private static final long HOPPING_LOOP_INTERVAL = 5000L; // 5 seconds

    private Handler handler;
    private Runnable hoppingRunnable;
    private BleMeshAdvertiser advertiser;
    private BleMeshScanner scanner;
    private MeshPacketRouter router;
    private SosDatabaseHelper dbHelper;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "MeshRelayService onCreate");

        createNotificationChannel();
        Notification notification = buildForegroundNotification();
        startForeground(NOTIFICATION_ID, notification);

        router = new MeshPacketRouter(this);
        advertiser = new BleMeshAdvertiser(this);
        scanner = new BleMeshScanner(this, router);
        dbHelper = SosDatabaseHelper.getInstance(this);

        handler = new Handler(Looper.getMainLooper());
        startPeriodicHoppingLoop();
    }

    private void startPeriodicHoppingLoop() {
        hoppingRunnable = new Runnable() {
            @Override
            public void run() {
                try {
                    Log.d(TAG, "5-Second BLE Mesh Hopping Cycle Executing...");

                    // 1. Gateway Sync Check
                    router.checkAndSyncGatewayOutbox();

                    // 2. Fetch Pending Messages from DB
                    List<MessageEntity> pending = dbHelper.getPendingOutboxMessages();

                    if (!pending.isEmpty()) {
                        MessageEntity topMsg = pending.get(0);
                        // Start Advertising for 2.5s
                        scanner.stopScanning();
                        advertiser.startBroadcasting(topMsg);

                        handler.postDelayed(() -> {
                            advertiser.stopBroadcasting();
                            scanner.startScanning();
                        }, 2500L);
                    } else {
                        // If no outbox, scan continuously for peer nodes
                        if (!scanner.isScanning()) {
                            scanner.startScanning();
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error in hopping loop", e);
                } finally {
                    handler.postDelayed(this, HOPPING_LOOP_INTERVAL);
                }
            }
        };

        handler.post(hoppingRunnable);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "MeshRelayService onStartCommand");
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null && hoppingRunnable != null) {
            handler.removeCallbacks(hoppingRunnable);
        }
        if (advertiser != null) advertiser.stopBroadcasting();
        if (scanner != null) scanner.stopScanning();
        Log.d(TAG, "MeshRelayService Destroyed");
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Aapda Matrix BLE Mesh Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Maintains autonomous store-and-forward BLE relay loop in disaster zones.");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildForegroundNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Aapda Matrix BLE Mesh Active")
                .setContentText("Autonomous 5s Store-and-Forward Relay Hopping Enabled")
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();
    }
}
