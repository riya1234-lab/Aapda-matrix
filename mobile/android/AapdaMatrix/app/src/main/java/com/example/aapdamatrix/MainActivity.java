package com.example.aapdamatrix;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.example.aapdamatrix.service.MeshRelayService;
import com.example.aapdamatrix.ui.OfflineMapActivity;
import com.example.aapdamatrix.ui.SafetyGuidelinesActivity;
import com.example.aapdamatrix.ui.VictimInterfaceActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private static final int PERMISSION_REQUEST_CODE = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        checkAndRequestPermissions();
        startMeshRelayService();
        setupNavigationListeners();
    }

    private void setupNavigationListeners() {
        CardView cardVictim = findViewById(R.id.cardVictimPortal);
        Button btnVictim = findViewById(R.id.btnOpenVictimApp);
        CardView cardSafety = findViewById(R.id.cardSafetySops);
        CardView cardMap = findViewById(R.id.cardOfflineMap);
        Button btnCall = findViewById(R.id.btnMainDirectDispatchCall);

        btnVictim.setOnClickListener(v -> openVictimPortal());
        cardVictim.setOnClickListener(v -> openVictimPortal());

        cardSafety.setOnClickListener(v -> {
            Intent intent = new Intent(this, SafetyGuidelinesActivity.class);
            startActivity(intent);
        });

        cardMap.setOnClickListener(v -> {
            Intent intent = new Intent(this, OfflineMapActivity.class);
            startActivity(intent);
        });

        btnCall.setOnClickListener(v -> makeDirectEmergencyCall());
    }

    private void openVictimPortal() {
        Intent intent = new Intent(this, VictimInterfaceActivity.class);
        startActivity(intent);
    }

    private void makeDirectEmergencyCall() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) {
            Intent intent = new Intent(Intent.ACTION_CALL);
            intent.setData(Uri.parse("tel:112"));
            startActivity(intent);
        } else {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CALL_PHONE}, PERMISSION_REQUEST_CODE);
        }
    }

    private void startMeshRelayService() {
        try {
            Intent serviceIntent = new Intent(this, MeshRelayService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {
            Toast.makeText(this, "Could not start Mesh Relay Service: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void checkAndRequestPermissions() {
        List<String> permissions = new ArrayList<>();
        permissions.add(Manifest.permission.ACCESS_FINE_LOCATION);
        permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        permissions.add(Manifest.permission.RECORD_AUDIO);
        permissions.add(Manifest.permission.SEND_SMS);
        permissions.add(Manifest.permission.CALL_PHONE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_SCAN);
            permissions.add(Manifest.permission.BLUETOOTH_ADVERTISE);
            permissions.add(Manifest.permission.BLUETOOTH_CONNECT);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS);
        }

        List<String> needed = new ArrayList<>();
        for (String p : permissions) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                needed.add(p);
            }
        }

        if (!needed.isEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            Toast.makeText(this, "Emergency Permissions Configured", Toast.LENGTH_SHORT).show();
        }
    }
}
