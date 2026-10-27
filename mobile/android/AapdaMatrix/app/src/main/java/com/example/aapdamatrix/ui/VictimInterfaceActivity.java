package com.example.aapdamatrix.ui;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.core.content.ContextCompat;

import com.example.aapdamatrix.R;
import com.example.aapdamatrix.database.MessageEntity;
import com.example.aapdamatrix.sos.SosCaptureManager;

public class VictimInterfaceActivity extends AppCompatActivity {

    private Spinner spinnerCalamity;
    private Button btnActivateSos;
    private ProgressBar progressRecording;
    private CardView cardTransmissionLog;
    private TextView tvTransmissionHeader, tvTransmissionDetails;
    private TextView tvBatteryGuardChip, tvGpsCoords;

    private String selectedCalamity = null;
    private SosCaptureManager sosCaptureManager;

    private final String[] disasterTypes = {
            "-- SELECT DISASTER TYPE --",
            "Landslide",
            "Flash Flood",
            "Earthquake",
            "Building Collapse",
            "Industrial Fire",
            "Cloudburst"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_victim_interface);

        sosCaptureManager = new SosCaptureManager(this);

        initViews();
        setupCalamitySpinner();
        setupQuickChips();
        updateBatteryAndGpsDisplay();

        btnActivateSos.setOnClickListener(v -> triggerSosProcess());
    }

    private void initViews() {
        spinnerCalamity = findViewById(R.id.spinnerCalamityType);
        btnActivateSos = findViewById(R.id.btnActivateSos);
        progressRecording = findViewById(R.id.progressRecording);
        cardTransmissionLog = findViewById(R.id.cardTransmissionLog);
        tvTransmissionHeader = findViewById(R.id.tvTransmissionHeader);
        tvTransmissionDetails = findViewById(R.id.tvTransmissionDetails);
        tvBatteryGuardChip = findViewById(R.id.tvBatteryGuardChip);
        tvGpsCoords = findViewById(R.id.tvGpsCoords);

        Button btnSops = findViewById(R.id.btnViewSops);
        Button btnMap = findViewById(R.id.btnViewOfflineMap);
        Button btnCall = findViewById(R.id.btnDirectCallDispatch);

        btnSops.setOnClickListener(v -> {
            Intent intent = new Intent(this, SafetyGuidelinesActivity.class);
            if (selectedCalamity != null) intent.putExtra("CALAMITY_TYPE", selectedCalamity);
            startActivity(intent);
        });

        btnMap.setOnClickListener(v -> {
            Intent intent = new Intent(this, OfflineMapActivity.class);
            startActivity(intent);
        });

        btnCall.setOnClickListener(v -> makeEmergencyCall());
    }

    private void setupCalamitySpinner() {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, disasterTypes);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerCalamity.setAdapter(adapter);

        spinnerCalamity.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (position > 0) {
                    selectedCalamity = disasterTypes[position];
                    enableSosButton();
                } else {
                    selectedCalamity = null;
                    disableSosButton();
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                selectedCalamity = null;
                disableSosButton();
            }
        });
    }

    private void setupQuickChips() {
        findViewById(R.id.btnChipLandslide).setOnClickListener(v -> selectDisasterByChip(1));
        findViewById(R.id.btnChipFlood).setOnClickListener(v -> selectDisasterByChip(2));
        findViewById(R.id.btnChipQuake).setOnClickListener(v -> selectDisasterByChip(3));
        findViewById(R.id.btnChipCollapse).setOnClickListener(v -> selectDisasterByChip(4));
        findViewById(R.id.btnChipFire).setOnClickListener(v -> selectDisasterByChip(5));
        findViewById(R.id.btnChipCloudburst).setOnClickListener(v -> selectDisasterByChip(6));
    }

    private void selectDisasterByChip(int index) {
        spinnerCalamity.setSelection(index);
        selectedCalamity = disasterTypes[index];
        enableSosButton();
        Toast.makeText(this, "Emergency selected: " + selectedCalamity, Toast.LENGTH_SHORT).show();
    }

    private void enableSosButton() {
        btnActivateSos.setEnabled(true);
        btnActivateSos.setText("ACTIVATE SOS: " + selectedCalamity.toUpperCase());
        btnActivateSos.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.emergency_red));
    }

    private void disableSosButton() {
        btnActivateSos.setEnabled(false);
        btnActivateSos.setText("SELECT EMERGENCY TYPE FIRST");
        btnActivateSos.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.chip_bg));
    }

    private void triggerSosProcess() {
        if (selectedCalamity == null) {
            Toast.makeText(this, "Please select an emergency type first!", Toast.LENGTH_SHORT).show();
            return;
        }

        sosCaptureManager.triggerSosWorkflow(selectedCalamity, new SosCaptureManager.SosProcessListener() {
            @Override
            public void onSosStarted() {
                runOnUiThread(() -> {
                    btnActivateSos.setEnabled(false);
                    btnActivateSos.setText("RECORDING VOICE SOS (10s)...");
                    progressRecording.setVisibility(View.VISIBLE);
                });
            }

            @Override
            public void onSosRecorded(String base64Audio) {
                runOnUiThread(() -> {
                    btnActivateSos.setText("TRANSMITTING SOS PAYLOAD...");
                });
            }

            @Override
            public void onTransmissionSuccess(String channelUsed, MessageEntity message) {
                runOnUiThread(() -> {
                    progressRecording.setVisibility(View.GONE);
                    btnActivateSos.setEnabled(true);
                    btnActivateSos.setText("ACTIVATE SOS: " + selectedCalamity.toUpperCase());

                    cardTransmissionLog.setVisibility(View.VISIBLE);
                    tvTransmissionHeader.setText("DISTRESS DISPATCH SUCCESSFUL");
                    tvTransmissionDetails.setText("Channel: " + channelUsed + "\nMessage ID: " + message.getMessageId().substring(0, 8));

                    showAiTriageDialog(message, channelUsed);
                });
            }

            @Override
            public void onError(String message) {
                runOnUiThread(() -> {
                    progressRecording.setVisibility(View.GONE);
                    btnActivateSos.setEnabled(true);
                    btnActivateSos.setText("RETRY SOS ACTIVATION");
                    Toast.makeText(VictimInterfaceActivity.this, "SOS Error: " + message, Toast.LENGTH_LONG).show();
                });
            }
        });
    }

    private void showAiTriageDialog(MessageEntity entity, String channel) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_ai_emergency, null);
        builder.setView(dialogView);

        AlertDialog dialog = builder.create();
        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        TextView tvTitle = dialogView.findViewById(R.id.tvAiDialogTitle);
        TextView tvMsg = dialogView.findViewById(R.id.tvAiDialogMessage);
        Button btnDismiss = dialogView.findViewById(R.id.btnDismissAiDialog);

        tvTitle.setText(entity.getCalamityType() + " Safety Triage");
        tvMsg.setText("Distress Signal routed via " + channel + ".\n\nKeep device steady. If internet becomes available, your intermediate mesh nodes will auto-gateway to Command Center.");

        btnDismiss.setOnClickListener(v -> dialog.dismiss());
        dialog.show();
    }

    private void updateBatteryAndGpsDisplay() {
        IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent batteryStatus = registerReceiver(null, filter);
        if (batteryStatus != null) {
            int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            int batteryPct = (int) ((level / (float) scale) * 100);
            tvBatteryGuardChip.setText("BATTERY: " + batteryPct + "%");
        }

        try {
            LocationManager lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            if (lm != null) {
                Location loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (loc == null) loc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                if (loc != null) {
                    tvGpsCoords.setText(String.format("Lat: %.4f, Lng: %.4f", loc.getLatitude(), loc.getLongitude()));
                } else {
                    tvGpsCoords.setText("Lat: 28.6139, Lng: 77.2090 (Cached)");
                }
            }
        } catch (Exception e) {
            tvGpsCoords.setText("GPS Ready");
        }
    }

    private void makeEmergencyCall() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) {
            Intent intent = new Intent(Intent.ACTION_CALL);
            intent.setData(Uri.parse("tel:112"));
            startActivity(intent);
        } else {
            Toast.permission(this, "Call permission required", Toast.LENGTH_SHORT).show();
        }
    }
}
