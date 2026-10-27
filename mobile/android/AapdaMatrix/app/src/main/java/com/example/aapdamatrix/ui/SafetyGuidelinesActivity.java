package com.example.aapdamatrix.ui;

import android.os.Bundle;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.example.aapdamatrix.R;

public class SafetyGuidelinesActivity extends AppCompatActivity {

    private TextView tvSopTitle, tvSopWarning;
    private LinearLayout containerChecklist;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_safety_guidelines);

        tvSopTitle = findViewById(R.id.tvSopTitle);
        tvSopWarning = findViewById(R.id.tvSopWarning);
        containerChecklist = findViewById(R.id.containerChecklist);
        Button btnBack = findViewById(R.id.btnBackToVictimInterface);

        String disasterType = getIntent().getStringExtra("CALAMITY_TYPE");
        if (disasterType == null) disasterType = "Landslide";

        loadGuidelines(disasterType);

        btnBack.setOnClickListener(v -> finish());
    }

    private void loadGuidelines(String disasterType) {
        tvSopTitle.setText(disasterType + " Survival Protocol");

        String warningText;
        String[] checklistItems;

        switch (disasterType.toLowerCase()) {
            case "flash flood":
                warningText = "Move to higher ground immediately! Do NOT attempt to cross flowing water above ankle level.";
                checklistItems = new String[]{
                        "Evacuate to elevated terrain or upper floors immediately",
                        "Turn off main gas line and electrical breakers if accessible",
                        "Avoid walking or driving through moving floodwaters",
                        "Keep your phone in power-saving mode for BLE mesh distress loops",
                        "Listen for emergency siren broadcasts or rescue helicopter signals"
                };
                break;

            case "earthquake":
                warningText = "DROP, COVER, AND HOLD ON! Stay away from windows, glass, and exterior walls.";
                checklistItems = new String[]{
                        "Take cover under a sturdy desk, table, or interior door frame",
                        "Protect head and neck with your arms or heavy objects",
                        "If outdoors, move to an open area away from electrical cables and buildings",
                        "Check for structural cracks or gas leaks after shaking ceases",
                        "Prepare for potential secondary aftershocks"
                };
                break;

            case "building collapse":
                warningText = "If trapped, conserve energy and cover nose/mouth with cloth to prevent dust inhalation.";
                checklistItems = new String[]{
                        "Cover your face with cloth or clothing to filter concrete dust",
                        "Tap on pipes or solid structures rhythmically to signal rescuers",
                        "Avoid shouting continuously to preserve oxygen and stamina",
                        "Keep phone BLE Mesh active to allow search teams to locate signal",
                        "Move limbs periodically to prevent deep vein thrombosis if possible"
                };
                break;

            case "industrial fire":
                warningText = "Crawl low under toxic smoke. Cover mouth with a damp cloth.";
                checklistItems = new String[]{
                        "Stay low near floor where clean oxygen remains",
                        "Cover nose and mouth with a wet towel or garment",
                        "Test door handles for heat before opening exterior doors",
                        "Evacuate upwind from toxic chemical gas plumes",
                        "Signal rescuers from windows using bright clothing or phone flash"
                };
                break;

            case "cloudburst":
                warningText = "Seek immediate solid shelter. Beware of sudden raging debris torrents.";
                checklistItems = new String[]{
                        "Move away from stream beds, ravines, and drainage channels",
                        "Climb onto stable reinforced roofs if flash flooding surges",
                        "Disconnect high-voltage appliances to prevent electrical surge shocks",
                        "Ensure family members stay tied together in extreme currents",
                        "Keep SOS voice note trigger ready on Aapda Matrix"
                };
                break;

            case "landslide":
            default:
                warningText = "Move away from the path of debris immediately. Stay alert for unusual sounds like trees cracking.";
                checklistItems = new String[]{
                        "Evacuate land movement paths immediately without stopping for belongings",
                        "Curl into a tight ball and protect your head if escape is impossible",
                        "Watch for sudden rises or sudden muddiness in local streams",
                        "Report cracked roads or shifting structures to emergency team",
                        "Remain clear of slide area — secondary slope failures are frequent"
                };
                break;
        }

        tvSopWarning.setText(warningText);

        containerChecklist.removeAllViews();
        for (String item : checklistItems) {
            CheckBox checkBox = new CheckBox(this);
            checkBox.setText(item);
            checkBox.setTextColor(getResources().getColor(R.color.text_primary, getTheme()));
            checkBox.setTextSize(13);
            checkBox.setPadding(16, 16, 16, 16);
            containerChecklist.addView(checkBox);
        }
    }
}
