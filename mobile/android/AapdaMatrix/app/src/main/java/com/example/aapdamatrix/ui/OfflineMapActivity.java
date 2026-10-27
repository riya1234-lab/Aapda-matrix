package com.example.aapdamatrix.ui;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.example.aapdamatrix.R;
import com.example.aapdamatrix.database.MessageEntity;
import com.example.aapdamatrix.database.SosDatabaseHelper;

import org.osmdroid.config.Configuration;
import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;

import java.util.List;

public class OfflineMapActivity extends AppCompatActivity {

    private MapView mapView;
    private TextView tvMapGpsStatus;
    private GeoPoint currentVictimPoint;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Required osmdroid configuration
        Configuration.getInstance().load(getApplicationContext(), PreferenceManager.getDefaultSharedPreferences(getApplicationContext()));

        setContentView(R.layout.activity_offline_map);

        mapView = findViewById(R.id.mapView);
        tvMapGpsStatus = findViewById(R.id.tvMapGpsStatus);
        Button btnRecenter = findViewById(R.id.btnRecenterMap);
        Button btnCall = findViewById(R.id.btnMapDirectCall);

        setupMapView();
        loadVictimLocationAndPins();

        btnRecenter.setOnClickListener(v -> centerMapOnVictim());
        btnCall.setOnClickListener(v -> makeEmergencyCall());
    }

    private void setupMapView() {
        mapView.setTileSource(TileSourceFactory.MAPNIK);
        mapView.setMultiTouchControls(true);
        mapView.getController().setZoom(15.0);
    }

    private void loadVictimLocationAndPins() {
        currentVictimPoint = getVictimGpsGeoPoint();
        tvMapGpsStatus.setText(String.format("Victim Location: Lat %.4f, Lng %.4f", currentVictimPoint.getLatitude(), currentVictimPoint.getLongitude()));

        mapView.getController().setCenter(currentVictimPoint);

        // 1. Add Victim Location Marker
        Marker victimMarker = new Marker(mapView);
        victimMarker.setPosition(currentVictimPoint);
        victimMarker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
        victimMarker.setTitle("YOUR VICTIM SOS NODE");
        victimMarker.setSnippet("Active BLE Mesh Hopping Enabled");
        mapView.getOverlays().add(victimMarker);

        // 2. Load Cached Emergency Pins from SQLite Database
        SosDatabaseHelper dbHelper = SosDatabaseHelper.getInstance(this);
        List<MessageEntity> messages = dbHelper.getAllMessages();

        for (MessageEntity msg : messages) {
            GeoPoint p = new GeoPoint(msg.getLatitude(), msg.getLongitude());
            Marker m = new Marker(mapView);
            m.setPosition(p);
            m.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
            m.setTitle("SOS: " + msg.getCalamityType());
            m.setSnippet("Status: " + msg.getStatus() + " | Hops: " + msg.getHopCount());
            mapView.getOverlays().add(m);
        }

        mapView.invalidate();
    }

    private GeoPoint getVictimGpsGeoPoint() {
        GeoPoint fallback = new GeoPoint(28.6139, 77.2090); // Default New Delhi
        try {
            LocationManager lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            if (lm != null) {
                Location loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (loc == null) loc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                if (loc != null) {
                    return new GeoPoint(loc.getLatitude(), loc.getLongitude());
                }
            }
        } catch (Exception e) {
            Toast.makeText(this, "Location permission fallback active", Toast.LENGTH_SHORT).show();
        }
        return fallback;
    }

    private void centerMapOnVictim() {
        if (currentVictimPoint != null) {
            mapView.getController().animateTo(currentVictimPoint);
            mapView.getController().setZoom(16.0);
        }
    }

    private void makeEmergencyCall() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) {
            Intent intent = new Intent(Intent.ACTION_CALL);
            intent.setData(Uri.parse("tel:112"));
            startActivity(intent);
        } else {
            Toast.makeText(this, "Call permission required", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mapView != null) mapView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mapView != null) mapView.onPause();
    }
}
